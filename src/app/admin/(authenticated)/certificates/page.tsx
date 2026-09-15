import { adminDb, queryError } from "@/lib/admin-data";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/admin/ui/PageHeader";
import DataTable from "@/components/admin/ui/DataTable";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import { requireAal2, requirePermission } from "@/lib/auth/dal";
import CertificatesClient from "./client";

export const metadata = {
  title: "Certificados | AMF Admin",
};

export default async function CertificadosPage() {
  await requireAal2();
  await requirePermission("academy.manage");

  const supabase = await adminDb("academy.manage");

  const { data: certificates, error } = await supabase
    .from("certificates")
    .select(
      `
      id,
      validation_code,
      status,
      issue_date,
      revoked_at,
      profile:profiles!profile_id(full_name, email),
      course:courses!course_id(title)
    `,
    )
    .order("issue_date", { ascending: false })
    .limit(100); // limit for safety

  queryError(error);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Certificados"
          description="Consulte e revogue certificados emitidos."
        />
      </div>

      <CertificatesClient initialData={certificates || []} />
    </div>
  );
}
