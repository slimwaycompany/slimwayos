import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Причины отказов' };

const config: CrudConfig = {
  title: 'Причины отказов',
  entity: 'decline-reasons',
  fields: [
    { key: 'name', label: 'Название', type: 'text', required: true },
  ],
  tableKeys: ['name'],
};

export default function DeclineReasonsPage() { return <CrudPage config={config} />; }
