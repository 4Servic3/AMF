'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/admin/ui/PageHeader'
import MediaPicker from '@/components/admin/media/MediaPicker'
import LessonVideoManager from '@/components/admin/courses/LessonVideoManager'
import { saveCourse } from '@/app/admin/actions/courses'

export default function CourseEditorClient({ id, initialData }: { id: string, initialData: any }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('geral')
  const [activeLessonVideoId, setActiveLessonVideoId] = useState<string | null>(null)
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
    { id: 'geral', label: 'Informações gerais' },
    { id: 'estrutura', label: 'Estrutura' },
    { id: 'conteudo', label: 'Conteúdo e mídias' },
    { id: 'acesso', label: 'Acesso' },
    { id: 'certificado', label: 'Certificado' },
    { id: 'publicacao', label: 'Publicação' }
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-amf-teal-900">Estrutura de Módulos e Aulas</h3>
                  <p className="text-sm text-amf-muted">Gerencie os módulos, aulas e vídeos do Mux vinculados ao curso.</p>
                </div>
              </div>

              {initialData?.course_modules && initialData.course_modules.length > 0 ? (
                initialData.course_modules.map((mod: any, modIdx: number) => (
                  <div key={mod.id || modIdx} className="border border-amf-border rounded-xl p-5 bg-amf-ivory-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-amf-teal-900 text-sm">
                        Módulo {modIdx + 1}: {mod.title || 'Sem título'}
                      </h4>
                    </div>
                    <div className="space-y-3 pl-3 border-l-2 border-amf-teal-200">
                      {mod.lessons && mod.lessons.length > 0 ? (
                        mod.lessons.map((lesson: any, lIdx: number) => (
                          <div key={lesson.id || lIdx} className="space-y-3">
                            <div className="bg-white p-4 border border-amf-border rounded-lg shadow-sm text-sm flex items-center justify-between">
                              <div>
                                <span className="font-medium text-amf-teal-950">
                                  Aula {lIdx + 1}: {lesson.title}
                                </span>
                                <span className="text-xs text-amf-muted ml-2">
                                  ({lesson.type || 'video'} • {lesson.status || 'draft'})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveLessonVideoId(activeLessonVideoId === lesson.id ? null : lesson.id)
                                }
                                className="px-3 py-1.5 text-xs font-medium bg-amf-teal-50 hover:bg-amf-teal-100 text-amf-teal-800 rounded-lg transition-colors"
                              >
                                {activeLessonVideoId === lesson.id ? 'Fechar Vídeo' : 'Gerenciar Vídeo Mux'}
                              </button>
                            </div>

                            {activeLessonVideoId === lesson.id && (
                              <div className="pl-2">
                                <LessonVideoManager
                                  lessonId={lesson.id}
                                  lessonTitle={lesson.title}
                                  initialVideo={lesson.video_assets}
                                />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-amf-muted italic">Nenhuma aula cadastrada neste módulo.</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                /* Exemplo para cursos recém-criados ou novos */
                <div className="border border-amf-border rounded-xl p-5 bg-amf-ivory-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-amf-teal-900 text-sm">Módulo 1: Introdução Clínica</h4>
                  </div>
                  <div className="space-y-3 pl-3 border-l-2 border-amf-teal-200">
                    <div className="bg-white p-4 border border-amf-border rounded-lg shadow-sm text-sm flex items-center justify-between">
                      <div>
                        <span className="font-medium text-amf-teal-950">Aula 1: Boas-vindas e Contextualização</span>
                        <span className="text-xs text-amf-muted ml-2">(video • published)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveLessonVideoId(activeLessonVideoId === 'sample-lesson-1' ? null : 'sample-lesson-1')
                        }
                        className="px-3 py-1.5 text-xs font-medium bg-amf-teal-50 hover:bg-amf-teal-100 text-amf-teal-800 rounded-lg transition-colors"
                      >
                        {activeLessonVideoId === 'sample-lesson-1' ? 'Fechar Vídeo' : 'Gerenciar Vídeo Mux'}
                      </button>
                    </div>

                    {activeLessonVideoId === 'sample-lesson-1' && (
                      <div className="pl-2">
                        <LessonVideoManager
                          lessonId="sample-lesson-1"
                          lessonTitle="Aula 1: Boas-vindas e Contextualização"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
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
