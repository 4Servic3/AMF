import 'server-only';

export {
  MuxConfigurationError,
  getMuxEnvironment,
  getMuxSafeConfig,
  resolveAllowedOrigins,
  type EnvironmentType,
  type MuxSafeConfig,
} from './config';

export {
  normalizeOrigin,
  isOriginAllowed,
  validateRequestOrigin,
} from './origins';

export {
  getMuxClient,
  createDirectUpload,
  generatePlaybackToken,
  generatePlaybackSessionTokens,
  retrieveAsset,
  ensureSignedPlaybackId,
  type DirectUploadParams,
  type DirectUploadResult,
  type PlaybackTokenParams,
  type PlaybackSessionTokensResult,
} from './client';

export {
  verifyWebhookSignature,
  recordWebhookMetric,
  getWebhookMetrics,
  resetWebhookMetrics,
  type WebhookMetrics,
} from './webhooks';
