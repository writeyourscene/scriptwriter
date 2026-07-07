import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div>
      <h2 className="text-2xl font-bold">Welcome back</h2>
      <p className="mt-1 text-sm text-gray-400">Sign in to continue writing your screenplay</p>

      <form onSubmit={handleSubmit(onEmailLogin)} className="mt-6 space-y-5">
        <Input
          label="Email or Username"
          type="text"
          placeholder="you@example.com or username"
          error={errors.email?.message}
          {...register('email', { required: 'Email or Username is required' })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-brand-400 hover:text-brand-300">
            Forgot password?
          </Link>
        </div>
        {apiError && <ErrorBox message={apiError} />}
        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Spinner /> : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 space-y-4">
        <Button variant="secondary" type="button" onClick={onGoogleLogin} disabled={loading} className="w-full gap-2">
          <FcGoogle className="text-lg" />
          Continue with Google
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-brand-400 hover:text-brand-300">
          Create one
        </Link>
      </p>
    </div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  )
}
