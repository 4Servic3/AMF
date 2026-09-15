import { logout } from "@/app/admin/actions/auth";
export default function Unauthorized() {
  return (
    <main className="mx-auto max-w-lg space-y-5 px-6 py-20">
      <h1 className="text-3xl">Acesso restrito</h1>
      <p>Sua conta não possui permissão para esta área administrativa.</p>
      <a className="amf-secondary" href="/app">
        Voltar ao aplicativo
      </a>
      <form action={logout}>
        <button className="amf-primary">Sair e usar outra conta</button>
      </form>
    </main>
  );
}
