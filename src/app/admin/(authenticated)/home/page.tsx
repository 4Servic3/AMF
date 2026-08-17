import MediaPicker from '@/components/admin/media/MediaPicker'
import { requireAal2 } from '@/lib/auth/dal'

export const metadata = {
  title: 'Home Editor | AMF Admin',
}

export default async function HomeEditorPage() {
  await requireAal2()

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-amf-plum">Home Editor</h1>
        <button className="px-4 py-2 bg-amf-teal-300 text-white rounded-md font-medium hover:bg-amf-teal-400 transition-colors">
          Publish Changes
        </button>
      </div>

      <section className="bg-white p-6 rounded-lg border border-amf-border shadow-sm space-y-6">
        <div className="border-b border-amf-border pb-4">
          <h2 className="text-2xl font-semibold text-amf-plum">Main Banner</h2>
          <p className="text-amf-muted mt-1">Configure the main banner shown at the top of the home page.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amf-plum mb-1">Banner Image</label>
            <MediaPicker />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amf-plum mb-1">Title</label>
            <input type="text" className="w-full border border-amf-border rounded-md px-3 py-2 text-amf-plum focus:outline-none focus:border-amf-teal-300" placeholder="Enter banner title" />
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
      </section>

      <section className="bg-white p-6 rounded-lg border border-amf-border shadow-sm space-y-6">
        <div className="border-b border-amf-border pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-amf-plum">Sections</h2>
            <p className="text-amf-muted mt-1">Manage the sortable lists of sections displayed on the home page.</p>
          </div>
          <button className="px-3 py-1.5 border border-amf-border text-amf-plum rounded-md hover:bg-amf-ivory-100 transition-colors text-sm font-medium">
            + Add Section
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-4 border border-amf-border rounded-md flex items-center justify-between bg-amf-ivory-50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center text-amf-muted cursor-grab">⋮⋮</div>
              <span className="font-medium text-amf-plum">Featured Courses</span>
            </div>
            <button className="text-sm text-amf-teal-300 hover:text-amf-teal-400 font-medium">Edit</button>
          </div>
          <div className="p-4 border border-amf-border rounded-md flex items-center justify-between bg-amf-ivory-50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center text-amf-muted cursor-grab">⋮⋮</div>
              <span className="font-medium text-amf-plum">Latest Lessons</span>
            </div>
            <button className="text-sm text-amf-teal-300 hover:text-amf-teal-400 font-medium">Edit</button>
          </div>
        </div>
      </section>
    </div>
  )
}
