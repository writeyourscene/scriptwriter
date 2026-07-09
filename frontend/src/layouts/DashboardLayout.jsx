import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { FiFilm, FiLogOut, FiSun, FiMoon, FiSettings, FiMenu, FiX } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from '../components/ui/Button'
import UserSettingsModal from '../components/projects/UserSettingsModal'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [showAdminSidebar, setShowAdminSidebar] = useState(false)

  const isAdminPanel = window.location.pathname.startsWith('/admin')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-surface-700 bg-surface-800/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {isAdminPanel ? (
            /* Admin view: Left side is hamburger toggle */
            <button
              onClick={() => setShowAdminSidebar(true)}
              className="rounded-lg p-2 text-gray-400 hover:bg-surface-700 hover:text-white transition-colors cursor-pointer select-none"
              title="Open Navigation Menu"
            >
              <FiMenu className="text-xl" />
            </button>
          ) : (
            /* Dashboard view: Left side is logo */
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ee7712] shadow-md shadow-orange-500/10">
                <FiFilm className="text-white" />
              </div>
              <span className="font-semibold text-sm">ScriptWriter</span>
            </Link>
          )}

          {isAdminPanel ? (
            /* Admin view: Right side is logo */
            <div className="flex items-center gap-4">
              {user?.role === 'ADMIN' && !window.location.pathname.startsWith('/admin') && (
                <Link
                  to="/admin"
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold px-3 py-1.5 rounded-lg border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 transition-all mr-2"
                >
                  Admin Panel &rarr;
                </Link>
              )}
              <div className="hidden text-right sm:block select-none">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
              <Link to="/admin" className="flex items-center gap-2.5">
                <span className="font-semibold">ScriptWriter</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ee7712]">
                  <FiFilm className="text-white" />
                </div>
              </Link>
            </div>
          ) : (
            /* Dashboard view: Right side is hamburger toggle + optional admin path redirect link */
            <div className="flex items-center gap-3">
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold px-3 py-1.5 rounded-lg border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 transition-all"
                >
                  Admin Panel &rarr;
                </Link>
              )}
              <button
                onClick={() => setShowAdminSidebar(true)}
                className="rounded-lg p-2 text-gray-400 hover:bg-surface-700 hover:text-white transition-colors cursor-pointer select-none"
                title="Open Navigation Menu"
              >
                <FiMenu className="text-xl" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Global Sidebar Drawer */}
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] transition-opacity duration-300 ${
            showAdminSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowAdminSidebar(false)}
        />

        {/* Drawer container: slides from Left for admin, slides from Right for writer dashboard */}
        <div
          className={`fixed top-0 bottom-0 w-72 bg-surface-850 border-surface-700 shadow-2xl z-[1000] p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
            isAdminPanel
              ? `left-0 border-r ${showAdminSidebar ? 'translate-x-0' : '-translate-x-full'}`
              : `right-0 border-l ${showAdminSidebar ? 'translate-x-0' : 'translate-x-full'}`
          }`}
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-700 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary select-none">
                  {isAdminPanel ? 'Console Menu' : 'Menu'}
                </span>
              </div>
              <button
                onClick={() => setShowAdminSidebar(false)}
                className="rounded p-1 hover:bg-surface-750 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Close Menu"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Profile Info block inside Drawer (Dashboard user view only) */}
            {!isAdminPanel && (
              <div className="rounded-2xl bg-surface-800 border border-surface-700/60 p-4 flex items-center gap-3 shadow-inner my-2 select-none">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-orange-500 text-white font-bold text-sm shadow-md shadow-orange-500/20 uppercase">
                  {user?.username?.substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-white">{user?.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.role || 'Writer'}</p>
                </div>
              </div>
            )}

            {/* Menu items list */}
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setShowAdminSidebar(false)
                  setShowSettings(true)
                }}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-surface-750 hover:text-white transition-all cursor-pointer text-left border-none bg-transparent"
              >
                <FiSettings className="text-lg text-gray-400" />
                <span>Account Settings</span>
              </button>

              {/* Premium Theme Slider Switch */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-surface-750/30 transition-all select-none border border-transparent">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <FiMoon className="text-lg text-indigo-400" />
                  ) : (
                    <FiSun className="text-lg text-amber-500" />
                  )}
                  <span className="text-sm font-semibold text-gray-705 dark:text-gray-300">Dark Mode</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    theme === 'dark' ? 'bg-[#ee7712]' : 'bg-gray-200 dark:bg-surface-700'
                  }`}
                  title="Toggle Theme Mode"
                >
                  <span
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      theme === 'dark' ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <div className="border-t border-surface-700 pt-4">
            <button
              onClick={() => {
                setShowAdminSidebar(false)
                handleLogout()
              }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-650 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer text-left border-none bg-transparent"
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>

      <UserSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
