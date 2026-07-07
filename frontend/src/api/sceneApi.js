import api from './axios'

export const sceneApi = {
  list(projectId, params = {}) {
    return api.get('/scenes', { params: { projectId, ...params } })
  },

  getById(id) {
    return api.get(`/scenes/${id}`)
  },

  create(payload) {
    return api.post('/scenes', payload)
  },

  update(id, payload) {
    return api.put(`/scenes/${id}`, payload)
  },

  delete(id) {
    return api.delete(`/scenes/${id}`)
  },

  reorder(scriptId, sceneIds) {
    return api.put('/scenes/reorder', { scriptId, sceneIds })
  },

  statistics(id) {
    return api.get(`/scenes/${id}/statistics`)
  },
}
