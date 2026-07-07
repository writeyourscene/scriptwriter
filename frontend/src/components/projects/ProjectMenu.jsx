import { useState, useRef, useEffect } from 'react'
import { FiMoreVertical, FiCopy, FiArchive, FiTrash2, FiStar, FiRotateCcw, FiEdit2 } from 'react-icons/fi'

export default function ProjectMenu({ project, onAction, trash = false }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handle = (action) => {
    setOpen(false)
    onAction(action, project)
  }

  const items = trash
    ? [
        { id: 'restoreTrash', label: 'Restore', icon: FiRotateCcw },
        { id: 'delete', label: 'Delete Permanently', icon: FiTrash2, danger: true },
      ]
    : project.archived
      ? [
          { id: 'restore', label: 'Restore', icon: FiRotateCcw },
          { id: 'delete', label: 'Delete', icon: FiTrash2, danger: true },
        ]
      : [
          { id: 'favorite', label: project.favorite ? 'Unfavorite' : 'Favorite', icon: FiStar },
          { id: 'rename', label: 'Rename / Edit Details', icon: FiEdit2 },
          { id: 'duplicate', label: 'Duplicate', icon: FiCopy },
          { id: 'archive', label: 'Archive', icon: FiArchive },
          { id: 'delete', label: 'Delete', icon: FiTrash2, danger: true },
        ]

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg p-1.5 text-gray-400 opacity-0 transition hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white group-hover:opacity-100"
      >
        <FiMoreVertical />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-surface-600 bg-surface-850 py-1 shadow-xl">
          {items.map(({ id, label, icon: Icon, danger }) => (
            <button
              key={id}
              type="button"
              onClick={() => handle(id)}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white transition-colors ${
                danger ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
