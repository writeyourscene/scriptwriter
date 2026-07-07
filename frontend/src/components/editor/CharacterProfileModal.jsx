import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'
import { characterApi } from '../../api/characterApi'

const STATUS_OPTIONS = [
  { value: 'MAIN', label: 'Main Character' },
  { value: 'SUPPORTING', label: 'Supporting' },
  { value: 'VILLAIN', label: 'Villain' },
  { value: 'HERO', label: 'Hero' },
  { value: 'GUEST', label: 'Guest Appearance' },
  { value: 'CAMEO', label: 'Cameo' },
]

export default function CharacterProfileModal({ character, open, onClose, onUpdated }) {
  const [form, setForm] = useState({})
  const [stats, setStats] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!character?.id || !open) return
    setForm({
      name: character.name || '',
      alias: character.alias || '',
      nickname: character.nickname || '',
      age: character.age || '',
      gender: character.gender || '',
      occupation: character.occupation || '',
      personality: character.personality || '',
      description: character.description || '',
      goals: character.goals || '',
      weaknesses: character.weaknesses || '',
      status: character.status || 'SUPPORTING',
    })
    setLoading(true)
    characterApi.statistics(character.id)
      .then(({ data }) => setStats(data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [character, open])

  if (!open || !character) return null

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : null,
      }
      const { data } = await characterApi.update(character.id, payload)
      onUpdated?.(data.data)
      onClose()
    } catch {
      // keep modal open on error
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-12 pb-8">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-surface-600 bg-surface-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-700 px-5 py-4">
          <h3 className="font-semibold">Character Profile</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-700/50 p-3 text-center text-xs">
                  <div><p className="text-gray-500">Dialogues</p><p className="font-semibold">{stats.totalDialogues}</p></div>
                  <div><p className="text-gray-500">Scenes</p><p className="font-semibold">{stats.totalScenes}</p></div>
                  <div><p className="text-gray-500">Words</p><p className="font-semibold">{stats.totalWordsSpoken}</p></div>
                </div>
              )}

              <Input label="Name" value={form.name} onChange={set('name')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Alias" value={form.alias} onChange={set('alias')} />
                <Input label="Nickname" value={form.nickname} onChange={set('nickname')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Age" type="number" value={form.age} onChange={set('age')} />
                <Input label="Gender" value={form.gender} onChange={set('gender')} />
              </div>
              <Input label="Occupation" value={form.occupation} onChange={set('occupation')} />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Status</label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-sm text-white"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  rows={3}
                  className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Personality</label>
                <textarea
                  value={form.personality}
                  onChange={set('personality')}
                  rows={2}
                  className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Goals</label>
                  <textarea
                    value={form.goals}
                    onChange={set('goals')}
                    rows={2}
                    className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">Weaknesses</label>
                  <textarea
                    value={form.weaknesses}
                    onChange={set('weaknesses')}
                    rows={2}
                    className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
              </div>

              {character.timeline?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-gray-300">Timeline</p>
                  <div className="flex flex-wrap gap-1">
                    {character.timeline.map((sceneNum) => (
                      <span key={sceneNum} className="rounded bg-surface-700 px-2 py-0.5 text-xs text-gray-400">
                        Scene {sceneNum}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-surface-700 px-5 py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  )
}
