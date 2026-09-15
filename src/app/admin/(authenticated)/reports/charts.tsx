"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
export function MetricsCharts({
  data,
}: {
  data: { name: string; revenue: number; users: number }[];
}) {
  return (
    <div
      className="h-80 w-full"
      role="img"
      aria-label="Receita em reais e novos cadastros por mês"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#eee8df" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="money" />
          <YAxis yAxisId="people" orientation="right" allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar
            yAxisId="money"
            dataKey="revenue"
            name="Receita (R$)"
            fill="#0f615f"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            yAxisId="people"
            dataKey="users"
            name="Cadastros"
            fill="#bda66a"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
