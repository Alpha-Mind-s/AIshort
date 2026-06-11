import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDrama } from '@/lib/api-client'
import { DramaForm, type DramaFormValues } from '@/components/DramaForm'
import { ArrowLeft } from 'lucide-react'

export default function DramaCreatePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (data: DramaFormValues) => {
    setIsSubmitting(true)
    setError('')
    try {
      const json = await createDrama({
        title: data.title,
        description: data.description,
        cover_url: data.cover_url,
        category_id: data.category_id,
        tags: data.tags,
      })
      navigate(`/dramas/${json.data.id}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create drama')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-1 hover:bg-white/5 rounded transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <h1 className="font-bold text-sm">Create New Drama</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}
        <DramaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Create Drama" />
      </main>
    </div>
  )
}
