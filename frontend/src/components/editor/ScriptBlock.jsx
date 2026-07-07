import React, { useRef, useState, useEffect, useCallback } from 'react'
import { ELEMENT_LABELS, ELEMENT_TYPES, TRANSITION_SUGGESTIONS } from '../../constants/screenplay'
import { formatCharacter, formatSceneHeading } from '../../utils/screenplayHelpers'
import { DICTIONARY, levenshtein } from '../../constants/dictionary'
import { transliterateWord } from '../../utils/translitUtils'

const BLOCK_CLASSES = {
  [ELEMENT_TYPES.SCENE_HEADING]: 'block-scene-heading',
  [ELEMENT_TYPES.ACTION]: 'block-action',
  [ELEMENT_TYPES.CHARACTER]: 'block-character',
  [ELEMENT_TYPES.DIALOGUE]: 'block-dialogue',
  [ELEMENT_TYPES.PARENTHETICAL]: 'block-parenthetical',
  [ELEMENT_TYPES.TRANSITION]: 'block-transition',
  [ELEMENT_TYPES.TITLE_PAGE]: 'block-title-page',
  [ELEMENT_TYPES.NOTE]: 'block-note',
}

const parsePlainTextToFields = (text) => {
  if (!text) {
    return { aboveText: '', title: '', screenplay: '', writer: '', director: '', belowText: '' }
  }
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let title = ''
  let screenplay = ''
  let writer = ''
  let director = ''

  let state = 'title'
  for (let line of lines) {
    const upper = line.toUpperCase()
    if (upper.includes('SCREENPLAY') || upper.includes('WRITTEN BY')) {
      screenplay = line
      state = 'writer'
    } else if (state === 'title') {
      title = line
      state = 'screenplay'
    } else if (state === 'writer') {
      writer = line
      state = 'director'
    } else {
      director = line
    }
  }

  return { aboveText: '', title, screenplay, writer, director, belowText: '' }
}

const getTitlePageFields = (text) => {
  const defaults = { aboveText: '', title: '', screenplay: '', writer: '', director: '', belowText: '' }
  try {
    if (text && text.trim().startsWith('{') && text.trim().endsWith('}')) {
      return { ...defaults, ...JSON.parse(text) }
    }
  } catch (e) {}
  return { ...defaults, ...parsePlainTextToFields(text) }
}

export default function ScriptBlock({
  block,
  index,
  onChange,
  onKeyDown,
  onFocus,
  characterSuggestions = [],
  pastUniqueWords = [],
  highlight,
  readOnly = false,
  sceneNumber = null,
  isSelected = false,
  autoCaps = false,
  translitLang = null,
  pageSize = 'a4',
}) {
  const ref = useRef(null)
  const [suggestions, setSuggestions] = useState([])
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1)

  const isTitlePage = block.type === ELEMENT_TYPES.TITLE_PAGE
  const titleFields = isTitlePage ? getTitlePageFields(block.text) : { title: '', screenplay: '', writer: '', director: '' }

  const handleTitleFieldChange = (fieldName, value) => {
    const updated = { ...titleFields, [fieldName]: value }
    onChange(index, { ...block, text: JSON.stringify(updated) })
  }

  const handleTitleFieldKeyDown = (e, nextFieldId, prevFieldId) => {
    const target = e.target
    const isTextarea = target.tagName.toLowerCase() === 'textarea'

    if (e.key === 'Enter') {
      if (isTextarea) {
        // Let textarea handle newline naturally
        return
      }
      e.preventDefault()
      if (nextFieldId) {
        document.getElementById(`title-field-${nextFieldId}-${index}`)?.focus()
      } else {
        // Last field: notify parent to insert a new block
        onKeyDown(e, index, block)
      }
    } else if (e.key === 'ArrowDown') {
      if (isTextarea) {
        const val = target.value
        const selectionEnd = target.selectionEnd
        const isAtEnd = selectionEnd === val.length || !val.substring(selectionEnd).includes('\n')
        if (!isAtEnd) {
          return // Let standard textarea navigation happen
        }
      }
      e.preventDefault()
      if (nextFieldId) {
        document.getElementById(`title-field-${nextFieldId}-${index}`)?.focus()
      } else {
        const el = document.querySelector(`[data-block-index="${index + 1}"]`)
        if (el) el.focus()
      }
    } else if (e.key === 'ArrowUp') {
      if (isTextarea) {
        const val = target.value
        const selectionStart = target.selectionStart
        const isAtStart = selectionStart === 0 || !val.substring(0, selectionStart).includes('\n')
        if (!isAtStart) {
          return // Let standard textarea navigation happen
        }
      }
      e.preventDefault()
      if (prevFieldId) {
        document.getElementById(`title-field-${prevFieldId}-${index}`)?.focus()
      }
    }
  }

  const adjustScroll = () => {
    const textarea = ref.current
    if (!textarea) return
    if (block.type === ELEMENT_TYPES.TITLE_PAGE) return

    const scrollContainer = textarea.closest('.editor-root')
    if (!scrollContainer) return

    if (!scrollContainer) return

    // Calculate the absolute vertical offset of the textarea relative to the scrollable container content
    let elementScrollOffset = 0
    let el = textarea
    while (el && el !== scrollContainer) {
      elementScrollOffset += el.offsetTop || 0
      el = el.offsetParent
    }

    const selectionStart = textarea.selectionStart || 0
    const textBeforeCursor = textarea.value.substring(0, selectionStart)
    const caretLine = textBeforeCursor.split('\n').length
    const totalLines = Math.max(1, textarea.value.split('\n').length)
    const lineRatio = caretLine / totalLines
    
    // Caret vertical offset inside the scroll container
    const caretScrollOffset = elementScrollOffset + (textarea.offsetHeight * lineRatio)
    
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      // Keep the active typing cursor locked to the upper 1/3 of the screen (approx 150px from top of container)
      const targetScrollTop = caretScrollOffset - 150
      if (Math.abs(scrollContainer.scrollTop - targetScrollTop) > 5) {
        scrollContainer.scrollTop = targetScrollTop
      }
    } else {
      // Desktop behavior: standard bounds checking relative to the viewport
      const textareaRect = textarea.getBoundingClientRect()
      const containerRect = scrollContainer.getBoundingClientRect()
      const caretViewportY = textareaRect.top + (textareaRect.height * lineRatio)
      const bottomThreshold = containerRect.top + (containerRect.height * 0.5)
      const topThreshold = containerRect.top + 150

      if (caretViewportY > bottomThreshold) {
        const diff = caretViewportY - bottomThreshold
        scrollContainer.scrollTop += diff
      } else if (caretViewportY < topThreshold) {
        const diff = topThreshold - caretViewportY
        scrollContainer.scrollTop -= diff
      }
    }
  }

  useEffect(() => {
    const textarea = ref.current
    if (!textarea) return

    if (block.type === ELEMENT_TYPES.TITLE_PAGE) {
      textarea.style.height = 'calc(var(--page-min-height) - 144px)'
      return
    }

    // Skip all height recalculations while the user is actively zooming the page.
    // The browser's native scaling handles the visual sizing smoothly, and we trigger a 
    // single clean recalculation when the zoom gesture ends.
    if (window.__isZooming) return

    const wrapper = textarea.closest('.script-block-wrapper')
    const prevHeight = textarea.style.height

    // Lock the wrapper's min-height to match the current textarea height.
    // This prevents the page layout from collapsing or jumping while we calculate the new height.
    if (wrapper && prevHeight) {
      wrapper.style.minHeight = prevHeight
    }

    textarea.style.height = 'auto'
    const newHeight = `${textarea.scrollHeight + 6}px`
    textarea.style.height = newHeight

    // Release the wrapper min-height lock
    if (wrapper) {
      wrapper.style.minHeight = ''
    }

    if (document.activeElement === textarea) {
      if (prevHeight !== newHeight) {
        setTimeout(adjustScroll, 0)
        setTimeout(adjustScroll, 150)
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (window.__isZooming) return // Skip observer updates during active zoom
      for (let entry of entries) {
        const { width } = entry.contentRect
        if (textarea.__prevWidth !== width) {
          textarea.__prevWidth = width
          requestAnimationFrame(() => {
            if (window.__isZooming) return
            const currentWrapper = textarea.closest('.script-block-wrapper')
            const currentPrevHeight = textarea.style.height
            if (currentWrapper && currentPrevHeight) {
              currentWrapper.style.minHeight = currentPrevHeight
            }
            textarea.style.height = 'auto'
            textarea.style.height = `${textarea.scrollHeight + 6}px`
            if (currentWrapper) {
              currentWrapper.style.minHeight = ''
            }
          })
        }
      }
    })

    resizeObserver.observe(textarea)
    return () => resizeObserver.disconnect()
  }, [block.text, block.type, pageSize])

  useEffect(() => {
    if (block.type === ELEMENT_TYPES.SCENE_HEADING && !block.text && document.activeElement === ref.current) {
      setSuggestions(['INT.', 'EXT.', 'INT/EXT.', 'EXT/INT.'])
      setActiveSuggestionIdx(-1)
    } else {
      setSuggestions([])
      setActiveSuggestionIdx(-1)
    }
  }, [block.type])

  const handleInput = (e) => {
    if (readOnly) return
    let value = e.target.value
    const cursorPos = e.target.selectionStart

    if (autoCaps) {
      value = value.toUpperCase()
    }

    // Format input depending on type
    if (block.type === ELEMENT_TYPES.SCENE_HEADING) {
      value = formatSceneHeading(value)
    } else if (block.type === ELEMENT_TYPES.CHARACTER) {
      value = formatCharacter(value)
    }

    // Transliteration: when a space/newline is typed after a pure-English word,
    // send the word to Google Input Tools and replace it asynchronously.
    if (translitLang && cursorPos !== null && cursorPos !== undefined) {
      const textBeforeCursor = value.substring(0, cursorPos)
      if (textBeforeCursor.endsWith(' ') || textBeforeCursor.endsWith('\n')) {
        const trimmedBefore = textBeforeCursor.slice(0, -1)
        const wordMatch = trimmedBefore.match(/([a-zA-Z]+)$/)
        if (wordMatch) {
          const word = wordMatch[1]
          const wordStart = trimmedBefore.length - word.length
          // Snapshot values before async call to avoid stale closure issues
          const valueSnapshot = value
          const blockSnapshot = block
          // Convert word to lowercase before sending to API since Google Input Tools 
          // fails on uppercase words (which are produced by autoCaps in screenplays).
          transliterateWord(word.toLowerCase(), translitLang).then((transliterated) => {
            if (transliterated && transliterated.toLowerCase() !== word.toLowerCase()) {
              const newText =
                valueSnapshot.substring(0, wordStart) +
                transliterated +
                valueSnapshot.substring(trimmedBefore.length)
              onChange(index, { ...blockSnapshot, text: newText })
            }
          })
        }
      }
    }

    // Extract active word under the cursor
    const cursorPosition = e.target.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPosition)
    const wordMatch = textBeforeCursor.match(/([a-zA-Z']+)$/)
    const activeWord = wordMatch ? wordMatch[1].toLowerCase() : ''

    // Helper to fetch past unique word suggestions matching prefix
    const getPastWordSuggestions = (minLen = 2) => {
      if (activeWord.length >= minLen) {
        return pastUniqueWords
          .filter((w) => w.startsWith(activeWord) && w !== activeWord)
          .slice(0, 5)
      }
      return []
    }

    let finalSuggestions = []

    if (block.type === ELEMENT_TYPES.SCENE_HEADING) {
      const ALL_SCENE_PREFIXES = ['INT.', 'EXT.', 'INT/EXT.', 'EXT/INT.']
      const upper = value.toUpperCase()
      
      let prefixes = []
      if (!value.includes(' ')) {
        prefixes = ALL_SCENE_PREFIXES.filter((p) => p.startsWith(upper) && p !== upper)
      }
      
      const wordSugs = getPastWordSuggestions(2).map(w => w.toUpperCase())
      finalSuggestions = [...prefixes, ...wordSugs]

    } else if (block.type === ELEMENT_TYPES.CHARACTER) {
      const upper = value.toUpperCase()
      const registered = characterSuggestions
        .filter((c) => c.name.startsWith(upper) && c.name !== upper)
        .map((c) => c.name)

      const wordSugs = getPastWordSuggestions(1).map(w => w.toUpperCase())
      finalSuggestions = Array.from(new Set([...registered, ...wordSugs])).slice(0, 5)

    } else if (block.type === ELEMENT_TYPES.TRANSITION) {
      const upper = value.toUpperCase()
      const transitions = TRANSITION_SUGGESTIONS
        .filter((t) => t.startsWith(upper) && t !== upper)

      const wordSugs = getPastWordSuggestions(2).map(w => w.toUpperCase())
      finalSuggestions = [...transitions, ...wordSugs]

    } else {
      // General spelling suggestions and autocomplete
      if (activeWord.length >= 2) {
        const allCandidates = Array.from(new Set([...DICTIONARY, ...pastUniqueWords]))
        
        // 1. Prefix matches (Autocomplete)
        const prefixMatches = allCandidates
          .filter((w) => w.startsWith(activeWord) && w !== activeWord)
          .slice(0, 3)

        // 2. Levenshtein matches (Spellcheck / Auto-correct suggestions)
        let spellingSuggestions = []
        if (!allCandidates.includes(activeWord)) {
          spellingSuggestions = allCandidates
            .filter((w) => {
              if (prefixMatches.includes(w)) return false
              return levenshtein(activeWord, w) <= 2
            })
            .slice(0, 2)
        }

        finalSuggestions = [...prefixMatches, ...spellingSuggestions]
      }
    }

    setSuggestions(finalSuggestions)
    setActiveSuggestionIdx(-1)  // Reset active index whenever suggestions refresh
    if (value !== e.target.value) {
      e.target.value = value
      e.target.setSelectionRange(cursorPos, cursorPos)
    }

    onChange(index, { ...block, text: value })
  }

  const applyWordSuggestion = (suggestion) => {
    if (readOnly) return
    const textarea = ref.current
    if (!textarea) return

    const cursorPosition = textarea.selectionStart || 0
    const textBeforeCursor = textarea.value.substring(0, cursorPosition)
    const textAfterCursor = textarea.value.substring(cursorPosition)

    const wordMatch = textBeforeCursor.match(/([a-zA-Z']+)$/)
    if (wordMatch) {
      const wordStart = cursorPosition - wordMatch[1].length
      // Format suggestions to uppercase for SCENE_HEADING and CHARACTER
      const formattedSuggestion = (block.type === ELEMENT_TYPES.SCENE_HEADING || block.type === ELEMENT_TYPES.CHARACTER) 
        ? suggestion.toUpperCase() 
        : suggestion
      const newTextBefore = textarea.value.substring(0, wordStart) + formattedSuggestion + ' '
      const newText = newTextBefore + textAfterCursor
      
      onChange(index, { ...block, text: newText })
      setSuggestions([])

      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = newTextBefore.length
      }, 0)
    }
  }

  const applySuggestion = (suggestion) => {
    if (readOnly) return
    const textarea = ref.current
    if (!textarea) return

    const ALL_SCENE_PREFIXES = ['INT.', 'EXT.', 'INT/EXT.', 'EXT/INT.']
    const isScenePrefix = block.type === ELEMENT_TYPES.SCENE_HEADING && ALL_SCENE_PREFIXES.includes(suggestion)
    const isTransition = block.type === ELEMENT_TYPES.TRANSITION && TRANSITION_SUGGESTIONS.includes(suggestion)
    const isCharacter = block.type === ELEMENT_TYPES.CHARACTER

    if (isScenePrefix || isTransition || isCharacter) {
      // Replace entire input
      onChange(index, { ...block, text: suggestion + ' ' })
      setSuggestions([])
      setActiveSuggestionIdx(-1)
      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = suggestion.length + 1
      }, 0)
    } else {
      applyWordSuggestion(suggestion)
    }
  }

  // Keyboard navigation handler exposed to parent onKeyDown wrapper
  const handleSuggestionKeyDown = (e) => {
    if (suggestions.length === 0) return false
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length)
      return true
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestionIdx((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      return true
    }
    if ((e.key === 'Enter' || e.key === 'Tab') && activeSuggestionIdx >= 0) {
      e.preventDefault()
      applySuggestion(suggestions[activeSuggestionIdx])
      return true
    }
    if (e.key === 'Escape') {
      setSuggestions([])
      setActiveSuggestionIdx(-1)
      return true
    }
    return false
  }

  return (
    <div className={`script-block-wrapper relative mb-0 wrapper-${block.type.toLowerCase().replace('_', '-')} ${isSelected ? 'is-selected' : ''}`}>
      <span className="block-label">
        {ELEMENT_LABELS[block.type]}
      </span>
      {/* Scene number badge — shown on both sides of scene heading */}
      {block.type === ELEMENT_TYPES.SCENE_HEADING && sceneNumber !== null && (
        <span style={{
          position: 'absolute',
          left: '-32px',
          top: '2px',
          fontSize: '12pt',
          fontFamily: 'inherit',
          color: '#333',
          fontWeight: 800,
          userSelect: 'none',
          lineHeight: '1.2',
          minWidth: 20,
          textAlign: 'right',
          letterSpacing: '-0.5px',
        }}>{sceneNumber}</span>
      )}
      <div className="relative w-full">
        {isTitlePage ? (
          <div
            ref={ref}
            className="block-title-page-container"
            data-no-autoscroll="true"
            style={{
              height: 'calc(var(--page-min-height) - 144px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              padding: '60px 40px',
              boxSizing: 'border-box',
              width: '100%',
            }}
            onFocus={(e) => { e.stopPropagation(); onFocus(index); }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Center Area: Title and Author/Screenplay names */}
            <div className="w-full flex flex-col items-center justify-center" style={{ gap: '24px' }}>
              {/* 1st Line: Movie Title (Size 26pt) */}
              <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                <input
                  id={`title-field-title-${index}`}
                  type="text"
                  value={titleFields.title}
                  placeholder="MOVIE TITLE"
                  onChange={(e) => handleTitleFieldChange('title', e.target.value)}
                  onKeyDown={(e) => handleTitleFieldKeyDown(e, 'director', null)}
                  onFocus={(e) => { e.stopPropagation(); onFocus(index); }}
                  readOnly={readOnly}
                  className="title-page-field title-field-title"
                  style={{
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                    caretColor: 'currentColor',
                    fontFamily: 'inherit',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    lineHeight: 'normal',
                  }}
                />
                {isSelected && (
                  <div className="pointer-events-none select-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span className="bg-[#2563eb] dark:bg-[#388bfd] text-white px-1 rounded-sm title-field-title" style={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 'normal' }}>
                      {titleFields.title || 'MOVIE TITLE'}
                    </span>
                  </div>
                )}
              </div>

              {/* 2nd Line: Director of the Film (h1 equivalent: 20pt) */}
              <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                <input
                  id={`title-field-director-${index}`}
                  type="text"
                  value={titleFields.director}
                  placeholder="DIRECTOR"
                  onChange={(e) => handleTitleFieldChange('director', e.target.value)}
                  onKeyDown={(e) => handleTitleFieldKeyDown(e, 'writer', 'title')}
                  onFocus={(e) => { e.stopPropagation(); onFocus(index); }}
                  readOnly={readOnly}
                  className="title-page-field title-field-director"
                  style={{
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                    caretColor: 'currentColor',
                    fontFamily: 'inherit',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    lineHeight: 'normal',
                  }}
                />
                {isSelected && (
                  <div className="pointer-events-none select-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span className="bg-[#2563eb] dark:bg-[#388bfd] text-white px-1 rounded-sm title-field-director" style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 'normal' }}>
                      {titleFields.director || 'DIRECTOR'}
                    </span>
                  </div>
                )}
              </div>

              {/* 3rd Line: Writer of the Film (h2 equivalent: 16pt) */}
              <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                <input
                  id={`title-field-writer-${index}`}
                  type="text"
                  value={titleFields.writer}
                  placeholder="WRITER"
                  onChange={(e) => handleTitleFieldChange('writer', e.target.value)}
                  onKeyDown={(e) => handleTitleFieldKeyDown(e, 'screenplay', 'director')}
                  onFocus={(e) => { e.stopPropagation(); onFocus(index); }}
                  readOnly={readOnly}
                  className="title-page-field title-field-writer"
                  style={{
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                    caretColor: 'currentColor',
                    fontFamily: 'inherit',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    lineHeight: 'normal',
                  }}
                />
                {isSelected && (
                  <div className="pointer-events-none select-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span className="bg-[#2563eb] dark:bg-[#388bfd] text-white px-1 rounded-sm title-field-writer" style={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 'normal' }}>
                      {titleFields.writer || 'WRITER'}
                    </span>
                  </div>
                )}
              </div>

              {/* 4th Line: Screenplay (h3 equivalent: 14pt) */}
              <div className="w-full relative" onClick={(e) => e.stopPropagation()}>
                <input
                  id={`title-field-screenplay-${index}`}
                  type="text"
                  value={titleFields.screenplay}
                  placeholder="SCREENPLAY"
                  onChange={(e) => handleTitleFieldChange('screenplay', e.target.value)}
                  onKeyDown={(e) => handleTitleFieldKeyDown(e, null, 'writer')}
                  onFocus={(e) => { e.stopPropagation(); onFocus(index); }}
                  readOnly={readOnly}
                  className="title-page-field title-field-screenplay"
                  style={{
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'inherit',
                    caretColor: 'currentColor',
                    fontFamily: 'inherit',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    lineHeight: 'normal',
                  }}
                />
                {isSelected && (
                  <div className="pointer-events-none select-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span className="bg-[#2563eb] dark:bg-[#388bfd] text-white px-1 rounded-sm title-field-screenplay" style={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 'normal' }}>
                      {titleFields.screenplay || 'SCREENPLAY'}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <>
            <textarea
              ref={ref}
              rows={1}
              value={block.text}
              onChange={readOnly ? undefined : handleInput}
              onKeyDown={readOnly ? undefined : (e) => {
                if (handleSuggestionKeyDown(e)) return
                onKeyDown(e, index, block)
              }}
              onFocus={readOnly ? undefined : () => { onFocus(index); setTimeout(adjustScroll, 0); }}
              onKeyUp={readOnly ? undefined : (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                  adjustScroll()
                }
              }}
              onClick={readOnly ? undefined : adjustScroll}
              onBlur={() => setSuggestions([])}
              readOnly={readOnly}
              className={`script-block ${BLOCK_CLASSES[block.type] || 'block-action'} ${highlight ? 'bg-yellow-200/30' : ''} ${readOnly ? 'resize-none cursor-default focus:outline-none' : ''} ${isSelected ? 'is-selected-textarea' : ''}`}
              spellCheck={false}
              data-block-index={index}
            />
            {isSelected && (
              <div 
                className={`script-block ${BLOCK_CLASSES[block.type] || 'block-action'} pointer-events-none select-none`}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  pointerEvents: 'none',
                  overflow: 'visible',
                  margin: 0,
                  width: '100%'
                }}
              >
                <span 
                  className="bg-[#2563eb] dark:bg-[#388bfd] text-white px-0.5 rounded-sm"
                  style={{ lineHeight: 'inherit' }}
                >
                  {block.text || '\u200B'}
                </span>
              </div>
            )}
          </>
        )}
      </div>
      {!readOnly && suggestions.length > 0 && (
        <div className="suggestions-dropdown" style={{ top: '100%', left: block.type === ELEMENT_TYPES.CHARACTER ? '144px' : 0 }}>
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); applySuggestion(s) }}
              onMouseEnter={() => setActiveSuggestionIdx(i)}
              style={{
                background: i === activeSuggestionIdx ? 'rgba(238,119,18,0.18)' : undefined,
                color: i === activeSuggestionIdx ? '#ee7712' : undefined,
                fontWeight: i === activeSuggestionIdx ? 700 : undefined,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
