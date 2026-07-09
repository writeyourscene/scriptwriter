import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUsers, FiLock, FiUnlock, FiTrash2, FiSearch, FiAlertTriangle, FiCheckCircle, FiKey } from 'react-icons/fi'
import { adminApi } from '../api/adminApi'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Spinner'

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [resettingUser, setResettingUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resettingError, setResettingError] = useState('')
  const [resettingSuccess, setResettingSuccess] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await adminApi.getUsers()
      setUsers(data.data || [])
      setError('')
    } catch (err) {
      console.error(err)
      setError('Failed to fetch users. Make sure you are logged in as ADMIN.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleAccess = async (user) => {
    const targetStatus = !user.projectAccess
    try {
      await adminApi.toggleAccess(user.id, targetStatus)
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, projectAccess: targetStatus } : u))
      )
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update access status.')
    }
  }

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete yourself.")
      return
    }
    const confirmMessage = `WARNING:\nAre you sure you want to delete user "${user.username}"?\n\nThis will PERMANENTLY delete their account and ALL of their screenplays/projects. This action CANNOT be undone.`
    
    if (window.confirm(confirmMessage)) {
      try {
        await adminApi.deleteUser(user.id)
        setUsers(prev => prev.filter(u => u.id !== user.id))
        alert(`User ${user.username} and all their projects have been deleted successfully.`)
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user.')
      }
    }
  }

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.trim().length < 4) {
      setResettingError('Password must be at least 4 characters long')
      return
    }
    try {
      await adminApi.resetPassword(resettingUser.id, newPassword.trim())
      setResettingSuccess('Password reset successfully!')
      setNewPassword('')
      setResettingError('')
      setTimeout(() => {
        setResettingUser(null)
        setResettingSuccess('')
      }, 1500)
    } catch (err) {
      setResettingError(err.response?.data?.message || 'Failed to reset password.')
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'admin') return matchesSearch && u.role === 'ADMIN'
    if (statusFilter === 'no-access') return matchesSearch && !u.projectAccess && u.role !== 'ADMIN'
    if (statusFilter === 'has-access') return matchesSearch && u.projectAccess
    return matchesSearch
  })

  // Statistics
  const totalUsers = users.length
  const adminsCount = users.filter(u => u.role === 'ADMIN').length
  const accessEnabledCount = users.filter(u => u.projectAccess).length
  const accessDisabledCount = users.filter(u => !u.projectAccess && u.role !== 'ADMIN').length

  if (loading && users.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-surface-700 pb-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary select-none">Console Manager</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-1">System Administration</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
          Monitor active system accounts, approve screenplay authoring permissions, and handle user security credentials across the ScriptWriter workspace.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: totalUsers, icon: FiUsers, color: 'text-brand-primary bg-brand-lightbg' },
          { label: 'Administrators', value: adminsCount, icon: FiUnlock, color: 'text-purple-700 dark:text-purple-400 bg-purple-500/10' },
          { label: 'Access Approved', value: accessEnabledCount, icon: FiCheckCircle, color: 'text-emerald-700 dark:text-emerald-450 bg-emerald-500/10' },
          { label: 'Approval Pending', value: accessDisabledCount, icon: FiLock, color: 'text-amber-800 dark:text-amber-400 bg-amber-500/10' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 sm:gap-4 rounded-xl border border-surface-700 bg-surface-800 p-3.5 sm:p-5 shadow-lg"
          >
            <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
              <stat.icon className="text-lg sm:text-xl" />
            </div>
            <div>
              <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-none sm:leading-normal">{stat.label}</p>
              <p className="text-lg sm:text-2xl font-bold mt-1 text-gray-900 dark:text-white leading-none">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-300 flex items-center gap-2">
          <FiAlertTriangle className="text-lg shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base" />
          <input
            type="text"
            placeholder="Search users by name, email or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-surface-700 bg-surface-800 py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:border-brand-primary transition-all shadow-inner"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'has-access', label: 'Has Access' },
            { id: 'no-access', label: 'Pending Approval' },
            { id: 'admin', label: 'Admins Only' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                statusFilter === f.id
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                  : 'bg-surface-800 text-gray-500 dark:text-gray-400 border border-surface-700 hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="overflow-hidden rounded-2xl border border-surface-700 bg-surface-800 shadow-xl"
      >
        {/* Desktop View: Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-700 bg-surface-850/50 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Project Creation Access</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || u.username?.[0] || ''}`.toUpperCase()
                  
                  return (
                    <tr key={u.id} className="hover:bg-surface-850/30 transition-colors">
                      {/* Profile details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.profileImage ? (
                            <img
                              src={u.profileImage}
                              alt={u.username}
                              className="h-10 w-10 rounded-full object-cover border border-surface-650"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-700 text-xs font-bold text-gray-700 dark:text-gray-200 border border-surface-600">
                              {initials}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                              {u.firstName} {u.lastName}
                              {u.id === currentUser?.id && (
                                <span className="rounded bg-brand-lightbg text-brand-primary text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-450 mt-0.5">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {u.email}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-lg px-2 py-1 text-xs font-semibold ${
                          u.role === 'ADMIN' 
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400' 
                            : 'bg-surface-700 text-gray-750 dark:text-gray-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Access switch */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {u.role === 'ADMIN' ? (
                            <span className="text-xs text-purple-700 dark:text-purple-400 italic">Always Granted</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleAccess(u)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                u.projectAccess
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                              }`}
                            >
                              {u.projectAccess ? (
                                <>
                                  <FiUnlock className="text-sm" /> Approved (Revoke)
                                </>
                              ) : (
                                <>
                                  <FiLock className="text-sm" /> Blocked (Approve)
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right flex justify-end gap-1 items-center">
                        <button
                          type="button"
                          onClick={() => setResettingUser(u)}
                          className="rounded-lg p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-750 dark:hover:text-amber-350 transition-colors"
                          title="Reset User Password"
                        >
                          <FiKey className="text-lg" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === currentUser?.id || u.role === 'ADMIN'}
                          className={`rounded-lg p-2 transition-colors ${
                            u.id === currentUser?.id || u.role === 'ADMIN'
                              ? 'text-gray-650 cursor-not-allowed opacity-50'
                              : 'text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-750 dark:hover:text-red-350'
                          }`}
                          title={u.role === 'ADMIN' ? 'Cannot delete admin users' : 'Delete User and All Projects'}
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Card-Based Layout */}
        <div className="block md:hidden divide-y divide-surface-700/50">
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              No users found matching your criteria.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || u.username?.[0] || ''}`.toUpperCase()
              return (
                <div key={u.id} className="p-4 space-y-4 bg-surface-800 hover:bg-surface-850/30 transition-all duration-200">
                  {/* Row 1: Profile & Role Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {u.profileImage ? (
                        <img
                          src={u.profileImage}
                          alt={u.username}
                          className="h-10 w-10 rounded-full object-cover border border-surface-650"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-700 text-xs font-bold text-gray-700 dark:text-gray-250 border border-surface-600 animate-none">
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white flex flex-wrap items-center gap-1.5">
                          <span>{u.firstName} {u.lastName}</span>
                          {u.id === currentUser?.id && (
                            <span className="rounded bg-brand-lightbg text-brand-primary text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-455 mt-0.5">@{u.username}</div>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold shrink-0 ${
                      u.role === 'ADMIN' 
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400' 
                        : 'bg-surface-700 text-gray-750 dark:text-gray-300'
                    }`}>
                      {u.role}
                    </span>
                  </div>

                  {/* Row 2: Email */}
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-mono break-all bg-surface-850/50 px-2.5 py-1.5 rounded-lg border border-surface-700">
                    <span className="text-[10px] uppercase font-bold text-gray-500 mr-2">Email:</span>
                    {u.email}
                  </div>

                  {/* Row 3: Project Access Status */}
                  <div className="flex items-center justify-between py-1.5 border-t border-b border-surface-700/50">
                    <span className="text-xs font-semibold text-gray-450">Creation Access:</span>
                    {u.role === 'ADMIN' ? (
                      <span className="text-xs text-purple-700 dark:text-purple-400 font-medium italic">Always Granted</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleAccess(u)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          u.projectAccess
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 active:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 active:bg-amber-500/20'
                        }`}
                      >
                        {u.projectAccess ? (
                          <>
                            <FiUnlock className="text-sm" /> Approved (Revoke)
                          </>
                        ) : (
                          <>
                            <FiLock className="text-sm" /> Blocked (Approve)
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Row 4: Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setResettingUser(u)}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-colors"
                    >
                      <FiKey className="text-sm" /> Reset Password
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      disabled={u.id === currentUser?.id || u.role === 'ADMIN'}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        u.id === currentUser?.id || u.role === 'ADMIN'
                          ? 'border-gray-700/30 text-gray-500 bg-transparent cursor-not-allowed opacity-50'
                          : 'border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400 hover:bg-red-500/15'
                      }`}
                    >
                      <FiTrash2 className="text-sm" /> Delete Account
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </motion.div>

      {/* Password Reset Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResettingUser(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-700 bg-surface-850 p-6 shadow-2xl z-10"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Reset Password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Enter a new password for user <span className="text-gray-900 dark:text-white font-semibold">@{resettingUser.username}</span>.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="New Password (min 4 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-surface-700 bg-surface-900 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:border-brand-primary transition-all shadow-inner"
                  autoFocus
                />
              </div>

              {resettingError && (
                <div className="text-xs text-red-500 dark:text-red-400">{resettingError}</div>
              )}
              {resettingSuccess && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400">{resettingSuccess}</div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => { setResettingUser(null); setNewPassword(''); setResettingError(''); }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Reset Password
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
