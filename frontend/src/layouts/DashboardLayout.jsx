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
            /* Left side: Hamburger menu toggle for Admin */
            <button
              onClick={() => setShowAdminSidebar(true)}
              className="rounded-lg p-2 text-gray-400 hover:bg-surface-700 hover:text-white transition-colors cursor-pointer select-none"
              title="Open Administration Menu"
            >
              <FiMenu className="text-xl" />
            </button>
          ) : (
            /* Standard: Left side logo */
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ee7712]">
                <FiFilm className="text-white" />
              </div>
              <span className="font-semibold">ScriptWriter</span>
            </Link>
          )}

          {isAdminPanel ? (
            /* Admin Panel right side logo and user info */
            <div className="flex items-center gap-4">
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
            /* Standard Actions list */
            <div className="flex items-center gap-4">
              {user?.role === 'ADMIN' && !window.location.pathname.startsWith('/admin') && (
                <Link
                  to="/admin"
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold px-3 py-1.5 rounded-lg border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 transition-all"
                >
                  Admin Panel &rarr;
                </Link>
              )}
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-lg p-2 text-gray-400 hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Account Settings"
              >
                <FiSettings className="text-lg" />
              </button>
              <button
                onClick={toggleTheme}
                className="theme-toggle-btn rounded-lg p-2 text-gray-400 hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={theme === 'dark' ? 'Switch to Normal Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <FiSun className="text-amber-400 text-lg" /> : <FiMoon className="text-indigo-600 text-lg" />}
              </button>
              <Button variant="ghost" onClick={handleLogout} className="gap-2">
                <FiLogOut />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Admin Sidebar Drawer */}
      {isAdminPanel && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] transition-opacity duration-300 ${
              showAdminSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setShowAdminSidebar(false)}
          />

          {/* Drawer container */}
          <div
            className={`fixed top-0 bottom-0 left-0 w-64 bg-surface-850 border-r border-surface-700 shadow-2xl z-[1000] p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
              showAdminSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-surface-700 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">Console Menu</span>
                </div>
                <button
                  onClick={() => setShowAdminSidebar(false)}
                  className="rounded p-1 hover:bg-surface-750 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Menu"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

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

                <button
                  onClick={() => {
                    toggleTheme()
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-surface-750 hover:text-white transition-all cursor-pointer text-left border-none bg-transparent"
                >
                  {theme === 'dark' ? (
                    <>
                      <FiSun className="text-lg text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <FiMoon className="text-lg text-indigo-500" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Logout button */}
            <div className="border-t border-surface-700 pt-4">
              <button
                onClick={() => {
                  setShowAdminSidebar(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer text-left border-none bg-transparent"
              >
                <FiLogOut className="text-lg" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>

      <UserSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
