import { useState, useRef, useEffect } from 'react'
import { FiArrowLeft, FiDownload, FiSidebar, FiSave, FiSearch, FiZap, FiShare2, FiUpload, FiSun, FiMoon, FiFilm, FiAlignLeft, FiUser, FiCornerDownRight, FiMessageSquare, FiRepeat, FiHome, FiRefreshCw, FiCheck, FiAlertCircle, FiChevronDown, FiFolder, FiPlus, FiSettings, FiGlobe, FiMenu, FiX } from 'react-icons/fi'
import { MdOutlineSubtitles, MdTranslate } from 'react-icons/md'
import { Button } from '../ui/Button'
import { ZOOM_LEVELS } from '../../constants/screenplay'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { INDIAN_LANGUAGES } from '../../utils/translitUtils'
import ShareModal from './ShareModal'
import FindReplaceModal from './FindReplaceModal'
import { FaFilePdf, FaFileWord } from 'react-icons/fa'

const ELEMENT_TYPES_LIST = [
  { 
    type: 'SCENE_HEADING', 
    label: 'Scene', 
    Icon: FiFilm,
    activeClasses: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/50',
    iconColor: 'text-violet-500/70 dark:text-violet-400/60'
  },
  { 
    type: 'ACTION', 
    label: 'Action', 
    Icon: FiAlignLeft,
    activeClasses: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/50',
    iconColor: 'text-blue-500/70 dark:text-blue-400/60'
  },
  { 
    type: 'CHARACTER', 
    label: 'Character', 
    Icon: FiUser,
    activeClasses: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/50',
    iconColor: 'text-emerald-500/70 dark:text-emerald-400/60'
  },
  { 
    type: 'DIALOGUE', 
    label: 'Dialogue', 
    Icon: FiMessageSquare,
    activeClasses: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/50',
    iconColor: 'text-teal-500/70 dark:text-teal-400/60'
  },
  { 
    type: 'PARENTHETICAL', 
    label: 'Parenthetical', 
    Icon: FiCornerDownRight,
    activeClasses: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/50',
    iconColor: 'text-indigo-500/70 dark:text-indigo-400/60'
  },
  { 
    type: 'TRANSITION', 
    label: 'Transition', 
    Icon: FiRepeat,
    activeClasses: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/50',
    iconColor: 'text-amber-500/70 dark:text-amber-400/60'
  },
  { 
    type: 'NOTE', 
    label: 'Note', 
    Icon: MdOutlineSubtitles,
    activeClasses: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/50',
    iconColor: 'text-rose-500/70 dark:text-rose-400/60'
  },
]

export default function EditorToolbar({
  title,
  saveStatus,
  lastSavedTime,
  zoom,
  onZoomChange,
  pageSize,
  onPageSizeChange,
  fontFamily = 'Courier Prime',
  onFontFamilyChange,
  onSave,
  blocks,
  onReplace,
  onToggleAi,
  onToggleSidebar,
  onDownload,
  scriptId,
  isShared,
  onToggleShare,
  onImport,
  onBack,
  focusedBlockType = 'action',
  onBlockTypeChange,
  projects = [],
  onProjectSelect,
  currentVersion = 1,
  versions = [],
  onSwitchVersion,
  onCreateVersion,
  onToggleSettings,
  translitLang,
  onTranslitLangChange,
  showMobileMenu,
  onMobileMenuToggle,
}) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef(null)
  
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false)
  const projectsDropdownRef = useRef(null)

  const [showVersionDropdown, setShowVersionDropdown] = useState(false)
  const versionDropdownRef = useRef(null)

  const [showShareDropdown, setShowShareDropdown] = useState(false)
  const shareDropdownRef = useRef(null)

  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false)
  const downloadDropdownRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
      if (projectsDropdownRef.current && !projectsDropdownRef.current.contains(e.target)) {
        setShowProjectsDropdown(false)
      }
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(e.target)) {
        setShowVersionDropdown(false)
      }
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setShowShareDropdown(false)
      }
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(e.target)) {
        setShowDownloadDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const statusText = {
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Save failed',
  }

  return (
    <div className="flex flex-col shrink-0 border-b border-gray-200 dark:border-surface-700 bg-white/80 dark:bg-surface-850/80 backdrop-blur-md sticky top-0 z-50">
      {/* Row 1: Top Navigation Bar */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-gray-200/50 dark:border-surface-700/50">
        <div className="flex items-center gap-3 h-full">
          {/* Back to Dashboard (Desktop) */}
          <button
            onClick={onBack}
            className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-750 hover:text-gray-800 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Back to Dashboard"
          >
            <FiArrowLeft className="text-base" />
          </button>

          {/* Mobile Menu Toggle (Mobile) */}
          <div className="relative md:hidden flex items-center">
            <button
              onClick={onMobileMenuToggle}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-750 hover:text-gray-800 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <FiMenu className="text-base" />
            </button>
          </div>

          {/* Logo with Orange Accent */}
          <div className="hidden md:flex items-center gap-2 mr-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ee7712] text-white">
              <FiFilm className="text-sm" />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-800 dark:text-white">ScriptWriter</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Professional Dual Theme Toggle Slider */}
          <div
            onClick={toggleTheme}
            className="relative hidden md:flex items-center bg-gray-100 dark:bg-surface-800 p-0.5 rounded-full border border-gray-200 dark:border-surface-700 h-8 w-[60px] cursor-pointer select-none transition-all mr-1"
            title={theme === 'dark' ? 'Switch to Normal Mode' : 'Switch to Dark Mode'}
          >
            {/* Sliding Pill Indicator */}
            <div
              className={`absolute top-0.5 bottom-0.5 w-6 rounded-full bg-white dark:bg-surface-700 shadow-sm transition-all duration-300 ${
                theme === 'dark' ? 'left-[32px]' : 'left-0.5'
              }`}
            />
            {/* Sun Icon */}
            <div className={`relative flex-1 flex items-center justify-center text-sm z-10 transition-colors duration-200 ${
              theme === 'light' ? 'text-amber-500 font-bold' : 'text-gray-400 hover:text-gray-300'
            }`}>
              <FiSun className="text-xs" />
            </div>
            {/* Moon Icon */}
            <div className={`relative flex-1 flex items-center justify-center text-sm z-10 transition-colors duration-200 ${
              theme === 'dark' ? 'text-indigo-400 font-bold' : 'text-gray-500 hover:text-gray-600'
            }`}>
              <FiMoon className="text-xs" />
            </div>
          </div>

          {/* Project & Version Switchers Wrapper */}
          <div className="flex items-center gap-0.5 mr-1 select-none">
            {/* Project Selector Dropdown */}
            <div className="relative" ref={projectsDropdownRef}>
              <button
                onClick={() => setShowProjectsDropdown(!showProjectsDropdown)}
                className="flex items-center gap-1 text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-surface-750 px-3 py-1.5 rounded-lg select-none outline-none cursor-pointer border-none bg-transparent active:scale-95 transition-all"
              >
                <span>{title || 'Untitled Screenplay'}</span>
                <FiChevronDown className={`text-xs text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showProjectsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProjectsDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-850 p-1.5 shadow-xl z-[999] backdrop-blur-sm">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-surface-800 mb-1 select-none">
                    Switch Project
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {projects && projects.length > 0 ? (
                      projects.map((p) => {
                        const isCurrent = p.title === title
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setShowProjectsDropdown(false)
                              onProjectSelect && onProjectSelect(p.id)
                            }}
                            className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-all ${
                              isCurrent
                                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-750'
                            }`}
                          >
                            <FiFolder className={isCurrent ? 'text-violet-500' : 'text-gray-400 dark:text-gray-500'} size={14} />
                            <span className="truncate flex-1">{p.title}</span>
                          </button>
                        )
                      })
                    ) : (
                      <div className="px-2 py-3 text-xs text-gray-400 dark:text-gray-500 text-center select-none">
                        No other projects
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Version Selector Dropdown */}
            <div className="relative" ref={versionDropdownRef}>
              <button
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all active:scale-95 select-none outline-none cursor-pointer border-none bg-transparent"
                title="Switch active version"
              >
                <span>v{currentVersion}</span>
                <FiChevronDown className={`text-[9px] transition-transform duration-200 ${showVersionDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showVersionDropdown && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-850 p-1.5 shadow-xl z-[999] backdrop-blur-sm">
                  <div className="px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-surface-800 mb-1 select-none">
                    Switch Version
                  </div>
                  
                  <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-0.5 mb-1.5">
                    {versions && versions.length > 0 ? (
                      versions.map((v) => {
                        const isActive = v.versionNumber === currentVersion
                        return (
                          <button
                            key={v.id}
                            onClick={() => {
                              setShowVersionDropdown(false)
                              onSwitchVersion && onSwitchVersion(v.versionNumber)
                            }}
                            className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-all ${
                              isActive
                                ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-750'
                            }`}
                          >
                            <span className="font-semibold">v{v.versionNumber}</span>
                            <span className="text-[9px] text-gray-400 dark:text-gray-500">
                              {new Date(v.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                            </span>
                          </button>
                        )
                      })
                    ) : (
                      <div className="px-2 py-3 text-xs text-gray-400 dark:text-gray-500 text-center select-none">
                        No versions
                      </div>
                    )}
                  </div>

                  {/* Create New Version option at the bottom */}
                  <div className="pt-1.5 border-t border-gray-100 dark:border-surface-800">
                    <button
                      onClick={() => {
                        setShowVersionDropdown(false)
                        onCreateVersion && onCreateVersion()
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#ee7712] hover:bg-[#d6650b] !text-white py-1.5 text-[11px] font-bold transition-all shadow-sm cursor-pointer border-none"
                    >
                      <FiPlus className="text-xs" />
                      <span>New Version</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Details Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 hover:bg-violet-700 !text-white transition-all font-bold text-xs cursor-pointer shadow-sm ml-1"
              title="View Profile"
            >
              {user?.username ? user.username.charAt(0).toUpperCase() : <FiUser />}
              {/* Active Green Dot */}
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface-850" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-850 p-4 shadow-xl z-[9999]">
                <div className="flex flex-col items-center text-center gap-2 pb-3 border-b border-gray-100 dark:border-surface-700">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary text-white text-lg font-bold">
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white">{user?.username || 'Writer'}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'No email provided'}</p>
                  </div>
                </div>
                <div className="py-3 flex flex-col gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Role:</span>
                    <span className="font-semibold text-gray-800 dark:text-white">{user?.role || 'USER'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(false)
                    logout()
                  }}
                  className="w-full mt-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 py-1.5 text-xs font-semibold transition-all"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Screenplay Format Toolbar */}
      <div className="flex h-12 items-center justify-between px-4 bg-gray-50 dark:bg-surface-800">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Save Status & Time (Toolbar - Row 2) */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 select-none mr-2">
            <div className="relative inline-flex mr-0.5">
              <FiSave className="text-gray-400 dark:text-gray-500 text-sm" />
              {saveStatus === 'saving' ? (
                <span className="absolute -bottom-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse ring-[1px] ring-gray-50 dark:ring-surface-800" />
              ) : saveStatus === 'error' ? (
                <span className="absolute -bottom-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full bg-red-500 ring-[1px] ring-gray-50 dark:ring-surface-800" />
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full bg-emerald-500 ring-[1px] ring-gray-50 dark:ring-surface-800" />
              )}
            </div>
            <span className="font-semibold text-[10px] text-gray-600 dark:text-gray-400 min-w-[90px]">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Failed' : `Saved at ${lastSavedTime}`}
            </span>
          </div>
          
          <div className="hidden md:block w-px h-4 bg-gray-300 dark:bg-surface-600 mx-1" />
 
          {/* Element Type Horizontal Button Group */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto custom-scrollbar pr-2">
            {ELEMENT_TYPES_LIST.map(({ type, label, Icon, activeClasses, iconColor }) => {
              const isActive = focusedBlockType === type
              const isDisabled = focusedBlockType === 'TITLE_PAGE'
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => !isDisabled && onBlockTypeChange(type)}
                  disabled={isDisabled}
                  title={isDisabled ? 'Cannot format elements on Title Page' : label}
                  className={`flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                    isDisabled
                      ? 'bg-gray-100 dark:bg-surface-850 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-surface-800 cursor-not-allowed opacity-50'
                      : isActive
                      ? activeClasses
                      : 'bg-white dark:bg-surface-800 text-gray-650 dark:text-gray-400 border-gray-200 dark:border-surface-700 hover:bg-gray-100 dark:hover:bg-surface-750'
                  }`}
                >
                  <Icon className={`text-sm transition-colors ${isActive && !isDisabled ? '' : isDisabled ? 'text-gray-400 dark:text-gray-600' : iconColor}`} />
                  <span className="hidden xl:inline">{label}</span>
                </button>
              )
            })}



          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selectors moved to settings panel */}

          {/* Action Button Toggles */}
          <div className="flex items-center border-l border-gray-200 dark:border-surface-700 pl-2 gap-1">
            {/* Language / Transliteration Picker moved to left side of panel symbol */}
            <div className="relative mr-1 group hidden md:block">
              <button
                className={`rounded p-2 transition-colors cursor-pointer flex items-center gap-1 active:scale-95 ${
                  translitLang
                    ? 'bg-orange-500/10 text-[#ee7712]'
                    : 'hover:bg-gray-200/60 dark:hover:bg-surface-750 text-gray-500 dark:text-gray-400'
                }`}
                title={translitLang ? `Transliteration: ${INDIAN_LANGUAGES.find(l => l.code === translitLang)?.label || 'On'}` : 'Indian Language Transliteration'}
              >
                <MdTranslate className={`text-[16px] ${!translitLang ? 'text-blue-500 drop-shadow-[0_0_2px_rgba(59,130,246,0.8)]' : ''}`} />
                {translitLang && (
                  <span className="text-[10px] font-bold leading-none">
                    {INDIAN_LANGUAGES.find(l => l.code === translitLang)?.short || ''}
                  </span>
                )}
              </button>

              <div className="absolute left-0 top-full pt-1.5 z-[999] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                <div className="w-52 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-850 p-1.5 shadow-xl backdrop-blur-sm">
                  <div className="px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-surface-800 mb-1 select-none">
                    Transliterate to
                  </div>

                  {/* Off / English option */}
                  <button
                    onClick={() => { onTranslitLangChange(null) }}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-left transition-all ${
                      !translitLang
                        ? 'bg-gray-100 dark:bg-surface-750 text-gray-800 dark:text-white font-semibold'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-800'
                    }`}
                  >
                    <span className="text-base">🔤</span>
                    <span>English (Off)</span>
                    {!translitLang && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-500" />}
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-surface-800" />

                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
                    {INDIAN_LANGUAGES.map((lang) => {
                      const isActive = translitLang === lang.code
                      return (
                        <button
                          key={lang.code}
                          onClick={() => { onTranslitLangChange(lang.code) }}
                          className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-left transition-all ${
                            isActive
                              ? 'bg-orange-500/10 text-[#ee7712] font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-800'
                          }`}
                        >
                          <span className="text-base w-5 text-center">{lang.native.charAt(0)}</span>
                          <div className="flex flex-col flex-1">
                            <span className="font-semibold">{lang.label}</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-none">{lang.native}</span>
                          </div>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#ee7712]" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-px h-4 bg-gray-300 dark:bg-surface-600 mx-1" />

            <div className="relative group">
              <button
                className="rounded p-2 hover:bg-gray-200/60 dark:hover:bg-surface-750 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                title="Find & Replace"
              >
                <FiSearch className="text-sm text-violet-500" />
              </button>
              
              <div className="absolute right-0 top-full pt-1.5 z-[999] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                <FindReplaceModal 
                  blocks={blocks}
                  onReplace={onReplace}
                />
              </div>
            </div>
            <button
              onClick={onToggleAi}
              className="rounded p-2 hover:bg-gray-200/60 dark:hover:bg-surface-750 transition-all active:scale-95 cursor-pointer hidden md:block"
              title="AI Assistant"
            >
              <FiZap className="text-sm text-amber-500" />
            </button>
            {/* Share options */}
            <div className="relative" ref={shareDropdownRef}>
              <button
                onClick={() => setShowShareDropdown(!showShareDropdown)}
                className={`rounded p-2 transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                  showShareDropdown ? 'bg-gray-200/60 dark:bg-surface-750' : 'hover:bg-gray-200/60 dark:hover:bg-surface-750'
                }`}
                title="Share Script"
              >
                <FiShare2 className="text-sm text-emerald-500" />
              </button>
              
              {showShareDropdown && (
                <div className="absolute right-0 top-full pt-1.5 z-[999]">
                  <ShareModal 
                    scriptId={scriptId}
                    scriptTitle={title}
                    isShared={isShared}
                    onToggleShare={onToggleShare}
                  />
                </div>
              )}
            </div>

            <button
              onClick={onImport}
              className="rounded p-2 hover:bg-gray-200/60 dark:hover:bg-surface-750 transition-all active:scale-95 cursor-pointer hidden md:block"
              title="Import file"
            >
              <FiUpload className="text-sm text-pink-500" />
            </button>

            {/* Download Options */}
            <div className="relative" ref={downloadDropdownRef}>
              <button
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                className={`rounded p-2 transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                  showDownloadDropdown ? 'bg-gray-200/60 dark:bg-surface-750' : 'hover:bg-gray-200/60 dark:hover:bg-surface-750'
                }`}
                title="Download Options"
              >
                <FiDownload className="text-sm text-cyan-500" />
              </button>

              {showDownloadDropdown && (
                <div className="absolute right-0 top-full pt-1.5 z-[999]">
                  <div className="w-40 rounded-xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-850 p-1.5 shadow-xl backdrop-blur-sm">
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-surface-800 mb-1 select-none">
                      Download As
                    </div>
                    <button
                      onClick={() => { setShowDownloadDropdown(false); onDownload('pdf'); }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-left transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-750"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-orange-500 text-white shadow-sm">
                        <FaFilePdf className="text-[10px]" />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-white">PDF Document</span>
                    </button>
                    <button
                      onClick={() => { setShowDownloadDropdown(false); onDownload('docx'); }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-left transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-750"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500 text-white shadow-sm">
                        <FaFileWord className="text-[10px]" />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-white">Word Document</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onToggleSidebar}
              className="rounded p-2 hover:bg-gray-200/60 dark:hover:bg-surface-750 transition-all active:scale-95 cursor-pointer hidden md:block"
              title="Toggle Panel"
            >
              <FiSidebar className="text-sm text-blue-500" />
            </button>

            <button
              onClick={onToggleSettings}
              className="rounded p-2 hover:bg-gray-200/60 dark:hover:bg-surface-750 transition-all active:scale-95 cursor-pointer hidden md:block"
              title="Editor Settings"
            >
              <FiSettings className="text-sm text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Sync / Save Button */}
          <button
            onClick={onSave}
            className="hidden md:flex items-center gap-1.5 rounded bg-brand-primary hover:bg-brand-600 !text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-md shadow-brand-primary/10 active:scale-95 ml-2"
          >
            <FiRefreshCw className="text-[11px] !text-white" />
            <span className="!text-white">Sync to Project</span>
          </button>
        </div>
      </div>
    </div>
  )
}
