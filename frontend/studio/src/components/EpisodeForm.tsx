import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@/lib/zod-resolver'
import { VideoUploader } from './VideoUploader'
import { X, Plus } from 'lucide-react'

const schema = z.object({
  episode_no: z.number().min(1, 'Required'),
  title: z.string().min(1, 'Required').max(200),
  duration: z.number().min(1, 'Required'),
  video_url: z.string().min(1, 'Video required'),
  subtitles: z.array(z.object({ language: z.string().min(1), url: z.string().min(1) })),
})

export type EpisodeFormValues = z.infer<typeof schema>

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
]

export function EpisodeForm({
  defaultValues,
  nextEpisodeNo,
  onSubmit,
  onUploadId,
  isSubmitting = false,
}: {
  defaultValues?: Partial<EpisodeFormValues>
  nextEpisodeNo: number
  onSubmit: (data: EpisodeFormValues) => Promise<void>
  onUploadId?: (id: string) => void
  isSubmitting?: boolean
}) {
  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<EpisodeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      episode_no: nextEpisodeNo, title: '', duration: 120, video_url: '', subtitles: [],
      ...defaultValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'subtitles' })
  const videoUrl = watch('video_url')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Episode #</label>
          <input type="number" {...register('episode_no', { valueAsNumber: true })} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
          {errors.episode_no && <p className="text-xs text-red-400 mt-1">{errors.episode_no.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Duration (sec)</label>
          <input type="number" {...register('duration', { valueAsNumber: true })} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
          {errors.duration && <p className="text-xs text-red-400 mt-1">{errors.duration.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Episode Title</label>
        <input {...register('title')} placeholder="e.g. The Beginning" className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500" />
        {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Video File</label>
        <VideoUploader value={videoUrl || undefined} onChange={(url, duration, uploadId) => { setValue('video_url', url); if (duration) setValue('duration', duration); onUploadId?.(uploadId) }} />
        {errors.video_url && <p className="text-xs text-red-400 mt-1">{errors.video_url.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Subtitles</label>
          <button type="button" onClick={() => append({ language: 'en', url: '' })} className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <select {...register(`subtitles.${index}.language`)} className="w-28 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <input {...register(`subtitles.${index}.url`)} placeholder="https://...subtitles.vtt" className="flex-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30" />
              <button type="button" onClick={() => remove(index)} className="p-1 hover:bg-white/5 rounded"><X className="h-3 w-3 text-gray-400" /></button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-50">
        {isSubmitting ? 'Saving...' : 'Add Episode'}
      </button>
    </form>
  )
}
