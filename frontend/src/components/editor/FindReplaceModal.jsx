import { useState, useRef, useEffect } from 'react'
import { FiX, FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi'
import { Button } from '../ui/Button'

export default function FindReplaceModal({ blocks, onReplace }) {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  
  const [matches, setMatches] = useState([])
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1)
  
  const searchInputRef = useRef(null)



  const getRegex = () => {
    let pattern = search
    if (!useRegex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`
    }
    const flags = caseSensitive ? 'g' : 'gi'
    try {
      return new RegExp(pattern, flags)
    } catch {
      return null
    }
  }

  const find = () => {
    if (!search) return
    const regex = getRegex()
    if (!regex) {
      alert("Invalid regular expression")
      return
    }
    const found = []
    blocks.forEach((block, index) => {
      const text = block.text || ''
      if (regex.test(text)) {
        found.push(index)
      }
    })
    setMatches(found)
    
    if (found.length > 0) {
      setCurrentMatchIdx(0)
      scrollToMatch(found[0])
    } else {
      setCurrentMatchIdx(-1)
    }
  }

  const scrollToMatch = (blockIndex) => {
    const el = document.querySelector(`[data-block-index="${blockIndex}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus({ preventScroll: true })
    }
  }

  const nextMatch = () => {
    if (matches.length === 0) return
    const nextIdx = (currentMatchIdx + 1) % matches.length
    setCurrentMatchIdx(nextIdx)
    scrollToMatch(matches[nextIdx])
  }

  const prevMatch = () => {
    if (matches.length === 0) return
    const prevIdx = (currentMatchIdx - 1 + matches.length) % matches.length
    setCurrentMatchIdx(prevIdx)
    scrollToMatch(matches[prevIdx])
  }

  const replaceAll = () => {
    if (!search) return
    const regex = getRegex()
    if (!regex) return
    let replacementCount = 0
    const newBlocks = blocks.map((b) => {
      const originalText = b.text || ''
      if (regex.test(originalText)) {
        replacementCount++
        // Reset lastIndex because we test() then replace()
        regex.lastIndex = 0
        return { ...b, text: originalText.replace(regex, replace) }
      }
      return b
    })
    
    if (replacementCount > 0) {
      onReplace(newBlocks)
      setMatches([])
      setCurrentMatchIdx(-1)
    }
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) prevMatch()
      else if (matches.length > 0) nextMatch()
      else find()
    }
  }

  return (
    <div className="w-[calc(100vw-32px)] sm:w-[340px] max-w-[340px] rounded-2xl border border-gray-200 dark:border-surface-700 bg-white/95 dark:bg-surface-900/95 backdrop-blur-2xl p-4.5 shadow-2xl shadow-black/10 dark:shadow-black/40 text-gray-800 dark:text-white transition-all ring-1 ring-black/5 dark:ring-white/10 pointer-events-auto">
      <div className="mb-3 flex items-center justify-between border-b border-gray-100 dark:border-surface-700 pb-2">
        <h3 className="font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-white tracking-wide">
          <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center">
            <FiSearch className="text-base text-violet-500" />
          </div>
          Find & Replace
        </h3>
      </div>
      
      <div className="space-y-3">
        <div className="relative">
          <input
            ref={searchInputRef}
            placeholder="Find (Press Enter to search/next)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setMatches([]) }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border border-gray-200 dark:border-surface-600 bg-gray-50 dark:bg-surface-900/50 px-3 py-2 text-xs text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          {matches.length > 0 && (
            <div className="absolute right-3 top-2.5 text-[10px] text-gray-500 dark:text-gray-400 font-mono font-medium">
              {currentMatchIdx + 1} / {matches.length}
            </div>
          )}
        </div>
        
        <input
          placeholder="Replace with..."
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          className="w-full rounded-lg border border-gray-200 dark:border-surface-600 bg-gray-50 dark:bg-surface-900/50 px-3 py-2 text-xs text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-colors"
        />
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-600 dark:text-gray-300 font-medium pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="accent-brand-500 w-3 h-3" />
            Match Case
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
            <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} className="accent-brand-500 w-3 h-3" />
            Whole Word
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
            <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} className="accent-brand-500 w-3 h-3" />
            Regex
          </label>
        </div>
        
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-surface-700/50">
          <div className="flex gap-1">
            <Button variant="secondary" onClick={prevMatch} disabled={matches.length === 0} className="!px-2 !py-1" title="Previous Match (Shift+Enter)">
              <FiChevronUp size={14} />
            </Button>
            <Button variant="secondary" onClick={nextMatch} disabled={matches.length === 0} className="!px-2 !py-1" title="Next Match (Enter)">
              <FiChevronDown size={14} />
            </Button>
            <Button variant="primary" onClick={find} className="!px-3 !py-1 !text-xs ml-1">Find All</Button>
          </div>
          <Button variant="danger" onClick={replaceAll} disabled={!search || matches.length === 0} className="!px-3 !py-1 !text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
            Replace All
          </Button>
        </div>
      </div>
    </div>
  )
}
