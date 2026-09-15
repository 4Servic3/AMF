"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function MediaUploader() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const form = e.currentTarget;
        setBusy(true);
        setMessage("");
        try {
          const res = await fetch("/api/admin/media/upload", {
            method: "POST",
            body: new FormData(form),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          form.reset();
          router.refresh();
          setMessage("Arquivo enviado com sucesso.");
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Falha no envio.",
          );
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-4"
    >
      <label className="block">
        JPG, PNG, WebP ou PDF · até 10 MB
        <input
          className="mt-3 block w-full"
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          disabled={busy}
        />
      </label>
      <button className="amf-primary" disabled={busy}>
        {busy ? "Enviando…" : "Enviar arquivo"}
      </button>
      {message && (
        <p className="amf-feedback" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
