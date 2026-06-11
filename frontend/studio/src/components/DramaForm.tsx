import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@/lib/zod-resolver'
import { CoverUploader } from './CoverUploader'
import { X } from 'lucide-react'

const schema = z.object({
  title: z.string().min(1, 'Required').max(200),
  description: z.string().min(1, 'Required').max(2000),
  cover_url: z.string().min(1, 'Cover image required'),
  category_id: z.number().min(1),
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published', 'reviewing', 'archived']),
})

export type DramaFormValues = z.infer<typeof schema>

const CATEGORIES = [
  { id: 1, name: 'Romance' },
  { id: 2, name: 'Action' },
  { id: 3, name: 'Comedy' },
  { id: 4, name: 'Thriller' },
  { id: 5, name: 'Fantasy' },
]

export function DramaForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save',
}: {
  defaultValues?: Partial<DramaFormValues>
  onSubmit: (data: DramaFormValues) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<DramaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', description: '', cover_url: '', category_id: 1, tags: [], status: 'draft',
      ...defaultValues,
    },
  })

  const tags = watch('tags')
  const coverUrl = watch('cover_url')
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setValue('tags', [...tags, t])
    setTagInput('')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
        <CoverUploader value={coverUrl || undefined} onChange={(url) => setValue('cover_url', url)} />
        {errors.cover_url && <p className="text-xs text-red-400 mt-1">{errors.cover_url.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
        <input {...register('title')} placeholder="Drama title" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
        {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea {...register('description')} rows={3} placeholder="Short description" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-vertical" />
        {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
        <select {...register('category_id', { valueAsNumber: true })} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
        <div className="flex gap-2">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} placeholder="Add tag..." className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
          <button type="button" onClick={addTag} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors">Add</button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
                {tag}
                <button type="button" onClick={() => setValue('tags', tags.filter((t) => t !== tag))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
        <select {...register('status')} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500">
          <option value="draft">Draft</option>
          <option value="reviewing">Under Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-50">
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
