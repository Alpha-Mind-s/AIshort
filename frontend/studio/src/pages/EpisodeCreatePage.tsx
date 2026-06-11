import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EpisodeForm, type EpisodeFormValues } from '@/components/EpisodeForm'
import { ArrowLeft } from 'lucide-react'

export default function EpisodeCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dramaId = Number(searchParams.get('drama_id') || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [nextEpisodeNo, setNextEpisodeNo] = useState(1)
  const [dramaTitle, setDramaTitle] = useState('')

  useEffect(() => {
    if (!dramaId) return
    // Fetch existing episodes to determine next episode number
    fetch(`http://localhost:8080/api/v1/dramas/${dramaId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.code === 0) {
          setDramaTitle(j.data.title)
          setNextEpisodeNo(j.data.total_episodes + 1)
        }
      })
      .catch(console.error)
  }, [dramaId])

  const handleSubmit = async (data: EpisodeFormValues) => {
    if (!dramaId) return
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch(`http://localhost:8080/api/v1/dramas/${dramaId}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.code !== 0) throw new Error(json.message || 'Failed to add episode')

      navigate(`/dramas/${dramaId}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add episode')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate(`/dramas/${dramaId}`)} className="p-1 hover:bg-white/5 rounded transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h1 className="font-bold text-sm">Add Episode</h1>
            {dramaTitle && <p className="text-xs text-gray-500">{dramaTitle}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}
        <EpisodeForm
          nextEpisodeNo={nextEpisodeNo}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  )
}
