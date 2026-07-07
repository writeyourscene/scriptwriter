import { useMemo, useState } from 'react'
import { FiSearch, FiUser } from 'react-icons/fi'
import { Spinner } from '../ui/Spinner'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'MAIN', label: 'Main' },
  { value: 'SUPPORTING', label: 'Supporting' },
  { value: 'VILLAIN', label: 'Villain' },
  { value: 'HERO', label: 'Hero' },
  { value: 'GUEST', label: 'Guest' },
  { value: 'CAMEO', label: 'Cameo' },
]

const STATUS_LABELS = {
  MAIN: 'Main',
  SUPPORTING: 'Supporting',
  VILLAIN: 'Villain',
  HERO: 'Hero',
  GUEST: 'Guest',
  CAMEO: 'Cameo',
}

export default function CharacterPanel({ characters, loading, onSelect, onSearch, onFilterStatus }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const sorted = useMemo(
    () => [...characters].sort((a, b) => a.name.localeCompare(b.name)),
    [characters]
  )

  const handleSearch = (value) => {
    setSearch(value)
    onSearch?.(value, status || undefined)
  }

  const handleStatus = (value) => {
    setStatus(value)
    onFilterStatus?.(search, value || undefined)
  }

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <FiUser /> Characters
      </h3>

      <div className="mb-3 space-y-2">
        <div className="relative">
          <FiSearch className="absolute left-2.5 top-2.5 text-gray-500" size={14} />
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-600 bg-surface-700 py-2 pl-8 pr-3 text-xs text-white placeholder:text-gray-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
          className="w-full rounded-lg border border-surface-600 bg-surface-700 px-2 py-1.5 text-xs text-white"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value || 'all'} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
      ) : (
        <ul className="space-y-1">
          {sorted.length === 0 && (
            <li className="text-sm text-gray-500">No characters yet. Type a name in the editor.</li>
          )}
          {sorted.map((char) => (
            <li key={char.id}>
              <button
                type="button"
                onClick={() => onSelect(char)}
                className="w-full rounded-lg px-2 py-2 text-left hover:bg-surface-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-gray-200">{char.name}</span>
                  {char.status && (
                    <span className="shrink-0 rounded bg-surface-600 px-1.5 py-0.5 text-[10px] text-gray-400">
                      {STATUS_LABELS[char.status] || char.status}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex gap-3 text-[10px] text-gray-500">
                  <span>{char.dialogueCount} lines</span>
                  <span>{char.sceneCount} scenes</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
