import { z } from 'zod';
const email = z.union([z.literal(''), z.email().max(254)]);
export const siteInformationSchema = z.object({ organization: z.string().trim().max(200), responsible: z.string().trim().max(200), supportEmail: email, privacyEmail: email, terms: z.string().trim().max(100000), privacy: z.string().trim().max(100000) });
export type SiteInformation = z.infer<typeof siteInformationSchema>;
export const emptySiteInformation: SiteInformation = { organization:'',responsible:'',supportEmail:'',privacyEmail:'',terms:'',privacy:'' };
export function parseSiteInformation(value: unknown): SiteInformation | null { const parsed = siteInformationSchema.safeParse(value); return parsed.success ? parsed.data : null; }
export function validatePublication(value: SiteInformation) { if (!value.organization || !value.responsible || !value.supportEmail || !value.privacyEmail || !value.terms || !value.privacy) throw new Error('Para publicar, preencha responsável, organização, contatos, termos e privacidade.'); }
