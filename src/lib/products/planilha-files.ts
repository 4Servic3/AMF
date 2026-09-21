import 'server-only';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { AppData } from '@/components/planilha-felinos/types';

export const PLANILHA_BUCKET = 'amf_product_files';
export const PLANILHA_XLSX_KEY = 'planilha-felinos/v13/Doses_Seguras_Felinos_v13_Polyana.xlsx';
export const PLANILHA_DATA_KEY = 'planilha-felinos/v13/data.json';

// Server-only. Call only after getPlanilhaAccess() returns available.
export async function readPlanilhaFile(key: typeof PLANILHA_XLSX_KEY | typeof PLANILHA_DATA_KEY): Promise<Blob> {
  const { data, error } = await createServiceRoleClient().storage.from(PLANILHA_BUCKET).download(key);
  if (error || !data) throw new Error('Material temporariamente indisponível.');
  return data;
}

export async function readPlanilhaData(): Promise<AppData> {
  const file = await readPlanilhaFile(PLANILHA_DATA_KEY);
  const data: AppData = JSON.parse(await file.text());
  if (!Array.isArray(data.categories) || !data.categories.length || !data.generatedAt) {
    throw new Error('Material temporariamente indisponível.');
  }
  return data;
}
