-- Migration: Allow members with course access to view corresponding video_assets
-- Date: 2026-09-04

DROP POLICY IF EXISTS "Members view video assets if entitled" ON video_assets;

CREATE POLICY "Members view video assets if entitled" ON video_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lesson_videos lv
      JOIN lessons l ON l.id = lv.lesson_id
      JOIN course_modules m ON m.id = l.module_id
      WHERE lv.video_asset_id = video_assets.id
        AND l.status = 'published'
        AND has_course_access(m.course_id)
    )
    OR
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN course_modules m ON m.id = l.module_id
      WHERE l.video_asset_id = video_assets.id
        AND l.status = 'published'
        AND has_course_access(m.course_id)
    )
  );
