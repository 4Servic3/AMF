import Link from 'next/link'
import PageHeader from '@/components/admin/ui/PageHeader'
import { adminDb, queryError } from '@/lib/admin-data'
import { PLANILHA_PRODUCT_ID } from '@/lib/products/planilha-access'

export const metadata = {
  title: 'Cursos e materiais | AMF Admin',
}

type CourseRow = {
  id: string
  title: string
  status: string
  slug: string | null
  all_students: boolean
  thumbnail_url: string | null
  media_assets: { file_path: string | null } | { file_path: string | null }[] | null
  course_modules: { id: string; lessons: { count: number }[] | null }[] | null
}

const STATUS: Record<string, { label: string; className: string }> = {
  published: { label: 'Publicado', className: 'bg-[#e8f6ee] text-[#1f7a4d]' },
  draft: { label: 'Rascunho', className: 'bg-amber-50 text-amber-800' },
  archived: { label: 'Arquivado', className: 'bg-[var(--admin-fill)] text-[var(--admin-secondary)]' },
  active: { label: 'À venda', className: 'bg-[#e8f6ee] text-[#1f7a4d]' },
  inactive: { label: 'Pausado', className: 'bg-amber-50 text-amber-800' },
}
const FALLBACK_COVER = '/assets/amf-casos/hero/hero-obstrucao-uretral.webp'

function Badge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.draft
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>
}

function Card({ cover, badge, kind, title, facts, actions }: { cover: string; badge: React.ReactNode; kind: string; title: string; facts: string[]; actions: React.ReactNode }) {
  return (
    <article className="amf-panel flex flex-col overflow-hidden !p-0">
      <div className="relative aspect-[16/9] bg-[var(--admin-fill)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute left-3 top-3">{badge}</div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-tint)]">{kind}</p>
        <h2 className="mt-1 text-lg leading-snug">{title}</h2>
        <p className="mt-1 text-sm text-[var(--admin-secondary)]">{facts.join(' · ')}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">{actions}</div>
      </div>
    </article>
  )
}

export default async function CoursesPage() {
  const db = await adminDb('courses.manage')
  const [courses, planilha] = await Promise.all([
    db
      .from('courses')
      .select('id,title,status,slug,all_students,thumbnail_url,media_assets!cover_asset_id(file_path),course_modules(id,lessons(count))')
      .order('created_at', { ascending: false }),
    db.from('products').select('id,name,status').eq('id', PLANILHA_PRODUCT_ID).maybeSingle(),
  ])
  queryError(courses.error)
  queryError(planilha.error)
  const all = (courses.data || []) as CourseRow[]
  const rows = all.filter((c) => c.status !== 'archived')
  const archived = all.filter((c) => c.status === 'archived')

  // Uma contagem por item: exata mesmo com muitos alunos e barata para poucos cursos.
  const accessCount = (type: 'course' | 'product', id: string) =>
    db.from('entitlements').select('id', { count: 'exact', head: true }).eq('resource_type', type).eq('resource_id', id).eq('status', 'active')
  const counts = await Promise.all([
    ...rows.map((c) => accessCount('course', c.id)),
    planilha.data ? accessCount('product', planilha.data.id) : Promise.resolve({ count: 0, error: null }),
  ])
  counts.forEach((r) => queryError(r.error))

  const coverOf = (c: CourseRow) => {
    const asset = Array.isArray(c.media_assets) ? c.media_assets[0] : c.media_assets
    const path = c.thumbnail_url || asset?.file_path || FALLBACK_COVER
    return path.startsWith('/') || path.startsWith('https://') ? path : db.storage.from('public_media').getPublicUrl(path).data.publicUrl
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Cursos e materiais"
        description="Tudo o que o aluno estuda no aplicativo: cursos e a planilha de doses seguras."
        actions={<Link href="/admin/courses/editor/new" className="amf-primary">Novo curso</Link>}
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((c, i) => {
          const modules = c.course_modules || []
          const lessons = modules.reduce((sum, m) => sum + (m.lessons?.[0]?.count || 0), 0)
          const students = counts[i].count || 0
          return (
            <Card
              key={c.id}
              cover={coverOf(c)}
              badge={<Badge status={c.status} />}
              kind="Curso"
              title={c.title}
              facts={[
                `${modules.length} ${modules.length === 1 ? 'módulo' : 'módulos'}`,
                `${lessons} ${lessons === 1 ? 'aula' : 'aulas'}`,
                c.all_students ? 'aberto a todos os alunos' : `${students} ${students === 1 ? 'aluno' : 'alunos'} com acesso`,
              ]}
              actions={<>
                <Link href={`/admin/courses/editor/${c.id}`} className="amf-primary">Editar</Link>
                <Link href={`/admin/courses/preview/${c.id}`} className="amf-secondary">Ver como aluno</Link>
              </>}
            />
          )
        })}
        {planilha.data && (
          <Card
            cover="/assets/amf-home/banner-planilha-felinos.jpeg"
            badge={<Badge status={planilha.data.status} />}
            kind="Material"
            title="Planilha de doses seguras (tabela de vacinas)"
            facts={['Calculadora e planilha Excel', `${counts[rows.length].count || 0} com acesso`]}
            actions={<>
              <Link href="/admin/products" className="amf-primary">Preço e checkout</Link>
              <Link href={`/admin/access?recurso=product:${planilha.data.id}`} className="amf-secondary">Quem tem acesso</Link>
              <a href="/app/produtos/planilha-doses-seguras-felinos/calculadora" target="_blank" rel="noopener noreferrer" className="amf-secondary">Abrir no app</a>
            </>}
          />
        )}
        <Link href="/admin/courses/editor/new" className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-[var(--admin-radius)] border-2 border-dashed border-[var(--admin-border)] p-6 text-center text-[var(--admin-secondary)] hover:border-[var(--admin-tint)] hover:text-[var(--admin-tint)]">
          <span className="text-3xl leading-none">+</span>
          <span className="font-semibold">Criar novo curso</span>
        </Link>
      </div>
      {archived.length > 0 && (
        <details className="amf-panel">
          <summary className="cursor-pointer font-semibold">Arquivados ({archived.length})</summary>
          <ul className="mt-3 divide-y divide-[var(--admin-separator)]">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{c.title}</span>
                <Link href={`/admin/courses/editor/${c.id}`} className="font-semibold text-[var(--admin-tint)]">Abrir</Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
