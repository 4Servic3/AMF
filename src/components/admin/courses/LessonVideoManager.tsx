'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Video,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive,
  RefreshCw,
  X,
  Link as LinkIcon,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export interface LessonVideoData {
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'errored' | 'error' | 'archived';
  mux_playback_id?: string | null;
  duration_seconds?: number | null;
  aspect_ratio?: string | null;
  max_stored_resolution?: string | null;
  title?: string | null;
  error_message?: string | null;
  ready_at?: string | null;
}

interface LessonVideoManagerProps {
  lessonId: string;
  lessonTitle?: string;
  initialVideo?: LessonVideoData | null;
  onVideoUpdated?: () => void;
}

export default function LessonVideoManager({
  lessonId,
  lessonTitle,
  initialVideo = null,
  onVideoUpdated,
}: LessonVideoManagerProps) {
  const [video, setVideo] = useState<LessonVideoData | null>(initialVideo);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Estados de Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(
    initialVideo?.status === 'processing' || initialVideo?.status === 'pending' || initialVideo?.status === 'uploading'
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estados de Associação Manual de Asset
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [muxAssetIdInput, setMuxAssetIdInput] = useState('');
  const [isAssociating, setIsAssociating] = useState(false);
  const [associateError, setAssociateError] = useState<string | null>(null);

  // Estados de Substituição
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceAssetIdInput, setReplaceAssetIdInput] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);

  // Consulta o status mais recente do vídeo no servidor
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const res = await fetch(`/api/admin/courses/lessons/${lessonId}/video-status`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setVideo(data.video);
        if (data.video?.status === 'processing' || data.video?.status === 'uploading') {
          setIsProcessing(true);
        } else {
          setIsProcessing(false);
        }
      }
    } catch {
      // Ignora erro transitório
    } finally {
      setIsLoadingStatus(false);
    }
  }, [lessonId]);

  // Polling automático enquanto estiver em processamento no Mux
  useEffect(() => {
    if (isProcessing) {
      pollTimerRef.current = setInterval(() => {
        fetchStatus();
      }, 6000);
    } else if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [isProcessing, fetchStatus]);

  // 1. Inicia o fluxo de Direct Upload
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Passo A: Solicita URL temporária de Direct Upload ao servidor
      const initRes = await fetch(`/api/admin/courses/lessons/${lessonId}/video-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const initData = await initRes.json();

      if (!initRes.ok) {
        throw new Error(initData.error || 'Não foi possível inicializar o upload.');
      }

      const { upload_url } = initData;

      // Passo B: Envia o binário diretamente do navegador para o Mux (sem sobrecarregar a Vercel)
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setIsUploading(false);
          setUploadProgress(100);
          setIsProcessing(true); // Exibe "Processando no Mux", sem marcar Pronto ainda
          fetchStatus();
          onVideoUpdated?.();
        } else {
          setIsUploading(false);
          setUploadError('Falha durante a transferência do arquivo para o provedor de vídeo.');
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setUploadError('Erro de conexão durante a transferência. Verifique sua rede e tente novamente.');
      };

      xhr.onabort = () => {
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.open('PUT', upload_url, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err.message || 'Erro ao preparar o upload.');
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
  };

  // 2. Associar Asset Existente
  const handleAssociateAsset = async () => {
    if (!muxAssetIdInput.trim()) return;
    setIsAssociating(true);
    setAssociateError(null);

    try {
      const res = await fetch(`/api/admin/courses/lessons/${lessonId}/video-associate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mux_asset_id: muxAssetIdInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao associar asset.');
      }

      setIsAssociateModalOpen(false);
      setMuxAssetIdInput('');
      await fetchStatus();
      onVideoUpdated?.();
    } catch (err: any) {
      setAssociateError(err.message || 'Erro ao associar asset.');
    } finally {
      setIsAssociating(false);
    }
  };

  // 3. Substituir Vídeo com Justificativa
  const handleReplaceVideo = async () => {
    if (replaceReason.trim().length < 5) {
      setReplaceError('A justificativa é obrigatória (mínimo de 5 caracteres).');
      return;
    }
    if (!replaceAssetIdInput.trim()) {
      setReplaceError('Informe o ID interno do novo vídeo pronto.');
      return;
    }

    setIsReplacing(true);
    setReplaceError(null);

    try {
      const res = await fetch(`/api/admin/courses/lessons/${lessonId}/video-replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_video_asset_id: replaceAssetIdInput.trim(),
          reason: replaceReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao substituir vídeo.');
      }

      setIsReplaceModalOpen(false);
      setReplaceReason('');
      setReplaceAssetIdInput('');
      await fetchStatus();
      onVideoUpdated?.();
    } catch (err: any) {
      setReplaceError(err.message || 'Erro ao substituir vídeo.');
    } finally {
      setIsReplacing(false);
    }
  };

  // Renderização de Badge de Status
  const renderStatusBadge = () => {
    if (isUploading) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Enviando ({uploadProgress}%)
        </span>
      );
    }

    if (isProcessing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          Processando no Mux
        </span>
      );
    }

    if (!video) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Sem vídeo
        </span>
      );
    }

    switch (video.status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pronto (Assinado)
          </span>
        );
      case 'errored':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Erro no Mux
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Archive className="w-3.5 h-3.5" />
            Arquivado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            Processando
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-amf-border p-5 space-y-4 shadow-sm">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amf-teal-50 flex items-center justify-center text-amf-teal-700">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amf-teal-950">Vídeo da Aula</h4>
            {lessonTitle && <p className="text-xs text-amf-muted truncate max-w-sm">{lessonTitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusBadge()}
          <button
            onClick={fetchStatus}
            disabled={isLoadingStatus}
            title="Atualizar status"
            className="p-1.5 text-amf-muted hover:text-amf-teal-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de Upload em Andamento */}
      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-900 font-medium">
            <span>Enviando arquivo diretamente ao Mux... {uploadProgress}%</span>
            <button
              onClick={handleCancelUpload}
              className="text-rose-600 hover:text-rose-700 hover:underline"
            >
              Cancelar
            </button>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-blue-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Por favor, não feche nem recarregue esta página durante a transferência.
          </p>
        </div>
      )}

      {/* Alerta de Processamento */}
      {isProcessing && !isUploading && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
          <span>
            O vídeo foi enviado com sucesso e está sendo codificado pelo Mux com restrição de playback assinada. Esta página verificará o status automaticamente.
          </span>
        </div>
      )}

      {/* Erro de Upload */}
      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            {uploadError}
          </span>
          <button onClick={() => setUploadError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Detalhes do Vídeo Atual */}
      {video && video.status === 'ready' && (
        <div className="p-3 bg-amf-ivory-50 border border-amf-border rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-amf-muted block">Duração</span>
            <span className="font-semibold text-amf-teal-900">
              {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}m ${video.duration_seconds % 60}s` : 'N/D'}
            </span>
          </div>
          <div>
            <span className="text-amf-muted block">Proporção</span>
            <span className="font-semibold text-amf-teal-900">{video.aspect_ratio || '16:9'}</span>
          </div>
          <div>
            <span className="text-amf-muted block">Resolução Máx.</span>
            <span className="font-semibold text-amf-teal-900">{video.max_stored_resolution || '1080p'}</span>
          </div>
          <div>
            <span className="text-amf-muted block">Segurança</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Assinado (RS256)
            </span>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex flex-wrap gap-2 pt-1">
        {/* Input Oculto de Arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
          onChange={handleFileSelected}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isProcessing}
          className="px-3 py-2 bg-amf-teal-600 hover:bg-amf-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          {video ? 'Enviar novo arquivo' : 'Enviar vídeo para o Mux'}
        </button>

        <button
          type="button"
          onClick={() => setIsAssociateModalOpen(true)}
          disabled={isUploading || isProcessing}
          className="px-3 py-2 bg-white hover:bg-amf-ivory-50 text-amf-teal-900 border border-amf-border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5 text-amf-muted" />
          Associar Asset Mux Existente
        </button>

        {video && video.status === 'ready' && (
          <button
            type="button"
            onClick={() => setIsReplaceModalOpen(true)}
            disabled={isUploading || isProcessing}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Substituir Vídeo Ativo
          </button>
        )}
      </div>

      {/* Modal: Associar Asset Mux Existente */}
      {isAssociateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-amf-border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold text-amf-teal-950">Associar Asset Existente do Mux</h3>
              <button
                onClick={() => setIsAssociateModalOpen(false)}
                className="text-amf-muted hover:text-amf-teal-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-amf-muted leading-relaxed">
              Informe o <strong>Mux Asset ID</strong>. O servidor validará o asset diretamente no Mux e garantirá que ele possua política de reprodução restrita (signed).
            </p>

            {associateError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">
                {associateError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-amf-teal-900 mb-1">Mux Asset ID</label>
              <input
                type="text"
                value={muxAssetIdInput}
                onChange={(e) => setMuxAssetIdInput(e.target.value)}
                placeholder="ex: 0201xV93q..."
                className="w-full px-3 py-2 border border-amf-border rounded-lg text-xs font-mono focus:ring-2 focus:ring-amf-teal-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAssociateModalOpen(false)}
                className="px-3 py-1.5 text-xs text-amf-muted hover:text-amf-teal-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAssociateAsset}
                disabled={isAssociating || !muxAssetIdInput.trim()}
                className="px-4 py-1.5 bg-amf-teal-600 hover:bg-amf-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
              >
                {isAssociating ? 'Validando...' : 'Associar à Aula'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Substituir Vídeo Ativo com Justificativa */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-amf-border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Substituição de Vídeo Ativo
              </h3>
              <button
                onClick={() => setIsReplaceModalOpen(false)}
                className="text-amf-muted hover:text-amf-teal-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-amf-muted leading-relaxed">
              O vídeo atual será <strong>arquivado</strong> e preservado para histórico de auditoria e rollback. A troca só entrará em vigor para os alunos após a aprovação com o motivo documentado.
            </p>

            {replaceError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">
                {replaceError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-amf-teal-900 mb-1">
                  ID Interno do Novo Vídeo Pronto (video_asset_id)
                </label>
                <input
                  type="text"
                  value={replaceAssetIdInput}
                  onChange={(e) => setReplaceAssetIdInput(e.target.value)}
                  placeholder="UUID do asset preparado..."
                  className="w-full px-3 py-2 border border-amf-border rounded-lg text-xs font-mono focus:ring-2 focus:ring-amf-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-amf-teal-900 mb-1">
                  Justificativa / Motivo da Troca * (mínimo 5 caracteres)
                </label>
                <textarea
                  value={replaceReason}
                  onChange={(e) => setReplaceReason(e.target.value)}
                  placeholder="ex: Atualização de conduta clínica e melhoria na qualidade do áudio."
                  className="w-full px-3 py-2 border border-amf-border rounded-lg text-xs min-h-[80px] focus:ring-2 focus:ring-amf-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(false)}
                className="px-3 py-1.5 text-xs text-amf-muted hover:text-amf-teal-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReplaceVideo}
                disabled={isReplacing || replaceReason.trim().length < 5 || !replaceAssetIdInput.trim()}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-sm"
              >
                {isReplacing ? 'Processando Troca...' : 'Confirmar e Arquivar Anterior'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
