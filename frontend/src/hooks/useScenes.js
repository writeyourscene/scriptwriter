import { useCallback, useState } from 'react'
import { sceneApi } from '../api/sceneApi'

export function useScenes(projectId, scriptId) {
  const [scenes, setScenes] = useState([])
  const [loading, setLoading] = useState(false)

  const loadScenes = useCallback(async (params = {}) => {
    if (!projectId) return
    setLoading(true)
    try {
      const { data } = await sceneApi.list(projectId, { scriptId, ...params })
      setScenes(data.data || [])
    } catch {
      setScenes([])
    } finally {
      setLoading(false)
    }
  }, [projectId, scriptId])

  const reorder = useCallback(async (sceneIds) => {
    if (!scriptId) return
    const { data } = await sceneApi.reorder(scriptId, sceneIds)
    setScenes(data.data || [])
  }, [scriptId])

  const toggleFavorite = useCallback(async (scene) => {
    const { data } = await sceneApi.update(scene.id, { favorite: !scene.favorite })
    setScenes((prev) => prev.map((s) => (s.id === scene.id ? data.data : s)))
  }, [])

  return { scenes, loading, loadScenes, reorder, toggleFavorite, setScenes }
}
