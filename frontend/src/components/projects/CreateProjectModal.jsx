import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUploadCloud, FiFileText, FiFolderPlus, FiFile } from 'react-icons/fi'
import { SCREENPLAY_TYPES, GENRES } from '../../constants/projects'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'

export default function CreateProjectModal({ open, onClose, onSubmit, onImport, loading }) {
  const [activeTab, setActiveTab] = useState('blank') // 'blank' | 'import'
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { language: 'en', screenplayType: 'MOVIE' } })

  const selectedGenre = watch('genre')
  const selectedScreenplayType = watch('screenplayType')

  if (!open) return null

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'pdf' || ext === 'docx') {
      setSelectedFile(file)
      // Pre-fill the project title with the file name
      const titleWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'))
      setValue('title', titleWithoutExt)
    } else {
      alert('Only .pdf and .docx files are supported.')
    }
  }

  const submit = async (data) => {
    try {
      const finalGenre = data.genre === 'Custom' ? data.customGenre : data.genre
      const finalScreenplayType = data.screenplayType === 'CUSTOM' ? data.customScreenplayType : data.screenplayType
      
      if (activeTab === 'import') {
        if (!selectedFile) {
          alert('Please select a file to import.')
          return
        }
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', data.title)
        formData.append('genre', finalGenre)
        formData.append('screenplayType', finalScreenplayType)
        formData.append('language', data.language)
        await onImport(formData)
      } else {
        const finalData = { ...data, genre: finalGenre, screenplayType: finalScreenplayType }
        await onSubmit(finalData)
      }
      reset()
      setSelectedFile(null)
      setActiveTab('blank')
      onClose()
    } catch (err) {
      console.error('Submit error:', err)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedFile(null)
    setActiveTab('blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-800 p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <FiFolderPlus className="text-lg" />
            </div>
            New Project
          </h2>
          <button type="button" onClick={handleClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white transition-all">
            <FiX />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mb-6 flex rounded-lg bg-surface-800 shadow-inner p-1.5 ring-1 ring-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('blank')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-center text-sm font-bold transition-all ${
              activeTab === 'blank'
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-[1.02]'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FiFile className={activeTab === 'blank' ? 'text-white' : 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]'} size={16} />
            Blank Project
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-center text-sm font-bold transition-all ${
              activeTab === 'import'
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-[1.02]'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FiUploadCloud className={activeTab === 'import' ? 'text-white' : 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]'} size={18} />
            Import PDF / DOCX
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'import' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                    dragActive
                      ? 'border-brand-primary bg-brand-lightbg'
                      : selectedFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-gray-300 dark:border-surface-600 bg-gray-50 dark:bg-surface-900 hover:border-brand-primary/50 dark:hover:border-brand-primary/50 hover:bg-gray-100 dark:hover:bg-surface-900/80'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <>
                      <FiFileText className="mb-3 text-4xl text-emerald-600 dark:text-emerald-400 animate-bounce" />
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedFile.name}</p>
                      <p className="mt-1 text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Click or drag to replace</p>
                    </>
                  ) : (
                    <>
                      <FiUploadCloud className="mb-3 text-5xl text-brand-primary/80 drop-shadow-md transition-transform group-hover:scale-110" />
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Drag & drop your screenplay file here</p>
                      <p className="mt-1 text-xs text-gray-500">Supports PDF or DOCX format</p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            label="Project name"
            placeholder="My Screenplay"
            error={errors.title?.message}
            {...register('title', { required: 'Project name is required' })}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col relative">
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                Genre
                {selectedGenre === 'Custom' && (
                  <button type="button" onClick={() => setValue('genre', '')} className="text-xs text-brand-500 hover:text-brand-600">Choose from list</button>
                )}
              </label>
              {selectedGenre === 'Custom' ? (
                <div className="relative">
                  <input
                    className={`w-full rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors ${errors.customGenre ? 'border-red-500' : ''}`}
                    placeholder="Type custom genre..."
                    autoFocus
                    {...register('customGenre', { required: 'Please specify the custom genre' })}
                  />
                </div>
              ) : (
                <select
                  className={`w-full rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-colors ${errors.genre ? 'border-red-500' : ''}`}
                  {...register('genre', { required: 'Genre is required' })}
                >
                  <option value="" disabled className="text-gray-400">Select Genre...</option>
                  {GENRES.map(({ value, label }) => (
                    <option key={value} value={label} className="bg-white dark:bg-surface-800 text-gray-900 dark:text-white">{label}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-col">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
              <select
                className={`w-full rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-colors ${errors.language ? 'border-red-500' : ''}`}
                {...register('language', { required: 'Language is required' })}
              >
                <option value="en" className="bg-white dark:bg-surface-800">English (en)</option>
                <option value="hi" className="bg-white dark:bg-surface-800">Hindi (hi)</option>
                <option value="bn" className="bg-white dark:bg-surface-800">Bengali (bn)</option>
                <option value="te" className="bg-white dark:bg-surface-800">Telugu (te)</option>
                <option value="mr" className="bg-white dark:bg-surface-800">Marathi (mr)</option>
                <option value="ta" className="bg-white dark:bg-surface-800">Tamil (ta)</option>
                <option value="ur" className="bg-white dark:bg-surface-800">Urdu (ur)</option>
                <option value="gu" className="bg-white dark:bg-surface-800">Gujarati (gu)</option>
                <option value="kn" className="bg-white dark:bg-surface-800">Kannada (kn)</option>
                <option value="or" className="bg-white dark:bg-surface-800">Odia (or)</option>
                <option value="ml" className="bg-white dark:bg-surface-800">Malayalam (ml)</option>
                <option value="pa" className="bg-white dark:bg-surface-800">Punjabi (pa)</option>
              </select>
            </div>
          </div>



          <div className="flex flex-col relative">
            <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              Screenplay type
              {selectedScreenplayType === 'CUSTOM' && (
                <button type="button" onClick={() => setValue('screenplayType', 'MOVIE')} className="text-xs text-brand-500 hover:text-brand-600">Choose from list</button>
              )}
            </label>
            {selectedScreenplayType === 'CUSTOM' ? (
              <div className="relative">
                <input
                  className={`w-full rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors ${errors.customScreenplayType ? 'border-red-500' : ''}`}
                  placeholder="Type custom format (e.g. Graphic Novel)"
                  autoFocus
                  {...register('customScreenplayType', { required: 'Please specify the custom format' })}
                />
              </div>
            ) : (
              <select
                className={`w-full rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary transition-colors ${errors.screenplayType ? 'border-red-500' : ''}`}
                {...register('screenplayType', { required: 'Screenplay type is required' })}
              >
                {SCREENPLAY_TYPES.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-white dark:bg-surface-800 text-gray-900 dark:text-white">{label}</option>
                ))}
              </select>
            )}
          </div>

          {activeTab === 'blank' && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-brand-primary transition-colors"
                  rows={3}
                  placeholder="Brief description..."
                  {...register('description')}
                />
              </div>
              <Input label="Estimated runtime (minutes)" type="number" {...register('estimatedRuntime')} />
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={loading || (activeTab === 'import' && !selectedFile)} className="gap-2">
              {loading ? <Spinner /> : activeTab === 'import' ? 'Import & Create' : 'Create Project'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
