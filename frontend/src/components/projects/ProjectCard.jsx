import { useNavigate } from 'react-router-dom'
import { FiStar } from 'react-icons/fi'
import { PROJECT_STATUS_COLORS } from '../../constants/projects'
import ProjectMenu from './ProjectMenu'

export default function ProjectCard({ project, onAction, trash = false }) {
  const navigate = useNavigate()
  const statusClass = PROJECT_STATUS_COLORS[project.status] || PROJECT_STATUS_COLORS.DRAFT

  const openEditor = () => {
    if (!trash) navigate(`/projects/${project.id}/editor`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openEditor}
      onKeyDown={(e) => e.key === 'Enter' && openEditor()}
      className={`group relative rounded-2xl border border-gray-150 dark:border-surface-700 bg-surface-800 p-5 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-brand-primary/5 dark:hover:shadow-black/20 hover:border-brand-primary/40 ${
        !trash ? 'cursor-pointer' : ''
      }`}
    >
      {/* Glowing Left Accent */}
      <span className="absolute inset-y-4 left-0 w-1 rounded-r bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900 dark:text-white">{project.title}</h3>
            {project.favorite && <FiStar className="shrink-0 fill-brand-primary text-brand-primary animate-pulse" />}
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-450">
            {project.genre} · {project.screenplayType?.replace('_', ' ')}
          </p>
        </div>
        <ProjectMenu project={project} onAction={onAction} trash={trash} />
      </div>

      {project.description && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-650 dark:text-gray-400">{project.description}</p>
      )}

      {project.statistics && (
        <div className="mb-3 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{project.statistics.scenes} scenes</span>
          <span>{project.statistics.characters} characters</span>
          {project.estimatedRuntime && <span>{project.estimatedRuntime} min</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
          {project.status?.replace('_', ' ')}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(project.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}
