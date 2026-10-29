// Provisória: os botões de compra caem aqui enquanto os links reais de checkout
// não forem cadastrados em Admin > Produtos e vendas.
export const metadata = { title: 'Checkout | AMF' };

export default function CheckoutPlaceholderPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-white">
      <h1 className="text-3xl font-semibold text-[#160820]">Checkout</h1>
    </main>
  );
}
