import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiCheck, FiZap, FiCreditCard } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { subscriptionApi } from '../../api/subscriptionApi'
import { Button } from './Button'

const features = [
  'Unlimited screenplay creation & projects',
  'Automated industry-standard A4/Letter page view pagination',
  'Live autosave and robust version snapshot history',
  'Diagonal watermarks custom text & opacity configuration',
  'Synchronized page breaks high-fidelity PDF / DOCX exports',
  'Public screenplay sharing & presentation preview link generator'
]

export default function SubscriptionModal({ open, onClose }) {
  const { user, refreshUser } = useAuth()
  const [planType, setPlanType] = useState('MONTHLY') // 'MONTHLY' or 'YEARLY'
  const [loading, setLoading] = useState(false)
  const [mockOrder, setMockOrder] = useState(null)
  const [prices, setPrices] = useState({ monthly: 99, yearly: 999 })

  useEffect(() => {
    if (!open) return
    const loadPrices = async () => {
      try {
        const { data } = await subscriptionApi.getConfig()
        if (data.data) {
          setPrices({
            monthly: data.data.monthlyPricePaise / 100,
            yearly: data.data.yearlyPricePaise / 100
          })
        }
      } catch (err) {
        console.error('Failed to load subscription prices config:', err)
      }
    }
    loadPrices()
  }, [open])

  if (!open) return null

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const { data } = await subscriptionApi.createOrder(planType)
      const orderData = data.data

      // Check if it is a mock order
      if (orderData.keyId === 'rzp_test_dummy') {
        setMockOrder(orderData)
        setLoading(false)
        return
      }

      // Live Razorpay payment trigger
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ScriptWriter Pro',
        description: `Upgrade to ${planType === 'YEARLY' ? 'Yearly' : 'Monthly'} Subscription`,
        order_id: orderData.orderId,
        handler: async (response) => {
          setLoading(true)
          try {
            await subscriptionApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planType: planType
            })
            await refreshUser()
            alert('Your subscription is now active! Access granted.')
            onClose()
          } catch (err) {
            console.error('Signature verification failed:', err)
            alert('Payment verification failed. Please contact support.')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#ee7712'
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('Failed checkout initialization:', err)
      alert(err.response?.data?.message || 'Failed to start payment. Please try again.')
      setLoading(false)
    }
  }

  const handleMockVerify = async () => {
    if (!mockOrder) return
    setLoading(true)
    try {
      await subscriptionApi.verifyPayment({
        razorpayOrderId: mockOrder.orderId,
        razorpayPaymentId: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
        razorpaySignature: 'mock_signature',
        planType: planType
      })
      await refreshUser()
      setMockOrder(null)
      alert('Mock subscription activated successfully!')
      onClose()
    } catch (err) {
      console.error(err)
      alert('Mock payment verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-transparent" onClick={onClose} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-3xl border border-surface-700 bg-surface-850 p-5 md:p-7 shadow-2xl z-10 my-4 mx-2 sm:mx-auto"
        >
        {/* Glow Effects */}
        <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-brand-primary/10 blur-2xl" />
        <div className="absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-orange-500/10 blur-2xl" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-surface-750 hover:text-white transition-colors cursor-pointer"
        >
          <FiX className="text-xl" />
        </button>

        {/* Dynamic content depending on mock or details */}
        <AnimatePresence mode="wait">
          {!mockOrder ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4 md:space-y-5"
            >
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto mb-2.5 hidden sm:flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  <FiZap className="text-xl" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Upgrade to ScriptWriter Pro
                </h3>
                <p className="text-xs sm:text-sm text-gray-550 dark:text-gray-400 mt-1 hidden sm:block">
                  Unlock limitless storytelling & professional formatting controls
                </p>
              </div>

              {/* Plan Toggle Selector */}
              <div className="flex justify-center">
                <div className="bg-surface-800 dark:bg-surface-900 border border-surface-750 p-1 rounded-xl flex gap-1 select-none">
                  <button
                    type="button"
                    onClick={() => setPlanType('MONTHLY')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                      planType === 'MONTHLY'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-200'
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlanType('YEARLY')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                      planType === 'YEARLY'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-200'
                    }`}
                  >
                    Yearly Billing
                    <span className="bg-[#ee7712]/15 text-[#ee7712] dark:bg-[#ee7712]/20 dark:text-orange-450 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider">
                      Save 15%
                    </span>
                  </button>
                </div>
              </div>

              {/* Selected Plan Details Card */}
              <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/5 p-4 relative text-center">
                {planType === 'YEARLY' && (
                  <div className="absolute top-2.5 right-2.5 rounded-full bg-brand-primary/15 px-2 py-0.5 text-[9px] font-bold text-brand-primary uppercase tracking-wide border border-brand-primary/20">
                    Best Value
                  </div>
                )}
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {planType === 'MONTHLY' ? 'Monthly Pro Plan' : 'Yearly Pro Plan'}
                </div>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    ₹{planType === 'YEARLY' ? prices.yearly : prices.monthly}
                  </span>
                  <span className="text-xs text-gray-550 dark:text-gray-400">
                    / {planType === 'YEARLY' ? 'year' : 'month'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 px-4 max-w-sm mx-auto">
                  {planType === 'MONTHLY'
                    ? 'Ideal for writing a single project or script revision. Cancel anytime.'
                    : 'Save money with our best-value yearly roadmap plan. Perfect for screenwriters.'}
                </p>
              </div>

              {/* Features List */}
              <div className="rounded-2xl border border-surface-700 bg-surface-800/40 p-4 sm:p-5 space-y-3 hidden sm:block">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">What's Included</span>
                <div className="grid gap-2.5 text-xs text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <FiCheck className="text-brand-primary mt-0.5 shrink-0 text-sm font-bold" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full justify-center gap-2 py-3 text-sm font-bold shadow-lg shadow-brand-primary/10 select-none cursor-pointer"
                >
                  <FiCreditCard className="text-lg" />
                  {loading ? 'Processing Checkout...' : `Pay ₹${planType === 'YEARLY' ? prices.yearly : prices.monthly} via Razorpay`}
                </Button>
                <span className="text-[10px] text-center text-gray-550 dark:text-gray-500">
                  Payments secured via Razorpay. Cancel anytime. Terms & conditions apply.
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mock"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-center py-6 space-y-6"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <FiZap className="text-2xl animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mock Environment Detected</h3>
                <p className="text-sm text-gray-550 dark:text-gray-400 mt-1.5 px-4 max-w-md mx-auto">
                  A real Razorpay Key is not set (`rzp_test_dummy` matches). You can confirm checkout and verify signature instantly below.
                </p>
              </div>

              <div className="rounded-2xl bg-surface-850 dark:bg-surface-800 border border-surface-700/60 p-4 inline-block text-left max-w-sm w-full mx-auto select-none">
                <div className="flex justify-between border-b border-surface-700/50 pb-2 mb-2 text-xs">
                  <span className="text-gray-550 dark:text-gray-400">Order ID:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-255 truncate max-w-[200px]">{mockOrder.orderId}</span>
                </div>
                <div className="flex justify-between border-b border-surface-700/50 pb-2 mb-2 text-xs">
                  <span className="text-gray-550 dark:text-gray-400">Plan type:</span>
                  <span className="font-bold text-gray-900 dark:text-white uppercase">{mockOrder.planType}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-550 dark:text-gray-400">Amount:</span>
                  <span className="font-extrabold text-brand-primary">₹{mockOrder.amount / 100}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <Button
                  variant="secondary"
                  onClick={() => setMockOrder(null)}
                  disabled={loading}
                  className="flex-1 justify-center text-xs"
                >
                  Go Back
                </Button>
                <Button
                  onClick={handleMockVerify}
                  disabled={loading}
                  className="flex-1 justify-center text-xs gap-1.5 font-bold"
                >
                  <FiCheck /> Complete Verification
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
