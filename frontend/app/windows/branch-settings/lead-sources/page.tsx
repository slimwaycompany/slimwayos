import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Рекламные источники' };

const config: CrudConfig = {
  title: 'Рекламные источники',
  entity: 'lead-sources',
  fields: [
    { key: 'name', label: 'Название', type: 'text', required: true },
  ],
  tableKeys: ['name'],
};

export default function LeadSourcesPage() { return <CrudPage config={config} />; }
