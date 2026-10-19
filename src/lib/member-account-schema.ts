import { z } from 'zod';

export const profileEditSchema = z.object({
  full_name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
  display_name: z.string().trim().max(80),
  phone: z.string().trim().max(25).refine((value) => !value || /^[+()\d\s.-]{7,25}$/.test(value), 'Informe um telefone válido.'),
  profession: z.enum(['veterinarian', 'student', 'other']),
}).strict();
export type ProfileEdit = z.infer<typeof profileEditSchema>;
export const ticketCategories = { general: 'Dúvida geral', technical: 'Problema técnico', access: 'Acesso a conteúdo' } as const;
export const ticketStatuses = { open: 'Aberto', pending: 'Em atendimento', resolved: 'Resolvido', closed: 'Encerrado' } as const;
export const ticketCreateSchema = z.object({
  subject: z.string().trim().min(3, 'Descreva o assunto.').max(160),
  category: z.enum(['general', 'technical', 'access']),
  content: z.string().trim().min(1, 'Escreva sua mensagem.').max(5000, 'Use até 5.000 caracteres.'),
}).strict();
export const ticketReplySchema = z.object({ ticketId: z.uuid(), content: z.string().trim().min(1).max(5000) }).strict();
export type MemberActionState = { error?: string; success?: string };
export function memberPage(value: unknown) {
  const parsed = Number(value ?? 1);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 1000) : 1;
}
