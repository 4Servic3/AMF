'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { StoryCollection } from '@/lib/models/stories';
import { StoryViewer } from './story-viewer';

type StoryContextType = {
  openStory: (collection: StoryCollection, initialIndex?: number) => void;
  closeStory: () => void;
};

const StoryContext = createContext<StoryContextType | null>(null);

export function StoryViewerProvider({ children }: { children: React.ReactNode }) {
  const [activeCollection, setActiveCollection] = useState<StoryCollection | null>(null);
  const [startIndex, setStartIndex] = useState(0);

  const openStory = useCallback((collection: StoryCollection, initialIndex = 0) => {
    setActiveCollection(collection);
    setStartIndex(initialIndex);
  }, []);

  const closeStory = useCallback(() => {
    setActiveCollection(null);
    setStartIndex(0);
  }, []);

  // Lock body scroll when viewer is open
  useEffect(() => {
    if (activeCollection) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeCollection]);

  return (
    <StoryContext.Provider value={{ openStory, closeStory }}>
      {children}
      
      {/* Global Story Viewer Modal */}
      {activeCollection && (
        <StoryViewer 
          collection={activeCollection} 
          initialIndex={startIndex} 
          onClose={closeStory} 
          hasAccess={false} // Assume false for now, logic will be handled inside viewer
        />
      )}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (!context) throw new Error('useStory must be used within a StoryViewerProvider');
  return context;
}
