/** Conteúdo que o admin pode conceder a um aluno: um curso publicado ou um produto avulso. */
export type AccessTarget = { kind: 'course' | 'product'; id: string };
type Named = { id: string; title?: string | null; name?: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valor do <select>: "course:<uuid>" ou "product:<uuid>". */
export function encodeAccessTarget(target: AccessTarget): string {
  return `${target.kind}:${target.id}`;
}

export function parseAccessTarget(value: string): AccessTarget | null {
  const [kind, id, extra] = value.split(':');
  if (extra !== undefined || (kind !== 'course' && kind !== 'product') || !id || !UUID.test(id)) return null;
  return { kind, id: id.toLowerCase() };
}

/** Nome legível de um acesso; nunca mostra o id cru quando o conteúdo é conhecido. */
export function describeAccess(entitlement: { resource_type: string; resource_id: string }, courses: Named[], products: Named[]): string {
  if (entitlement.resource_type === 'course') {
    const course = courses.find(c => c.id === entitlement.resource_id);
    return course ? `Curso · ${course.title}` : 'Curso removido ou indisponível';
  }
  if (entitlement.resource_type === 'product') {
    const product = products.find(p => p.id === entitlement.resource_id);
    return product ? `Produto · ${product.name}` : 'Produto removido ou indisponível';
  }
  return 'Conteúdo indisponível';
}
