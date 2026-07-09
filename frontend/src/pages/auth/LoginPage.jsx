import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { FcGoogle } from 'react-icons/fc'
import { FiEye, FiEyeOff, FiFilm } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onEmailLogin = async (data) => {
    setApiError('')
    try {
      const res = await login(data)
      if (res?.user?.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  const onGoogleLogin = async () => {
    setApiError('')
    setLoading(true)
    try {
      const email = window.prompt('Dev mode: enter your Google email')
      if (!email) return
      const { data } = await authApi.googleLogin({ idToken: 'dev-token', email })
      localStorage.setItem('sw_access_token', data.data.accessToken)
      localStorage.setItem('sw_refresh_token', data.data.refreshToken)
      localStorage.setItem('sw_user', JSON.stringify(data.data.user))
      
      if (data.data.user?.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
      window.location.reload()
    } catch (err) {
      setApiError(err.response?.data?.message || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col items-start">
        <div className="flex items-center gap-2.5 mb-4 select-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ee7712] shadow-md shadow-orange-500/20">
            <FiFilm className="text-lg text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">ScriptWriter</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Sign in to continue writing your screenplay</p>
      </motion.div>

      <motion.form onSubmit={handleSubmit(onEmailLogin)} variants={itemVariants} className="space-y-4">
        <Input
          label="Email or Username"
          type="text"
          placeholder="you@example.com or username"
          error={errors.email?.message}
          {...register('email', { required: 'Email or Username is required' })}
        />
        
        <div className="space-y-1.5 relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
              className={`w-full rounded-lg border border-surface-600 bg-surface-800 pl-3.5 pr-10 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${
                errors.password ? 'border-red-500' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? <FiEyeOff className="text-base" /> : <FiEye className="text-base" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-550 dark:text-red-400 mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
            Forgot password?
          </Link>
        </div>

        {apiError && <ErrorBox message={apiError} />}

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2 py-2.5 font-bold shadow-md shadow-brand-primary/10 transition-all active:scale-[0.98]">
          {isSubmitting ? <Spinner /> : 'Sign in'}
        </Button>
      </motion.form>

      <motion.div variants={itemVariants} className="relative my-4 select-none">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-surface-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-surface-850 px-3 text-gray-400 dark:text-gray-500 font-bold tracking-wider">
            Or continue with
          </span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <Button variant="secondary" type="button" onClick={onGoogleLogin} disabled={loading} className="w-full gap-2.5 py-2.5 font-bold hover:bg-gray-50 dark:hover:bg-surface-800 transition-all border border-gray-200 dark:border-surface-700 active:scale-[0.98]">
          <FcGoogle className="text-lg" />
          Continue with Google
        </Button>
      </motion.div>

      <motion.p variants={itemVariants} className="text-center text-sm text-gray-500 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 ml-1">
          Create one
        </Link>
      </motion.p>
    </motion.div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  )
}
