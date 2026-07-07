import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { SCREENPLAY_TYPES } from '../../constants/projects'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'

export default function EditProjectModal({ open, onClose, onSubmit, project, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (project) {
      reset({
        title: project.title || '',
        genre: project.genre || '',
        language: project.language || 'en',
        screenplayType: project.screenplayType || 'MOVIE',
        status: project.status || 'DRAFT',
        description: project.description || '',
        estimatedRuntime: project.estimatedRuntime || '',
      })
    }
  }, [project, reset])

  if (!open || !project) return null

  const submit = async (data) => {
    try {
      await onSubmit({
        id: project.id,
        payload: {
          ...data,
          estimatedRuntime: data.estimatedRuntime ? parseInt(data.estimatedRuntime, 10) : null,
        },
      })
      onClose()
    } catch (err) {
      console.error('Update error:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-700 bg-surface-850 p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Project Details</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white transition-colors">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Input
            label="Project name"
            placeholder="My Screenplay"
            error={errors.title?.message}
            {...register('title', { required: 'Project name is required' })}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Genre"
              placeholder="Drama, Thriller..."
              error={errors.genre?.message}
              {...register('genre', { required: 'Genre is required' })}
            />
            <Input
              label="Language"
              placeholder="en"
              error={errors.language?.message}
              {...register('language', { required: 'Language is required' })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Screenplay type</label>
              <select
                className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-colors"
                {...register('screenplayType', { required: 'Screenplay type is required' })}
              >
                {SCREENPLAY_TYPES.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-surface-800 text-gray-900 dark:text-white">{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-colors"
                {...register('status', { required: 'Status is required' })}
              >
                <option value="DRAFT" className="bg-surface-800 text-gray-900 dark:text-white">Draft</option>
                <option value="WRITING" className="bg-surface-800 text-gray-900 dark:text-white">Writing</option>
                <option value="REVIEW" className="bg-surface-800 text-gray-900 dark:text-white">Review</option>
                <option value="COMPLETED" className="bg-surface-800 text-gray-900 dark:text-white">Completed</option>
                <option value="PUBLISHED" className="bg-surface-800 text-gray-900 dark:text-white">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 outline-none focus:border-brand-primary transition-colors"
              rows={3}
              placeholder="Brief description..."
              {...register('description')}
            />
          </div>

          <Input label="Estimated runtime (minutes)" type="number" {...register('estimatedRuntime')} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? <Spinner /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
