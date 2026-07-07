import api from './axios'

export const scriptApi = {
  getOrCreate(projectId) {
    return api.get(`/projects/${projectId}/script`)
  },

  getById(scriptId) {
    return api.get(`/scripts/${scriptId}`)
  },

  save(scriptId, payload) {
    return api.put(`/scripts/${scriptId}`, payload)
  },

  autosave(scriptId, payload) {
    return api.post(`/scripts/${scriptId}/autosave`, payload)
  },

  getVersions(scriptId) {
    return api.get(`/scripts/${scriptId}/versions`)
  },

  restoreVersion(scriptId, versionNumber) {
    return api.post(`/scripts/${scriptId}/restore-version`, { versionNumber })
  },

  switchVersion(scriptId, versionNumber) {
    return api.post(`/scripts/${scriptId}/switch-version`, { versionNumber })
  },

  exportPdf(scriptId, pageSize = 'a4', watermark = '') {
    return api.get(`/scripts/${scriptId}/export/pdf`, { params: { pageSize, watermark }, responseType: 'blob' })
  },

  exportDocx(scriptId, pageSize = 'a4') {
    return api.get(`/scripts/${scriptId}/export/docx`, { params: { pageSize }, responseType: 'blob' })
  },

  aiAssist(scriptId, payload) {
    return api.post(`/scripts/${scriptId}/ai`, payload)
  },

  getCharacters(scriptId, query) {
    return api.get(`/scripts/${scriptId}/characters`, { params: { query } })
  },

  toggleShare(scriptId, isShared) {
    return api.put(`/scripts/${scriptId}/share`, null, { params: { isShared } })
  },

  getPublicScript(scriptId) {
    return api.get(`/public/scripts/${scriptId}`)
  },

  exportPublicPdf(scriptId, pageSize = 'a4', watermark = '') {
    return api.get(`/public/scripts/${scriptId}/export/pdf`, { params: { pageSize, watermark }, responseType: 'blob' })
  },

  exportPublicDocx(scriptId, pageSize = 'a4') {
    return api.get(`/public/scripts/${scriptId}/export/docx`, { params: { pageSize }, responseType: 'blob' })
  },

  importFile(scriptId, formData) {
    return api.post(`/scripts/${scriptId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
