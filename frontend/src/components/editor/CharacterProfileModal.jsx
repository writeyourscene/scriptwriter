import { useEffect, useState } from 'react'
import { FiX, FiChevronDown } from 'react-icons/fi'
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
    <div className="fixed inset-0 z-[1100] flex items-center justify-center overflow-y-auto p-4 md:p-6 bg-black/60 backdrop-blur-[2px] select-none">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-850 shadow-2xl overflow-hidden transform transition-all my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-150 dark:border-surface-750 px-5 py-4">
          <h3 className="font-bold text-gray-800 dark:text-white">Character Profile</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-650 dark:hover:text-white transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 dark:bg-surface-800/40 p-3 text-center text-xs border border-gray-100 dark:border-surface-800">
                  <div><p className="text-gray-400 dark:text-gray-500 font-medium">Dialogues</p><p className="font-bold text-gray-700 dark:text-gray-300 mt-0.5">{stats.totalDialogues}</p></div>
                  <div><p className="text-gray-400 dark:text-gray-500 font-medium">Scenes</p><p className="font-bold text-gray-700 dark:text-gray-300 mt-0.5">{stats.totalScenes}</p></div>
                  <div><p className="text-gray-400 dark:text-gray-500 font-medium">Words</p><p className="font-bold text-gray-700 dark:text-gray-300 mt-0.5">{stats.totalWordsSpoken}</p></div>
                </div>
              )}

              <Input label="Name" value={form.name} onChange={set('name')} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Alias" value={form.alias} onChange={set('alias')} />
                <Input label="Nickname" value={form.nickname} onChange={set('nickname')} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Age" type="number" value={form.age} onChange={set('age')} />
                <Input label="Gender" value={form.gender} onChange={set('gender')} />
              </div>
              
              <Input label="Occupation" value={form.occupation} onChange={set('occupation')} />

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</label>
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={set('status')}
                    className="w-full rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-3.5 pr-10 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-surface-600 transition-all outline-none cursor-pointer appearance-none"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-white dark:bg-surface-850 text-gray-700 dark:text-gray-300">{o.label}</option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-350 focus:border-brand-primary outline-none transition-all resize-none"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Personality</label>
                <textarea
                  value={form.personality}
                  onChange={set('personality')}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-350 focus:border-brand-primary outline-none transition-all resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Goals</label>
                  <textarea
                    value={form.goals}
                    onChange={set('goals')}
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-350 focus:border-brand-primary outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Weaknesses</label>
                  <textarea
                    value={form.weaknesses}
                    onChange={set('weaknesses')}
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-350 focus:border-brand-primary outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {character.timeline?.length > 0 && (
                <div className="border-t border-gray-100 dark:border-surface-800 pt-3">
                  <p className="mb-1.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Timeline</p>
                  <div className="flex flex-wrap gap-1">
                    {character.timeline.map((sceneNum) => (
                      <span key={sceneNum} className="rounded-md bg-gray-50 dark:bg-surface-800 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-surface-750">
                        Scene {sceneNum}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-150 dark:border-surface-750 px-5 py-4 bg-gray-50 dark:bg-surface-800/20">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </div>
  )
}
