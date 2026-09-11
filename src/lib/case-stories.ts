import { z } from 'zod'

export const caseStoryInput = z.object({
  caseId: z.string().uuid().nullable(),
  caseTitle: z.string().trim().max(160),
  caption: z.string().trim().max(500),
  fileName: z.string().min(1).max(255),
  fileType: z.string().regex(/^(video\/|image\/(jpeg|png|webp)$)/),
  fileSize: z.number().positive().max(1024 * 1024 * 1024),
}).refine(value => value.caseId || value.caseTitle.length > 0, { message: 'Selecione ou dê um nome ao caso.' })
  .refine(value => !value.fileType.startsWith('image/') || value.fileSize <= 10 * 1024 * 1024, {message:'Imagens devem ter até 10 MB.'})

export type CaseStoryRow = { id: string; case_id: string; caption: string; status: string; created_at: string }
export type CaseOption = { id: string; title: string }
