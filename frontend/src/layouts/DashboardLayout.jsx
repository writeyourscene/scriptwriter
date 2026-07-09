import { useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { FiFilm, FiLogOut, FiSun, FiMoon, FiSettings } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Button } from '../components/ui/Button'
import UserSettingsModal from '../components/projects/UserSettingsModal'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-900">
      <header className="border-b border-surface-700 bg-surface-800/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ee7712]">
              <FiFilm className="text-white" />
            </div>
            <span className="font-semibold">ScriptWriter</span>
          </Link>

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
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>

      <UserSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
