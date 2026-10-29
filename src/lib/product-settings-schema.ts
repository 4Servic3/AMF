import { z } from 'zod';

/** Formulário de produto à venda no admin. Preço em reais ("49,90"); vazio = sem preço exibido. */
export const productSettingsSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(3, 'Informe o nome do produto.').max(120),
  description: z.string().trim().max(500).optional().default(''),
  status: z.enum(['active', 'inactive', 'draft']),
  checkoutUrl: z.string().trim().max(2048).optional().default('')
    .refine(value => !value || /^https:\/\/[^\s]+$/.test(value), 'O link de pagamento precisa começar com https://'),
  price: z.string().trim().max(20).optional().default('')
    .refine(value => !value || /^\d{1,7}([.,]\d{1,2})?$/.test(value), 'Preço inválido. Use o formato 197,00.'),
  interval: z.enum(['', 'month', 'year']).optional().default(''),
  unlocksCases: z.boolean().default(false),
});

export type ProductSettings = z.infer<typeof productSettingsSchema>;

/** "197,9" -> 19790 centavos. */
export function priceToCents(price: string): number | null {
  if (!price) return null;
  const [reais, cents = ''] = price.replace('.', ',').split(',');
  return Number(reais) * 100 + Number(cents.padEnd(2, '0'));
}

export function centsToPrice(cents: number | null | undefined): string {
  if (typeof cents !== 'number' || cents <= 0) return '';
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}

export function parseProductForm(form: FormData) {
  return productSettingsSchema.safeParse({
    id: form.get('id'),
    name: form.get('name'),
    description: form.get('description') ?? '',
    status: form.get('status'),
    checkoutUrl: form.get('checkoutUrl') ?? '',
    price: form.get('price') ?? '',
    interval: form.get('interval') ?? '',
    unlocksCases: form.get('unlocksCases') === 'on',
  });
}
