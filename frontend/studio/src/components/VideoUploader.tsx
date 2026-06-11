import { useState, useRef, useCallback } from 'react'
import { Upload, FileVideo, X, CheckCircle, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_SIZE = 2 * 1024 * 1024 * 1024 // 2 GB

type Phase = 'idle' | 'uploading' | 'done' | 'error'

export function VideoUploader({
  value,
  onChange,
}: {
  value?: string
  onChange: (videoUrl: string, duration: number, uploadId: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>(value ? 'done' : 'idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [error, setError] = useState('')

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only MP4, MOV, WebM are supported.'
    if (file.size > MAX_SIZE) return 'File too large (max 2 GB).'
    return null
  }

  const upload = useCallback(async (file: File) => {
    const err = validate(file)
    if (err) { setError(err); setPhase('error'); return }

    setFileName(file.name)
    setFileSize(file.size)
    setError('')
    setPhase('uploading')
    setProgress(0)

    try {
      // 1. Get presigned upload URL
      const uploadRes = await apiFetch<{ upload_id: string; upload_url: string; download_url: string }>('/videos/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, file_size: file.size, content_type: file.type }),
      })

      // 2. Real XHR upload to MinIO with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadRes.data.upload_url)
        xhr.setRequestHeader('Content-Type', file.type)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed: HTTP ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
      })

      // 3. Return video URL and upload ID (CompleteUpload handled by parent after episode creation)
      onChange(uploadRes.data.download_url, 0, uploadRes.data.upload_id)
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      setPhase('error')
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }, [upload])

  if (phase === 'done' && value) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName || 'video.mp4'}</p>
            <p className="text-xs text-gray-400">Upload complete</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="text-xs text-purple-400 hover:text-purple-300">Change</button>
            <button type="button" onClick={() => { setPhase('idle'); onChange('', 0) }} className="p-1 hover:bg-white/5 rounded"><X className="h-4 w-4 text-gray-400" /></button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
      </div>
    )
  }

  if (phase === 'uploading') {
    return (
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <FileVideo className="h-5 w-5 text-purple-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-gray-400">{(fileSize / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <span className="text-sm font-bold text-purple-400">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-400 text-center">Uploading...</p>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-3">
        <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-red-400 shrink-0" /><p className="text-sm text-red-400">{error}</p></div>
        <button type="button" onClick={() => { setPhase('idle'); setError('') }} className="text-xs text-purple-400 hover:text-purple-300">Try again</button>
      </div>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="rounded-xl border-2 border-dashed border-white/15 hover:border-purple-500/50 p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
    >
      <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
        <Upload className="h-6 w-6 text-purple-400" />
      </div>
      <p className="text-sm font-medium">Drag & drop or click to browse</p>
      <p className="text-xs text-gray-400">MP4, MOV, WebM — up to 2 GB</p>
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </div>
  )
}
