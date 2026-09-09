import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'HR' };

export default function HrPage() {
  return (
    <div className="flex h-full items-center justify-center text-gray-400">
      HR — в разработке
    </div>
  );
}
