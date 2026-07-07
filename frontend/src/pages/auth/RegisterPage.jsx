import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=[\]{}:;"'\\|,.<>/?]).{8,32}$/

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    setApiError('')
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      })
      navigate('/dashboard')
    } catch (err) {
      const validation = err.response?.data?.data
      if (validation && typeof validation === 'object') {
        setApiError(Object.values(validation).join(', '))
      } else {
        setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
      }
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Create your account</h2>
      <p className="mt-1 text-sm text-gray-400">Start writing professional screenplays today</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            placeholder="John"
            error={errors.firstName?.message}
            {...register('firstName', { required: 'First name is required', maxLength: 50 })}
          />
          <Input
            label="Last name"
            placeholder="Doe"
            {...register('lastName', { maxLength: 100 })}
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            pattern: {
              value: PASSWORD_RULE,
              message: 'Must include upper, lower, number, special char (8-32 chars)',
            },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === watch('password') || 'Passwords do not match',
          })}
        />

        {apiError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {apiError}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
          {isSubmitting ? <Spinner /> : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-400 hover:text-brand-300">
          Sign in
        </Link>
      </p>
    </div>
  )
}
