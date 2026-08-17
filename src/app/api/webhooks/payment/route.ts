import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Webhooks de pagamento muitas vezes não têm o contexto do usuário logado,
// então usamos o client com Service Role para bypassar RLS em operações críticas de servidor.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'secret_mock_dev';

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(req: Request) {
  try {
    // 1. Validar Assinatura (Exemplo Genérico)
    const signature = req.headers.get('x-webhook-signature');
    if (!signature && process.env.NODE_ENV === 'production') {
       return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    // Em um cenário real, você faria HMAC(secret, payload) === signature

    const payload = await req.json();
    
    // Normalização do Payload 
    // Adapte estes campos conformo o provedor (MercadoPago, Stripe, LastLink)
    const externalId = payload.id || payload.transaction_id || `evt_${Date.now()}`;
    const provider = payload.provider || 'generic_provider';
    const type = payload.type || 'payment.approved';
    const profileId = payload.customer_reference || payload.metadata?.user_id; // Passado no checkout
    const productId = payload.product_reference || payload.metadata?.product_id;

    // 2. Idempotência: Gravar o evento bruto
    // A tabela webhook_events tem um UNIQUE(provider, external_id)
    const { error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        provider,
        external_id: externalId,
        type,
        payload, // Salvar raw para debug
        status: 'pending'
      });

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation
         // Evento já foi recebido. Podemos ignorar ou verificar o status.
         return NextResponse.json({ message: 'Event already processed (idempotent skip)' });
      }
      throw insertError;
    }

    // 3. Processamento de Regras de Negócio (Entitlements)
    if (type === 'payment.approved' && profileId && productId) {
       // Conceder Acesso
       const { error: entitlementError } = await supabase
        .from('entitlements')
        .upsert({
          profile_id: profileId,
          product_id: productId,
          source_type: 'webhook_purchase',
          source_id: null, // idealmente seria o purchase_id se gravássemos em purchases
          expires_at: null // Assinaturas teriam um expires_at calculado
        }, { onConflict: 'profile_id,product_id' }); // Precisaria garantir a constraint
        
       if (entitlementError) throw entitlementError;
    } else if (type === 'subscription.canceled' || type === 'payment.refunded') {
       // Revogar Acesso ou expirar
       await supabase
        .from('entitlements')
        .delete()
        .match({ profile_id: profileId, product_id: productId });
    }

    // Marca como processado
    await supabase
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .match({ provider, external_id: externalId });

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
