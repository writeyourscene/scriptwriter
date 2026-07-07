import { useState, useEffect } from 'react'
import { FiX, FiUser, FiLock, FiCheck } from 'react-icons/fi'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'

export default function UserSettingsModal({ open, onClose }) {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'password'

  // Profile Form State
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Status State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (open && user) {
      setUsername(user.username || '')
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      // Reset password states
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess('')
    }
  }, [open, user])

  if (!open) return null

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await authApi.updateProfile({
        username,
        firstName,
        lastName
      })
      await refreshUser()
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile details.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      setLoading(false)
      return
    }

    try {
      await authApi.changePassword({
        currentPassword,
        newPassword
      })
      setSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your current password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl border border-surface-700 bg-surface-850 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-700 bg-surface-900/50">
          <button
            onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'profile'
                ? 'border-brand-primary text-brand-primary bg-brand-lightbg'
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FiUser size={14} />
            Edit Profile
          </button>
          <button
            onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
            className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'password'
                ? 'border-brand-primary text-brand-primary bg-brand-lightbg'
                : 'border-transparent text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FiLock size={14} />
            Security
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
              <FiCheck /> {success}
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-brand-primary focus:outline-none"
                  placeholder="Username"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-brand-primary focus:outline-none"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-brand-primary focus:outline-none"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={loading} className="w-full justify-center">
                  {loading ? 'Saving...' : 'Save Profile Details'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-brand-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-brand-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-brand-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={loading} className="w-full justify-center">
                  {loading ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
