import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Слоты' };

const config: CrudConfig = {
  title: 'Слоты под аппараты',
  entity: 'device-slots',
  fields: [
    { key: 'device_id',    label: 'Аппарат',             type: 'text', asyncEntity: 'devices', required: true },
    { key: 'duration_min', label: 'Длительность слота (мин)', type: 'number', required: true },
    { key: 'work_start',   label: 'Начало работы',       type: 'time' },
    { key: 'work_end',     label: 'Конец работы',        type: 'time' },
  ],
  tableKeys: ['device_id', 'duration_min', 'work_start', 'work_end'],
};

export default function DeviceSlotsPage() { return <CrudPage config={config} />; }
