import { motion } from 'framer-motion'
import { FiX, FiLock } from 'react-icons/fi'
import { Button } from './Button'

export default function ApprovalRequiredModal({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-700 bg-surface-850 p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <FiX className="text-lg" />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <FiLock className="text-2xl" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Project Creation Locked</h3>
          <p className="mt-2.5 text-sm text-gray-650 dark:text-gray-300 px-2 leading-relaxed">
            Your account does not have permission to create screenplays yet. Please contact the system administrator to request approval.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={onClose} className="px-8 shadow-md shadow-brand-primary/10">
            Okay
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
