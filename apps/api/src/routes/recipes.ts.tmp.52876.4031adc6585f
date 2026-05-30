import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const RecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  servings: z.number().positive().default(1),
  ingredients: z.array(
    z.object({
      foodItemId: z.string(),
      quantity: z.number().positive(),
    })
  ),
})

function computeNutrition(ingredients: { foodItem: { calories: number; protein: number; carbs: number; fat: number }; quantity: number }[], servings: number) {
  const total = ingredients.reduce(
    (acc, ing) => {
      acc.calories += ing.foodItem.calories * ing.quantity
      acc.protein += ing.foodItem.protein * ing.quantity
      acc.carbs += ing.foodItem.carbs * ing.quantity
      acc.fat += ing.foodItem.fat * ing.quantity
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
  return {
    totalCalories: total.calories,
    totalProtein: total.protein,
    totalCarbs: total.carbs,
    totalFat: total.fat,
    perServingCalories: total.calories / servings,
    perServingProtein: total.protein / servings,
    perServingCarbs: total.carbs / servings,
    perServingFat: total.fat / servings,
  }
}

const recipeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { onRequest: [fastify.authenticate] }, async (request) => {
    const recipes = await prisma.recipe.findMany({
      where: { userId: request.user.userId },
      include: { ingredients: { include: { foodItem: true } } },
      orderBy: { name: 'asc' },
    })
    return recipes.map((r) => ({
      ...r,
      nutrition: computeNutrition(r.ingredients, r.servings),
    }))
  })

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const recipe = await prisma.recipe.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
        include: { ingredients: { include: { foodItem: true } } },
      })
      if (!recipe) return reply.status(404).send({ error: 'Not found' })
      return { ...recipe, nutrition: computeNutrition(recipe.ingredients, recipe.servings) }
    }
  )

  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = RecipeSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Invalid input', details: body.error.issues })

    const recipe = await prisma.recipe.create({
      data: {
        userId: request.user.userId,
        name: body.data.name,
        description: body.data.description,
        servings: body.data.servings,
        ingredients: {
          create: body.data.ingredients,
        },
      },
      include: { ingredients: { include: { foodItem: true } } },
    })
    return { ...recipe, nutrition: computeNutrition(recipe.ingredients, recipe.servings) }
  })

  fastify.put<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const existing = await prisma.recipe.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!existing) return reply.status(404).send({ error: 'Not found' })

      const body = RecipeSchema.partial().safeParse(request.body)
      if (!body.success) return reply.status(400).send({ error: 'Invalid input' })

      if (body.data.ingredients) {
        await prisma.recipeIngredient.deleteMany({ where: { recipeId: existing.id } })
      }

      const recipe = await prisma.recipe.update({
        where: { id: existing.id },
        data: {
          name: body.data.name,
          description: body.data.description,
          servings: body.data.servings,
          ...(body.data.ingredients
            ? { ingredients: { create: body.data.ingredients } }
            : {}),
        },
        include: { ingredients: { include: { foodItem: true } } },
      })
      return { ...recipe, nutrition: computeNutrition(recipe.ingredients, recipe.servings) }
    }
  )

  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const existing = await prisma.recipe.findFirst({
        where: { id: request.params.id, userId: request.user.userId },
      })
      if (!existing) return reply.status(404).send({ error: 'Not found' })
      await prisma.recipeIngredient.deleteMany({ where: { recipeId: existing.id } })
      await prisma.recipe.delete({ where: { id: existing.id } })
      return { ok: true }
    }
  )
}

export default recipeRoutes
