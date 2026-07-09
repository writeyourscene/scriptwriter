import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { scriptApi } from '../api/scriptApi'
import ScreenplayEditor from '../components/editor/ScreenplayEditor'
import { Button } from '../components/ui/Button'
import { FiDownload, FiGlobe, FiChevronLeft, FiFilm } from 'react-icons/fi'

const ZOOM_LEVELS = [50, 75, 90, 100, 110, 125, 150]

export default function PublicScriptPage() {
  const { scriptId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [script, setScript] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [zoom, setZoom] = useState(100)
  const [pageSize, setPageSize] = useState('a4')

  useEffect(() => {
    async function loadScript() {
      try {
        const { data } = await scriptApi.getPublicScript(scriptId)
        setScript(data.data)
        setBlocks(JSON.parse(data.data.content || '[]'))
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.message || 'This screenplay is private or does not exist.')
      } finally {
        setLoading(false)
      }
    }
    loadScript()
  }, [scriptId])

  // Auto-calculate zoom for mobile screens to fit the page exactly
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

  const handleExportPdf = async () => {
    if (!script?.id) return
    try {
      const response = await scriptApi.exportPublicPdf(script.id, pageSize)
      const data = response.data

      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text()
        const parsed = JSON.parse(text)
        alert(`Failed to export PDF: ${parsed.message || 'Unknown error'}`)
        return
      }

      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${script.title || 'screenplay'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Failed to download PDF')
    }
  }

  const handleExportDocx = async () => {
    if (!script?.id) return
    try {
      const response = await scriptApi.exportPublicDocx(script.id, pageSize)
      const data = response.data

      if (data instanceof Blob && data.type === 'application/json') {
        const text = await data.text()
        const parsed = JSON.parse(text)
        alert(`Failed to export DOCX: ${parsed.message || 'Unknown error'}`)
        return
      }

      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${script.title || 'screenplay'}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Failed to download DOCX')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-900 text-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading screenplay...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-900 text-white px-4">
        <div className="text-center max-w-md w-full rounded-xl border border-surface-800 bg-surface-800 p-8 shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
            <FiGlobe className="text-2xl" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Screenplay Unavailable</h3>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <Link to="/login">
            <Button className="w-full">Go to Script-Writer</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-surface-900 text-white">
      {/* Read Only Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-700 bg-surface-800 px-4 text-white">
        {/* Left side: Back Button and Brand Logo */}
        <div className="flex items-center gap-1.5">
          <Link to="/login" className="rounded-lg p-1.5 text-gray-400 hover:bg-surface-700 hover:text-white transition-colors cursor-pointer" title="Back to Login">
            <FiChevronLeft className="text-xl" />
          </Link>
          <Link to="/login" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ee7712] shadow-md shadow-orange-500/10">
              <FiFilm className="text-white text-base" />
            </div>
            <span className="font-semibold text-sm text-white">ScriptWriter</span>
          </Link>
        </div>

        {/* Right side: Page settings dropdowns + Project Title */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5">
            {/* Page Size Dropdown */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value)}
              className="rounded-lg border border-surface-600 bg-surface-700 px-2 py-1 text-xs text-white"
            >
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="script">Script</option>
            </select>

            {/* Zoom Dropdown */}
            <select
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="rounded-lg border border-surface-600 bg-surface-700 px-2 py-1 text-xs text-white"
            >
              {ZOOM_LEVELS.map((z) => (
                <option key={z} value={z}>{z}%</option>
              ))}
            </select>
          </div>

          {/* Project Title Info */}
          <div className="flex flex-col items-end text-right select-none">
            <h1 className="text-sm font-semibold text-white truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[300px]">
              {script?.title}
            </h1>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <FiGlobe className="text-[9px]" /> View Only
            </p>
          </div>
        </div>
      </header>

      {/* Screenplay Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ScreenplayEditor
          blocks={blocks}
          zoom={zoom}
          pageSize={pageSize}
          readOnly={true}
          onChange={() => {}}
          fontFamily={script?.fontFamily || 'Courier Prime'}
        />
      </div>
    </div>
  )
}
