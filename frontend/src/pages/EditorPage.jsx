import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { scriptApi } from '../api/scriptApi'
import { useAutoSave } from '../hooks/useAutoSave'
import { useCharacters } from '../hooks/useCharacters'
import { useScenes } from '../hooks/useScenes'
import { useProjects } from '../hooks/useProjects'
import { parseContent } from '../utils/screenplayHelpers'
import EditorToolbar from '../components/editor/EditorToolbar'
import ScreenplayEditor, { computeLocalStats } from '../components/editor/ScreenplayEditor'
import EditorSidebar from '../components/editor/EditorSidebar'
import CharacterProfileModal from '../components/editor/CharacterProfileModal'
import AiPanel from '../components/editor/AiPanel'
import SettingsPanel from '../components/editor/SettingsPanel'

import PageNavigator from '../components/editor/PageNavigator'
import { Spinner } from '../components/ui/Spinner'
import { FiArrowLeft, FiFilm, FiAlignLeft, FiUser, FiMessageSquare, FiCornerDownRight, FiRepeat, FiSidebar, FiSettings, FiSave, FiRefreshCw, FiSun, FiMoon, FiShare2, FiZap, FiUpload, FiX } from 'react-icons/fi'
import { MdOutlineSubtitles, MdTranslate } from 'react-icons/md'
import { FaFilePdf, FaFileWord } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'

const ELEMENT_TYPES_LIST = [
  { type: 'SCENE_HEADING', label: 'Scene',       Icon: FiFilm,             activeClasses: 'bg-orange-500/20 text-orange-500 border border-orange-500/30' },
  { type: 'ACTION',        label: 'Action',      Icon: FiAlignLeft,        activeClasses: 'bg-blue-500/20 text-blue-500 border border-blue-500/30' },
  { type: 'CHARACTER',     label: 'Character',   Icon: FiUser,             activeClasses: 'bg-purple-500/20 text-purple-500 border border-purple-500/30' },
  { type: 'DIALOGUE',      label: 'Dialogue',    Icon: FiMessageSquare,    activeClasses: 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' },
  { type: 'PARENTHETICAL', label: 'Parenthetical',Icon: FiCornerDownRight, activeClasses: 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' },
  { type: 'TRANSITION',    label: 'Transition',  Icon: FiRepeat,           activeClasses: 'bg-amber-500/20 text-amber-500 border border-amber-500/30' },
  { type: 'NOTE',          label: 'Note',        Icon: MdOutlineSubtitles, activeClasses: 'bg-pink-500/20 text-pink-500 border border-pink-500/30' },
]

export default function EditorPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [watermarkEnabled, setWatermarkEnabled] = useState(() => {
    return localStorage.getItem(`watermark_${projectId}_enabled`) === 'true'
  })
  const [watermarkText, setWatermarkText] = useState(() => {
    return localStorage.getItem(`watermark_${projectId}_text`) || 'CONFIDENTIAL'
  })
  const [watermarkOpacity, setWatermarkOpacity] = useState(() => {
    const val = localStorage.getItem(`watermark_${projectId}_opacity`)
    return val ? parseFloat(val) : 0.1
  })

  useEffect(() => {
    localStorage.setItem(`watermark_${projectId}_enabled`, watermarkEnabled)
  }, [watermarkEnabled, projectId])

  useEffect(() => {
    localStorage.setItem(`watermark_${projectId}_text`, watermarkText)
  }, [watermarkText, projectId])

  useEffect(() => {
    localStorage.setItem(`watermark_${projectId}_opacity`, watermarkOpacity)
  }, [watermarkOpacity, projectId])

  const [loading, setLoading] = useState(true)
  const [script, setScript] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [pageSize, setPageSize] = useState('a4')
  const [fontFamily, setFontFamily] = useState('Courier Prime')
  const [showAi, setShowAi] = useState(false)
  const [showFind, setShowFind] = useState(false)
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768)
  const [showSettings, setShowSettings] = useState(false)
  const [autoCaps, setAutoCaps] = useState(true)
  const [translitLang, setTranslitLang] = useState(null)
  const [versions, setVersions] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [jumpToSceneNumber, setJumpToSceneNumber] = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState('')
  const fileInputRef = useRef(null)
  const [viewportStyle, setViewportStyle] = useState({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleViewportChange = () => {
      const vv = window.visualViewport
      if (vv) {
        // Calculate exact visible viewport bottom to position formatting bar above keyboard
        setViewportStyle({
          position: 'fixed',
          top: `${vv.offsetTop + vv.height - 56}px`,
          bottom: 'auto',
          height: '56px',
        })
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
      window.visualViewport.addEventListener('scroll', handleViewportChange)
      window.addEventListener('focusin', handleViewportChange)
      handleViewportChange()
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange)
        window.visualViewport.removeEventListener('scroll', handleViewportChange)
        window.removeEventListener('focusin', handleViewportChange)
      }
    }
  }, [])

  useEffect(() => {
    if (script?.updatedAt) {
      try {
        const dateObj = new Date(script.updatedAt)
        const time = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '')
        setLastSavedTime(time)
      } catch {
        setLastSavedTime('')
      }
    }
  }, [script])

  // Auto-calculate zoom for mobile screens to fit the page exactly like desktop mode
  useEffect(() => {
    const handleAutoZoom = () => {
      if (window.innerWidth < 768) {
        const pageWidthPx = pageSize === 'letter' ? 816 : 794
        const availableWidth = window.innerWidth - 24
        const autoZoomVal = Math.min(100, Math.max(20, Math.floor((availableWidth / pageWidthPx) * 100)))
        setZoom(autoZoomVal)
      } else {
        setZoom(100)
      }
    }

    handleAutoZoom()
    window.addEventListener('resize', handleAutoZoom)
    return () => window.removeEventListener('resize', handleAutoZoom)
  }, [pageSize])

  const {
    characters,
    suggestions,
    loading: charactersLoading,
    loadCharacters,
    loadSuggestions,
    refresh: refreshCharacters,
    setCharacters,
  } = useCharacters(projectId)

  const {
    scenes,
    loading: scenesLoading,
    loadScenes,
    reorder: reorderScenes,
    toggleFavorite: toggleSceneFavorite,
  } = useScenes(projectId, script?.id)

  const { data: projectsData } = useProjects({ archived: false, trash: false })
  const projects = projectsData?.content ?? []

  const refreshAfterSave = useCallback(async () => {
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '')
    setLastSavedTime(time)
    await Promise.all([
      refreshCharacters(),
      loadScenes(),
    ])
  }, [refreshCharacters, loadScenes])

  const { status, save } = useAutoSave(script?.id, blocks, script?.title, fontFamily, !!script?.id, refreshAfterSave)

  const loadScript = useCallback(async () => {
    try {
      const { data } = await scriptApi.getOrCreate(projectId)
      const scriptData = data.data
      setScript(scriptData)
      setBlocks(parseContent(scriptData.content))
      if (scriptData.fontFamily) {
        setFontFamily(scriptData.fontFamily)
      }
      const versionsRes = await scriptApi.getVersions(scriptData.id)
      setVersions(versionsRes.data.data || [])
      await Promise.all([
        loadCharacters(),
        loadSuggestions(),
        loadScenes(),
      ])
    } catch {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [projectId, navigate, loadCharacters, loadSuggestions, loadScenes])

  useEffect(() => {
    loadScript()
  }, [loadScript])

  const handleDownload = async (format) => {
    if (!script?.id) return
    try {
      const response = format === 'docx'
        ? await scriptApi.exportDocx(script.id, pageSize)
        : await scriptApi.exportPdf(script.id, pageSize, watermarkEnabled ? watermarkText : '')
      const data = response.data

      // Check if the response is actually a JSON error
      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text()
        const parsed = JSON.parse(text)
        alert(`Failed to export ${format.toUpperCase()}: ${parsed.message || 'Unknown error'}`)
        return
      }
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data)
          alert(`Failed to export ${format.toUpperCase()}: ${parsed.message || 'Unknown error'}`)
          return
        } catch {
          // Keep going
        }
      }

      const mimeType = format === 'docx' 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        : 'application/pdf'
      
      const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${script.title || 'screenplay'}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(`Failed to export ${format.toUpperCase()}:`, err)
      alert(`Failed to download ${format.toUpperCase()}. Please try again.`)
    }
  }

  const handleFileImport = async (e) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    
    if (!window.confirm("Importing this file will replace all current screenplay content. Are you sure you want to proceed?")) {
      e.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setLoading(true)
      const response = await scriptApi.importFile(script.id, formData)
      const updatedScript = response.data.data
      setScript(updatedScript)
      setBlocks(parseContent(updatedScript.content))
      await loadScript()
      alert('Screenplay imported successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to import screenplay file. Please ensure it is a valid PDF or DOCX file.')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  const handleAi = async ({ type, prompt }) => {
    if (!script?.id) return
    setAiLoading(true)
    try {
      const { data } = await scriptApi.aiAssist(script.id, { type, prompt })
      setAiResponse(data.data.result)
    } catch {
      setAiResponse('AI request failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleRestoreVersion = async (versionNumber) => {
    await handleSwitchVersion(versionNumber)
  }

  const handleSwitchVersion = async (versionNumber) => {
    if (!script?.id) return
    try {
      setLoading(true)
      const { data } = await scriptApi.switchVersion(script.id, versionNumber)
      setScript(data.data)
      setBlocks(parseContent(data.data.content))
      
      // Reload versions and script status
      const versionsRes = await scriptApi.getVersions(script.id)
      setVersions(versionsRes.data.data || [])
    } catch (err) {
      console.error(err)
      alert('Failed to switch to version ' + versionNumber)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVersion = async () => {
    if (!script?.id) return
    const label = prompt("Enter a label or note for this version (optional):")
    if (label === null) return // User clicked Cancel
    
    try {
      setLoading(true)
      const payload = {
        content: JSON.stringify(blocks),
        title: script.title,
        fontFamily: fontFamily,
        createVersion: true,
        versionLabel: label
      }
      await scriptApi.save(script.id, payload)
      
      // Reload versions and script status
      const versionsRes = await scriptApi.getVersions(script.id)
      setVersions(versionsRes.data.data || [])
      
      const { data } = await scriptApi.getOrCreate(projectId)
      setScript(data.data)
      setBlocks(parseContent(data.data.content))
      
      alert('Version created successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to create a new version.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleShare = async (newVal) => {
    if (!script?.id) return
    await scriptApi.toggleShare(script.id, newVal)
    setScript((prev) => ({
      ...prev,
      isShared: newVal,
    }))
  }

  const handleCharacterSearch = (search, status) => {
    loadCharacters({ search: search || undefined, status: status || undefined })
  }

  const handleCharacterSelect = (char) => {
    setSelectedCharacter(char)
    setShowCharacterModal(true)
  }

  const handleCharacterUpdated = (updated) => {
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    loadSuggestions()
  }

  const handleJumpToScene = (sceneNumber) => {
    setJumpToSceneNumber(null)
    setTimeout(() => setJumpToSceneNumber(sceneNumber), 0)
  }

  const stats = computeLocalStats(blocks)

  const focusedBlock = blocks[focusedIndex]
  const focusedBlockType = focusedBlock?.type || 'action'
  const handleBlockTypeChange = (newType) => {
    if (focusedIndex === null || focusedIndex === undefined) return
    if (focusedIndex < 0 || focusedIndex >= blocks.length) return
    const block = blocks[focusedIndex]
    if (!block || block.type === 'TITLE_PAGE' || newType === 'TITLE_PAGE') return

    const newBlocks = [...blocks]
    let newText = newBlocks[focusedIndex].text
    
    // Handle brackets when switching AWAY from PARENTHETICAL
    if (block.type === 'PARENTHETICAL' && newType !== 'PARENTHETICAL') {
      let inner = newText.trim()
      inner = inner.replace(/^\[/, '').replace(/\]$/, '')
      newText = inner
    }
    
    // Handle brackets when switching TO PARENTHETICAL
    if (newType === 'PARENTHETICAL') {
      let inner = newText.trim()
      inner = inner.replace(/^[\(\[]/, '').replace(/[\)\]]$/, '')
      newText = `[${inner}]`
    }
    
    newBlocks[focusedIndex] = { ...newBlocks[focusedIndex], type: newType, text: newText }
    setBlocks(newBlocks)
    setTimeout(() => {
      const el = document.querySelector(`[data-block-index="${focusedIndex}"]`)
      if (el) {
        el.focus({ preventScroll: true })
        if (newType === 'PARENTHETICAL' && newText === '[]') {
          el.selectionStart = el.selectionEnd = 1
        }
      }
    }, 50)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex h-screen h-[100dvh] flex-col bg-surface-900">
      <EditorToolbar
        title={script?.title}
        saveStatus={status}
        lastSavedTime={lastSavedTime}
        zoom={zoom}
        onZoomChange={setZoom}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        fontFamily={fontFamily}
        onFontFamilyChange={setFontFamily}
        onSave={save}
        blocks={blocks}
        onReplace={setBlocks}
        onToggleAi={() => setShowAi(!showAi)}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onDownload={handleDownload}
        scriptId={script?.id}
        isShared={script?.isShared}
        onToggleShare={handleToggleShare}
        onImport={() => fileInputRef.current?.click()}
        onBack={() => navigate('/dashboard')}
        focusedBlockType={focusedBlockType}
        onBlockTypeChange={handleBlockTypeChange}
        projects={projects}
        onProjectSelect={(id) => navigate(`/projects/${id}/editor`)}
        currentVersion={script?.currentVersion}
        versions={versions}
        onSwitchVersion={handleSwitchVersion}
        onCreateVersion={handleCreateVersion}
        onToggleSettings={() => setShowSettings(!showSettings)}
        translitLang={translitLang}
        onTranslitLangChange={setTranslitLang}
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <ScreenplayEditor
            blocks={blocks}
            onChange={setBlocks}
            characterSuggestions={suggestions}
            zoom={zoom}
            onZoomChange={setZoom}
            jumpToSceneNumber={jumpToSceneNumber}
            pageSize={pageSize}
            fontFamily={fontFamily}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
            script={script}
            versions={versions}
            autoCaps={autoCaps}
            translitLang={translitLang}
            watermarkEnabled={watermarkEnabled}
            watermarkText={watermarkText}
            watermarkOpacity={watermarkOpacity}
          />
        </div>

        <div className={`transition-all duration-300 ease-in-out ${showSidebar ? 'w-72 opacity-100 border-l border-surface-700' : 'w-0 opacity-0 overflow-hidden border-l-0'}`}>
          <EditorSidebar
            stats={{ ...stats, dialogues: stats.dialogues }}
            versions={versions}
            onRestoreVersion={handleRestoreVersion}
            onCreateVersion={handleCreateVersion}
            characters={characters}
            charactersLoading={charactersLoading}
            onCharacterSelect={handleCharacterSelect}
            onCharacterSearch={handleCharacterSearch}
            onCharacterFilter={handleCharacterSearch}
            scenes={scenes}
            scenesLoading={scenesLoading}
            onJumpToScene={handleJumpToScene}
            onSceneReorder={reorderScenes}
            onToggleSceneFavorite={toggleSceneFavorite}
          />
        </div>

        <div className={`transition-all duration-300 ease-in-out ${showAi ? 'w-80 opacity-100 border-l border-surface-700' : 'w-0 opacity-0 overflow-hidden border-l-0'}`}>
          <AiPanel
            open={true}
            onClose={() => setShowAi(false)}
            onSubmit={handleAi}
            loading={aiLoading}
            lastResponse={aiResponse}
          />
        </div>

        <div className={`transition-all duration-300 ease-in-out ${showSettings ? 'w-80 opacity-100 border-l border-surface-700' : 'w-0 opacity-0 overflow-hidden border-l-0'}`}>
          <SettingsPanel
            zoom={zoom}
            onZoomChange={setZoom}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            fontFamily={fontFamily}
            onFontFamilyChange={setFontFamily}
            autoCaps={autoCaps}
            onAutoCapsChange={setAutoCaps}
            watermarkEnabled={watermarkEnabled}
            onWatermarkEnabledChange={setWatermarkEnabled}
            watermarkText={watermarkText}
            onWatermarkTextChange={setWatermarkText}
            watermarkOpacity={watermarkOpacity}
            onWatermarkOpacityChange={setWatermarkOpacity}
            onClose={() => setShowSettings(false)}
          />
        </div>
      </div>





      <CharacterProfileModal
        character={selectedCharacter}
        open={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        onUpdated={handleCharacterUpdated}
      />



      {/* Mobile Sticky Footer Formatting Bar */}
      {(!focusedBlock || focusedBlock.type !== 'TITLE_PAGE') && (
        <div 
          style={viewportStyle}
          className="md:hidden fixed bottom-0 left-0 right-0 w-full flex h-14 items-center justify-around px-2 bg-surface-900/95 dark:bg-surface-950/95 border-t border-surface-800 backdrop-blur-md z-50 select-none pb-safe"
        >
          {ELEMENT_TYPES_LIST.map(({ type, label, Icon, activeClasses }) => {
            const isActive = focusedBlockType === type;
            return (
              <button
                key={type}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleBlockTypeChange(type)
                }}
                onTouchStart={(e) => {
                  e.preventDefault()
                  handleBlockTypeChange(type)
                }}
                className={`flex flex-col items-center justify-center gap-0.5 w-12 h-10 rounded-lg transition-all border border-transparent ${
                  isActive 
                    ? activeClasses 
                    : 'text-gray-400 hover:text-white hover:bg-surface-800'
                }`}
              >
                <Icon className="text-base" />
                <span className="text-[9px] font-medium tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* Mobile Sticky Drawer Menu */}
      {showMobileMenu && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-all duration-300" onClick={() => setShowMobileMenu(false)} />
          
          {/* Drawer Container */}
          <div className="fixed top-0 left-0 bottom-0 z-[101] w-72 h-full bg-white dark:bg-surface-850 border-r border-gray-150 dark:border-surface-800 shadow-2xl flex flex-col modal-animate-slide-in">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-surface-800 bg-gray-50/50 dark:bg-surface-900/50">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ee7712] text-white">
                  <FiFilm className="text-sm" />
                </div>
                <span className="text-sm font-bold tracking-tight text-gray-800 dark:text-white">ScriptWriter Menu</span>
              </div>
              <button 
                onClick={() => setShowMobileMenu(false)} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-750 transition-colors cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-white dark:bg-surface-850">
              
              {/* Category: Navigation */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 select-none">
                  Navigation
                </div>
                <button
                  onClick={() => { setShowMobileMenu(false); navigate('/dashboard'); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-gray-100 dark:bg-surface-750 text-gray-500 dark:text-gray-400">
                    <FiArrowLeft className="text-sm" />
                  </div>
                  <span>Back to Dashboard</span>
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); setShowSidebar(!showSidebar); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-blue-500/10 text-blue-505">
                    <FiSidebar className="text-sm" />
                  </div>
                  <span>Toggle Sidebar Panel</span>
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); setShowSettings(!showSettings); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-gray-500/10 text-gray-650 dark:text-gray-400">
                    <FiSettings className="text-sm" />
                  </div>
                  <span>Editor Settings</span>
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-surface-800 my-1" />

              {/* Category: Status */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 select-none">
                  Status
                </div>
                <div className="w-full flex items-center gap-3.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <FiSave className="text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 dark:text-gray-500 leading-none">Auto Save</span>
                    <span className="text-xs font-semibold mt-0.5">{status === 'saving' ? 'Saving...' : status === 'error' ? 'Failed' : `Saved ${lastSavedTime}`}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowMobileMenu(false); save(); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-brand-500/10 text-brand-505 dark:text-brand-400">
                    <FiRefreshCw className="text-sm" />
                  </div>
                  <span>Sync to Project</span>
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-surface-800 my-1" />

              {/* Category: Tools */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 select-none">
                  Tools
                </div>
                <button
                  onClick={() => { setShowMobileMenu(false); toggleTheme(); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    {theme === 'dark' ? <FiSun className="text-amber-500" /> : <FiMoon className="text-indigo-400" />}
                  </div>
                  <span>{theme === 'dark' ? 'Normal Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); handleToggleShare(!script?.isShared); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <FiShare2 className="text-sm" />
                  </div>
                  <span>Share Project</span>
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); setShowAi(!showAi); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-amber-500/10 text-amber-505">
                    <FiZap className="text-sm" />
                  </div>
                  <span>AI Assistant</span>
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); setTranslitLang(translitLang ? null : 'hi'); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-blue-500/10 text-blue-505">
                    <MdTranslate className="text-sm" />
                  </div>
                  <span>{translitLang ? 'Disable Indian Typing' : 'Enable Indian Typing'}</span>
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); fileInputRef.current?.click(); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-pink-500/10 text-pink-505">
                    <FiUpload className="text-sm" />
                  </div>
                  <span>Import Script File</span>
                </button>
              </div>

              <div className="border-t border-gray-150 dark:border-surface-800 my-1" />

              {/* Category: Download */}
              <div className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 select-none">
                  Export As
                </div>
                <button
                  onClick={() => { setShowMobileMenu(false); handleDownload('pdf'); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-orange-500/10 text-orange-505">
                    <FaFilePdf className="text-sm" />
                  </div>
                  <span>PDF Document</span>
                </button>
                <button
                  onClick={() => { setShowMobileMenu(false); handleDownload('docx'); }}
                  className="w-full flex items-center gap-3.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-white transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-center w-7.5 h-7.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <FaFileWord className="text-sm" />
                  </div>
                  <span>Word Document</span>
                </button>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  )
}
