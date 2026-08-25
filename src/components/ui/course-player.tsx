'use client';

import React, { useState, useEffect, useRef } from 'react';
import { saveProgress, markAsCompleted } from '@/lib/services/progress';
import MuxPlayer from '@mux/mux-player-react';

interface CoursePlayerProps {
  userId: string;
  lessonId: string;
  videoId: string;
  initialPositionSeconds?: number;
  courseSlug: string;
}

export function CoursePlayer({ userId, lessonId, videoId, initialPositionSeconds = 0, courseSlug }: CoursePlayerProps) {
  const [tokenData, setTokenData] = useState<{ playbackId: string, token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(0);
  const [completed, setCompleted] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch(`/api/courses/${courseSlug}/lesson/${lessonId}/mux-token`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Failed to load video');
          return;
        }

        setTokenData(data);
      } catch (err) {
        setError('Error connecting to playback service');
      }
    }
    
    fetchToken();
  }, [courseSlug, lessonId]);

  // Auto-save progress mechanism
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isPlaying) {
        // Save progress every 10 seconds of playback
        saveProgress(userId, lessonId, progress, 10);
        
        // Auto-complete at 90%
        if (duration > 0 && (progress / duration) >= 0.9 && !completed) {
          setCompleted(true);
          markAsCompleted(userId, lessonId, true);
        }
      }
    }, 10000);

    const handlePageHide = () => {
      if (isPlaying && progress > 0) {
        saveProgress(userId, lessonId, progress, 10);
      }
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isPlaying, userId, lessonId, progress, duration, completed]);

  if (error) {
    return (
      <div className="w-full bg-gray-900 text-white rounded-xl overflow-hidden shadow-md relative aspect-video flex flex-col items-center justify-center p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3 className="text-lg font-bold mb-2">Vídeo Indisponível</h3>
        <p className="text-gray-400 text-sm max-w-md">{error === 'Video processing' ? 'Este vídeo ainda está sendo processado. Tente novamente em alguns minutos.' : 'Não foi possível carregar o vídeo no momento. Verifique sua conexão e acesso.'}</p>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="w-full bg-gray-900 text-white rounded-xl overflow-hidden shadow-md relative aspect-video flex flex-col items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-(--color-amf-teal) border-t-transparent rounded-full mb-4"></div>
        <p className="text-sm font-medium text-gray-400">Autorizando playback...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden shadow-md relative aspect-video flex items-center justify-center">
      <MuxPlayer
        ref={playerRef}
        playbackId={tokenData.playbackId}
        tokens={{
          playback: tokenData.token,
          thumbnail: tokenData.token,
          storyboard: tokenData.token
        }}
        metadata={{
          video_id: videoId,
          video_title: 'Aula AMF',
          player_name: 'AMF Player',
        }}
        startTime={initialPositionSeconds > 0 ? initialPositionSeconds : undefined}
        onTimeUpdate={(e: any) => setProgress(Math.floor(e.target.currentTime))}
        onDurationChange={(e: any) => setDuration(Math.floor(e.target.duration))}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          setIsPlaying(false);
          // Salva imediatamente no pause
          if (progress > 0) {
            saveProgress(userId, lessonId, progress, 10);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (!completed) {
            setCompleted(true);
            markAsCompleted(userId, lessonId, true);
          }
        }}
        className="w-full h-full object-contain"
        accentColor="#0F6466"
      />
    </div>
  );
}
