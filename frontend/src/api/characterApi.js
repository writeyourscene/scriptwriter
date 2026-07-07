import api from './axios'

export const characterApi = {
  list(projectId, params = {}) {
    return api.get('/characters', { params: { projectId, ...params } })
  },

  search(projectId, query) {
    return api.get('/characters/search', { params: { projectId, query } })
  },

  getById(id) {
    return api.get(`/characters/${id}`)
  },

  create(payload) {
    return api.post('/characters', payload)
  },

  update(id, payload) {
    return api.put(`/characters/${id}`, payload)
  },

  delete(id) {
    return api.delete(`/characters/${id}`)
  },

  statistics(id) {
    return api.get(`/characters/${id}/statistics`)
  },

  addRelationship(id, payload) {
    return api.post(`/characters/${id}/relationships`, payload)
  },

  addNote(id, payload) {
    return api.post(`/characters/${id}/notes`, payload)
  },
}
