import Link from 'next/link';
import { redirect } from 'next/navigation';
import PlanilhaApp from '@/components/planilha-felinos/App';
import { getPlanilhaAccess } from '@/lib/products/planilha-access';
import { readPlanilhaData } from '@/lib/products/planilha-files';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Calculadora de Doses | AMF', robots: { index: false, follow: false } };
const productPath = '/app/produtos/planilha-doses-seguras-felinos';

export default async function PlanilhaCalculatorPage() {
  const access = await getPlanilhaAccess();
  if (access.state === 'unauthenticated') redirect('/entrar');
  if (access.state !== 'available') redirect(productPath);
  // No clinical dataset is shipped as a public asset or client JavaScript import.
  const data = await readPlanilhaData();
  return (
    <div className="mx-auto w-full max-w-4xl pb-6">
      <Link href={productPath} className="mb-3 inline-flex min-h-11 items-center text-sm font-medium text-[#1F5F54]">← Voltar ao produto</Link>
      <div className="overflow-hidden rounded-2xl border border-[#DDD5C4]">
        <PlanilhaApp appData={data} />
      </div>
    </div>
  );
}
