import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DramaForm, type DramaFormValues } from '@/components/DramaForm'
import { EpisodeListEditor, type EpisodeItem } from '@/components/EpisodeListEditor'
import { ArrowLeft, Plus } from 'lucide-react'

export default function DramaEditPage() {
  const { id } = useParams<{ id: string }>()
  const dramaId = Number(id)
  const navigate = useNavigate()
  const [drama, setDrama] = useState<DramaFormValues | null>(null)
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingEp, setDeletingEp] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      const [dramaRes, epRes] = await Promise.all([
        fetch(`http://localhost:8080/api/v1/dramas/${dramaId}`),
        fetch(`http://localhost:8080/api/v1/dramas/${dramaId}/episodes`),
      ])
      const dramaJson = await dramaRes.json()
      const epJson = await epRes.json()
      if (dramaJson.code === 0) {
        const d = dramaJson.data
        setDrama({
          title: d.title,
          description: d.description,
          cover_url: d.cover_url,
          category_id: d.category_id,
          tags: d.tags,
          status: d.status,
        })
      }
      if (epJson.code === 0) {
        setEpisodes(
          epJson.data.map((e: { id: number; episode_no: number; title: string; duration: number; status: string; localizations: unknown[] }) => ({
            id: e.id,
            episode_no: e.episode_no,
            title: e.title,
            duration: e.duration,
            status: e.status,
            languages: e.localizations.length,
          }))
        )
      }
    } catch (e) {
      console.error('Failed to fetch drama', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [dramaId])

  const handleUpdateDrama = async (data: DramaFormValues) => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`http://localhost:8080/api/v1/dramas/${dramaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.code !== 0) throw new Error(json.message || 'Failed to update')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update drama')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEpisode = async (epId: number) => {
    if (!confirm('Delete this episode?')) return
    setDeletingEp(epId)
    try {
      await fetch(`http://localhost:8080/api/v1/episodes/${epId}`, { method: 'DELETE' })
      setEpisodes((prev) => prev.filter((e) => e.id !== epId))
      fetchData() // Refresh episode count
    } catch (e) {
      console.error('Failed to delete episode', e)
    } finally {
      setDeletingEp(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!drama) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Drama not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-1 hover:bg-white/5 rounded transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </button>
            <h1 className="font-bold text-sm">Edit Drama</h1>
          </div>
          <button
            onClick={() => navigate(`/episodes/new?drama_id=${dramaId}`)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Episode
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Drama metadata */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Drama Details</h2>
          <DramaForm
            defaultValues={drama}
            onSubmit={handleUpdateDrama}
            isSubmitting={saving}
            submitLabel="Update Drama"
          />
        </section>

        {/* Episodes */}
        <section className="border-t border-white/10 pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-300">Episodes</h2>
              <p className="text-xs text-gray-500 mt-0.5">{episodes.length} total</p>
            </div>
            <button
              onClick={() => navigate(`/episodes/new?drama_id=${dramaId}`)}
              className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Episode
            </button>
          </div>
          <EpisodeListEditor
            episodes={episodes}
            onDelete={handleDeleteEpisode}
            isDeleting={deletingEp}
          />
        </section>
      </main>
    </div>
  )
}
