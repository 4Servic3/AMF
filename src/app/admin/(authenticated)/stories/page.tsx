import MediaPicker from '@/components/admin/media/MediaPicker'
import { requireAal2 } from '@/lib/auth/dal'

export const metadata = {
  title: 'Stories Editor | AMF Admin',
}

export default async function StoriesEditorPage() {
  await requireAal2()

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amf-plum">Stories Editor</h1>
        <button className="px-4 py-2 bg-amf-teal-300 text-white rounded-md font-medium hover:bg-amf-teal-400 transition-colors">
          Publish Changes
        </button>
      </div>

      <section className="bg-white p-6 rounded-lg border border-amf-border shadow-sm space-y-6">
        <div className="border-b border-amf-border pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-amf-plum">Collections</h2>
            <p className="text-amf-muted mt-1">Manage the collections of stories.</p>
          </div>
          <button className="px-3 py-1.5 border border-amf-border text-amf-plum rounded-md hover:bg-amf-ivory-100 transition-colors text-sm font-medium">
            + New Collection
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-amf-border rounded-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-amf-plum">New Releases</h3>
              <button className="text-sm text-amf-teal-300 hover:text-amf-teal-400 font-medium">Edit</button>
            </div>
            <div>
              <label className="block text-sm font-medium text-amf-plum mb-1">Thumbnail</label>
              <MediaPicker />
            </div>
          </div>
          <div className="p-4 border border-amf-border rounded-md space-y-4 flex items-center justify-center border-dashed bg-amf-ivory-50 cursor-pointer hover:bg-amf-ivory-100 transition-colors">
            <span className="text-amf-muted font-medium">+ Add Collection Placeholder</span>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-lg border border-amf-border shadow-sm space-y-6">
        <div className="border-b border-amf-border pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-amf-plum">Story Items</h2>
            <p className="text-amf-muted mt-1">Manage individual stories inside collections.</p>
          </div>
          <button className="px-3 py-1.5 border border-amf-border text-amf-plum rounded-md hover:bg-amf-ivory-100 transition-colors text-sm font-medium">
            + Add Story
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 border border-amf-border rounded-md space-y-4">
            <h3 className="font-semibold text-amf-plum">Story #1</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-amf-plum mb-1">Media</label>
                <MediaPicker />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amf-plum mb-1">Title</label>
                  <input type="text" className="w-full border border-amf-border rounded-md px-3 py-2 text-amf-plum focus:outline-none focus:border-amf-teal-300" placeholder="Story title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amf-plum mb-1">CTA Target Type</label>
                  <select className="w-full border border-amf-border rounded-md px-3 py-2 text-amf-plum focus:outline-none focus:border-amf-teal-300">
                    <option value="course">Course</option>
                    <option value="case">Case</option>
                    <option value="lesson">Lesson</option>
                    <option value="subscription_checkout">Subscription Checkout</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
