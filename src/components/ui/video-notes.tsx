'use client';

import React, { useState, useEffect } from 'react';
import { saveNote, getNote, type UserNote } from '@/lib/services/notes';

export function VideoNotes({ userId, lessonId }: { userId: string, lessonId: string }) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [initialLoad, setInitialLoad] = useState(true);

  // Load initial note
  useEffect(() => {
    async function loadNote() {
      const data = await getNote(userId, lessonId);
      if (data) {
        setNote(data.content);
      }
      setInitialLoad(false);
    }
    loadNote();
  }, [userId, lessonId]);

  // Debounced save
  useEffect(() => {
    if (initialLoad) return;
    
    setStatus('saving');
    
    const timeout = setTimeout(async () => {
      await saveNote(userId, lessonId, note);
      setStatus('saved');
      
      // Return to idle after a few seconds
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [note, userId, lessonId, initialLoad]);

  return (
    <div className="flex flex-col h-full bg-white border border-(--color-amf-border) rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-(--color-amf-border) bg-gray-50/50">
        <h3 className="font-bold text-(--color-amf-plum) flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Minhas Anotações
        </h3>
        <div className="text-xs font-medium text-(--color-amf-muted)">
          {status === 'saving' && <span className="text-(--color-amf-teal)">Salvando...</span>}
          {status === 'saved' && <span className="text-(--color-amf-teal)">Salvo</span>}
          {status === 'idle' && <span>Apenas você pode ver isso</span>}
        </div>
      </div>
      
      <div className="flex-1 p-0">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Faça anotações sobre a aula aqui. O salvamento é automático..."
          className="w-full h-full min-h-[300px] p-4 resize-none border-none outline-none text-sm text-(--color-amf-foreground)"
        ></textarea>
      </div>
    </div>
  );
}
