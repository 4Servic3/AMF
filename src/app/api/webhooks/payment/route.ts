// Billing has no configured provider or authenticated event contract yet.
// Fail closed instead of granting course access from arbitrary JSON.
export async function POST() {
  return Response.json(
    {error:'Integração de pagamento ainda não configurada.'},
    {status:503,headers:{'Cache-Control':'no-store'}},
  );
}
