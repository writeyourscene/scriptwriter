import { useState, useEffect } from 'react'
import { FiX, FiCopy, FiCheck, FiShare2, FiGlobe, FiLock } from 'react-icons/fi'
import { FaWhatsapp, FaFilePdf, FaFileWord, FaShareAlt } from 'react-icons/fa'
import { Button } from '../ui/Button'
import { scriptApi } from '../../api/scriptApi'

export default function ShareModal({ scriptId, scriptTitle, isShared, onToggleShare }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(true)
  const [docxLoading, setDocxLoading] = useState(true)
  const [pdfFile, setPdfFile] = useState(null)
  const [docxFile, setDocxFile] = useState(null)
  const [fetched, setFetched] = useState(false)

  // Wait 1 second before pre-fetching to not slow down the initial editor load
  useEffect(() => {
    if (fetched || !scriptId) return
    const timer = setTimeout(() => {
      setFetched(true)
      setPdfLoading(true)
      setDocxLoading(true)
      
      scriptApi.exportPdf(scriptId, 'a4').then(response => {
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })
        setPdfFile(new File([blob], `${scriptTitle || 'screenplay'}.pdf`, { type: 'application/pdf' }))
        setPdfLoading(false)
      }).catch(err => {
        console.error('Pre-fetch PDF failed:', err)
        setPdfLoading(false)
      })

      scriptApi.exportDocx(scriptId, 'a4').then(response => {
        const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
        setDocxFile(new File([blob], `${scriptTitle || 'screenplay'}.docx`, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
        setDocxLoading(false)
      }).catch(err => {
        console.error('Pre-fetch DOCX failed:', err)
        setDocxLoading(false)
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [scriptId, fetched])

  const shareLink = `${window.location.origin}/public/scripts/${scriptId}`
  const encodedText = encodeURIComponent(`Read my screenplay "${scriptTitle || 'Untitled'}": ${shareLink}`)
  const whatsappUrl = `https://wa.me/?text=${encodedText}`

  const canUseNativeShare = typeof navigator !== 'undefined' && !!navigator.share
  
  const downloadFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleToggle = async () => {
    setLoading(true)
    try {
      await onToggleShare(!isShared)
    } catch (err) {
      console.error(err)
      alert('Failed to update share status')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: scriptTitle || 'Screenplay',
          text: `Read my screenplay "${scriptTitle || 'Untitled'}":`,
          url: shareLink
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    }
  }

  const handleExportFile = async (format, share = false) => {
    const file = format === 'pdf' ? pdfFile : docxFile
    if (!file) return

    if (share) {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: scriptTitle || 'Screenplay',
            text: `Here is the exported ${format.toUpperCase()} file.`
          })
        } catch (shareErr) {
          if (shareErr.name !== 'AbortError') {
            console.warn('Native share failed:', shareErr)
            alert('Your device blocked sharing. This happens on some browsers due to security restrictions.')
          }
        }
      } else {
        alert(`Your device or browser does not support native file sharing for ${format.toUpperCase()}s.`)
      }
    } else {
      downloadFile(file, file.name)
    }
  }

  return (
    <div className="w-[340px] rounded-2xl border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-850 backdrop-blur-2xl p-4.5 shadow-2xl shadow-black/10 dark:shadow-black/40 text-gray-800 dark:text-white pointer-events-auto ring-1 ring-black/5 dark:ring-white/10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-400">
            <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center">
              <FiShare2 className="text-base" />
            </div>
            <h3 className="font-bold text-sm text-gray-800 dark:text-white tracking-wide">Share Screenplay</h3>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Public Access Panel */}
          <div className="rounded-xl bg-gray-50/80 dark:bg-surface-900/60 p-3.5 border border-gray-200/80 dark:border-surface-700/60">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {isShared ? (
                  <FiGlobe className="text-emerald-400 text-base shrink-0 animate-pulse" />
                ) : (
                  <FiLock className="text-amber-400 text-base shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold text-xs text-gray-800 dark:text-white">
                    {isShared ? 'Public Access Active' : 'Private Access'}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {isShared ? 'Anyone with link can read' : 'Only you can view or edit'}
                  </p>
                </div>
              </div>
              <Button
                variant={isShared ? 'secondary' : 'primary'}
                onClick={handleToggle}
                disabled={loading}
                className="text-[10px] py-1.5 px-3 font-bold transition-all shrink-0 !text-white"
              >
                {loading ? '...' : isShared ? 'Make Private' : 'Make Public'}
              </Button>
            </div>
          </div>

          {/* Social Share & Links (Visible when shared) */}
          {isShared && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Public Link</label>
                <div className="flex gap-1.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md bg-emerald-600/95 hover:bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white transition-all"
                  >
                    <FaWhatsapp className="text-xs" /> WhatsApp
                  </a>
                  {canUseNativeShare && (
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      className="flex items-center gap-1 rounded-md bg-gray-100 dark:bg-surface-700 hover:bg-gray-200 dark:hover:bg-surface-650 px-2 py-1 text-[10px] font-semibold text-gray-700 dark:text-white transition-all border border-gray-200 dark:border-surface-600"
                    >
                      <FaShareAlt className="text-[10px]" /> Share...
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5">
                <input
                  readOnly
                  value={shareLink}
                  onClick={(e) => e.target.select()}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center justify-center rounded-lg bg-brand-500 px-3 hover:bg-brand-600 transition-colors text-white text-xs font-semibold gap-1 shadow-md shadow-brand-500/10"
                >
                  {copied ? (
                    <>
                      <FiCheck className="text-emerald-300" /> Copied
                    </>
                  ) : (
                    <>
                      <FiCopy /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Export / Share as PDF/DOCX */}
          <div className="space-y-2.5 pt-4 mt-4 border-t border-gray-100 dark:border-white/10">
            <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Export & Share</label>
            <div className="grid grid-cols-2 gap-2">
              {/* PDF Card */}
              <button
                type="button"
                onClick={() => handleExportFile('pdf', true)}
                disabled={pdfLoading}
                className="group relative flex items-center justify-between p-2.5 rounded-xl border border-gray-200/60 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-brand-500/30 transition-all duration-300 overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-2 relative z-10">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500 text-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <FaFilePdf className="text-base" />
                  </div>
                  <span className="font-semibold text-xs text-gray-800 dark:text-white">PDF</span>
                </div>
                <div className="relative z-10 w-7 h-7 flex items-center justify-center rounded-full bg-brand-500 text-white shadow-sm group-hover:bg-brand-600 transition-colors duration-300">
                  {pdfLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FaShareAlt className="text-[11px]" />
                  )}
                </div>
              </button>

              {/* DOCX Card */}
              <button
                type="button"
                onClick={() => handleExportFile('docx', true)}
                disabled={docxLoading}
                className="group relative flex items-center justify-between p-2.5 rounded-xl border border-gray-200/60 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-brand-500/30 transition-all duration-300 overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-2 relative z-10">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500 text-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <FaFileWord className="text-base" />
                  </div>
                  <span className="font-semibold text-xs text-gray-800 dark:text-white">Word</span>
                </div>
                <div className="relative z-10 w-7 h-7 flex items-center justify-center rounded-full bg-brand-500 text-white shadow-sm group-hover:bg-brand-600 transition-colors duration-300">
                  {docxLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FaShareAlt className="text-[11px]" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
    </div>
  )
}
