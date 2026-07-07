import api from './axios'

export const projectApi = {
  list(params = {}) {
    return api.get('/projects', { params })
  },

  listArchived(params = {}) {
    return api.get('/projects/archived', { params })
  },

  listTrash(params = {}) {
    return api.get('/projects/trash', { params })
  },

  getById(id) {
    return api.get(`/projects/${id}`)
  },

  create(payload) {
    return api.post('/projects', payload)
  },

  update(id, payload) {
    return api.put(`/projects/${id}`, payload)
  },

  delete(id) {
    return api.delete(`/projects/${id}`)
  },

  archive(id) {
    return api.put(`/projects/${id}/archive`)
  },

  restore(id) {
    return api.put(`/projects/${id}/restore`)
  },

  restoreFromTrash(id) {
    return api.put(`/projects/${id}/trash-restore`)
  },

  toggleFavorite(id) {
    return api.put(`/projects/${id}/favorite`)
  },

  duplicate(id) {
    return api.post(`/projects/${id}/duplicate`)
  },

  share(id, payload) {
    return api.post(`/projects/${id}/share`, payload)
  },

  importProject(formData) {
    return api.post('/projects/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
