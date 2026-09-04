'use client';

import React from 'react';
import { SecureLessonPlayer } from '@/components/player';

interface CoursePlayerProps {
  userId?: string;
  lessonId: string;
  videoId?: string;
  initialPositionSeconds?: number;
  courseSlug?: string;
  title?: string;
  nextLessonHref?: string;
}

export function CoursePlayer({
  lessonId,
  courseSlug,
  title,
  nextLessonHref,
}: CoursePlayerProps) {
  return (
    <SecureLessonPlayer
      lessonId={lessonId}
      courseSlug={courseSlug}
      title={title}
      nextLessonHref={nextLessonHref}
    />
  );
}

export default CoursePlayer;
