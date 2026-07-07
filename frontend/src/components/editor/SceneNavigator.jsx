import { useState } from 'react'
import { FiFilm, FiStar } from 'react-icons/fi'
import { Spinner } from '../ui/Spinner'

export default function SceneNavigator({
  scenes,
  loading,
  onJumpToScene,
  onReorder,
  onToggleFavorite,
}) {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  const handleDragStart = (index) => setDragIndex(index)

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setOverIndex(index)
  }

  const handleDrop = async (index) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    const reordered = [...scenes]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)
    setDragIndex(null)
    setOverIndex(null)
    await onReorder?.(reordered.map((s) => s.id))
  }

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <FiFilm /> Scenes
      </h3>

      {loading ? (
        <div className="flex justify-center py-6"><Spinner className="h-5 w-5" /></div>
      ) : (
        <ul className="space-y-1">
          {scenes.length === 0 && (
            <li className="text-sm text-gray-500">No scenes yet. Add a scene heading in the editor.</li>
          )}
          {scenes.map((scene, index) => (
            <li
              key={scene.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
              className={`rounded-lg transition-colors ${
                overIndex === index ? 'bg-brand-500/10 ring-1 ring-brand-500/30' : ''
              } ${dragIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-1">
                <button
                  type="button"
                  onClick={() => onJumpToScene?.(scene.sceneNumber)}
                  className="min-w-0 flex-1 rounded-lg px-2 py-2 text-left hover:bg-surface-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-[10px] font-bold text-brand-400">
                      {scene.sceneNumber}
                    </span>
                    <span className="truncate text-xs text-gray-200">
                      {scene.slugLine || scene.title || 'Untitled Scene'}
                    </span>
                  </div>
                  <div className="mt-0.5 flex gap-2 pl-5 text-[10px] text-gray-500">
                    {scene.location && <span>{scene.location}</span>}
                    {scene.timeOfDay && <span>· {scene.timeOfDay}</span>}
                    {scene.dialogueCount > 0 && <span>· {scene.dialogueCount} lines</span>}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavorite?.(scene)}
                  className={`mt-2 shrink-0 rounded p-1.5 ${
                    scene.favorite ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'
                  }`}
                  title={scene.favorite ? 'Remove favorite' : 'Mark favorite'}
                >
                  <FiStar size={12} fill={scene.favorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
