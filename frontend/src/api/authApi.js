import api from './axios'

export const authApi = {
  register(payload) {
    return api.post('/auth/register', payload)
  },

  login(payload) {
    return api.post('/auth/login', payload)
  },

  googleLogin(payload) {
    return api.post('/auth/google', payload)
  },

  sendOtp(phone) {
    return api.post('/auth/send-otp', { phone })
  },

  verifyOtp(payload) {
    return api.post('/auth/verify-otp', payload)
  },

  logout(refreshToken) {
    return api.post('/auth/logout', { refreshToken })
  },

  refreshToken(refreshToken) {
    return api.post('/auth/refresh-token', { refreshToken })
  },

  getMe() {
    return api.get('/auth/me')
  },

  updateProfile(payload) {
    return api.put('/auth/profile', payload)
  },

  changePassword(payload) {
    return api.put('/auth/change-password', payload)
  },

  deleteAccount(refreshToken) {
    return api.delete('/auth/account', { data: { refreshToken } })
  },

  forgotPassword(email) {
    return api.post('/auth/forgot-password', { email })
  },

  resetPassword(payload) {
    return api.post('/auth/reset-password', payload)
  },
}
