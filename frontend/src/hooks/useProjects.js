import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectApi } from '../api/projectApi'

export function useProjects({ search = '', favorite = null, archived = false, trash = false, page = 0 } = {}) {
  return useQuery({
    queryKey: ['projects', { search, favorite, archived, trash, page }],
    queryFn: async () => {
      const params = { search: search || undefined, page, size: 12 }
      let response
      if (trash) {
        response = await projectApi.listTrash(params)
      } else if (archived) {
        response = await projectApi.listArchived(params)
      } else {
        response = await projectApi.list({ ...params, favorite: favorite ?? undefined })
      }
      return response.data.data
    },
  })
}

export function useProjectMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] })

  return {
    create: useMutation({ mutationFn: (payload) => projectApi.create(payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }) => projectApi.update(id, payload), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id) => projectApi.delete(id), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (id) => projectApi.archive(id), onSuccess: invalidate }),
    restore: useMutation({ mutationFn: (id) => projectApi.restore(id), onSuccess: invalidate }),
    restoreFromTrash: useMutation({ mutationFn: (id) => projectApi.restoreFromTrash(id), onSuccess: invalidate }),
    toggleFavorite: useMutation({ mutationFn: (id) => projectApi.toggleFavorite(id), onSuccess: invalidate }),
    duplicate: useMutation({ mutationFn: (id) => projectApi.duplicate(id), onSuccess: invalidate }),
    importProject: useMutation({ mutationFn: (formData) => projectApi.importProject(formData), onSuccess: invalidate }),
  }
}
