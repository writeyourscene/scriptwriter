import { useCallback, useState } from 'react'
import { characterApi } from '../api/characterApi'

export function useCharacters(projectId) {
  const [characters, setCharacters] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  const loadCharacters = useCallback(async (params = {}) => {
    if (!projectId) return
    setLoading(true)
    try {
      const { data } = await characterApi.list(projectId, params)
      setCharacters(data.data || [])
    } catch {
      setCharacters([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const loadSuggestions = useCallback(async (query = '') => {
    if (!projectId) return
    try {
      const { data } = await characterApi.search(projectId, query)
      setSuggestions(data.data || [])
    } catch {
      setSuggestions([])
    }
  }, [projectId])

  const refresh = useCallback(async () => {
    await Promise.all([loadCharacters(), loadSuggestions()])
  }, [loadCharacters, loadSuggestions])

  return {
    characters,
    suggestions,
    loading,
    loadCharacters,
    loadSuggestions,
    refresh,
    setCharacters,
  }
}
