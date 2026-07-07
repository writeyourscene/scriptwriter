import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiFilm } from 'react-icons/fi'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen auth-layout">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between bg-surface-800 p-12 auth-dark-panel">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-surface-900 to-surface-900" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ee7712]">
            <FiFilm className="text-xl text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">ScriptWriter</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <h1 className="font-mono text-4xl font-bold leading-tight text-white">
            Write your story.
            <br />
            <span className="text-brand-400">Industry standard.</span>
          </h1>
          <p className="mt-4 text-gray-300">
            Professional screenplay formatting with AI-powered writing assistance for directors and writers.
          </p>
        </motion.div>
        <p className="relative z-10 text-sm text-gray-400">© 2026 ScriptWriter</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ee7712]">
            <FiFilm className="text-lg text-white" />
          </div>
          <span className="text-lg font-semibold">ScriptWriter</span>
        </div>
        <div className="w-full max-w-md auth-card">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
