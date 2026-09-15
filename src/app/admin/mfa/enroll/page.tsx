"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setupMFA, verifyMFA } from "../../actions/mfa";
export default function Enroll() {
  const [data, setData] = useState<{
      id: string;
      totp: { qr_code: string; secret: string };
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [code, setCode] = useState("");
  const router = useRouter();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Proteger sua conta</h1>
      <p>
        Configure a verificação em duas etapas com seu aplicativo autenticador.
      </p>
      {!data ? (
        <button
          className="amf-primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const result = await setupMFA();
              if (!result.id || !result.totp)
                throw new Error(result.error || "Não foi possível configurar.");
              setData({ id: result.id, totp: result.totp });
            } catch (e) {
              setError(e instanceof Error ? e.message : "Falha ao configurar.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Preparando…" : "Configurar autenticador"}
        </button>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              const result = await verifyMFA(data.id, code);
              if (result.error) throw new Error(result.error);
              router.replace("/admin");
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Código inválido.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>Leia o QR code ou copie a chave no autenticador:</p>
          <img
            alt="QR code para configurar autenticação"
            className="mx-auto h-48 w-48"
            src={
              data.totp.qr_code.startsWith("data:")
                ? data.totp.qr_code
                : "data:image/svg+xml;charset=utf-8," +
                  encodeURIComponent(data.totp.qr_code)
            }
          />
          <code className="block break-all rounded-xl bg-white p-3">
            {data.totp.secret}
          </code>
          <label className="block">
            Código de 6 dígitos
            <input
              className="mt-2 w-full"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <button className="amf-primary" disabled={busy}>
            {busy ? "Verificando…" : "Confirmar e entrar"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
