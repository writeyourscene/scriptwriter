import { useState } from 'react'
import { FiChevronUp } from 'react-icons/fi'

export default function PageNavigator({ totalPages, onJump }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState('1')

  const jump = () => {
    const num = parseInt(page, 10)
    if (num >= 1 && num <= totalPages) {
      onJump(num)
      setOpen(false)
    }
  }

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-6 z-40">
      {open && (
        <div className="mb-1.5 flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-2 shadow-xl">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => setPage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && jump()}
            className="w-12 rounded border border-gray-200 dark:border-surface-750 bg-gray-50 dark:bg-surface-700 px-1.5 py-0.5 text-xs text-gray-800 dark:text-white outline-none"
          />
          <span className="text-[10px] text-gray-400">/ {totalPages}</span>
          <button type="button" onClick={jump} className="rounded bg-brand-500 hover:bg-brand-600 px-2 py-0.5 text-xs font-bold text-white transition-all shadow-sm">
            Go
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-md hover:bg-gray-50 dark:hover:bg-surface-750 transition-all cursor-pointer active:scale-95"
      >
        Page {page} <FiChevronUp className={`text-[10px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}
