import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

interface ImportResult {
  weightEntries: number
}

interface ImportHistory {
  id: string
  type: string
  importedAt: string
  recordCount: number
}

function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="flex items-center gap-2 mt-1">
      <code className="flex-1 text-xs bg-surfaceHigh px-3 py-2 rounded-lg font-mono truncate text-muted">
        {value}
      </code>
      <button
        onClick={handleCopy}
        className="text-xs text-primary font-medium px-3 py-2 rounded-lg bg-primary/10 shrink-0"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

const SHORTCUT_BODY_FIELDS = [
  { key: 'token', value: 'Your API Token (paste the value above)' },
  { key: 'date', value: 'Format Date → "YYYY-MM-DD" from Current Date' },
  { key: 'weight_kg', value: 'Health → Body Mass → in kg' },
  { key: 'steps', value: 'Health → Step Count → sum for today' },
  { key: 'active_calories', value: 'Health → Active Energy Burned → sum for today' },
]

export function AppleHealth() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportError(null)
    setResult(null)

    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<ImportResult>('/health/apple/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      // Refresh history
      const { data: hist } = await api.get<ImportHistory[]>('/health/apple/history')
      setHistory(hist)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Import failed — please try again'
      setImportError(msg)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const loadHistory = async () => {
    if (historyLoaded) return
    try {
      const { data } = await api.get<ImportHistory[]>('/health/apple/history')
      setHistory(data)
      setHistoryLoaded(true)
    } catch { /* silent */ }
  }

  // Load history on mount
  if (!historyLoaded) loadHistory()

  const shortcutUrl = `${window.location.origin}/api/health/apple/shortcut`
  const apiToken = user?.id ?? ''

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-3 safe-top flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-primary text-sm font-medium"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold">Apple Health</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-nav space-y-5">

        {/* XML Import */}
        <section>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">XML Import</p>
          <div className="bg-surface rounded-2xl p-4 space-y-3">
            <p className="text-sm text-muted leading-relaxed">
              Export from the Health app: tap your profile photo → Export All Health Data → share the
              ZIP to this device, then extract <strong className="text-foreground">export.xml</strong> and
              select it below. Only weight (body mass) records are imported right now.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".xml"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted disabled:opacity-50 active:bg-surfaceHigh transition-colors"
            >
              {importing ? 'Importing...' : 'Select export.xml'}
            </button>

            {result && (
              <div className="p-3 bg-success/10 border border-success/30 rounded-xl">
                <p className="text-sm text-success font-semibold">Import complete</p>
                <p className="text-xs text-success/80 mt-0.5">
                  {result.weightEntries} weight {result.weightEntries === 1 ? 'entry' : 'entries'} imported
                </p>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl">
                <p className="text-sm text-danger">{importError}</p>
              </div>
            )}

            {/* Past imports */}
            {history.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted font-medium mb-2">Past imports</p>
                <div className="space-y-1">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted">
                        {new Date(h.importedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' '}<span className="text-muted/60">({h.type.replace('_', ' ').toLowerCase()})</span>
                      </span>
                      <span className="text-foreground font-medium">{h.recordCount} records</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* iOS Shortcut Setup */}
        <section>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Daily Sync via iOS Shortcut</p>
          <div className="bg-surface rounded-2xl p-4 space-y-4">
            <p className="text-sm text-muted leading-relaxed">
              Set up a Shortcut that runs automatically each morning and syncs your latest weight,
              steps, and active calories — no exports needed.
            </p>

            {/* API Token */}
            <div>
              <p className="text-xs font-medium mb-0.5">Your API Token</p>
              <CopyableCode value={apiToken} />
            </div>

            {/* Webhook URL */}
            <div>
              <p className="text-xs font-medium mb-0.5">Shortcut URL</p>
              <CopyableCode value={shortcutUrl} />
            </div>

            {/* Step-by-step */}
            <div>
              <p className="text-sm font-semibold mb-3">Setup Steps</p>
              <ol className="space-y-3">
                {[
                  'Open the Shortcuts app on your iPhone.',
                  'Tap  +  to create a new shortcut.',
                  'Add action: "Get Contents of URL".',
                  `Set the URL to the Shortcut URL above. Set Method to POST.`,
                  'Set Request Body to JSON and add the fields below:',
                  'Add an Automation: Settings → Automations → New → Time of Day → 8:00 AM Daily → Run Immediately → choose your shortcut.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-muted leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>

              {/* JSON body fields */}
              <div className="mt-3 ml-8 bg-surfaceHigh rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-muted mb-2">JSON Request Body Fields</p>
                {SHORTCUT_BODY_FIELDS.map((f) => (
                  <div key={f.key}>
                    <span className="text-xs font-mono text-primary">{f.key}</span>
                    <span className="text-xs text-muted"> → {f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-surfaceHigh rounded-xl">
              <p className="text-xs text-muted leading-relaxed">
                <strong className="text-foreground">Tip:</strong> The shortcut runs silently in the background.
                Your weight chart will update the next time you open the app. Steps and active calories feed
                into the "Count Active Calories" toggle in Settings if enabled.
              </p>
            </div>
          </div>
        </section>

        {/* Native HealthKit note (shown on iOS native only — but show always for info) */}
        <section>
          <p className="text-xs text-muted uppercase tracking-wide font-medium mb-2">Native iOS App</p>
          <div className="bg-surface rounded-2xl p-4">
            <p className="text-sm text-muted leading-relaxed">
              When FitSelf is sideloaded via Capacitor + AltStore, it connects to HealthKit directly — no
              shortcuts or exports needed. Data syncs automatically whenever you open the app.
              See the README for the sideloading guide.
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
