import { Pencil, Trash2, GripVertical } from 'lucide-react'

export interface EpisodeItem {
  id: number
  episode_no: number
  title: string
  duration: number
  status: string
  languages: number
}

export function EpisodeListEditor({
  episodes,
  onDelete,
  isDeleting,
}: {
  episodes: EpisodeItem[]
  onDelete: (id: number) => void
  isDeleting?: number | null
}) {
  if (episodes.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-12">No episodes yet. Add your first one!</p>
  }

  const sorted = [...episodes].sort((a, b) => a.episode_no - b.episode_no)

  return (
    <div className="space-y-2">
      {sorted.map((ep) => (
        <div key={ep.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 group hover:border-purple-500/30 transition-colors">
          <GripVertical className="h-4 w-4 text-gray-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">EP {ep.episode_no}</span>
              <h4 className="text-sm font-medium truncate">{ep.title}</h4>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>{Math.floor(ep.duration / 60)}:{(ep.duration % 60).toString().padStart(2, '0')}</span>
              <span className={ep.status === 'ready' ? 'text-green-400' : ep.status === 'processing' ? 'text-yellow-400' : 'text-red-400'}>
                {ep.status}
              </span>
              <span>{ep.languages} langs</span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button type="button" onClick={() => onDelete(ep.id)} disabled={isDeleting === ep.id} className="p-1.5 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
