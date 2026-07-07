import { useCallback, useEffect, useRef, useState } from 'react'
import { scriptApi } from '../api/scriptApi'

export function useAutoSave(scriptId, content, title, fontFamily, enabled = true, onSaved) {
  const [status, setStatus] = useState('saved')
  const timerRef = useRef(null)
  const lastSavedRef = useRef('')
  const intervalRef = useRef(null)

  const save = useCallback(async (isManual = false) => {
    if (!scriptId || !enabled) return
    const payload = { content: JSON.stringify(content), title, fontFamily }
    const serialized = JSON.stringify(payload)
    if (serialized === lastSavedRef.current && !isManual) return

    setStatus('saving')
    try {
      const fn = isManual ? scriptApi.save : scriptApi.autosave
      await fn(scriptId, payload)
      lastSavedRef.current = serialized
      setStatus('saved')
      onSaved?.()
    } catch {
      setStatus('error')
    }
  }, [scriptId, content, title, fontFamily, enabled, onSaved])

  useEffect(() => {
    if (!enabled || !scriptId) return

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(false), 2000)

    return () => clearTimeout(timerRef.current)
  }, [content, title, fontFamily, scriptId, enabled, save])

  useEffect(() => {
    if (!enabled || !scriptId) return
    intervalRef.current = setInterval(() => save(false), 5000)
    return () => clearInterval(intervalRef.current)
  }, [scriptId, enabled, save])

  return { status, save: () => save(true) }
}
