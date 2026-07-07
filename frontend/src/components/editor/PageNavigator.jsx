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
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-surface-600 bg-surface-800 p-3 shadow-xl">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => setPage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && jump()}
            className="w-16 rounded-lg border border-surface-600 bg-surface-700 px-2 py-1 text-sm text-white"
          />
          <span className="text-xs text-gray-400">/ {totalPages}</span>
          <button type="button" onClick={jump} className="rounded-lg bg-brand-500 px-3 py-1 text-xs font-medium text-white">
            Go
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-surface-600 bg-surface-800 px-4 py-2 text-sm shadow-lg hover:bg-surface-700"
      >
        Page {page} <FiChevronUp className={open ? 'rotate-180' : ''} />
      </button>
    </div>
  )
}
