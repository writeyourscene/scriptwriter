import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ScriptBlock from './ScriptBlock'
import PageNavigator from './PageNavigator'
import {
  createBlock,
  nextElementType,
  nextOnEnter,
  prevElementType,
  countWords,
  countScenes,
  getUniqueCharacters,
  estimatePages,
} from '../../utils/screenplayHelpers'
import { ELEMENT_TYPES } from '../../constants/screenplay'
import { FiTrash2, FiFilm, FiAlignLeft, FiUser, FiMessageSquare, FiRepeat, FiCornerDownRight, FiPlus, FiAlertTriangle } from 'react-icons/fi'
import { MdOutlineSubtitles } from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import '../../styles/editor.css'

const MAX_UNDO = 50

export default function ScreenplayEditor({
  blocks,
  onChange,
  characterSuggestions = [],
  zoom = 100,
  onZoomChange,
  findMatches = [],
  jumpToSceneNumber,
  pageSize = 'a4',
  readOnly = false,
  fontFamily = 'Courier Prime',
  focusedIndex: propFocusedIndex,
  setFocusedIndex: propSetFocusedIndex,
  script,
  versions = [],
  autoCaps = false,
  translitLang = null,
  watermarkEnabled = false,
  watermarkText = 'CONFIDENTIAL',
  watermarkOpacity = 0.1,
}) {
  const [localFocusedIndex, localSetFocusedIndex] = useState(0)
  const focusedIndex = propFocusedIndex !== undefined ? propFocusedIndex : localFocusedIndex
  const setFocusedIndex = propSetFocusedIndex !== undefined ? propSetFocusedIndex : localSetFocusedIndex
  
  const focusedIndexRef = useRef(focusedIndex)
  useEffect(() => {
    focusedIndexRef.current = focusedIndex
  }, [focusedIndex])

  const [pageBreaks, setPageBreaks] = useState([])
  const [pageHeights, setPageHeights] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { pageNum, startIdx, endIdx }
  const [selectedBlockIndices, setSelectedBlockIndices] = useState([])
  const selectedBlockIndicesRef = useRef([])

  // Scroll-lock: when true, useLayoutEffect restores the saved scroll position
  // synchronously after the next DOM paint so page-break div insertions don't jump the view.
  const scrollLockRef = useRef(false)
  const savedScrollTopRef = useRef(0)

  // Runs after EVERY render, synchronously before the browser paints.
  // If a scroll-lock is requested, restore the saved position immediately.
  useLayoutEffect(() => {
    if (scrollLockRef.current && editorRootRef.current) {
      editorRootRef.current.scrollTop = savedScrollTopRef.current
      scrollLockRef.current = false
    }
  })

  useEffect(() => {
    selectedBlockIndicesRef.current = selectedBlockIndices
  }, [selectedBlockIndices])

  const hasAuthorPage = blocks.some(b => b.type === ELEMENT_TYPES.TITLE_PAGE)
  const onlyHasTitlePage = blocks.every(b => b.type === ELEMENT_TYPES.TITLE_PAGE)
  
  const { user } = useAuth()
  const authorName = user
    ? (user.firstName + (user.lastName ? ' ' + user.lastName : '')) || user.username
    : 'Satish Veesam'

  const activeVersion = versions.find(v => v.versionNumber === script?.currentVersion)

  const formattedDate = (() => {
    const defaultDateStr = 'Jun 27 @ 1:31pm'
    const targetDate = activeVersion ? activeVersion.createdAt : script?.createdAt
    if (!targetDate) return defaultDateStr
    try {
      const dateObj = new Date(targetDate)
      const month = dateObj.toLocaleDateString('en-US', { month: 'short' })
      const day = dateObj.toLocaleDateString('en-US', { day: 'numeric' })
      const time = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '')
      return `${month} ${day} @ ${time}`
    } catch {
      return defaultDateStr
    }
  })()

  const editorRef = useRef(null)
  const editorRootRef = useRef(null)
  const undoStack = useRef([])
  const redoStack = useRef([])
  // Keep a ref copy of pageBreaks so handlers always see latest value without stale closure
  const pageBreaksRef = useRef([])
  const pageHeightsRef = useRef({})

  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault()
        if (!onZoomChange) return
        
        // Calculate new zoom level smoothly (supports fractional trackpad pinch deltas)
        const zoomDelta = -(e.deltaY * 0.1)
        onZoomChange((prevZoom) => {
          const newZoom = Math.min(Math.max(50, prevZoom + zoomDelta), 200)
          return newZoom
        })
      }
    }

    // Prevent browser auto-scroll when focusing any script element
    const handleFocusIn = (e) => {
      const rootEl = editorRootRef.current
      if (!rootEl) return
      // Lock scroll for title-page fields AND all regular script blocks
      if (
        (e.target && e.target.closest && e.target.closest('[data-no-autoscroll]')) ||
        (e.target && e.target.classList && e.target.classList.contains('script-block'))
      ) {
        savedScrollTopRef.current = rootEl.scrollTop
        scrollLockRef.current = true
      }
    }

    // Touch gesture pinch-to-zoom variables
    let startDistance = 0
    let startZoom = 100

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault() // prevent standard browser viewport zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        startDistance = Math.sqrt(dx * dx + dy * dy)
        startZoom = zoomRef.current
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && startDistance > 0) {
        e.preventDefault() // prevent standard browser viewport zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        const ratio = distance / startDistance
        let newZoom = Math.round(startZoom * ratio)
        // Clamp mobile zoom between 50% and 180% for perfect styling boundaries
        newZoom = Math.max(50, Math.min(180, newZoom))
        
        if (onZoomChange) {
          onZoomChange(newZoom)
        }
      }
    }

    const handleTouchEnd = () => {
      startDistance = 0
    }

    const rootEl = editorRootRef.current
    if (rootEl) {
      rootEl.addEventListener('wheel', handleWheel, { passive: false })
      rootEl.addEventListener('focusin', handleFocusIn, true)
      rootEl.addEventListener('touchstart', handleTouchStart, { passive: false })
      rootEl.addEventListener('touchmove', handleTouchMove, { passive: false })
      rootEl.addEventListener('touchend', handleTouchEnd)
      rootEl.addEventListener('touchcancel', handleTouchEnd)
    }
    return () => {
      if (rootEl) {
        rootEl.removeEventListener('wheel', handleWheel)
        rootEl.removeEventListener('focusin', handleFocusIn, true)
        rootEl.removeEventListener('touchstart', handleTouchStart)
        rootEl.removeEventListener('touchmove', handleTouchMove)
        rootEl.removeEventListener('touchend', handleTouchEnd)
        rootEl.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [onZoomChange])

  const focusAndScroll = useCallback((el) => {
    if (!el) return
    el.focus({ preventScroll: true })
  }, [])

  const recalculatePageBreaks = useCallback(() => {
    if (pageSize === 'script') {
      if (pageBreaksRef.current.length > 0) {
        pageBreaksRef.current = []
        setPageBreaks([])
      }
      return
    }
    if (!editorRef.current) return

    const heightLimit = pageSize === 'letter' ? 1385 : 1475
    const blockElements = editorRef.current.querySelectorAll('.script-block-wrapper')

    const zoomScale = (zoom || 100) / 100
    const newPageBreaks = []
    const newPageHeights = {}
    let currentPage = 1
    let currentHeight = 72  // start at top padding
    let prevMarginBottom = 0 // track previous element's bottom margin for CSS collapsing
    let isFirstElementOnPage = true

    blockElements.forEach((el, idx) => {
      // Margins are on the wrapper element (scene-heading, character, etc.)
      const wrapperStyle = window.getComputedStyle(el)
      // Normalize computed pixel values by zoomScale to get unscaled dimensions matching heightLimit (1122)
      const marginTop = Math.round((parseFloat(wrapperStyle.marginTop) || 0) / zoomScale)
      const marginBottom = Math.round((parseFloat(wrapperStyle.marginBottom) || 0) / zoomScale)

      const block = blocks[idx]
      const prevBlock = blocks[idx - 1]
      const isTitlePage = block?.type === ELEMENT_TYPES.TITLE_PAGE
      const forcePageBreak =
        (!isTitlePage &&
         prevBlock &&
         prevBlock.type === ELEMENT_TYPES.TITLE_PAGE) ||
        (block?.pageBreakBefore === true)

      // CSS margin collapsing: the gap before this element is max(prevBottom, curTop), not their sum.
      // At the top of a page (either Page 1 or after a page break), there is no space before the first element
      // because top margins are collapsed/ignored at page boundaries (matching iText/PDF top-of-page behavior).
      const spaceBefore = isFirstElementOnPage ? 0 : Math.max(prevMarginBottom, marginTop)

      let contentHeight = el.offsetHeight
      const ta = el.querySelector('.script-block')
      if (ta) {
        // Read active styles to determine the exact line height of the text in the browser
        const style = window.getComputedStyle(ta)
        const fontSize = parseFloat(style.fontSize) || 16
        const styleLineHeight = style.lineHeight
        let elementLineHeight = fontSize * 1.2
        if (styleLineHeight && styleLineHeight !== 'normal') {
          elementLineHeight = parseFloat(styleLineHeight) || elementLineHeight
        }
        
        const paddingTop = parseFloat(style.paddingTop) || 0
        const paddingBottom = parseFloat(style.paddingBottom) || 0
        
        // Exact height of the text block inside textarea
        const rawScrollHeight = ta.scrollHeight
        const textHeight = Math.max(0, rawScrollHeight - paddingTop - paddingBottom)
        
        // Determine number of lines (rounded to nearest integer)
        const linesCount = Math.round(textHeight / elementLineHeight) || 1
        
        // Match the PDF line height: 14pt * 1.2 = 16.8pt (exactly 22.4px in editor scale)
        const pdfLineHeightPx = 22.4
        contentHeight = linesCount * pdfLineHeightPx
      }

      // Height this element contributes to the current page accumulator.
      const elementHeight = spaceBefore + contentHeight

      if ((!isTitlePage && currentHeight + elementHeight > heightLimit - 72) || forcePageBreak) {
        newPageHeights[currentPage] = currentHeight
        newPageBreaks.push(idx)
        currentPage++
        currentHeight = 72   // reset: new page starts at top padding
        prevMarginBottom = 0 // no previous element on new page
        isFirstElementOnPage = true
      } else {
        isFirstElementOnPage = false
      }

      currentHeight += isFirstElementOnPage ? contentHeight : elementHeight
      isFirstElementOnPage = false
      prevMarginBottom = marginBottom  // remember for next element's collapse calculation
    })
    newPageHeights[currentPage] = currentHeight

    const breaksChanged = JSON.stringify(newPageBreaks) !== JSON.stringify(pageBreaksRef.current)
    const heightsChanged = JSON.stringify(newPageHeights) !== JSON.stringify(pageHeightsRef.current)

    if (breaksChanged || heightsChanged) {
      // Snapshot scroll and set the lock BEFORE setState so useLayoutEffect
      // can restore it synchronously on the very next render (before browser paints).
      const rootEl = editorRootRef.current
      if (rootEl) {
        // Calculate if any page breaks were added or removed ABOVE the focused element.
        // Each visual-page-break adds exactly 192px of height to the document.
        let breaksAddedAbove = 0
        const focusIdx = focusedIndexRef.current
        if (focusIdx !== null && focusIdx !== undefined) {
          const oldBreaksAbove = pageBreaksRef.current.filter(idx => idx <= focusIdx).length
          const newBreaksAbove = newPageBreaks.filter(idx => idx <= focusIdx).length
          breaksAddedAbove = newBreaksAbove - oldBreaksAbove
        }

        savedScrollTopRef.current = rootEl.scrollTop + (breaksAddedAbove * 192)
        scrollLockRef.current = true
      }

      if (breaksChanged) {
        pageBreaksRef.current = newPageBreaks
        setPageBreaks(newPageBreaks)
      }
      if (heightsChanged) {
        pageHeightsRef.current = newPageHeights
        setPageHeights(newPageHeights)
      }
    }
  }, [blocks, pageSize, zoom])

  const getPastUniqueWords = useCallback((currentIndex) => {
    const words = new Set()
    for (let i = 0; i < currentIndex; i++) {
      const text = blocks[i]?.text || ''
      const matches = text.match(/\b[a-zA-Z']{2,20}\b/g)
      if (matches) {
        matches.forEach(w => words.add(w.toLowerCase()))
      }
    }
    return Array.from(words)
  }, [blocks])

  useEffect(() => {
    const timer = setTimeout(recalculatePageBreaks, 100)
    return () => clearTimeout(timer)
  }, [blocks, pageSize, recalculatePageBreaks])

  const pushUndo = useCallback((state) => {
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO + 1), state]
    redoStack.current = []
  }, [])

  useEffect(() => {
    if (!jumpToSceneNumber) return
    const sceneIndices = blocks
      .map((b, i) => ({ b, i }))
      .filter(({ b }) => b.type === ELEMENT_TYPES.SCENE_HEADING)
    const target = sceneIndices[jumpToSceneNumber - 1]
    if (target) {
      const el = document.querySelector(`[data-block-index="${target.i}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el?.focus({ preventScroll: true }), 300)
    }
  }, [jumpToSceneNumber, blocks])

  const updateBlocks = useCallback((newBlocks, recordUndo = true) => {
    if (recordUndo) pushUndo(blocks)
    onChange(newBlocks)
  }, [blocks, onChange, pushUndo])

  const getBlocksOnCurrentPage = useCallback(() => {
    if (focusedIndex === null || focusedIndex === undefined) return []
    let startIdx = 0
    let endIdx = blocks.length - 1
    
    for (let i = 0; i < pageBreaks.length; i++) {
      if (focusedIndex < pageBreaks[i]) {
        endIdx = pageBreaks[i] - 1
        break
      }
      startIdx = pageBreaks[i]
    }
    
    const indices = []
    for (let i = startIdx; i <= endIdx; i++) {
      indices.push(i)
    }
    return indices
  }, [focusedIndex, pageBreaks, blocks.length])

  const deleteSelectedBlocks = useCallback((selectedIndices) => {
    if (selectedIndices.length === 0) return
    const firstIdx = selectedIndices[0]
    const blockToKeep = blocks[firstIdx]
    if (!blockToKeep) return
    
    const finalBlocks = []
    let keptBlockSet = false
    for (let i = 0; i < blocks.length; i++) {
      if (selectedIndices.includes(i)) {
        if (!keptBlockSet) {
          finalBlocks.push({ ...blocks[i], text: '' })
          keptBlockSet = true
        }
      } else {
        finalBlocks.push(blocks[i])
      }
    }
    updateBlocks(finalBlocks)
    setSelectedBlockIndices([])
    setTimeout(() => {
      const keptNewIndex = finalBlocks.findIndex(b => b.id === blockToKeep.id)
      const el = document.querySelector(`[data-block-index="${keptNewIndex}"]`)
      if (el) {
        focusAndScroll(el)
      }
    }, 50)
  }, [blocks, updateBlocks, focusAndScroll])

  const overwriteSelectedBlocks = useCallback((selectedIndices, typedChar) => {
    if (selectedIndices.length === 0) return
    const firstIdx = selectedIndices[0]
    const blockToKeep = blocks[firstIdx]
    if (!blockToKeep) return
    
    const finalBlocks = []
    let keptBlockSet = false
    for (let i = 0; i < blocks.length; i++) {
      if (selectedIndices.includes(i)) {
        if (!keptBlockSet) {
          finalBlocks.push({ ...blocks[i], text: typedChar })
          keptBlockSet = true
        }
      } else {
        finalBlocks.push(blocks[i])
      }
    }
    updateBlocks(finalBlocks)
    setSelectedBlockIndices([])
    setTimeout(() => {
      const keptNewIndex = finalBlocks.findIndex(b => b.id === blockToKeep.id)
      const el = document.querySelector(`[data-block-index="${keptNewIndex}"]`)
      if (el) {
        focusAndScroll(el)
        el.selectionStart = el.selectionEnd = typedChar.length
      }
    }, 50)
  }, [blocks, updateBlocks, focusAndScroll])

  // Called when user clicks a delete button.
  // pageNum is 1-based (1, 2, 3 ...)
  const requestDeletePage = useCallback((pageNum) => {
    // Use ref for synchronous access to latest pageBreaks
    const breaks = pageBreaksRef.current

    // pageNum=1 → start=0,  end=breaks[0] (or blocks.length if no breaks)
    // pageNum=2 → start=breaks[0], end=breaks[1]
    // pageNum=N → start=breaks[N-2], end=breaks[N-1] (or blocks.length)
    const startIdx = pageNum === 1 ? 0 : breaks[pageNum - 2]
    const endIdx = breaks[pageNum - 1] !== undefined ? breaks[pageNum - 1] : blocks.length

    if (startIdx === undefined || startIdx >= blocks.length) return

    setDeleteConfirm({ pageNum, startIdx, endIdx })
  }, [blocks.length])

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return
    const { startIdx, endIdx } = deleteConfirm
    let newBlocks = blocks.filter((_, idx) => idx < startIdx || idx >= endIdx)

    // Clear pageBreakBefore flag on the block that shifts to the deleted block's index
    if (endIdx < blocks.length) {
      newBlocks = newBlocks.map((b, idx) => {
        if (idx === startIdx) {
          const { pageBreakBefore, ...rest } = b
          return rest
        }
        return b
      })
    }

    const removedCount = endIdx - startIdx
    const shiftedBreaks = pageBreaksRef.current
      .filter(pb => pb < startIdx || pb >= endIdx)
      .map(pb => pb >= endIdx ? pb - removedCount : pb)
    pageBreaksRef.current = shiftedBreaks
    setPageBreaks(shiftedBreaks)

    if (newBlocks.length === 0) {
      newBlocks = [{
        id: Math.random().toString(36).substr(2, 9),
        type: ELEMENT_TYPES.ACTION,
        text: '',
      }]
    }
    setDeleteConfirm(null)
    updateBlocks(newBlocks)
  }, [deleteConfirm, blocks, updateBlocks])

  const handleAddBlankPage = useCallback((index) => {
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: ELEMENT_TYPES.ACTION,
      text: '',
      pageBreakBefore: true,
    }
    const updatedBlocks = blocks.map((b, idx) => {
      if (idx === index) {
        return { ...b, pageBreakBefore: true }
      }
      return b
    })
    const newBlocks = [
      ...updatedBlocks.slice(0, index),
      newBlock,
      ...updatedBlocks.slice(index),
    ]

    // Shift page breaks synchronously to avoid 100ms render glitch
    const shiftedBreaks = pageBreaksRef.current.map(pbIndex => 
      pbIndex >= index ? pbIndex + 1 : pbIndex
    )
    pageBreaksRef.current = shiftedBreaks
    setPageBreaks(shiftedBreaks)

    updateBlocks(newBlocks)
  }, [blocks, updateBlocks])

  const handleAddAuthorPage = useCallback(() => {
    if (blocks.some(b => b.type === ELEMENT_TYPES.TITLE_PAGE)) return
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: ELEMENT_TYPES.TITLE_PAGE,
      text: JSON.stringify({ title: '', screenplay: '', writer: '', director: '' }),
    }
    const newBlocks = [newBlock, ...blocks]
    updateBlocks(newBlocks)
  }, [blocks, updateBlocks])

  const handleAddContentPage = useCallback(() => {
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: ELEMENT_TYPES.ACTION,
      text: '',
    }
    const newBlocks = [...blocks, newBlock]
    updateBlocks(newBlocks)
    setTimeout(() => {
      const idx = newBlocks.length - 1
      const el = document.querySelector(`[data-block-index="${idx}"]`)
      focusAndScroll(el)
    }, 50)
  }, [blocks, updateBlocks, focusAndScroll])

  const cancelDelete = useCallback(() => setDeleteConfirm(null), [])

  const handlePageJump = useCallback((pageNum) => {
    const breaks = pageBreaksRef.current
    let startIdx = 0
    if (hasAuthorPage) {
      startIdx = breaks[pageNum - 1] !== undefined ? breaks[pageNum - 1] : 0
    } else {
      startIdx = pageNum === 1 ? 0 : (breaks[pageNum - 2] !== undefined ? breaks[pageNum - 2] : 0)
    }

    if (startIdx !== undefined && startIdx < blocks.length) {
      const el = document.querySelector(`[data-block-index="${startIdx}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(() => {
          el.focus({ preventScroll: true })
        }, 300)
      }
    }
  }, [blocks.length, hasAuthorPage])

  const handleChange = (index, updatedBlock) => {
    const newBlocks = [...blocks]
    const finalBlock = (autoCaps && updatedBlock.type !== ELEMENT_TYPES.TITLE_PAGE)
      ? { ...updatedBlock, text: updatedBlock.text.toUpperCase() }
      : updatedBlock
    newBlocks[index] = finalBlock
    updateBlocks(newBlocks)
  }

  const insertBlockAfter = (index, type) => {
    if (type === ELEMENT_TYPES.TITLE_PAGE) {
      if (index > 0 && blocks[index].type !== ELEMENT_TYPES.TITLE_PAGE) {
        return
      }
    }
    const newBlocks = [...blocks]
    newBlocks.splice(index + 1, 0, createBlock(type, ''))

    // Shift page breaks synchronously so new block doesn't inherit next block's page break
    const shiftedBreaks = pageBreaksRef.current.map(pbIndex => 
      pbIndex >= index + 1 ? pbIndex + 1 : pbIndex
    )
    pageBreaksRef.current = shiftedBreaks
    setPageBreaks(shiftedBreaks)

    updateBlocks(newBlocks)
    setTimeout(() => {
      const el = document.querySelector(`[data-block-index="${index + 1}"]`)
      focusAndScroll(el)
    }, 50)
  }

  const getSelectedTextareas = useCallback(() => {
    if (!editorRef.current) return []
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return []

    try {
      const range = selection.getRangeAt(0)
      const textareas = Array.from(editorRef.current.querySelectorAll('.script-block'))
      const selected = []

      textareas.forEach((ta, idx) => {
        const wrapper = ta.closest('.script-block-wrapper')
        if (wrapper && range.intersectsNode(wrapper)) {
          selected.push({ idx, ta })
        }
      })
      return selected
    } catch (e) {
      return []
    }
  }, [])

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (readOnly) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const activeEl = document.activeElement
        if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
          const isFullySelected = activeEl.selectionStart === 0 && activeEl.selectionEnd === activeEl.value.length
          if (!isFullySelected) {
            return // Allow native select-all for the current block's text first
          }
        }
        
        e.preventDefault()
        
        const breaks = pageBreaksRef.current
        let focusIdx = focusedIndexRef.current
        if (focusIdx === null || focusIdx === undefined) {
          focusIdx = selectedBlockIndicesRef.current.length > 0 ? selectedBlockIndicesRef.current[0] : 0
        }
        
        let pageStart = 0
        let pageEnd = blocks.length
        
        for (let i = 0; i < breaks.length; i++) {
          if (focusIdx < breaks[i]) {
            pageEnd = breaks[i]
            break
          }
          pageStart = breaks[i]
        }
        
        const isPageAlreadySelected = selectedBlockIndicesRef.current.length === (pageEnd - pageStart)
        
        let targetIndices = []
        if (isPageAlreadySelected) {
          // 3rd stage: select entire script
          targetIndices = blocks.map((_, i) => i)
        } else {
          // 2nd stage: select current page
          for (let i = pageStart; i < pageEnd; i++) {
            targetIndices.push(i)
          }
        }
        
        setSelectedBlockIndices(targetIndices)
        window.getSelection()?.removeAllRanges()
        document.activeElement?.blur()
        return
      }

      // If custom page selection is active
      if (selectedBlockIndicesRef.current.length > 0) {
        const selectedIndices = selectedBlockIndicesRef.current
        
        // 1. Deletion (Backspace/Delete)
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault()
          deleteSelectedBlocks(selectedIndices)
          return
        }
        
        // 2. Copy (Ctrl+C)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          e.preventDefault()
          const textToCopy = selectedIndices.map(idx => blocks[idx]?.text || '').join('\n\n')
          navigator.clipboard.writeText(textToCopy)
          return
        }
        
        // 3. Cut (Ctrl+X)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
          e.preventDefault()
          const textToCopy = selectedIndices.map(idx => blocks[idx]?.text || '').join('\n\n')
          navigator.clipboard.writeText(textToCopy)
          deleteSelectedBlocks(selectedIndices)
          return
        }
        
        // 4. Overwrite (Printable character)
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          overwriteSelectedBlocks(selectedIndices, e.key)
          return
        }
        
        // 5. Navigation or cancel keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Tab'].includes(e.key)) {
          setSelectedBlockIndices([])
          return
        }
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        const selected = getSelectedTextareas()
        if (selected.length > 1) {
          e.preventDefault()

          const startItem = selected[0]
          const endItem = selected[selected.length - 1]

          const startTa = startItem.ta
          const startBlock = blocks[startItem.idx]
          const startRemaining = startBlock.text.substring(0, startTa.selectionStart)

          const endTa = endItem.ta
          const endBlock = blocks[endItem.idx]
          const endRemaining = endBlock.text.substring(endTa.selectionEnd)

          const mergedText = startRemaining + endRemaining

          const newBlocks = []
          for (let i = 0; i < startItem.idx; i++) {
            newBlocks.push(blocks[i])
          }
          newBlocks.push({ ...startBlock, text: mergedText })
          for (let i = endItem.idx + 1; i < blocks.length; i++) {
            newBlocks.push(blocks[i])
          }

          const removedCount = endItem.idx - startItem.idx
          const shiftedBreaks = pageBreaksRef.current
            .filter(pb => pb <= startItem.idx || pb > endItem.idx)
            .map(pb => pb > endItem.idx ? pb - removedCount : pb)
          pageBreaksRef.current = shiftedBreaks
          setPageBreaks(shiftedBreaks)

          updateBlocks(newBlocks)
          window.getSelection()?.removeAllRanges()

          setTimeout(() => {
            const el = document.querySelector(`[data-block-index="${startItem.idx}"]`)
            if (el) {
              focusAndScroll(el)
              el.selectionStart = el.selectionEnd = startRemaining.length
            }
          }, 50)
        }
      }
    }

    const handleGlobalClick = () => {
      if (selectedBlockIndicesRef.current.length > 0) {
        setSelectedBlockIndices([])
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    document.addEventListener('click', handleGlobalClick)
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
      document.removeEventListener('click', handleGlobalClick)
    }
  }, [blocks, readOnly, updateBlocks, getSelectedTextareas, deleteSelectedBlocks, overwriteSelectedBlocks])

  const handleKeyDown = (e, index, block) => {
    if (block.type === ELEMENT_TYPES.TITLE_PAGE) {
      const isControlKey = e.ctrlKey || e.metaKey || e.altKey
      const isNavigationOrDeletion = [
        'Backspace', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Tab', 'Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Enter'
      ].includes(e.key)

      if (!isControlKey && !isNavigationOrDeletion) {
        const titlePageEls = Array.from(editorRef.current.querySelectorAll('.script-block-wrapper')).filter((el, idx) => {
          return blocks[idx]?.type === ELEMENT_TYPES.TITLE_PAGE
        })
        let totalTitleHeight = 72
        titlePageEls.forEach((el) => {
          const ta = el.querySelector('.script-block')
          const style = ta ? window.getComputedStyle(ta) : window.getComputedStyle(el)
          const marginTop = parseFloat(style.marginTop) || 0
          const marginBottom = parseFloat(style.marginBottom) || 0
          totalTitleHeight += el.offsetHeight + marginTop + marginBottom
        })
        const heightLimit = pageSize === 'letter' ? 1056 : 1122
        if (totalTitleHeight > heightLimit - 72) {
          e.preventDefault()
          return
        }
      }
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'a') {
        // Prevent browser from selecting the whole webpage
        e.preventDefault()
        // Select every block on the current page
        const currentBlocks = getBlocksOnCurrentPage()
        setSelectedBlockIndices(currentBlocks)
        // Clear any native browser text selection so it doesn't look messy
        window.getSelection()?.removeAllRanges()
        // Also show native selection in the currently focused textarea
        const target = e.target
        setTimeout(() => { if (target && target.select) target.select() }, 0)
        return
      }
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (undoStack.current.length > 0) {
          const prev = undoStack.current.pop()
          redoStack.current.push(blocks)
          onChange(prev)
        }
        return
      }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        if (redoStack.current.length > 0) {
          const next = redoStack.current.pop()
          undoStack.current.push(blocks)
          onChange(next)
        }
        return
      }
      if (e.key === 's') {
        e.preventDefault()
        return
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (block.type === ELEMENT_TYPES.TITLE_PAGE) return
      const newType = e.shiftKey ? prevElementType(block.type) : nextElementType(block.type)
      
      let newText = block.text
      
      // Handle brackets when switching AWAY from PARENTHETICAL
      if (block.type === ELEMENT_TYPES.PARENTHETICAL && newType !== ELEMENT_TYPES.PARENTHETICAL) {
        let inner = newText.trim()
        inner = inner.replace(/^\[/, '').replace(/\]$/, '')
        newText = inner
      }
      
      // Handle brackets when switching TO PARENTHETICAL
      if (newType === ELEMENT_TYPES.PARENTHETICAL) {
        let inner = newText.trim()
        inner = inner.replace(/^[\(\[]/, '').replace(/[\)\]]$/, '')
        newText = `[${inner}]`
      }
      
      handleChange(index, { ...block, type: newType, text: newText })
      
      if (newType === ELEMENT_TYPES.PARENTHETICAL && newText === '[]') {
        setTimeout(() => {
          if (e.target) e.target.selectionStart = e.target.selectionEnd = 1
        }, 0)
      }
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === ELEMENT_TYPES.TITLE_PAGE) {
        e.preventDefault()
        insertBlockAfter(index, ELEMENT_TYPES.SCENE_HEADING)
        return
      }
      e.preventDefault()
      insertBlockAfter(index, nextOnEnter(block.type))
      return
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selectionStart = e.target.selectionStart
      const selectionEnd = e.target.selectionEnd

      if (selectionStart !== selectionEnd) {
        e.preventDefault()
        const newText = block.text.substring(0, selectionStart) + block.text.substring(selectionEnd)
        handleChange(index, { ...block, text: newText })
        setTimeout(() => {
          if (e.target) {
            e.target.selectionStart = e.target.selectionEnd = selectionStart
          }
        }, 0)
        return
      }

      if (e.key === 'Backspace' && block.text === '' && blocks.length > 1) {
        e.preventDefault()
        const newBlocks = blocks.filter((_, i) => i !== index)
        updateBlocks(newBlocks)
        setTimeout(() => {
          const el = document.querySelector(`[data-block-index="${Math.max(0, index - 1)}"]`)
          focusAndScroll(el)
        }, 50)
      }
    }
  }

  // Change type of focused block
  const handleChangeType = useCallback((newType) => {
    if (focusedIndex === null || focusedIndex === undefined) return
    const block = blocks[focusedIndex]
    if (!block) return
    if (block.type === ELEMENT_TYPES.TITLE_PAGE || newType === ELEMENT_TYPES.TITLE_PAGE) return
    const newBlocks = [...blocks]
    newBlocks[focusedIndex] = { ...block, type: newType }
    updateBlocks(newBlocks)
  }, [focusedIndex, blocks, updateBlocks])

  const handlePageClick = useCallback((e) => {
    if (readOnly) return

    const sel = window.getSelection()
    if (sel && sel.toString().length > 0) {
      return
    }

    if (
      e.target.tagName === 'TEXTAREA' ||
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'BUTTON' ||
      e.target.closest('button') ||
      e.target.closest('.suggestions-dropdown')
    ) {
      return
    }

    if (!editorRef.current) return

    const textareas = Array.from(editorRef.current.querySelectorAll('.script-block'))
    if (textareas.length === 0) return

    const clickY = e.clientY
    let closestTa = textareas[0]
    let minDistance = Math.abs(textareas[0].getBoundingClientRect().top - clickY)

    textareas.forEach((ta) => {
      const rect = ta.getBoundingClientRect()
      const middleY = rect.top + rect.height / 2
      const distance = Math.abs(middleY - clickY)
      if (distance < minDistance) {
        minDistance = distance
        closestTa = ta
      }
    })

    if (closestTa) {
      focusAndScroll(closestTa)
      const val = closestTa.value
      closestTa.selectionStart = closestTa.selectionEnd = val.length
    }
  }, [editorRef, readOnly, focusAndScroll])

  // Element type toolbar items
  const ELEMENT_TOOLBAR = [
    { type: ELEMENT_TYPES.SCENE_HEADING, label: 'Scene',       Icon: FiFilm },
    { type: ELEMENT_TYPES.ACTION,        label: 'Action',      Icon: FiAlignLeft },
    { type: ELEMENT_TYPES.CHARACTER,     label: 'Character',   Icon: FiUser },
    { type: ELEMENT_TYPES.DIALOGUE,      label: 'Dialogue',    Icon: FiMessageSquare },
    { type: ELEMENT_TYPES.PARENTHETICAL, label: 'Parenthetical',Icon: FiCornerDownRight },
    { type: ELEMENT_TYPES.TRANSITION,    label: 'Transition',  Icon: FiRepeat },
    { type: ELEMENT_TYPES.NOTE,          label: 'Note',        Icon: MdOutlineSubtitles },
  ]

  const focusedBlock = blocks[focusedIndex]


  const totalPages = pageBreaks.length + 1
  const heightLimit = pageSize === 'letter' ? 1385 : 1475

  return (
    <>



      <div
        ref={editorRootRef}
        className="editor-root flex-1 overflow-auto pt-8 pb-[60vh] md:pb-8 relative"
        onClick={handlePageClick}
      >
        <div className="editor-bg-blob blob-1" />
        <div className="editor-bg-blob blob-2" />
        <div className="editor-bg-blob blob-3" />

        {/* Info bar showing screenplay generation metadata */}
        <div className="no-print mx-auto mb-6 max-w-[210mm] w-[calc(100%-2rem)] flex items-center gap-3 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 px-4 py-3 rounded-lg shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 dark:border-surface-600 bg-gray-50 dark:bg-surface-900 text-[11px] font-bold text-gray-500 dark:text-gray-400 select-none">
            v{script?.currentVersion || 1}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-850 dark:text-white">{script?.title || 'New Screenplay'}</span> (v{script?.currentVersion || 1}{activeVersion?.label ? `: ${activeVersion.label}` : ''}) was draft-saved by <span className="font-semibold text-gray-850 dark:text-white">{authorName}</span> on <span className="text-blue-600 dark:text-gray-200 font-semibold">{formattedDate}</span>
          </div>
        </div>

        <div
          style={{
            zoom: zoom / 100,
            transform: zoom !== 100 && typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox') ? `scale(${zoom / 100})` : undefined,
            transformOrigin: 'top center',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            minHeight: 'fit-content',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >

      <div
        ref={editorRef}
        className="editor-page"
        style={{
          '--page-width': pageSize === 'letter' ? '215.9mm' : '210mm',
          '--page-min-height': pageSize === 'script' ? 'auto' : pageSize === 'letter' ? '279.4mm' : '297mm',
          width: 'var(--page-width)',
          minHeight: 'var(--page-min-height)',
          fontFamily: fontFamily,
          paddingBottom: pageSize === 'script' ? '120px' : '72px',
        }}
        data-page={pageSize === 'script' ? undefined : `${totalPages}.`}
      >
        {!readOnly && !hasAuthorPage && pageSize !== 'script' && (
          <div 
            className="no-print"
            style={{
              paddingTop: '24px',
              paddingBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              borderBottom: '1px dashed #e2e8f0',
              marginBottom: '24px',
            }}
          >
            <button
              type="button"
              onClick={handleAddAuthorPage}
              className="flex items-center gap-2 rounded-lg border border-dashed border-orange-500/40 bg-orange-500/5 px-4 py-2 text-xs font-semibold text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <FiPlus /> Add Title Page
            </button>
          </div>
        )}

        {blocks.map((block, index) => {
          const isPageStart = pageBreaks.includes(index)
          const newPageNum = isPageStart ? pageBreaks.indexOf(index) + 2 : null
          const prevPageNum = newPageNum ? newPageNum - 1 : null
          const isFirstBlock = index === 0

          // Compute scene number: count SCENE_HEADING blocks up to and including this index
          let sceneNum = null
          if (block.type === ELEMENT_TYPES.SCENE_HEADING) {
            let count = 0
            for (let i = 0; i <= index; i++) {
              if (blocks[i].type === ELEMENT_TYPES.SCENE_HEADING) count++
            }
            sceneNum = count
          }

          const isTitlePageBlock = block.type === ELEMENT_TYPES.TITLE_PAGE
          const hideBlock = isTitlePageBlock && pageSize === 'script'

          return (
            <div key={block.id} style={hideBlock ? { display: 'none' } : {}}>
              {/* Page 1 delete + add buttons */}
              {!readOnly && isFirstBlock && !hasAuthorPage && pageSize !== 'script' && (
                <>
                  {/* Add blank page above page 1 content (inserts before index 0) */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleAddBlankPage(0) }}
                    title="Add blank page here"
                    className="script-page-add-btn"
                    style={{
                      position: 'absolute', right: '-45px', top: '-16px', zIndex: 30,
                      pointerEvents: 'auto', width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    <FiPlus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); requestDeletePage(1) }}
                    title={hasAuthorPage ? "Delete Author Page" : "Delete Page 1"}
                    className="script-page-delete-btn"
                    style={{
                      position: 'absolute', right: '-45px', top: '24px', zIndex: 30,
                      pointerEvents: 'auto', width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', cursor: 'pointer',
                    }}
                  >
                    <FiTrash2 size={14} />
                  </button>

                  {/* Page 1 Delete Confirmation Window */}
                  {deleteConfirm && deleteConfirm.pageNum === 1 && (
                    <div
                      className="absolute right-[-45px] top-[64px] z-[40] bg-white dark:bg-surface-900 border border-red-200 dark:border-red-950 rounded-xl p-4 text-left max-w-[280px] w-full shadow-lg modal-animate-in pointer-events-auto"
                      style={{ transformOrigin: 'top right' }}
                    >
                      <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                        Delete Page 1?
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        All content on this page will be permanently removed.
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelDelete} className="px-3 py-1.5 rounded border border-gray-200 dark:border-surface-700 text-xs font-semibold text-gray-750 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors cursor-pointer">
                          Cancel
                        </button>
                        <button onClick={confirmDelete} className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors border-none cursor-pointer">
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {isPageStart && (
                <div className="visual-page-break">
                  <div style={{ height: `${Math.max(0, heightLimit - 72 - (pageHeights[prevPageNum] || 72))}px`, background: 'white', pointerEvents: 'none' }} />
                  <div className="page-break-bottom-margin" style={{ pointerEvents: 'none' }} />
                  <div className="page-break-gap" style={{ pointerEvents: 'none' }}>
                    <span>Page Break ({pageSize === 'letter' ? 'Letter' : 'A4'})</span>
                  </div>
                  <div className="page-break-top-margin" style={{ pointerEvents: 'none' }} />
                  <div className="page-number-label" style={{ pointerEvents: 'none' }}>
                    {hasAuthorPage ? `${newPageNum - 1}.` : `${newPageNum}.`}
                  </div>

                  {/* Add + Delete buttons for this page break */}
                  {!readOnly && (
                    <>
                      {/* Add blank page — inserts at the block index that starts this new page */}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddBlankPage(index) }}
                        title="Add blank page here"
                        className="script-page-add-btn"
                        style={{
                          position: 'absolute',
                          right: '64px',
                          bottom: '80px',
                          zIndex: 30,
                          pointerEvents: 'auto',
                          width: 32, height: 32, borderRadius: '50%',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer',
                        }}
                      >
                        <FiPlus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); requestDeletePage(newPageNum) }}
                        title={hasAuthorPage ? (newPageNum === 2 ? "Delete Page 1" : `Delete Page ${newPageNum - 1}`) : `Delete Page ${newPageNum}`}
                        className="script-page-delete-btn"
                        style={{
                          position: 'absolute',
                          right: '24px',
                          bottom: '80px',
                          zIndex: 30,
                          pointerEvents: 'auto',
                          width: 32, height: 32, borderRadius: '50%',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer',
                        }}
                      >
                        <FiTrash2 size={16} />
                      </button>

                      {/* Page Break Delete Confirmation Window */}
                      {deleteConfirm && deleteConfirm.pageNum === newPageNum && (
                        <div
                          className="absolute right-[24px] bottom-[-60px] z-[40] bg-white dark:bg-surface-900 border border-red-200 dark:border-red-955 rounded-xl p-4 text-left max-w-[280px] w-full shadow-lg modal-animate-in pointer-events-auto"
                          style={{ transformOrigin: 'top right' }}
                        >
                          <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                            Delete {hasAuthorPage ? (newPageNum === 2 ? "Page 1" : `Page ${newPageNum - 1}`) : `Page ${newPageNum}`}?
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            All content on this page will be permanently removed.
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={cancelDelete} className="px-3 py-1.5 rounded border border-gray-200 dark:border-surface-700 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors cursor-pointer">
                              Cancel
                            </button>
                            <button onClick={confirmDelete} className="px-3 py-1.5 rounded text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors border-none cursor-pointer">
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              <ScriptBlock
                block={block}
                index={index}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={setFocusedIndex}
                characterSuggestions={characterSuggestions}
                pastUniqueWords={getPastUniqueWords(index)}
                highlight={findMatches.includes(index)}
                readOnly={readOnly}
                sceneNumber={sceneNum}
                isSelected={selectedBlockIndices.includes(index)}
                autoCaps={autoCaps}
                translitLang={translitLang}
                pageSize={pageSize}
              />
            </div>
          )
        })}

        {!readOnly && hasAuthorPage && onlyHasTitlePage && pageSize !== 'script' && (
          <div 
            className="no-print"
            style={{
              paddingTop: '24px',
              paddingBottom: '24px',
              display: 'flex',
              justifyContent: 'center',
              borderTop: '1px dashed #e2e8f0',
              marginTop: '40px',
            }}
          >
            <button
              type="button"
              onClick={handleAddContentPage}
              className="flex items-center gap-2 rounded-lg border border-dashed border-orange-500/40 bg-orange-500/5 px-4 py-2 text-xs font-semibold text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <FiPlus /> Add Page below Title Page
            </button>
          </div>
        )}

        {/* Live Watermark Overlay per page */}
        {watermarkEnabled && pageSize !== 'script' && Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1
          if (pageNum === 1 && hasAuthorPage) return null
          const pageTop = (pageNum - 1) * (heightLimit + 120)
          const pageHeight = heightLimit + 72
          return (
            <div
              key={i}
              className="watermark-overlay"
              style={{
                top: `${pageTop}px`,
                height: `${pageHeight}px`,
                opacity: watermarkOpacity,
              }}
            >
              <div className="watermark-text select-none pointer-events-none">
                {watermarkText}
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
    {pageSize !== 'script' && (
      <PageNavigator
        totalPages={hasAuthorPage ? Math.max(1, pageBreaks.length) : pageBreaks.length + 1}
        onJump={handlePageJump}
      />
    )}
    </>
  )
}

export function computeLocalStats(blocks) {
  const estPages = estimatePages(countWords(blocks))
  return {
    pages: Math.max(1, estPages - 1),
    words: countWords(blocks),
    scenes: countScenes(blocks),
    characters: getUniqueCharacters(blocks).length,
    dialogues: blocks.filter((b) => b.type === ELEMENT_TYPES.DIALOGUE && b.text?.trim()).length,
  }
}

export { getUniqueCharacters }
