'use client';

import React, { useState } from 'react';
import MediaPicker from '@/components/admin/media/MediaPicker';
import { saveCaseDraft, submitForReview, approveCase, rejectCase, publishCase } from '@/app/admin/actions/cases';

export default function CaseEditorForm({ initialData, caseId }: { initialData?: any, caseId: string }) {
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState(initialData || { title: '', summary: '', difficulty: 1 });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveCaseDraft(caseId === 'new' ? null : caseId, formData);
      alert('Draft saved successfully');
    } catch (err: any) {
      alert(err.message);
    }
    setIsSaving(false);
  };

  const handleAction = async (actionFn: Function, ...args: any[]) => {
    setIsSaving(true);
    try {
      await actionFn(...args);
      alert('Action successful');
    } catch (err: any) {
      alert(err.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amf-ink-900">
          {caseId === 'new' ? 'Create New Case' : `Editing Case: ${formData.title || caseId}`}
        </h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-4 py-2 border border-amf-border text-amf-ink-900 rounded-md hover:bg-amf-ivory-50 transition"
          >
            Save Draft
          </button>
          {caseId !== 'new' && (
            <>
              <button 
                onClick={() => handleAction(submitForReview, caseId)}
                disabled={isSaving}
                className="px-4 py-2 bg-amf-ink-900 text-white rounded-md hover:bg-amf-ink-800 transition"
              >
                Submit for Review
              </button>
              <button 
                onClick={() => handleAction(approveCase, caseId)}
                disabled={isSaving}
                className="px-4 py-2 bg-amf-teal-600 text-white rounded-md hover:bg-amf-teal-700 transition"
              >
                Approve
              </button>
              <button 
                onClick={() => handleAction(publishCase, caseId)}
                disabled={isSaving}
                className="px-4 py-2 bg-amf-plum text-white rounded-md hover:bg-amf-plum/90 transition"
              >
                Publish
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-amf-border">
        {['info', 'chapters', 'questions', 'media'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-amf-teal-600 text-amf-teal-600' 
                : 'border-transparent text-amf-muted hover:text-amf-ink-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-amf-surface border border-amf-border rounded-xl p-6">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amf-ink-900 mb-1">Title</label>
              <input 
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-amf-border rounded-lg focus:ring-amf-teal-500 focus:border-amf-teal-500" 
                placeholder="Case Title" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amf-ink-900 mb-1">Summary</label>
              <textarea 
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-amf-border rounded-lg focus:ring-amf-teal-500 focus:border-amf-teal-500" 
                placeholder="Brief summary..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amf-ink-900 mb-1">Difficulty (1-5)</label>
              <input 
                name="difficulty"
                type="number"
                min="1" max="5"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-amf-border rounded-lg focus:ring-amf-teal-500 focus:border-amf-teal-500" 
              />
            </div>
          </div>
        )}

        {activeTab === 'chapters' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Chapters</h2>
            <p className="text-sm text-amf-muted">Define the narrative flow of the clinical case.</p>
            <div className="border border-amf-border rounded-lg p-4 bg-amf-ivory-50">
              <input className="w-full mb-2 px-3 py-2 border border-amf-border rounded" placeholder="Chapter Title" />
              <div className="h-32 bg-white border border-amf-border rounded flex items-center justify-center text-amf-muted">
                [Rich Text Editor Placeholder]
              </div>
            </div>
            <button className="text-amf-teal-600 font-medium hover:underline">+ Add Chapter</button>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Questions</h2>
            <p className="text-sm text-amf-muted">Add assessment questions for the users.</p>
            <div className="border border-amf-border rounded-lg p-4 bg-amf-ivory-50 space-y-3">
              <input className="w-full px-3 py-2 border border-amf-border rounded" placeholder="Question Prompt" />
              <div className="space-y-2 pl-4 border-l-2 border-amf-border">
                <div className="flex items-center gap-2"><input type="radio" /><input className="flex-1 px-3 py-1 border border-amf-border rounded text-sm" placeholder="Option A" /></div>
                <div className="flex items-center gap-2"><input type="radio" /><input className="flex-1 px-3 py-1 border border-amf-border rounded text-sm" placeholder="Option B" /></div>
              </div>
            </div>
            <button className="text-amf-teal-600 font-medium hover:underline">+ Add Question</button>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Cover Asset</h2>
              <MediaPicker />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Hero Asset</h2>
              <MediaPicker />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
