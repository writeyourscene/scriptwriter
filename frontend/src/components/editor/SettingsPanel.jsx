import { useState } from 'react'
import { FiX, FiType, FiMaximize2, FiLayout, FiSliders, FiHelpCircle } from 'react-icons/fi'
import { ZOOM_LEVELS } from '../../constants/screenplay'

export default function SettingsPanel({
  zoom,
  onZoomChange,
  pageSize,
  onPageSizeChange,
  fontFamily,
  onFontFamilyChange,
  autoCaps,
  onAutoCapsChange,
  watermarkEnabled,
  onWatermarkEnabledChange,
  watermarkText,
  onWatermarkTextChange,
  watermarkOpacity,
  onWatermarkOpacityChange,
  watermarkSize,
  onWatermarkSizeChange,
  onClose,
}) {
  const [showFontDropdown, setShowFontDropdown] = useState(false)

  const FONT_GROUPS = [
    {
      label: 'Standard Courier fonts',
      fonts: [
        { value: 'Courier Prime', label: 'Courier Prime (Industry Standard)' },
        { value: 'Courier New', label: 'Courier New (Classic Typewriter)' },
        { value: 'Courier', label: 'Courier (System Default)' },
      ]
    },
    {
      label: 'Creative fonts (Screenplay look)',
      fonts: [
        { value: 'IM Fell English', label: 'IM Fell English (Vintage/Drama)' },
        { value: 'Ultra', label: 'Ultra (Action/Thriller)' },
        { value: 'Bungee', label: 'Bungee (Retro Comic/Animation)' },
      ]
    }
  ]

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-surface-850 select-none">
      {/* Panel Header */}
      <div className="flex h-12 items-center justify-between border-b border-gray-200 dark:border-surface-700 px-4">
        <div className="flex items-center gap-2">
          <FiSliders className="text-[#ee7712] text-base" />
          <span className="text-sm font-bold text-gray-800 dark:text-white">Editor Settings</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-surface-750 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
          title="Close Settings"
        >
          <FiX className="text-base" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Page Zoom Option */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <FiMaximize2 className="text-sm text-blue-500" />
            <span>Page Zoom</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {ZOOM_LEVELS.map((z) => {
              const isSelected = zoom === z
              return (
                <button
                  key={z}
                  onClick={() => onZoomChange(z)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-primary/10 text-brand-primary border-brand-primary font-bold'
                      : 'border-gray-200 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {z}%
                </button>
              )
            })}
          </div>
        </div>

        {/* Font Family Option */}
        <div className="space-y-2.5 relative">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <FiType className="text-sm text-violet-500" />
            <span>Font Family</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFontDropdown(!showFontDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-surface-600 transition-all outline-none cursor-pointer"
            >
              <span>
                {FONT_GROUPS.flatMap(g => g.fonts).find(f => f.value === fontFamily)?.label || fontFamily}
              </span>
              <svg
                className={`w-3 h-3 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${showFontDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFontDropdown && (
              <>
                {/* Click-away backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setShowFontDropdown(false)} />
                
                {/* Dropdown Options List */}
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-1.5 shadow-xl z-50 custom-scrollbar">
                  {FONT_GROUPS.map((group) => (
                    <div key={group.label} className="mb-2 last:mb-0">
                      <div className="px-2.5 py-1 text-[9px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-wider select-none">
                        {group.label}
                      </div>
                      <div className="space-y-0.5 mt-0.5">
                        {group.fonts.map((f) => {
                          const isSelected = f.value === fontFamily
                          return (
                            <button
                              key={f.value}
                              onClick={() => {
                                onFontFamilyChange(f.value)
                                setShowFontDropdown(false)
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-all cursor-pointer font-medium ${
                                isSelected
                                  ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                                  : 'text-gray-700 dark:text-gray-350 hover:bg-gray-100 dark:hover:bg-surface-750'
                              }`}
                            >
                              {f.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page Size Option */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <FiLayout className="text-sm text-emerald-500" />
            <span>Page Layout / Size</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'Letter' },
              { value: 'script', label: 'Script' },
            ].map((p) => {
              const isSelected = pageSize === p.value
              return (
                <button
                  key={p.value}
                  onClick={() => onPageSizeChange(p.value)}
                  className={`py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-primary/10 text-brand-primary border-brand-primary font-bold'
                      : 'border-gray-200 dark:border-surface-700 hover:bg-gray-50 dark:hover:bg-surface-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Auto Capitalization Option */}
        <div className="flex items-center justify-between py-4 border-t border-b border-gray-100 dark:border-surface-800">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Auto-Caps Letters</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">Capitalize all letters while typing</span>
          </div>
          <button
            onClick={() => onAutoCapsChange(!autoCaps)}
            className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              autoCaps ? 'bg-[#ee7712]' : 'bg-gray-200 dark:bg-surface-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                autoCaps ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Watermark Options */}
        <div className="space-y-3.5 border-t border-gray-100 dark:border-surface-800 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-gray-750 dark:text-gray-300">Custom Watermark</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">Overlay text diagonally on pages</span>
            </div>
            <button
              onClick={() => onWatermarkEnabledChange(!watermarkEnabled)}
              className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                watermarkEnabled ? 'bg-[#ee7712]' : 'bg-gray-200 dark:bg-surface-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  watermarkEnabled ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {watermarkEnabled && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-surface-800/50 rounded-xl border border-gray-150 dark:border-surface-800">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider select-none">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => onWatermarkTextChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-surface-750 bg-white dark:bg-surface-800 text-gray-755 dark:text-gray-300 focus:border-brand-primary outline-none transition-all"
                  placeholder="e.g. CONFIDENTIAL"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider select-none">
                  <span>Opacity</span>
                  <span>{Math.round(watermarkOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.30"
                  step="0.01"
                  value={watermarkOpacity}
                  onChange={(e) => onWatermarkOpacityChange(parseFloat(e.target.value))}
                  className="w-full accent-[#ee7712] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider select-none">
                  <span>Size</span>
                  <span>{watermarkSize} pt</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="120"
                  step="1"
                  value={watermarkSize}
                  onChange={(e) => onWatermarkSizeChange(parseInt(e.target.value))}
                  className="w-full accent-[#ee7712] cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
