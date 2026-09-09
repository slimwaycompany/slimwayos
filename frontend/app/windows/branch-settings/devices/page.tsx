import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Аппараты' };

const config: CrudConfig = {
  title: 'Аппараты',
  entity: 'devices',
  fields: [
    { key: 'name',          label: 'Название',     type: 'text',   required: true },
    { key: 'device_type',   label: 'Тип аппарата', type: 'text' },
    { key: 'serial_number', label: 'Серийный номер', type: 'text' },
    { key: 'status',        label: 'Статус',       type: 'select', required: true,
      options: [
        { value: 'active',      label: 'Активен' },
        { value: 'maintenance', label: 'На обслуживании' },
        { value: 'broken',      label: 'Сломан' },
      ] },
  ],
  tableKeys: ['name', 'device_type', 'serial_number', 'status'],
};

export default function DevicesPage() { return <CrudPage config={config} />; }
