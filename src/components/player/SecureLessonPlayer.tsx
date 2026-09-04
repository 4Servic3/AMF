'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PlaybackSessionResponse {
  playbackId: string;
  tokens: {
    playback: string;
    thumbnail?: string;
    storyboard?: string;
  };
  durationSeconds: number;
  videoId: string;
  videoTitle: string;
  viewerUserId: string;
  resumeAtSeconds: number;
  expiresAt: string;
  playerPreferences?: {
    autoplay?: boolean;
    preload?: 'none' | 'metadata' | 'auto';
  };
}

interface SecureLessonPlayerProps {
  lessonId: string;
  courseSlug?: string;
  title?: string;
  onProgressUpdate?: (percent: number) => void;
  onComplete?: () => void;
  nextLessonHref?: string;
}

type PlayerStatus = 
  | 'loading'
  | 'ready'
  | 'processing'
  | 'unauthorized'
  | 'not_found'
  | 'offline'
  | 'error';

export function SecureLessonPlayer({
  lessonId,
  courseSlug,
  title,
  onProgressUpdate,
  onComplete,
  nextLessonHref,
}: SecureLessonPlayerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PlayerStatus>('loading');
  const [session, setSession] = useState<PlaybackSessionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showRestartBanner, setShowRestartBanner] = useState<boolean>(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);

  const playerRef = useRef<any>(null);
  const retryCountRef = useRef<number>(0);
  const lastProgressSentTimeRef = useRef<number>(0);
  const lastPositionRef = useRef<number>(0);
  const currentDurationRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // 1. Fetch Session from same-origin endpoint
  const fetchSession = useCallback(async (isRetry = false) => {
    try {
      if (!window.navigator.onLine) {
        setIsOnline(false);
        setStatus('offline');
        return;
      }

      setStatus('loading');
      setErrorMessage(null);

      const res = await fetch(`/api/courses/lessons/${lessonId}/playback-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 425) {
          setStatus('processing');
          setErrorMessage(data.error || 'O vídeo desta aula ainda está sendo codificado.');
          return;
        }
        if (res.status === 401 || res.status === 403) {
          setStatus('unauthorized');
          setErrorMessage(data.error || 'Acesso não autorizado para reproduzir esta aula.');
          return;
        }
        if (res.status === 404) {
          setStatus('not_found');
          setErrorMessage(data.error || 'Vídeo não configurado para esta aula.');
          return;
        }
        setStatus('error');
        setErrorMessage(data.error || 'Falha ao inicializar o player.');
        return;
      }

      // Memory-only storage of session and tokens
      setSession(data);
      currentDurationRef.current = data.durationSeconds || 0;
      lastPositionRef.current = data.resumeAtSeconds || 0;

      if (data.resumeAtSeconds > 15) {
        setShowRestartBanner(true);
      }

      setStatus('ready');
      if (isRetry) {
        retryCountRef.current += 1;
      }
    } catch (err) {
      if (!window.navigator.onLine) {
        setIsOnline(false);
        setStatus('offline');
      } else {
        setStatus('error');
        setErrorMessage('Não foi possível conectar ao serviço de vídeo. Verifique sua conexão.');
      }
    }
  }, [lessonId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // 2. Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (status === 'offline') {
        fetchSession();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status, fetchSession]);

  // 3. Proactive token refresh when waking or tab focuses if close to expiration
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.expiresAt) {
        const expiresAtMs = new Date(session.expiresAt).getTime();
        const twoMinutes = 2 * 60 * 1000;
        if (Date.now() > expiresAtMs - twoMinutes) {
          // Token expiring soon, renew
          fetchSession(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, fetchSession]);

  // 4. Progress Reporting Function (monotonic & server-authoritative)
  const reportProgress = useCallback(
    async (position: number, isEnded = false, useKeepalive = false) => {
      if (position <= 0 && !isEnded) return;

      const payload = {
        position_seconds: Math.floor(position),
        duration_seconds: Math.floor(currentDurationRef.current),
        is_ended: isEnded,
      };

      try {
        const url = `/api/courses/lessons/${lessonId}/progress`;
        if (useKeepalive && typeof fetch !== 'undefined') {
          fetch(url, {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(() => {});
          return;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          lastProgressSentTimeRef.current = Date.now();
          if (data.percent !== undefined) {
            onProgressUpdate?.(data.percent);
          }
          if (data.is_completed && !isCompleted) {
            setIsCompleted(true);
            onComplete?.();
          }
        }
      } catch (e) {
        // Silently catch network transient errors in background progress ping
      }
    },
    [lessonId, isCompleted, onComplete, onProgressUpdate]
  );

  // 5. Pagehide / visibilitychange flush
  useEffect(() => {
    const handleUnload = () => {
      if (isPlayingRef.current && lastPositionRef.current > 0) {
        reportProgress(lastPositionRef.current, false, true);
      }
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [reportProgress]);

  // 6. Dismiss restart banner after 10 seconds
  useEffect(() => {
    if (showRestartBanner) {
      const timer = setTimeout(() => {
        setShowRestartBanner(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showRestartBanner]);

  // 7. Auto-advance countdown on video completion
  useEffect(() => {
    if (autoAdvanceCountdown !== null && autoAdvanceCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoAdvanceCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoAdvanceCountdown === 0 && nextLessonHref) {
      router.push(nextLessonHref);
    }
  }, [autoAdvanceCountdown, nextLessonHref, router]);

  // 8. Player Event Handlers
  const handleTimeUpdate = (e: any) => {
    const current = Math.floor(e.target.currentTime || 0);
    lastPositionRef.current = current;

    // Checkpoint a cada 15 segundos
    const now = Date.now();
    if (now - lastProgressSentTimeRef.current >= 15000) {
      reportProgress(current, false);
    }
  };

  const handleDurationChange = (e: any) => {
    const dur = Math.floor(e.target.duration || 0);
    if (dur > 0) {
      currentDurationRef.current = dur;
    }
  };

  const handlePlay = () => {
    isPlayingRef.current = true;
  };

  const handlePause = () => {
    isPlayingRef.current = false;
    if (lastPositionRef.current > 0) {
      reportProgress(lastPositionRef.current, false);
    }
  };

  const handleEnded = () => {
    isPlayingRef.current = false;
    reportProgress(lastPositionRef.current, true);
    setIsCompleted(true);
    onComplete?.();

    if (nextLessonHref) {
      setAutoAdvanceCountdown(5);
    }
  };

  const handleError = () => {
    // Attempt 1 automatic refresh if token might have expired or stalled
    if (retryCountRef.current < 1) {
      fetchSession(true);
    } else {
      setStatus('error');
      setErrorMessage('Erro na reprodução do vídeo. Clique em tentar novamente.');
    }
  };

  const handleRestartFromBeginning = () => {
    if (playerRef.current) {
      playerRef.current.currentTime = 0;
      lastPositionRef.current = 0;
      setShowRestartBanner(false);
    }
  };

  // Helper format time
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // RENDER STATES
  // -------------------------------------------------------------

  // Loading State
  if (status === 'loading') {
    return (
      <div 
        className="w-full bg-[#160820] text-[#FAF7F1] rounded-2xl overflow-hidden shadow-lg relative aspect-video flex flex-col items-center justify-center p-6 border border-white/5"
        role="status"
        aria-live="polite"
      >
        <div className="w-12 h-12 rounded-full border-3 border-[#0F6466] border-t-transparent animate-spin mb-4" />
        <h3 className="text-base font-semibold tracking-wide text-[#FAF7F1]">Carregando aula segura...</h3>
        <p className="text-xs text-white/50 mt-1">Estabelecendo sessão criptografada</p>
      </div>
    );
  }

  // Processing State (425)
  if (status === 'processing') {
    return (
      <div 
        className="w-full bg-[#160820] text-[#FAF7F1] rounded-2xl overflow-hidden shadow-lg relative aspect-video flex flex-col items-center justify-center p-6 text-center border border-white/5"
        role="alert"
      >
        <div className="w-12 h-12 rounded-full bg-[#D4AD62]/20 text-[#D4AD62] flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h3 className="text-lg font-bold mb-2 text-[#FAF7F1]">Vídeo em processamento</h3>
        <p className="text-white/60 text-sm max-w-md mb-6 leading-relaxed">
          {errorMessage || 'O vídeo desta aula ainda está sendo codificado pelo provedor. Em instantes estará liberado.'}
        </p>
        <button
          onClick={() => fetchSession()}
          className="px-5 py-2.5 bg-[#0F6466] hover:bg-[#0c5052] text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          Verificar novamente
        </button>
      </div>
    );
  }

  // Unauthorized / Forbidden State (401/403)
  if (status === 'unauthorized') {
    return (
      <div 
        className="w-full bg-[#160820] text-[#FAF7F1] rounded-2xl overflow-hidden shadow-lg relative aspect-video flex flex-col items-center justify-center p-6 text-center border border-white/5"
        role="alert"
      >
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3 className="text-lg font-bold mb-2 text-[#FAF7F1]">Conteúdo Restrito</h3>
        <p className="text-white/60 text-sm max-w-md mb-6 leading-relaxed">
          {errorMessage || 'Você precisa possuir uma matrícula ativa para assistir a esta aula.'}
        </p>
        {courseSlug && (
          <Link
            href={`/app/produtos/${courseSlug}`}
            className="px-5 py-2.5 bg-[#D4AD62] hover:bg-[#c29d54] text-[#160820] text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            Ver detalhes do curso
          </Link>
        )}
      </div>
    );
  }

  // Not Found State (404)
  if (status === 'not_found') {
    return (
      <div 
        className="w-full bg-[#160820] text-[#FAF7F1] rounded-2xl overflow-hidden shadow-lg relative aspect-video flex flex-col items-center justify-center p-6 text-center border border-white/5"
        role="alert"
      >
        <div className="w-12 h-12 rounded-full bg-white/10 text-white/70 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h3 className="text-lg font-bold mb-2 text-[#FAF7F1]">Vídeo Indisponível</h3>
        <p className="text-white/60 text-sm max-w-md leading-relaxed">
          {errorMessage || 'Vídeo ainda não configurado para esta aula.'}
        </p>
      </div>
    );
  }

  // Offline State
  if (status === 'offline' || !isOnline) {
    return (
      <div 
        className="w-full bg-[#160820] text-[#FAF7F1] rounded-2xl overflow-hidden shadow-lg relative aspect-video flex flex-col items-center justify-center p-6 text-center border border-white/5"
        role="alert"
      >
        <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        </div>
        <h3 className="text-lg font-bold mb-2 text-[#FAF7F1]">Sem conexão com a internet</h3>
        <p className="text-white/60 text-sm max-w-md mb-6 leading-relaxed">
          Você está offline. O reprodutor voltará a carregar assim que o sinal de internet for restabelecido.
        </p>
        <button
          onClick={() => fetchSession()}
          className="px-5 py-2.5 bg-[#0F6466] hover:bg-[#0c5052] text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          Tentar reconectar
        </button>
      </div>
    );
  }

  // Generic Error State
  if (status === 'error' || !session) {
    return (
      <div 
        className="w-full bg-[#160820] text-[#FAF7F1] rounded-2xl overflow-hidden shadow-lg relative aspect-video flex flex-col items-center justify-center p-6 text-center border border-white/5"
        role="alert"
      >
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h3 className="text-lg font-bold mb-2 text-[#FAF7F1]">Falha ao carregar aula</h3>
        <p className="text-white/60 text-sm max-w-md mb-6 leading-relaxed">
          {errorMessage || 'Ocorreu um erro temporário ao reproduzir o vídeo.'}
        </p>
        <button
          onClick={() => {
            retryCountRef.current = 0;
            fetchSession();
          }}
          className="px-5 py-2.5 bg-[#0F6466] hover:bg-[#0c5052] text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          Tentar novamente
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // READY: RENDER MUX PLAYER
  // -------------------------------------------------------------
  return (
    <div className="w-full bg-[#160820] rounded-2xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center border border-white/10 group">
      
      {/* Mux Player Instance */}
      <MuxPlayer
        ref={playerRef}
        playbackId={session.playbackId}
        tokens={{
          playback: session.tokens.playback,
          thumbnail: session.tokens.thumbnail,
          storyboard: session.tokens.storyboard,
        }}
        metadata={{
          video_id: session.videoId,
          video_title: session.videoTitle || title || 'Aula AMF',
          viewer_user_id: session.viewerUserId,
          player_name: 'AMF Secure Player',
        }}
        startTime={session.resumeAtSeconds > 0 ? session.resumeAtSeconds : undefined}
        streamType="on-demand"
        preload={session.playerPreferences?.preload || 'metadata'}
        autoPlay={session.playerPreferences?.autoplay || false}
        accentColor="#0F6466"
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        className="w-full h-full object-contain focus:outline-none"
      />

      {/* Restart from beginning prompt pill */}
      {showRestartBanner && session.resumeAtSeconds > 15 && (
        <div 
          className="absolute top-4 left-4 z-20 bg-[#160820]/90 backdrop-blur-md text-[#FAF7F1] px-4 py-2 rounded-xl text-xs flex items-center gap-3 shadow-lg border border-white/10 animate-fade-in"
          role="status"
        >
          <span>Continuando de {formatSeconds(session.resumeAtSeconds)}</span>
          <button
            onClick={handleRestartFromBeginning}
            className="text-[#D4AD62] hover:text-[#e4be72] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
          >
            Recomeçar do início
          </button>
          <button
            onClick={() => setShowRestartBanner(false)}
            className="text-white/40 hover:text-white ml-1"
            aria-label="Fechar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Auto-advance banner on video ended */}
      {autoAdvanceCountdown !== null && nextLessonHref && (
        <div 
          className="absolute inset-0 z-30 bg-[#160820]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in"
          role="alert"
        >
          <div className="w-12 h-12 rounded-full bg-[#0F6466]/20 text-[#0F6466] flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h4 className="text-base font-bold text-[#FAF7F1] mb-1">Aula Concluída!</h4>
          <p className="text-xs text-white/70 mb-4">
            Avançando para a próxima aula em {autoAdvanceCountdown}s...
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoAdvanceCountdown(null)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[#FAF7F1] text-xs font-semibold rounded-lg transition-colors"
            >
              Permanecer nesta aula
            </button>
            <Link
              href={nextLessonHref}
              className="px-4 py-2 bg-[#0F6466] hover:bg-[#0c5052] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              Ir agora
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
