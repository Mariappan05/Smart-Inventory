"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

const data = [
  { name: "Jan", utilization: 85 },
  { name: "Feb", utilization: 88 },
  { name: "Mar", utilization: 92 },
  { name: "Apr", utilization: 89 },
  { name: "May", utilization: 94 },
  { name: "Jun", utilization: 91 },
];

export function UtilizationChart() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const grid = dark ? "#334155" : "#e2e8f0";
  const axis = dark ? "#94a3b8" : "#64748b";
  const line = dark ? "#60a5fa" : "#0f172a";
  const tooltipBg = dark ? "#1e293b" : "#ffffff";
  const tooltipBorder = dark ? "#334155" : "#e2e8f0";
  const tooltipText = dark ? "#f1f5f9" : "#0f172a";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="name" stroke={axis} fontSize={12} />
          <YAxis stroke={axis} fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              color: tooltipText,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)",
            }}
          />
          <Line
            type="monotone"
            dataKey="utilization"
            stroke={line}
            strokeWidth={2}
            dot={{ fill: line, strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
