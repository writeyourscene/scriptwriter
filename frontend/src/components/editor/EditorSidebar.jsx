import { useState } from 'react'
import { FiClock, FiFilm, FiUser, FiUsers, FiFileText, FiType, FiMessageSquare, FiBarChart2 } from 'react-icons/fi'
import CharacterPanel from './CharacterPanel'
import SceneNavigator from './SceneNavigator'

const TABS = [
  { id: 'stats', label: 'Stats', icon: FiBarChart2, activeColor: 'text-indigo-500 border-indigo-500', inactiveColor: 'text-indigo-400/60 dark:text-indigo-500/40' },
  { id: 'characters', label: 'Characters', icon: FiUser, activeColor: 'text-teal-500 border-teal-500', inactiveColor: 'text-teal-400/60 dark:text-teal-500/40' },
  { id: 'scenes', label: 'Scenes', icon: FiFilm, activeColor: 'text-violet-500 border-violet-500', inactiveColor: 'text-violet-400/60 dark:text-violet-500/40' },
  { id: 'versions', label: 'Versions', icon: FiClock, activeColor: 'text-emerald-500 border-emerald-500', inactiveColor: 'text-emerald-400/60 dark:text-emerald-500/40' },
]

export default function EditorSidebar({
  stats,
  versions,
  onRestoreVersion,
  onCreateVersion,
  characters,
  charactersLoading,
  onCharacterSelect,
  onCharacterSearch,
  onCharacterFilter,
  scenes,
  scenesLoading,
  onJumpToScene,
  onSceneReorder,
  onToggleSceneFavorite,
}) {
  const [tab, setTab] = useState('stats')

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-surface-700 bg-surface-800">
      <div className="flex shrink-0 border-b border-surface-700 bg-surface-850">
        {TABS.map(({ id, label, icon: Icon, activeColor, inactiveColor }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[9px] font-semibold uppercase tracking-wider transition-all border-b-2 ${
              tab === id
                ? activeColor
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-surface-750'
            }`}
          >
            {Icon && <Icon className={tab === id ? '' : inactiveColor} size={14} />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-surface-850/50 backdrop-blur-sm">
        {tab === 'stats' && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-gray-200 dark:border-surface-700">
              <FiBarChart2 className="text-indigo-500 text-sm" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Script Analytics</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-750 p-3 shadow-sm hover:shadow-md hover:border-brand-primary/30 hover:-translate-y-0.5 transition-all flex flex-col gap-1 cursor-default">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Pages</span>
                  <FiFileText className="text-blue-500 text-xs" />
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-white leading-none">{stats.pages}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">Read: ~{stats.pages} min</div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-750 p-3 shadow-sm hover:shadow-md hover:border-brand-primary/30 hover:-translate-y-0.5 transition-all flex flex-col gap-1 cursor-default">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Words</span>
                  <FiType className="text-emerald-500 text-xs" />
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-white leading-none">{stats.words}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">Speech: ~{Math.round(stats.words / 130)} min</div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-750 p-3 shadow-sm hover:shadow-md hover:border-brand-primary/30 hover:-translate-y-0.5 transition-all flex flex-col gap-1 cursor-default">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Scenes</span>
                  <FiFilm className="text-violet-500 text-xs" />
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-white leading-none">{stats.scenes}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">Avg {stats.scenes ? (stats.words / stats.scenes).toFixed(0) : 0} w/sc</div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-750 p-3 shadow-sm hover:shadow-md hover:border-brand-primary/30 hover:-translate-y-0.5 transition-all flex flex-col gap-1 cursor-default">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Cast</span>
                  <FiUsers className="text-amber-500 text-xs" />
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-white leading-none">{stats.characters}</div>
                <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">Characters</div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-750 p-3 shadow-sm hover:shadow-md hover:border-brand-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-between cursor-default">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
                  <FiMessageSquare className="text-xs" />
                </div>
                <div>
                  <div className="text-[9px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Dialogues</div>
                  <div className="text-base font-bold text-gray-800 dark:text-white leading-tight">{stats.dialogues}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 block">Avg / Scene</span>
                <span className="text-xs font-bold text-teal-500">
                  {stats.scenes ? (stats.dialogues / stats.scenes).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === 'characters' && (
          <CharacterPanel
            characters={characters}
            loading={charactersLoading}
            onSelect={onCharacterSelect}
            onSearch={onCharacterSearch}
            onFilterStatus={onCharacterFilter}
          />
        )}

        {tab === 'scenes' && (
          <SceneNavigator
            scenes={scenes}
            loading={scenesLoading}
            onJumpToScene={onJumpToScene}
            onReorder={onSceneReorder}
            onToggleFavorite={onToggleSceneFavorite}
          />
        )}

        {tab === 'versions' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <FiClock /> Versions
              </h3>
              <button
                type="button"
                onClick={onCreateVersion}
                className="rounded-lg bg-brand-primary hover:opacity-90 !text-white px-3 py-1.5 text-[11px] font-bold transition-all shadow-sm cursor-pointer border-none"
              >
                + New Version
              </button>
            </div>
            <ul className="space-y-2">
              {versions.length === 0 && <li className="text-sm text-gray-500">No versions yet</li>}
              {versions.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => onRestoreVersion(v.versionNumber)}
                    className="w-full rounded-lg px-2.5 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-surface-700 border border-surface-700/50 hover:border-brand-primary/30 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-brand-primary">v{v.versionNumber}</span>
                      <span className="text-[9px] text-gray-500">
                        {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {v.label && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic line-clamp-2">
                        "{v.label}"
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  )
}
