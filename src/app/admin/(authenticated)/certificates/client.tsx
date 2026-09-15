"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/admin/ui/DataTable";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { revokeCertificate } from "@/app/admin/actions/certificates";

export default function CertificatesClient({
  initialData,
}: {
  initialData: any[];
}) {
  const router = useRouter();
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  const handleRevokeClick = (cert: any) => {
    setSelectedCert(cert);
    setRevokeReason("");
    setRevokeModalOpen(true);
  };

  const confirmRevoke = async () => {
    if (!selectedCert || !revokeReason) return;
    try {
      setRevoking(true);
      await revokeCertificate(selectedCert.validation_code, revokeReason);
      setRevokeModalOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRevoking(false);
    }
  };

  const columns = [
    {
      header: "Código de validação",
      accessorKey: "validation_code",
      cell: (row: any) => (
        <span className="font-mono text-sm">{row.validation_code}</span>
      ),
    },
    {
      header: "Aluno",
      cell: (row: any) => (
        <div>
          <div className="font-medium">{row.profile?.full_name}</div>
          <div className="text-xs text-gray-500">{row.profile?.email}</div>
        </div>
      ),
    },
    {
      header: "Conteúdo",
      cell: (row: any) => {
        if (row.course)
          return <span className="text-sm">Curso: {row.course.title}</span>;
        if (row.case)
          return <span className="text-sm">Caso: {row.case.title}</span>;
        if (row.path)
          return <span className="text-sm">Trilha: {row.path.title}</span>;
        return "Unknown";
      },
    },
    {
      header: "Status",
      cell: (row: any) => {
        return (
          <StatusBadge variant={row.status === "active" ? "success" : "error"}>
            {row.status.toUpperCase()}
          </StatusBadge>
        );
      },
    },
    {
      header: "Emitido em",
      cell: (row: any) => new Date(row.issue_date).toLocaleDateString(),
    },
    {
      header: "Ações",
      cell: (row: any) => {
        if (row.status === "revoked")
          return (
            <span className="text-xs text-gray-400">
              Revogado em {new Date(row.revoked_at).toLocaleDateString()}
            </span>
          );
        return (
          <button
            onClick={() => handleRevokeClick(row)}
            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
          >
            Revogar
          </button>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={initialData} />

      {revokeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Revogar certificado</h2>
            <p className="text-sm text-gray-600 mb-4">
              Deseja revogar o certificado{" "}
              <strong>{selectedCert?.validation_code}</strong>? Esta ação não
              pode ser desfeita.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Motivo da revogação
              </label>
              <textarea
                className="w-full border rounded-lg p-2 text-sm"
                rows={3}
                required
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Informe o motivo da revogação…"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRevokeModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRevoke}
                disabled={revoking || !revokeReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {revoking ? "Revogando…" : "Confirmar revogação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
