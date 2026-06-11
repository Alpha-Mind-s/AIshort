import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'

export function CoverUploader({
  value,
  onChange,
}: {
  value?: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [error, setError] = useState('')

  const handleFile = useCallback((file: File) => {
    setError('')
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setError('JPG, PNG, or WebP only'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Max 5 MB'); return }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    onChange(`https://picsum.photos/seed/${Date.now()}/400/600`)
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  if (preview) {
    return (
      <div className="relative inline-block">
        <div className="w-36 h-48 rounded-lg overflow-hidden border border-white/10">
          <img src={preview} alt="Cover" className="w-full h-full object-cover" />
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
        className="w-36 h-48 rounded-lg border-2 border-dashed border-white/10 hover:border-purple-500/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
      >
        <ImageIcon className="h-6 w-6 text-gray-500" />
        <p className="text-[10px] text-gray-500 text-center px-2">JPG, PNG, WebP<br />max 5 MB</p>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}
