import type { Metadata } from 'next';
import CrudPage, { type CrudConfig } from '@/app/components/CrudPage';

export const metadata: Metadata = { title: 'Юр. лицо' };

const config: CrudConfig = {
  title: 'Юридические лица',
  entity: 'legal-entities',
  fields: [
    { key: 'name',         label: 'Название',            type: 'text', required: true },
    { key: 'bin',          label: 'БИН',                 type: 'text' },
    { key: 'address',      label: 'Адрес',               type: 'text' },
    { key: 'bank_details', label: 'Банковские реквизиты', type: 'textarea' },
  ],
  tableKeys: ['name', 'bin', 'address'],
};

export default function LegalEntitiesPage() { return <CrudPage config={config} />; }
