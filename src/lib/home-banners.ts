import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type PublishedHomeBanner = {
  id: string
  media_asset_id: string | null
  cta_target_type: string | null
  cta_target_id: string | null
  title: string | null
}

const COLUMNS = 'id,media_asset_id,cta_target_type,cta_target_id,title'

/**
 * Banners no ar agora: publicados e dentro do período (sem datas = permanente).
 * Se as colunas de data ainda não existirem no banco, cai para a regra antiga.
 */
export async function loadLiveHomeBanners(): Promise<PublishedHomeBanner[]> {
  const db = createServiceRoleClient()
  const now = new Date().toISOString()
  const base = () => db.from('home_banners').select(COLUMNS).eq('status', 'published').order('position', { ascending: true }).limit(20)
  const dated = await base().or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gt.${now}`)
  if (!dated.error) return dated.data || []
  if (dated.error.code !== '42703') return []
  const plain = await base()
  return plain.data || []
}
