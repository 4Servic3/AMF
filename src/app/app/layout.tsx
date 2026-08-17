import React from 'react';
import { GlobalHeader } from '@/components/layout/global-header';
import { MainContentWrapper } from '@/components/layout/main-content-wrapper';
import { Navigation } from '@/components/layout/navigation';
import { StoryViewerProvider } from '@/components/ui/stories/story-viewer-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoryViewerProvider>
      <div className="flex min-h-screen bg-[#FAF7F1]">
        <Navigation />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-[84px] xl:pl-[240px] flex flex-col min-h-screen min-w-0">
          <GlobalHeader />

          {/* A reserva inferior mestre que impede o conteúdo de ficar por baixo da bottom nav */}
          <div className="premium-app-main flex-1 flex flex-col">
            <MainContentWrapper>
              {children}
            </MainContentWrapper>
          </div>
        </div>
      </div>
    </StoryViewerProvider>
  );
}
