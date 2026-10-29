"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaAsset } from "@/app/admin/actions/media-library";

export default function DeleteMediaButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        type="button"
        disabled={busy}
        className="px-2 text-sm font-semibold text-[var(--admin-danger)]"
        onClick={async () => {
          if (!confirm(`Excluir "${name}" da biblioteca? Esta ação não pode ser desfeita.`)) return;
          setBusy(true);
          setError("");
          try {
            const result = await deleteMediaAsset(id);
            if (result.error) setError(result.error);
            else router.refresh();
          } catch {
            setError("Não foi possível excluir. Tente novamente.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Excluindo…" : "Excluir"}
      </button>
      {error && <p role="alert" className="mt-2 w-full text-xs text-[var(--admin-danger)]">{error}</p>}
    </>
  );
}
