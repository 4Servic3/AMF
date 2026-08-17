import React, { Suspense } from "react";
import Hero from "@/components/admin/dashboard/Hero";
import KPIGrid from "@/components/admin/dashboard/KPIGrid";
import DashboardCharts from "@/components/admin/dashboard/DashboardCharts";
import PlatformAreas from "@/components/admin/dashboard/PlatformAreas";
import PerformanceChart from "@/components/admin/dashboard/PerformanceChart";
import WorkQueue from "@/components/admin/dashboard/WorkQueue";
import SystemHealth from "@/components/admin/dashboard/SystemHealth";
import Schedule from "@/components/admin/dashboard/Schedule";
import AttentionUsers from "@/components/admin/dashboard/AttentionUsers";
import Shortcuts from "@/components/admin/dashboard/Shortcuts";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";

export default function AdminDashboardPage() {
  return (
    <div className="pb-0 bg-[#FBF7F0] min-h-screen">
      {/* Dark Hero Area (Header blends with this bg) */}
      <div className="bg-[#1A0B2E] w-full px-7 pt-6 pb-10">
        <div className="w-full mx-auto space-y-6">
          <Hero />
          <KPIGrid />
        </div>
      </div>
      
      {/* Creme Area */}
      <div className="px-7 py-6">
        <div className="w-full mx-auto space-y-6">
          
          <div className="mb-4">
            <h2 className="text-xl font-serif text-amf-ink-900 font-bold">Áreas da plataforma</h2>
          </div>
          
          {/* Areas - Full Width row of 5 */}
          <Suspense fallback={<div className="h-[70px] bg-white animate-pulse rounded-2xl border border-amf-border"></div>}>
            <PlatformAreas />
          </Suspense>

          {/* First Operational Row: 5-3-4 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <Suspense fallback={<div className="h-72 bg-white animate-pulse rounded-2xl border border-amf-border"></div>}>
                <PerformanceChart />
              </Suspense>
            </div>
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="h-72 bg-white animate-pulse rounded-2xl border border-amf-border"></div>}>
                <WorkQueue />
              </Suspense>
            </div>
            <div className="lg:col-span-4">
              <Suspense fallback={<div className="h-72 bg-white animate-pulse rounded-2xl border border-amf-border"></div>}>
                <SystemHealth />
              </Suspense>
            </div>
          </div>

          {/* Second Operational Row: 5-3-4 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <Suspense fallback={<div className="h-64 bg-white animate-pulse rounded-2xl border border-amf-border"></div>}>
                <Schedule />
              </Suspense>
            </div>
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="h-64 bg-white animate-pulse rounded-2xl border border-amf-border"></div>}>
                <AttentionUsers />
              </Suspense>
            </div>
            <div className="lg:col-span-4">
              <Suspense fallback={<div className="h-64 bg-white animate-pulse rounded-2xl border border-amf-border"></div>}>
                <Shortcuts />
              </Suspense>
            </div>
          </div>

          {/* Final Table */}
          <div className="pt-2">
            <Suspense fallback={<div className="h-80 bg-white animate-pulse rounded-2xl border border-amf-border"></div>}>
              <RecentActivity />
            </Suspense>
          </div>

        </div>
      </div>
    </div>
  );
}
