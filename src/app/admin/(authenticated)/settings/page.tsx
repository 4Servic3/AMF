import { SiteInformationSettings } from "@/components/admin/site-information-settings";
﻿import { requireAal2, requirePermission } from "@/lib/auth/dal";
import { logout } from "../../actions/auth";
import { getFeatureFlags } from "@/lib/services/flags";
import { FeatureFlagToggle } from "@/components/admin/feature-flag-toggle";
import PageHeader from "@/components/admin/ui/PageHeader";

export const metadata = { title: "Configurações | AMF Admin" };

export default async function SettingsPage() {
  await requireAal2();
  await requirePermission("settings.manage");
  const flags = await getFeatureFlags();

  // Só flags que de fato mudam o app; as demais (stories, close friends, novidades,
  // cursos) não eram lidas em lugar nenhum e confundiam quem administra.
  const flagEntries = [
    {
      key: "member_cases_enabled",
      desc: "Casos clínicos e stories da home",
      enabled: flags.member_cases_enabled,
    },
    {
      key: "member_academy_enabled",
      desc: "Acesso à academia flutuante",
      enabled: flags.member_academy_enabled,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Configurações"
        description="Ative ou desative áreas do aplicativo e publique as informações institucionais."
      />
      <div className="bg-white rounded-xl border border-amf-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Recursos do Membro</h2>
        <div className="grid gap-4">
          {flagEntries.map((f) => (
            <FeatureFlagToggle
              key={f.key}
              flagKey={f.key}
              description={f.desc}
              enabled={f.enabled}
            />
          ))}
        </div>
      </div>
      <SiteInformationSettings />
      <div className="bg-red-50 p-6 rounded-xl border border-red-200">
        <h2 className="text-lg font-semibold text-red-700 mb-2">
          Sessão administrativa
        </h2>
        <p className="mb-4 text-red-600 text-sm">
          Encerre sua sessão neste navegador com segurança.
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Sair da minha conta
          </button>
        </form>
      </div>
    </div>
  );
}
