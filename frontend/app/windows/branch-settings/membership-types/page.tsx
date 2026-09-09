import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Абонементы' };

const config: CrudConfig = {
  title: 'Абонементы',
  entity: 'membership-types',
  fields: [
    { key: 'name',          label: 'Название',           type: 'text',   required: true },
    { key: 'duration_days', label: 'Длительность (дней)', type: 'number', required: true },
    { key: 'visit_count',   label: 'Кол-во посещений',   type: 'number', required: true },
    { key: 'price',         label: 'Цена',               type: 'number', required: true },
  ],
  tableKeys: ['name', 'duration_days', 'visit_count', 'price'],
};

export default function MembershipTypesPage() { return <CrudPage config={config} />; }
