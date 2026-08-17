'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/admin/ui/PageHeader'
import MediaPicker from '@/components/admin/media/MediaPicker'
import { saveCourse } from '@/app/admin/actions/courses'

export default function CourseEditorClient({ id, initialData }: { id: string, initialData: any }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('geral')
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    status: 'draft',
    productType: 'course',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveCourse(id, formData)
      router.push('/admin/courses')
    } catch (error) {
      console.error(error)
      alert('Failed to save course.')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'estrutura', label: 'Estrutura' },
    { id: 'avaliacoes', label: 'Avaliações' },
    { id: 'acesso', label: 'Acesso' }
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <PageHeader 
          title={id === 'new' ? 'New Course' : `Edit: ${formData.title || 'Course'}`} 
          description="Manage course content and structure."
        />
        <div className="flex gap-2">
          <button 
            onClick={() => router.push('/admin/courses')}
            className="px-4 py-2 bg-amf-ivory-200 hover:bg-amf-ivory-300 text-amf-teal-900 rounded-lg transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-amf-teal-600 hover:bg-amf-teal-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            {isSaving ? 'Saving...' : 'Save Course'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-amf-border overflow-hidden">
        <div className="flex border-b border-amf-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'border-b-2 border-amf-teal-600 text-amf-teal-700' 
                  : 'text-amf-muted hover:text-amf-teal-600 hover:bg-amf-ivory-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-amf-teal-900 mb-2">Course Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-amf-border rounded-lg focus:ring-2 focus:ring-amf-teal-500 focus:border-transparent outline-none"
                  placeholder="e.g. Advanced Cardiology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amf-teal-900 mb-2">Description</label>
                <textarea 
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-amf-border rounded-lg focus:ring-2 focus:ring-amf-teal-500 focus:border-transparent outline-none min-h-[120px]"
                  placeholder="Course description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-amf-teal-900 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-amf-border rounded-lg focus:ring-2 focus:ring-amf-teal-500 focus:border-transparent outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amf-teal-900 mb-2">Product Type</label>
                  <select
                    value={formData.productType}
                    onChange={e => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full px-4 py-2 border border-amf-border rounded-lg focus:ring-2 focus:ring-amf-teal-500 focus:border-transparent outline-none"
                  >
                    <option value="course">Course</option>
                    <option value="subscription">Subscription</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-amf-teal-900 mb-2">Cover Image / Banner</label>
                <MediaPicker />
              </div>
            </div>
          )}

          {activeTab === 'estrutura' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-amf-teal-900">Module & Lesson Builder</h3>
              <p className="text-sm text-amf-muted">Create modules and add lessons to build your course structure.</p>
              
              {/* Dummy structure for now */}
              <div className="border border-amf-border rounded-lg p-4 bg-amf-ivory-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-amf-teal-800">Module 1: Introduction</h4>
                  <button className="text-sm text-amf-teal-600 hover:underline">Edit</button>
                </div>
                <div className="space-y-2 pl-4 border-l-2 border-amf-teal-200">
                  <div className="bg-white p-3 border border-amf-border rounded shadow-sm text-sm flex justify-between">
                    <span>Lesson 1: Welcome</span>
                    <button className="text-amf-muted hover:text-amf-teal-600">Edit</button>
                  </div>
                  <button className="text-sm text-amf-teal-600 hover:underline mt-2">+ Add Lesson</button>
                </div>
              </div>
              
              <button className="w-full py-3 border-2 border-dashed border-amf-border text-amf-muted rounded-lg hover:border-amf-teal-400 hover:text-amf-teal-600 transition-colors">
                + Add New Module
              </button>
            </div>
          )}

          {activeTab === 'avaliacoes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-amf-teal-900">Quiz Manager & Global Question Bank</h3>
              <p className="text-sm text-amf-muted">Link global questions to create evaluations for this course.</p>
              
              <div className="border-2 border-dashed border-amf-border rounded-lg p-8 text-center bg-amf-ivory-50">
                <p className="text-amf-teal-800 font-medium mb-2">No evaluations added yet</p>
                <button className="px-4 py-2 bg-amf-teal-600 text-white rounded hover:bg-amf-teal-700 text-sm transition-colors">
                  Select Questions from Global Bank
                </button>
              </div>
            </div>
          )}

          {activeTab === 'acesso' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-amf-teal-900">Access Control</h3>
              <p className="text-sm text-amf-muted">Manage who can access this course and how.</p>
              
              <div>
                <label className="block text-sm font-medium text-amf-teal-900 mb-2">Access State</label>
                <select className="w-full md:w-1/2 px-4 py-2 border border-amf-border rounded-lg focus:ring-2 focus:ring-amf-teal-500 focus:border-transparent outline-none">
                  <option value="unlocked">Unlocked (Free)</option>
                  <option value="active_subscription">Requires Active Subscription</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
