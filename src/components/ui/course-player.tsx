'use client';

import React, { useRef, useState, useEffect } from 'react';
import { saveProgress, markAsCompleted } from '@/lib/services/progress';

interface CoursePlayerProps {
  userId: string;
  lessonId: string;
  videoId: string;
  initialPositionSeconds?: number;
}

export function CoursePlayer({ userId, lessonId, videoId, initialPositionSeconds = 0 }: CoursePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Auto-save progress mechanism (debounce-like behavior via interval)
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isPlaying && videoRef.current) {
        const currentTime = Math.floor(videoRef.current.currentTime);
        // Save progress every 10 seconds of playback
        saveProgress(userId, lessonId, currentTime, 10);
        
        // Auto-complete at 90%
        if (duration > 0 && (currentTime / duration) >= 0.9 && !completed) {
          setCompleted(true);
          markAsCompleted(userId, lessonId, true);
        }
      }
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [isPlaying, userId, lessonId, duration, completed]);

  // Handle initialization
  useEffect(() => {
    if (videoRef.current && initialPositionSeconds > 0) {
      videoRef.current.currentTime = initialPositionSeconds;
    }
  }, [initialPositionSeconds]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(Math.floor(videoRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(Math.floor(videoRef.current.duration));
    }
  };

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden shadow-md relative aspect-video flex items-center justify-center group">
      {/* Fallback to local mockup video for MVP. In Stage 4 this will be integrated with Vimeo/PandaVideo/Mux SDKs */}
      <video 
        ref={videoRef}
        className="w-full h-full object-contain"
        src={`/videos/${videoId}.mp4`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (!completed) {
            setCompleted(true);
            markAsCompleted(userId, lessonId, true);
          }
        }}
        // Para mock up se o vídeo não existir
        poster="/images/video-placeholder.jpg"
      />
      
      {/* Se o vídeo mock não existir (provável), mostraremos um aviso visual por cima para teste */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 pointer-events-none bg-gray-900/40">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
        <span className="font-medium text-sm">Provedor de Vídeo Simulado ({videoId})</span>
        {duration > 0 && (
          <span className="text-xs mt-1">Tempo: {progress}s / {duration}s</span>
        )}
      </div>

      {/* Basic Controls Overlay (Visible on hover) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4 text-white">
          <button onClick={handlePlayPause} className="w-8 h-8 flex items-center justify-center hover:text-(--color-amf-teal) pointer-events-auto">
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-(--color-amf-teal)" 
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            ></div>
          </div>
          
          <div className="text-xs font-medium">
            {formatTime(progress)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
