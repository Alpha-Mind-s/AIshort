import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api-client'

export function CoverUploader({
  value,
  onChange,
}: {
  value?: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = useCallback(async (file: File) => {
    setError('')
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setError('JPG, PNG, or WebP only'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Max 5 MB'); return }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      // 1. Get presigned upload URL from backend
      const uploadRes = await apiFetch<{ upload_id: string; upload_url: string; download_url: string }>(
        '/videos/upload-url',
        {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            file_size: file.size,
            content_type: file.type,
          }),
        }
      )

      // 2. Upload file directly to MinIO via presigned URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadRes.data.upload_url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.send(file)
      })

      // 3. Return the download URL
      onChange(uploadRes.data.download_url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      // Keep preview even on error so user can see what they picked
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (preview) {
    return (
      <div className="relative inline-block">
        <div className="w-36 h-48 rounded-lg overflow-hidden border border-white/15">
          <img src={preview} alt="Cover" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
            </div>
          )}
        </div>
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button type="button" onClick={() => inputRef.current?.click()} className="h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center"><Upload className="h-3 w-3" /></button>
          <button type="button" onClick={() => { setPreview(null); onChange('') }} className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="h-3 w-3" /></button>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-36 h-48 rounded-lg border-2 border-dashed border-white/15 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
      >
        <ImageIcon className="h-6 w-6 text-gray-400" />
        <p className="text-[10px] text-gray-400 text-center px-2">JPG, PNG, WebP<br />max 5 MB</p>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}
