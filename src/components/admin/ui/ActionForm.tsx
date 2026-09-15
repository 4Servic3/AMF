"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function ActionForm({
  action,
  children,
  label = "Salvar",
  confirmMessage,
}: {
  action: (data: FormData) => Promise<unknown>;
  children: React.ReactNode;
  label?: string;
  confirmMessage?: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || (confirmMessage && !confirm(confirmMessage))) return;
        setBusy(true);
        setMessage("");
        try {
          await action(new FormData(e.currentTarget));
          setMessage("Salvo com sucesso.");
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Não foi possível salvar.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="space-y-4">
        {children}
        <button type="submit" className="amf-primary">
          {busy ? "Salvando…" : label}
        </button>
      </fieldset>
      {message && (
        <p role="status" className="amf-feedback">
          {message}
        </p>
      )}
    </form>
  );
}
