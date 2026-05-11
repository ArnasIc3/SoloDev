import { statCardColors } from "@/lib/styles";

interface StatCardProps {
  label: string;
  value: number;
  color?: keyof typeof statCardColors;
}

export function StatCard({ label, value, color = "zinc" }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${statCardColors[color]}`}>
      <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
