import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mux Video Domain Migration & Constraints Audit', () => {
  const migrationPath = path.resolve(
    import.meta.dirname,
    '../supabase/migrations/20260826000000_mux_video_domain.sql'
  );
  const rollbackPath = path.resolve(
    import.meta.dirname,
    '../supabase/rollback/20260826000000_mux_video_domain.sql'
  );

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  const rollbackSql = fs.readFileSync(rollbackPath, 'utf8').replace(/\r\n/g, '\n');

  it('migration file exists and contains all required table definitions', () => {
    expect(migrationSql).toContain('ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS mux_upload_id');
    expect(migrationSql).toContain('ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS mux_asset_id');
    expect(migrationSql).toContain('ALTER TABLE video_assets ADD COLUMN IF NOT EXISTS mux_playback_id');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS lesson_videos');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS video_uploads');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS playback_sessions');
    expect(migrationSql).toContain('ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS provider_event_id');
  });

  it('enforces safe delete behavior (RESTRICT) on lesson_videos foreign keys', () => {
    // Não pode usar cascade para apagar assets silenciosamente
    expect(migrationSql).toContain('lesson_id uuid references lessons(id) on delete restrict');
    expect(migrationSql).toContain('video_asset_id uuid references video_assets(id) on delete restrict');
  });

  it('enforces single primary video constraint per lesson', () => {
    // Constraint que impede dois vídeos primários ativos para a mesma aula
    expect(migrationSql).toContain('idx_lesson_videos_primary_unique');
    expect(migrationSql).toContain('WHERE is_primary = true');
  });

  it('enforces uniqueness for mux IDs and idempotency for webhook events', () => {
    expect(migrationSql).toContain('idx_video_assets_mux_upload_id');
    expect(migrationSql).toContain('idx_video_assets_mux_asset_id');
    expect(migrationSql).toContain('idx_video_assets_mux_playback_id');
    expect(migrationSql).toContain('idx_webhook_events_provider_event');
  });

  it('never stores raw upload URLs or JWTs in table definitions', () => {
    expect(migrationSql.toLowerCase()).not.toContain('upload_url');
    expect(migrationSql.toLowerCase()).not.toContain('direct_upload_url');
    expect(migrationSql.toLowerCase()).not.toContain('jwt_token');
    expect(migrationSql.toLowerCase()).not.toContain('signed_jwt');
  });

  it('registers granular RBAC permission courses.videos.manage and assigns to roles', () => {
    expect(migrationSql).toContain("'courses.videos.manage'");
    expect(migrationSql).toContain("'super_admin'");
    expect(migrationSql).toContain("'content_admin'");
  });

  it('configures strict RLS policies with AAL2 for admin mutations and student read-isolation', () => {
    // Aluno não pode inserir/atualizar/excluir video_assets ou video_uploads
    expect(migrationSql).toContain('CREATE POLICY "Admins manage video assets" ON video_assets');
    expect(migrationSql).toContain('courses.videos.manage');
    expect(migrationSql).toContain("auth.jwt()->>'aal' = 'aal2'");

    // Aluno vê lesson_videos apenas se tiver acesso ao curso e aula publicada
    expect(migrationSql).toContain('CREATE POLICY "Members view lesson videos if entitled" ON lesson_videos');
    expect(migrationSql).toContain('has_course_access(m.course_id)');
  });

  it('rollback script properly cleans up tables without destroying existing lessons or video_assets', () => {
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS playback_sessions;');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS video_uploads;');
    expect(rollbackSql).toContain('DROP TABLE IF EXISTS lesson_videos;');
    expect(rollbackSql).toContain('DROP POLICY IF EXISTS "Members view lesson videos if entitled"');
    expect(rollbackSql).toContain('DELETE FROM admin_permissions \nWHERE key = \'courses.videos.manage\';');
    // Não pode dropar a tabela video_assets ou lessons
    expect(rollbackSql).not.toContain('DROP TABLE video_assets');
    expect(rollbackSql).not.toContain('DROP TABLE lessons');
  });
});

describe('Video Domain Business Rules Logic', () => {
  // Funções puras simulando a lógica de negócio e constraints do banco
  function validatePrimaryVideoUniqueness(
    existingVideos: Array<{ lesson_id: string; is_primary: boolean }>,
    newVideo: { lesson_id: string; is_primary: boolean }
  ): boolean {
    if (!newVideo.is_primary) return true;
    const hasPrimary = existingVideos.some(
      (v) => v.lesson_id === newVideo.lesson_id && v.is_primary
    );
    return !hasPrimary;
  }

  function validateVideoStatus(status: string): boolean {
    const validStatuses = ['pending', 'uploading', 'processing', 'ready', 'errored', 'error', 'archived'];
    return validStatuses.includes(status);
  }

  function canStudentAccessVideo(hasEntitlement: boolean, lessonStatus: string): boolean {
    return hasEntitlement && lessonStatus === 'published';
  }

  it('blocks second primary video for the same lesson', () => {
    const lessonVideos = [{ lesson_id: 'lesson-1', is_primary: true }];

    // Tentar adicionar outro vídeo primário deve ser bloqueado
    const canAddSecondPrimary = validatePrimaryVideoUniqueness(lessonVideos, {
      lesson_id: 'lesson-1',
      is_primary: true,
    });
    expect(canAddSecondPrimary).toBe(false);

    // Adicionar vídeo secundário (is_primary = false) é permitido
    const canAddSecondary = validatePrimaryVideoUniqueness(lessonVideos, {
      lesson_id: 'lesson-1',
      is_primary: false,
    });
    expect(canAddSecondary).toBe(true);
  });

  it('validates allowed video asset statuses and rejects invalid ones', () => {
    expect(validateVideoStatus('ready')).toBe(true);
    expect(validateVideoStatus('processing')).toBe(true);
    expect(validateVideoStatus('uploading')).toBe(true);
    expect(validateVideoStatus('invalid_status')).toBe(false);
    expect(validateVideoStatus('deleted')).toBe(false);
  });

  it('verifies student access rules strictly', () => {
    expect(canStudentAccessVideo(true, 'published')).toBe(true);
    expect(canStudentAccessVideo(false, 'published')).toBe(false);
    expect(canStudentAccessVideo(true, 'draft')).toBe(false);
    expect(canStudentAccessVideo(true, 'coming_soon')).toBe(false);
  });
});
