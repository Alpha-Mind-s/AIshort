import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudioAuth } from '@/stores/auth-store'
import { getDramaList, deleteDrama, type DramaItem } from '@/lib/api-client'
import { Plus, Film, Search, LogOut, Edit, Trash2, Users, TrendingUp, DollarSign, Play } from 'lucide-react'

const STATS = [
  { key: 'total_users', value: '12,847', icon: Users, change: '+12%', color: 'text-blue-400' },
  { key: 'total_dramas', value: '156', icon: Play, change: '+8%', color: 'text-purple-400' },
  { key: 'daily_views', value: '48.2K', icon: TrendingUp, change: '+23%', color: 'text-green-400' },
  { key: 'revenue', value: '$24,892', icon: DollarSign, change: '+18%', color: 'text-yellow-400' },
]

export default function DashboardPage() {
  const { user, clearAuth } = useStudioAuth()
  const navigate = useNavigate()
  const [dramas, setDramas] = useState<DramaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchDramas = async () => {
    try {
      const json = await getDramaList({ page_size: 100 })
      setDramas(json.data)
    } catch (e) {
      console.error('Failed to fetch dramas', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDramas() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this drama and all its episodes?')) return
    try {
      await deleteDrama(id)
      setDramas((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      console.error('Failed to delete drama', e)
    }
  }

  const filtered = dramas.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'published': return 'bg-green-500/20 text-green-400'
      case 'draft': return 'bg-yellow-500/20 text-yellow-400'
      case 'reviewing': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-gray-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="h-5 w-5 text-purple-400" />
            <span className="font-bold text-sm">AIshort Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{user?.email}</span>
            <button onClick={clearAuth} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <LogOut className="h-3 w-3" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{stat.key.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">{stat.value}</span>
                  <span className="text-xs text-green-400 font-medium">{stat.change}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Dramas</h1>
            <p className="text-sm text-gray-500 mt-1">{dramas.length} total</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-56 rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 placeholder-gray-600"
              />
            </div>
            <button
              onClick={() => navigate('/dramas/new')}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Drama
            </button>
          </div>
        </div>

        {/* Recent activity + system status */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Activity</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <p>• New user registered: user_12k</p>
              <p>• Drama "Love in the Rain" hit 100K views</p>
              <p>• Payment received: $79.99 (yearly plan)</p>
              <p>• Content flag reviewed: 3 items</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">System Status</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'API', status: 'Operational', color: 'text-green-400' },
                { label: 'CDN', status: 'Operational', color: 'text-green-400' },
                { label: 'AI Pipeline', status: 'Degraded', color: 'text-yellow-400' },
                { label: 'Storage', status: '98% available', color: 'text-green-400' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-medium ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drama grid */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[200px] rounded-xl border border-white/10 bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Film className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No dramas found</p>
            <button onClick={() => navigate('/dramas/new')} className="text-sm text-purple-400 hover:text-purple-300 mt-2 inline-block">
              Create your first drama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((drama) => (
              <div
                key={drama.id}
                className="group rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-purple-500/30 transition-all cursor-pointer"
                onClick={() => navigate(`/dramas/${drama.id}`)}
              >
                <div className="aspect-[2/1] bg-white/5 relative overflow-hidden">
                  <img
                    src={drama.cover_url}
                    alt={drama.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(drama.status)}`}>
                    {drama.status}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm truncate">{drama.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{drama.total_episodes} episodes</span>
                  </div>
                  {drama.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {drama.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-400">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dramas/${drama.id}`) }}
                      className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-xs hover:bg-white/20 transition-colors"
                    >
                      <Edit className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(drama.id) }}
                      className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
