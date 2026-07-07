import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api/authApi'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    setApiError('')
    try {
      await authApi.forgotPassword(data.email)
      setSubmitted(true)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="mt-3 text-sm text-gray-400">
          If an account exists with that email, we&apos;ve sent password reset instructions.
        </p>
        <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand-400 hover:text-brand-300">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Reset password</h2>
      <p className="mt-1 text-sm text-gray-400">Enter your email and we&apos;ll send reset instructions</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />

        {apiError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {apiError}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Spinner /> : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
