import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { FormGroup } from '@/components/ui/input'

export default function Preferences() {
  const [prefs, setPrefs] = useState({
    language:          'en-US',
    compactMode:       false,
    showRiskSubScores: true,
    autoOpenQueue:     true,
    defaultTab:        'submissions',
  })

  function tog(key) { setPrefs((p) => ({ ...p, [key]: !p[key] })) }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Preferences" subtitle="Customize how the app looks and behaves for you." />

      <div className="card">
        <div className="px-5 py-4 border-b border-line">
          <div className="font-semibold text-sm text-ink-primary">Localization</div>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <FormGroup label="Language">
            <select
              value={prefs.language}
              onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
              className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                         focus:outline-none focus:border-brand text-ink-primary"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-US">Spanish (US)</option>
            </select>
          </FormGroup>
          <FormGroup label="Date Format">
            <select className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                               focus:outline-none focus:border-brand text-ink-primary">
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </FormGroup>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-line">
          <div className="font-semibold text-sm text-ink-primary">Display</div>
          <div className="text-xs text-ink-tertiary mt-0.5">Control what you see and how dense the UI feels.</div>
        </div>
        <div className="p-5 space-y-4">
          <Switch
            checked={prefs.compactMode}
            onCheckedChange={() => tog('compactMode')}
            label="Compact mode"
            description="Use smaller row heights in tables and lists."
          />
          <Switch
            checked={prefs.showRiskSubScores}
            onCheckedChange={() => tog('showRiskSubScores')}
            label="Expand risk sub-scores by default"
            description="Show the AI breakdown automatically on submission detail pages."
          />
          <Switch
            checked={prefs.autoOpenQueue}
            onCheckedChange={() => tog('autoOpenQueue')}
            label="Open underwriting queue on login"
            description="Navigate directly to your queue instead of the submissions list."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Preferences saved')}>Save Preferences</Button>
      </div>
    </div>
  )
}
