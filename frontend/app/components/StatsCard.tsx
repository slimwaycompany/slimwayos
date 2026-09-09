import { clsx } from 'clsx';

interface StatsCardProps {
  label: string;
  value: string | number;
  unit: string;
  color: string;
}

const colorMap = {
  green: 'bg-green-50 text-green-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  orange: 'bg-orange-50 text-orange-700',
};

export default function StatsCard({ label, value, unit, color }: StatsCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className={clsx('text-3xl font-bold', colorMap[color].split(' ')[1])}>{value}</span>
        <span className="mb-1 text-sm text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
