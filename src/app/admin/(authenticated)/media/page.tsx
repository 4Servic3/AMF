import { requireAal2, requirePermission } from '@/lib/auth/dal'
import MediaUploader from '@/components/admin/media/MediaUploader'
import MediaPicker from '@/components/admin/media/MediaPicker'

export default async function MediaPage() {
  await requireAal2()
  await requirePermission('media.manage')

  return (
    <div className="p-6 md:p-8 space-y-8 bg-amf-creme min-h-full">
      <header>
        <h1 className="text-2xl font-editorial text-amf-plum mb-2">Media Library</h1>
        <p className="text-amf-muted text-sm">Manage all images, videos, and documents used across the app.</p>
      </header>
      
      <section className="bg-amf-surface p-6 rounded-xl border border-amf-border">
        <h2 className="text-lg font-semibold text-amf-plum mb-4">Upload New Media</h2>
        <MediaUploader />
      </section>
      
      <section className="bg-amf-surface p-6 rounded-xl border border-amf-border">
        <h2 className="text-lg font-semibold text-amf-plum mb-4">Media Library</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="aspect-square bg-amf-ivory-100 rounded-lg flex items-center justify-center border border-amf-border text-amf-teal-400">
              Placeholder
            </div>
          ))}
        </div>
      </section>

      <section className="bg-amf-surface p-6 rounded-xl border border-amf-border">
         <h2 className="text-lg font-semibold text-amf-plum mb-4">Media Picker Component Demo</h2>
         <MediaPicker />
      </section>
    </div>
  )
}
