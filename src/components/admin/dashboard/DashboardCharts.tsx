"use client";

import React from "react";
import DataTable from "@/components/admin/ui/DataTable";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { name: "Jan", users: 400 },
  { name: "Feb", users: 600 },
  { name: "Mar", users: 550 },
  { name: "Apr", users: 900 },
  { name: "May", users: 1200 },
  { name: "Jun", users: 1500 },
];

const recentUsers = [
  { id: 1, name: "Maria Silva", email: "maria@example.com", status: "active", date: "2026-08-17" },
  { id: 2, name: "João Santos", email: "joao@example.com", status: "pending", date: "2026-08-16" },
  { id: 3, name: "Ana Costa", email: "ana@example.com", status: "active", date: "2026-08-15" },
  { id: 4, name: "Pedro Lima", email: "pedro@example.com", status: "inactive", date: "2026-08-14" },
];

const columns = [
  { header: "Name", accessorKey: "name", className: "font-medium" },
  { header: "Email", accessorKey: "email", className: "text-amf-muted-600" },
  { header: "Date", accessorKey: "date" },
  { 
    header: "Status", 
    cell: (row: any) => (
      <StatusBadge 
        variant={
          row.status === "active" ? "success" : 
          row.status === "pending" ? "warning" : "neutral"
        }
      >
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </StatusBadge>
    )
  },
];

export default function DashboardCharts() {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-amf-surface p-6 rounded-2xl border border-amf-border shadow-sm">
          <h3 className="text-lg font-bold text-amf-ink-900 mb-6">User Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #D9D1C4', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#59BFAE" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#59BFAE', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-amf-surface p-6 rounded-2xl border border-amf-border shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-amf-ink-900 mb-4">Quick Actions</h3>
          <div className="flex-1 flex flex-col gap-3">
            <button className="p-4 rounded-xl border border-amf-border hover:border-amf-teal-400 hover:bg-amf-teal-400/5 transition-all text-left group">
              <h4 className="font-medium text-amf-ink-900 group-hover:text-amf-teal-400 transition-colors">Add new user</h4>
              <p className="text-sm text-amf-muted-600 mt-1">Manually invite a user to the platform</p>
            </button>
            <button className="p-4 rounded-xl border border-amf-border hover:border-amf-teal-400 hover:bg-amf-teal-400/5 transition-all text-left group">
              <h4 className="font-medium text-amf-ink-900 group-hover:text-amf-teal-400 transition-colors">Review cases</h4>
              <p className="text-sm text-amf-muted-600 mt-1">3 pending cases require your attention</p>
            </button>
            <button className="p-4 rounded-xl border border-amf-border hover:border-amf-teal-400 hover:bg-amf-teal-400/5 transition-all text-left group">
              <h4 className="font-medium text-amf-ink-900 group-hover:text-amf-teal-400 transition-colors">System settings</h4>
              <p className="text-sm text-amf-muted-600 mt-1">Configure platform parameters</p>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-amf-ink-900">Recent Users</h3>
        <DataTable columns={columns} data={recentUsers} />
      </div>
    </>
  );
}
