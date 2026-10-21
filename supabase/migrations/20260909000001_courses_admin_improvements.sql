-- Migration: Courses Admin Improvements
-- Adds RLS policy so admins can preview draft courses,
-- and ensures course_cover storage bucket exists for course cover images.

-- 1. Allow admins to SELECT courses in any status (including draft/archived)
--    The existing "Admins manage courses" policy uses FOR ALL which covers SELECT,
--    but only when has_permission('content.manage') AND aal2. This is already correct.
--    However we add an explicit SELECT policy for 'courses.manage' permission holders too.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'courses'
      AND policyname = 'Admins view all courses including draft'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins view all courses including draft" ON courses
        FOR SELECT
        USING (
          has_permission('courses.manage')
          AND auth.jwt()->>'aal' = 'aal2'
        )
    $policy$;
  END IF;
END $$;

-- 2. Allow admins to SELECT course_modules in any status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'course_modules'
      AND policyname = 'Admins view all modules including draft'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins view all modules including draft" ON course_modules
        FOR SELECT
        USING (
          has_permission('courses.manage')
          AND auth.jwt()->>'aal' = 'aal2'
        )
    $policy$;
  END IF;
END $$;

-- 3. Allow admins to SELECT lessons in any status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lessons'
      AND policyname = 'Admins view all lessons including draft'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins view all lessons including draft" ON lessons
        FOR SELECT
        USING (
          has_permission('courses.manage')
          AND auth.jwt()->>'aal' = 'aal2'
        )
    $policy$;
  END IF;
END $$;

-- 4. Ensure the course-covers bucket exists using the public_media bucket
--    (reuses existing public_media bucket which already allows image/* types)
--    No new bucket needed — we use public_media which is already public with 5MB limit.
--    Course covers will be stored at path: course-covers/{courseId}/{filename}

-- 5. Grant entitlements SELECT to admins (needed for the access panel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'entitlements'
      AND policyname = 'Admins view all entitlements'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins view all entitlements" ON entitlements
        FOR SELECT
        USING (
          has_permission('users.manage')
          AND auth.jwt()->>'aal' = 'aal2'
        )
    $policy$;
  END IF;
END $$;

-- 6. Grant entitlements INSERT/UPDATE to admins (for granting/revoking course access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'entitlements'
      AND policyname = 'Admins manage entitlements'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins manage entitlements" ON entitlements
        FOR ALL
        USING (
          has_permission('users.manage')
          AND auth.jwt()->>'aal' = 'aal2'
        )
    $policy$;
  END IF;
END $$;
