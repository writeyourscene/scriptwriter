import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiSearch, FiStar, FiArchive, FiFolder, FiTrash2 } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useProjects, useProjectMutations } from '../hooks/useProjects'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import ProjectCard from '../components/projects/ProjectCard'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import EditProjectModal from '../components/projects/EditProjectModal'
import ApprovalRequiredModal from '../components/ui/ApprovalRequiredModal'

const filters = [
  { id: 'all', label: 'All', icon: FiFolder },
  { id: 'favorites', label: 'Favorites', icon: FiStar },
  { id: 'archived', label: 'Archived', icon: FiArchive },
  { id: 'trash', label: 'Trash', icon: FiTrash2 },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showApprovalRequired, setShowApprovalRequired] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  const archived = filter === 'archived'
  const trash = filter === 'trash'
  const favorite = filter === 'favorites' ? true : null

  const { data, isLoading, error } = useProjects({ search, favorite, archived, trash })
  const mutations = useProjectMutations()
  const projects = data?.content ?? []

  const handleNewProjectClick = () => {
    if (!user?.projectAccess) {
      setShowApprovalRequired(true);
      return;
    }
    setShowCreate(true);
  }

  const handleCreate = async (data) => {
    try {
      const response = await mutations.create.mutateAsync(data)
      const project = response.data.data
      navigate(`/projects/${project.id}/editor`)
    } catch (err) {
      console.error('Failed to create project:', err)
      const errMsg = err.response?.data?.message || 'Failed to create project. Please try again.'
      alert(errMsg)
      throw err
    }
  }

  const handleImport = async (formData) => {
    try {
      const response = await mutations.importProject.mutateAsync(formData)
      const project = response.data.data
      navigate(`/projects/${project.id}/editor`)
    } catch (err) {
      console.error('Failed to import project:', err)
      alert('Failed to import screenplay. Please check if it is a valid PDF/DOCX file.')
      throw err
    }
  }

  const handleUpdate = async ({ id, payload }) => {
    try {
      await mutations.update.mutateAsync({ id, payload })
    } catch (err) {
      console.error('Failed to update project:', err)
      alert('Failed to update project. Please try again.')
    }
  }

  const handleAction = async (action, project) => {
    switch (action) {
      case 'favorite': await mutations.toggleFavorite.mutateAsync(project.id); break
      case 'duplicate': await mutations.duplicate.mutateAsync(project.id); break
      case 'archive': await mutations.archive.mutateAsync(project.id); break
      case 'restore': await mutations.restore.mutateAsync(project.id); break
      case 'restoreTrash': await mutations.restoreFromTrash.mutateAsync(project.id); break
      case 'rename':
        setSelectedProject(project)
        setShowEdit(true)
        break
      case 'delete':
        if (window.confirm(`Delete "${project.title}"?`)) {
          await mutations.remove.mutateAsync(project.id)
        }
        break
      default: break
    }
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user?.firstName || user?.username}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{data?.totalElements ?? 0} projects</p>
        </div>
        {!trash && (
          <Button onClick={handleNewProjectClick} className="gap-2">
            <FiPlus /> New Project
          </Button>
        )}
      </motion.div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                filter === id
                  ? 'bg-brand-lightbg text-brand-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-surface-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-surface-600 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-primary sm:w-64"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Failed to load projects. Make sure the backend is running.
        </div>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <div className="rounded-2xl border border-dashed border-surface-600 py-20 text-center bg-surface-800/40 backdrop-blur-sm shadow-inner">
          <FiFolder className="mx-auto mb-4 text-4xl text-gray-500 dark:text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-300">No projects found</h3>
          {filter === 'all' && (
            <Button onClick={handleNewProjectClick} className="mt-4 gap-2">
              <FiPlus /> New Project
            </Button>
          )}
        </div>
      )}

      {!isLoading && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onAction={handleAction}
              trash={trash}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        onImport={handleImport}
        loading={mutations.create.isPending || mutations.importProject.isPending}
      />

      <EditProjectModal
        open={showEdit}
        onClose={() => { setShowEdit(false); setSelectedProject(null); }}
        onSubmit={handleUpdate}
        project={selectedProject}
        loading={mutations.update.isPending}
      />

      <ApprovalRequiredModal
        open={showApprovalRequired}
        onClose={() => setShowApprovalRequired(false)}
      />
    </div>
  )
}
