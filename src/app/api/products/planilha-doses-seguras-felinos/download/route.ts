import { getPlanilhaAccess } from '@/lib/products/planilha-access';
import { readPlanilhaFile, PLANILHA_XLSX_KEY } from '@/lib/products/planilha-files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff' };

export async function GET() {
  try {
    const access = await getPlanilhaAccess();
    if (access.state !== 'available') {
      const status = access.state === 'unauthenticated' ? 401 : access.state === 'locked' ? 403 : 503;
      return Response.json({ error: status === 401 ? 'Entre na sua conta para baixar a planilha.' : status === 403 ? 'Este produto não está liberado para sua conta.' : 'Não foi possível verificar seu acesso. Tente novamente.' }, { status, headers });
    }
    const file = await readPlanilhaFile(PLANILHA_XLSX_KEY);
    return new Response(await file.arrayBuffer(), { headers: {
      ...headers,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Doses_Seguras_Felinos_v13_Polyana.xlsx"',
    } });
  } catch {
    return Response.json({ error: 'Planilha temporariamente indisponível. Tente novamente.' }, { status: 503, headers });
  }
}
