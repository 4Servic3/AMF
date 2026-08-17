export interface UserNote {
  id?: string;
  profile_id: string;
  lesson_id: string;
  content: string;
  video_timestamp_seconds?: number | null;
  created_at: string;
  updated_at: string;
}

// In-memory mock para desenvolvimento local. Em produção -> Supabase.
let mockNotes: UserNote[] = [];

export async function saveNote(
  userId: string,
  lessonId: string,
  content: string,
  videoTimestampSeconds?: number
): Promise<UserNote> {
  // Simulando um debounce e save.
  const existingNoteIndex = mockNotes.findIndex(
    n => n.profile_id === userId && n.lesson_id === lessonId
  );

  if (existingNoteIndex !== -1) {
    mockNotes[existingNoteIndex].content = content;
    mockNotes[existingNoteIndex].updated_at = new Date().toISOString();
    if (videoTimestampSeconds !== undefined) {
      mockNotes[existingNoteIndex].video_timestamp_seconds = videoTimestampSeconds;
    }
    return mockNotes[existingNoteIndex];
  } else {
    const newNote: UserNote = {
      id: Math.random().toString(36).substring(7),
      profile_id: userId,
      lesson_id: lessonId,
      content,
      video_timestamp_seconds: videoTimestampSeconds,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockNotes.push(newNote);
    return newNote;
  }
}

export async function getNote(userId: string, lessonId: string): Promise<UserNote | null> {
  const note = mockNotes.find(n => n.profile_id === userId && n.lesson_id === lessonId);
  return note || null;
}
