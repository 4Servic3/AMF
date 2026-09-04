import 'server-only';
import Mux from '@mux/mux-node';
import { getMuxCredentials, MuxConfigurationError } from './config';
import { isOriginAllowed } from './origins';

let muxClientInstance: Mux | null = null;

/**
 * Retorna o cliente singleton do SDK Mux instanciado estritamente no servidor.
 */
export function getMuxClient(): Mux {
  if (!muxClientInstance) {
    const creds = getMuxCredentials();
    muxClientInstance = new Mux({
      tokenId: creds.tokenId,
      tokenSecret: creds.tokenSecret,
    });
  }
  return muxClientInstance;
}

export interface DirectUploadParams {
  corsOrigin: string;
  passthrough?: string;
}

export interface DirectUploadResult {
  uploadUrl: string;
  uploadId: string;
}

/**
 * Cria uma URL de Direct Upload no Mux com playback_policy assinado e restrição de domínio.
 * NUNCA aceita origens arbitrárias ou enviadas diretamente pelo cliente sem validação.
 */
export async function createDirectUpload(params: DirectUploadParams): Promise<DirectUploadResult> {
  const { corsOrigin, passthrough } = params;

  if (!isOriginAllowed(corsOrigin)) {
    throw new Error('Origem não autorizada para upload de vídeo.');
  }

  const client = getMuxClient();
  const creds = getMuxCredentials();

  const newAssetSettings: Record<string, any> = {
    playback_policy: ['signed'],
    max_resolution_tier: '1080p',
  };

  if (passthrough) {
    newAssetSettings.passthrough = passthrough;
  }

  // Se houver Playback Restriction configurada no ambiente, vincular ao asset
  if (creds.playbackRestrictionId) {
    newAssetSettings.playback_restriction_id = creds.playbackRestrictionId;
  }

  try {
    const upload = await client.video.uploads.create({
      new_asset_settings: newAssetSettings,
      cors_origin: corsOrigin,
    });

    if (!upload.url || !upload.id) {
      throw new Error('Falha ao obter URL de upload do provedor de vídeo.');
    }

    return {
      uploadUrl: upload.url,
      uploadId: upload.id,
    };
  } catch (error: any) {
    // Sanitização estrita: nunca logar chaves ou detalhes confidenciais
    const sanitizedMsg = error?.message?.includes('Origem')
      ? error.message
      : 'Erro ao comunicar com o serviço de vídeo.';
    throw new Error(sanitizedMsg);
  }
}

/**
 * Recupera dados de um asset existente diretamente da API do Mux.
 */
export async function retrieveAsset(assetId: string) {
  const client = getMuxClient();
  try {
    return await client.video.assets.retrieve(assetId);
  } catch {
    throw new Error('Asset de vídeo não encontrado ou indisponível no Mux.');
  }
}

/**
 * Garante que um asset possua um Playback ID assinado (policy = signed).
 * Se o asset já tiver um playback ID assinado, retorna-o.
 * Se tiver apenas público ou nenhum, cria um playback ID assinado no Mux.
 */
export async function ensureSignedPlaybackId(assetId: string): Promise<string> {
  const client = getMuxClient();
  const asset = await retrieveAsset(assetId);

  const existingSigned = asset.playback_ids?.find((p) => p.policy === 'signed');
  if (existingSigned && existingSigned.id) {
    return existingSigned.id;
  }

  // Cria um Playback ID com policy 'signed'
  try {
    const created = await client.video.assets.createPlaybackId(assetId, {
      policy: 'signed',
    });
    if (!created.id) {
      throw new Error('Falha ao criar Playback ID assinado no Mux.');
    }
    return created.id;
  } catch {
    throw new Error('Não foi possível gerar Playback ID assinado para o asset informado.');
  }
}

export interface PlaybackTokenParams {
  playbackId: string;
  expirationSeconds?: number;
  type?: 'video' | 'thumbnail' | 'storyboard';
}

/**
 * Gera token JWT assinado para reprodução restrita de vídeo Mux (RS256).
 */
export async function generatePlaybackToken(params: PlaybackTokenParams): Promise<string> {
  const { playbackId, expirationSeconds = 7200, type = 'video' } = params;
  const client = getMuxClient();
  const creds = getMuxCredentials();

  try {
    const token = await client.jwt.signPlaybackId(playbackId, {
      keyId: creds.signingKeyId,
      keySecret: creds.privateKey,
      expiration: `${expirationSeconds}s`,
      type,
    });

    return token;
  } catch {
    throw new Error('Falha ao gerar credencial de reprodução de vídeo.');
  }
}

export interface PlaybackSessionTokensResult {
  tokens: {
    playback: string;
    thumbnail: string;
    storyboard: string;
  };
  expiresAt: string;
  ttlSeconds: number;
}

/**
 * Gera os 3 tokens JWT granulares (playback, thumbnail, storyboard) para uma sessão de reprodução.
 * Aplica TTL dinâmico (duração + 10min, mínimo 30min) e anexa playback_restriction_id.
 */
export async function generatePlaybackSessionTokens(params: {
  playbackId: string;
  durationSeconds?: number | null;
  sessionId: string;
}): Promise<PlaybackSessionTokensResult> {
  const { playbackId, durationSeconds, sessionId } = params;
  const client = getMuxClient();
  const creds = getMuxCredentials();

  // TTL: duração confirmada + 10 minutos (600s), mínimo garantido de 30 minutos (1800s)
  const duration = durationSeconds && durationSeconds > 0 ? durationSeconds : 1200;
  const ttlSeconds = Math.max(1800, duration + 600);
  const expirationStr = `${ttlSeconds}s`;
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const tokenParams: Record<string, any> = {
    session_id: sessionId,
  };

  if (creds.playbackRestrictionId) {
    tokenParams.playback_restriction_id = creds.playbackRestrictionId;
  }

  try {
    const [playbackToken, thumbnailToken, storyboardToken] = await Promise.all([
      client.jwt.signPlaybackId(playbackId, {
        keyId: creds.signingKeyId,
        keySecret: creds.privateKey,
        expiration: expirationStr,
        type: 'video',
        params: tokenParams,
      }),
      client.jwt.signPlaybackId(playbackId, {
        keyId: creds.signingKeyId,
        keySecret: creds.privateKey,
        expiration: expirationStr,
        type: 'thumbnail',
        params: tokenParams,
      }),
      client.jwt.signPlaybackId(playbackId, {
        keyId: creds.signingKeyId,
        keySecret: creds.privateKey,
        expiration: expirationStr,
        type: 'storyboard',
        params: tokenParams,
      }),
    ]);

    return {
      tokens: {
        playback: playbackToken,
        thumbnail: thumbnailToken,
        storyboard: storyboardToken,
      },
      expiresAt,
      ttlSeconds,
    };
  } catch {
    throw new Error('Falha ao gerar credenciais de reprodução de vídeo.');
  }
}
