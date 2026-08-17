'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveAcademyPath } from '@/app/admin/actions/academy'

export default function AcademyEditorClient({ id, initialData }: { id: string, initialData: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    status: initialData?.status || 'draft',
    estimated_weeks: initialData?.estimated_weeks || 4
  })

  const [phases, setPhases] = useState<any[]>(initialData?.phases || [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await saveAcademyPath(id, formData)
      router.push('/admin/academy')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Edit Academy Path</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input 
            required 
            type="text" 
            className="w-full border rounded-lg p-2" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input 
            required 
            type="text" 
            className="w-full border rounded-lg p-2" 
            value={formData.slug} 
            onChange={e => setFormData({...formData, slug: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea 
            className="w-full border rounded-lg p-2" 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select 
            className="w-full border rounded-lg p-2" 
            value={formData.status} 
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estimated Weeks</label>
          <input 
            type="number" 
            className="w-full border rounded-lg p-2" 
            value={formData.estimated_weeks} 
            onChange={e => setFormData({...formData, estimated_weeks: parseInt(e.target.value)})} 
          />
        </div>
        <button disabled={loading} className="bg-amf-teal-600 text-white px-4 py-2 rounded-lg">
          {loading ? 'Saving...' : 'Save Path'}
        </button>
      </form>

      {id !== 'new' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold">Phases & Steps Manager (Simulated Drag-and-Drop)</h2>
          <p className="text-gray-500 text-sm">Organize the curriculum and set Prerequisite constraints.</p>
          
          <div className="space-y-4">
            {phases.length === 0 ? (
              <p className="text-gray-400 italic">No phases yet.</p>
            ) : (
              phases.map((phase, pIdx) => (
                <div key={phase.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 cursor-move">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-gray-700">::: Phase {pIdx + 1}: {phase.title}</h3>
                    <button type="button" className="text-sm text-amf-teal-600 hover:underline">Edit Phase</button>
                  </div>
                  
                  <div className="space-y-2 ml-4">
                    {phase.steps?.map((step: any, sIdx: number) => (
                      <div key={step.id} className="bg-white border rounded p-3 flex justify-between items-center cursor-move">
                        <div>
                          <span className="text-gray-400 mr-2">:::</span>
                          <span className="font-medium">Step {sIdx + 1}: {step.title_override || 'Untitled Step'}</span>
                          <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">{step.step_type}</span>
                        </div>
                        <div className="flex gap-3">
                          <button type="button" className="text-xs text-orange-600 hover:underline">
                            Prerequisites ({step.prerequisites?.length || 0})
                          </button>
                          <button type="button" className="text-xs text-amf-teal-600 hover:underline">Edit</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="text-sm text-amf-teal-600 border border-dashed border-amf-teal-300 rounded px-3 py-1 w-full text-center hover:bg-amf-teal-50">
                      + Add Step
                    </button>
                  </div>
                </div>
              ))
            )}
            <button type="button" className="bg-gray-100 border border-dashed border-gray-300 text-gray-600 px-4 py-2 rounded-lg w-full font-medium hover:bg-gray-200">
              + Add Phase
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
