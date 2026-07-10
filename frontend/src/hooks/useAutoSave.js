import { useCallback, useEffect, useRef, useState } from 'react'
import { scriptApi } from '../api/scriptApi'

export function useAutoSave(
  scriptId,
  content,
  title,
  fontFamily,
  watermarkEnabled = false,
  watermarkText = 'CONFIDENTIAL',
  watermarkOpacity = 0.1,
  watermarkSize = 64,
  enabled = true,
  onSaved
) {
  const [status, setStatus] = useState('saved')
  const timerRef = useRef(null)
  const lastSavedRef = useRef('')
  const intervalRef = useRef(null)

  // Request queuing refs to prevent concurrent DB updates and locks
  const isSavingRef = useRef(false)
  const pendingSaveRef = useRef(false)

  // Store latest variables in a ref so save always has the absolute latest editor values
  const paramsRef = useRef({ content, title, fontFamily, watermarkEnabled, watermarkText, watermarkOpacity, watermarkSize })
  useEffect(() => {
    paramsRef.current = { content, title, fontFamily, watermarkEnabled, watermarkText, watermarkOpacity, watermarkSize }
  }, [content, title, fontFamily, watermarkEnabled, watermarkText, watermarkOpacity, watermarkSize])

  const save = useCallback(async (isManual = false) => {
    if (!scriptId || !enabled) return

    const params = paramsRef.current
    const payload = {
      content: JSON.stringify(params.content),
      title: params.title,
      fontFamily: params.fontFamily,
      watermarkEnabled: params.watermarkEnabled,
      watermarkText: params.watermarkText,
      watermarkOpacity: params.watermarkOpacity,
      watermarkSize: params.watermarkSize
    }
    const serialized = JSON.stringify(payload)

    // Skip if values match what is already saved on server (and not a manual click)
    if (serialized === lastSavedRef.current && !isManual) return

    // If another save is active, queue this update and wait
    if (isSavingRef.current) {
      pendingSaveRef.current = true
      return
    }

    isSavingRef.current = true
    pendingSaveRef.current = false
    setStatus('saving')

    try {
      const fn = isManual ? scriptApi.save : scriptApi.autosave
      await fn(scriptId, payload)
      lastSavedRef.current = serialized
      setStatus('saved')
      onSaved?.()
    } catch {
      setStatus('error')
    } finally {
      isSavingRef.current = false
      // If new changes arrived while saving was in progress, save them immediately
      if (pendingSaveRef.current) {
        save(isManual)
      }
    }
  }, [scriptId, enabled, onSaved])

  // Typing debounce check - reduced to 1000ms for faster saving
  useEffect(() => {
    if (!enabled || !scriptId) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(false), 1000)

    return () => clearTimeout(timerRef.current)
  }, [content, title, fontFamily, watermarkEnabled, watermarkText, watermarkOpacity, watermarkSize, scriptId, enabled, save])

  // Backup sync interval - reduced to 3000ms for faster checks
  useEffect(() => {
    if (!enabled || !scriptId) return
    intervalRef.current = setInterval(() => save(false), 3000)
    return () => clearInterval(intervalRef.current)
  }, [scriptId, enabled, save])

  return { status, save: () => save(true) }
}
