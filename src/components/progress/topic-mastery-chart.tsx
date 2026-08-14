"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import type { TopicMastery } from "@/lib/types/database.types";

export function TopicMasteryChart({ data }: { data: TopicMastery[] }) {
  return (
    <div className="card p-4" style={{ height: Math.max(240, data.length * 42) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24 }}>
          <CartesianGrid horizontal={false} stroke="#C9C2AE55" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="topic_name"
            width={140}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, _name, item) => [
              `${value}% (${item.payload.correct}/${item.payload.total})`,
              "Accuracy",
            ]}
          />
          <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.topic_id}
                fill={entry.accuracy < 70 ? "#B5533C" : "#4B6B53"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
