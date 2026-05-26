import { statCardColors } from "@/lib/styles";

interface StatCardProps {
  label: string;
  value: number;
  color?: keyof typeof statCardColors;
}

export function StatCard({ label, value, color = "zinc" }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm dark:shadow-none ${statCardColors[color]}`}>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
