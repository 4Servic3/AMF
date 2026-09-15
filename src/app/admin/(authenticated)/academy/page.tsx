import { adminDb, queryError } from "@/lib/admin-data";
import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { requireAal2, requirePermission } from "@/lib/auth/dal";

export const metadata = {
  title: "Trilhas da academia | AMF Admin",
};

export default async function AcademyPathsPage() {
  await requireAal2();
  await requirePermission("academy.manage");

  const supabase = await adminDb("academy.manage");

  const { data: paths, error } = await supabase
    .from("academy_paths")
    .select(
      `
      id,
      title,
      status,
      created_at
    `,
    )
    .order("created_at", { ascending: false });

  queryError(error);

  const columns = [
    {
      header: "Título",
      accessorKey: "title",
      cell: (row: any) => (
        <Link
          href={`/admin/academy/editor/${row.id}`}
          className="font-medium text-amf-teal-600 hover:text-amf-teal-700 hover:underline"
        >
          {row.title}
        </Link>
      ),
    },
    {
      header: "Status",
      cell: (row: any) => {
        const statusMap: Record<string, string> = {
          draft: "neutral",
          published: "success",
          archived: "neutral",
        };
        const variant = (statusMap[row.status] || "neutral") as any;
        return (
          <StatusBadge variant={variant}>
            {row.status ? row.status.toUpperCase() : "DRAFT"}
          </StatusBadge>
        );
      },
    },
    {
      header: "Criado em",
      cell: (row: any) =>
        new Date(row.created_at || Date.now()).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Trilhas da academia"
          description="Gerencie trilhas, fases e etapas de aprendizagem."
        />
        <Link
          href="/admin/academy/editor/new"
          className="bg-amf-teal-600 hover:bg-amf-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Criar trilha
        </Link>
      </div>

      <DataTable columns={columns} data={paths || []} />
    </div>
  );
}
