import api from './axios'

export const adminApi = {
  getUsers() {
    return api.get('/admin/users')
  },

  toggleAccess(id, access) {
    return api.put(`/admin/users/${id}/toggle-access?access=${access}`)
  },

  deleteUser(id) {
    return api.delete(`/admin/users/${id}`)
  },

  resetPassword(id, password) {
    return api.put(`/admin/users/${id}/reset-password?password=${encodeURIComponent(password)}`)
  }
}
