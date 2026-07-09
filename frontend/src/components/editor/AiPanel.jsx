import { useState } from 'react'
import { FiSend, FiX } from 'react-icons/fi'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'

const QUICK_PROMPTS = [
  { type: 'CONTINUE', label: 'Continue writing' },
  { type: 'GRAMMAR', label: 'Fix grammar' },
  { type: 'DIALOGUE', label: 'Suggest dialogue' },
  { type: 'ANALYZE', label: 'Analyze story' },
]

export default function AiPanel({ open, onClose, onSubmit, loading, lastResponse }) {
  const [prompt, setPrompt] = useState('')

  if (!open) return null

  const submit = (type = 'CHAT') => {
    if (!prompt.trim()) return
    onSubmit({ type, prompt })
    setPrompt('')
  }

  return (
    <aside className="flex w-full h-full shrink-0 flex-col bg-gray-55 dark:bg-surface-900 bg-gray-50">
      <div className="flex items-center justify-between border-b border-surface-700 p-4">
        <h3 className="font-semibold">AI Assistant</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><FiX /></button>
      </div>

      <div className="flex flex-wrap gap-2 p-3">
        {QUICK_PROMPTS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSubmit({ type, prompt: prompt || label })}
            className="rounded-full bg-surface-700 px-3 py-1 text-xs text-gray-300 hover:bg-brand-500/20 hover:text-brand-400"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && <div className="flex justify-center py-8"><Spinner /></div>}
        {lastResponse && (
          <div className="rounded-lg bg-surface-700 p-3 text-sm text-gray-300 whitespace-pre-wrap">
            {lastResponse}
          </div>
        )}
        {!loading && !lastResponse && (
          <p className="text-sm text-gray-500">Ask the AI to help with dialogue, scenes, grammar, or story ideas.</p>
        )}
      </div>

      <div className="border-t border-surface-700 p-3">
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Ask AI..."
            className="flex-1 rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-white"
          />
          <Button onClick={() => submit()} disabled={loading}><FiSend /></Button>
        </div>
      </div>
    </aside>
  )
}
