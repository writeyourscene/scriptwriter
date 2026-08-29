import api from './axios'

export const subscriptionApi = {
  createOrder(planType) {
    return api.post('/subscriptions/create-order', { planType })
  },

  verifyPayment(payload) {
    return api.post('/subscriptions/verify-payment', payload)
  },

  getConfig() {
    return api.get('/subscriptions/config')
  },

  updateConfig(monthlyPrice, yearlyPrice, yearlyDiscountPercent) {
    return api.put(`/subscriptions/config?monthlyPrice=${monthlyPrice}&yearlyPrice=${yearlyPrice}&yearlyDiscountPercent=${yearlyDiscountPercent}`)
  }
}
