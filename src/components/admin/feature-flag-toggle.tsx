"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFeatureFlag } from "@/app/admin/actions/settings";
export function FeatureFlagToggle({
  flagKey,
  enabled,
  description,
  hideLabel = false,
}: {
  flagKey: string;
  enabled: boolean;
  description: string;
  hideLabel?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {!hideLabel && <p className="font-medium">{description}</p>}
        {message && (
          <p role="status" className="text-sm text-red-700">
            {message}
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={description}
        disabled={busy}
        className={enabled ? "amf-primary" : "amf-secondary"}
        onClick={async () => {
          if (
            busy ||
            !confirm(
              (enabled ? "Desativar " : "Ativar ") +
                description +
                " para os alunos?",
            )
          )
            return;
          setBusy(true);
          setMessage("");
          try {
            await toggleFeatureFlag(flagKey, !enabled);
            router.refresh();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Não foi possível atualizar.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Salvando…" : enabled ? "Ativado" : "Desativado"}
      </button>
    </div>
  );
}
