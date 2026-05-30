import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()
const EXERCISEDB_KEY = process.env.EXERCISEDB_API_KEY

if (!EXERCISEDB_KEY) {
  console.error('EXERCISEDB_API_KEY env var is required for seeding')
  process.exit(1)
}

const API_HOST = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'

const client = axios.create({
  baseURL: `https://${API_HOST}/api/v1`,
  headers: {
    'x-rapidapi-key': EXERCISEDB_KEY,
    'x-rapidapi-host': API_HOST,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 3): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      const status = err.response?.status
      if (status === 429) {
        const wait = 30000 * attempt
        console.log(`  Rate limited (${label}), waiting ${wait / 1000}s…`)
        await sleep(wait)
      } else if (attempt < maxRetries) {
        console.log(`  Retry ${attempt}/${maxRetries} for ${label}: ${err.message}`)
        await sleep(2000 * attempt)
      } else {
        console.error(`  Failed ${label}: ${err.message}`)
        return null
      }
    }
  }
  return null
}

// ─── Phase 1: Bulk pagination ─────────────────────────────────

async function collectExerciseIds(): Promise<string[]> {
  const ids: string[] = []
  let offset = 0
  const limit = 20
  let total = Infinity

  console.log('Phase 1: Collecting exercise IDs via bulk endpoint…')

  while (offset < total) {
    const res = await withRetry(
      () => client.get('/exercises', { params: { offset, limit } }),
      `bulk offset=${offset}`
    )

    if (!res) {
      console.log(`  Skipping offset ${offset} after repeated failures`)
      offset += limit
      continue
    }

    const body = res.data
    if (!body.success) {
      console.error('  API error:', body)
      break
    }

    total = body.meta?.total ?? total
    const exercises: any[] = body.data ?? []

    for (const ex of exercises) {
      await prisma.exercise.upsert({
        where: { exerciseDbId: ex.exerciseId },
        update: {},
        create: {
          exerciseDbId: ex.exerciseId,
          name: (ex.name ?? '').trim(),
          muscleGroup: ex.bodyParts?.[0] ?? null,
          musclesPrimary: ex.targetMuscles ?? [],
          musclesSecondary: ex.secondaryMuscles ?? [],
          equipment: ex.equipments?.[0] ?? null,
          category: ex.exerciseType ?? null,
          imageUrl: ex.imageUrl ?? null,
        },
      })
      ids.push(ex.exerciseId)
    }

    console.log(`  ${ids.length} / ${total} exercises saved (basic data)`)
    offset += limit

    await sleep(400)
  }

  return ids
}

// ─── Phase 2: Individual detail fetch ────────────────────────

async function enrichExerciseDetails() {
  const toEnrich = await prisma.exercise.findMany({
    where: {
      exerciseDbId: { not: null },
      videoUrl: null,
      isCustom: false,
    },
    select: { id: true, exerciseDbId: true, name: true },
  })

  if (toEnrich.length === 0) {
    console.log('Phase 2: All exercises already have details — skipping.')
    return
  }

  console.log(`\nPhase 2: Fetching details for ${toEnrich.length} exercises…`)

  for (let i = 0; i < toEnrich.length; i++) {
    const { id, exerciseDbId, name } = toEnrich[i]
    if (!exerciseDbId) continue

    const res = await withRetry(
      () => client.get(`/exercises/${exerciseDbId}`),
      `detail ${exerciseDbId}`
    )

    if (res?.data?.success && res.data.data) {
      const d = res.data.data
      await prisma.exercise.update({
        where: { id },
        data: {
          description: d.overview?.trim() || null,
          instructions: Array.isArray(d.instructions) ? d.instructions : [],
          tips: Array.isArray(d.exerciseTips) ? d.exerciseTips : [],
          videoUrl: d.videoUrl || null,
          imageUrl: d.imageUrls?.['480p'] ?? d.imageUrl ?? null,
        },
      })
    }

    if ((i + 1) % 20 === 0 || i + 1 === toEnrich.length) {
      console.log(`  ${i + 1} / ${toEnrich.length} detailed`)
    }

    await sleep(350)
  }
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('=== FitSelf Exercise Seed ===\n')

  await collectExerciseIds()
  await enrichExerciseDetails()

  const count = await prisma.exercise.count({ where: { isCustom: false } })
  console.log(`\nDone. ${count} exercises in database.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
