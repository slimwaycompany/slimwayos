'use client';

import { useState, useEffect } from 'react';
import { Country, City } from 'country-state-city';
import { getExampleNumber } from 'libphonenumber-js';
import type { CountryCode, Examples } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';

const STORAGE_KEY = 'slimway_location';

interface LocationData {
  country: string;
  countryCode: string;
  city: string;
  timezone: string;
  lat: number | null;
  lon: number | null;
  phoneFormat: string;
}

export default function LocationPage() {
  const [countryCode, setCountryCode] = useState('');
  const [cityName, setCityName]       = useState('');
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as LocationData;
    setCountryCode(data.countryCode ?? '');
    setCityName(data.city ?? '');
  }, []);

  const countries      = Country.getAllCountries();
  const selectedCountry = countries.find((c) => c.isoCode === countryCode);
  const cities         = countryCode ? (City.getCitiesOfCountry(countryCode) ?? []) : [];
  const selectedCity   = cities.find((c) => c.name === cityName);

  const timezone = selectedCountry?.timezones?.[0]?.gmtOffsetName ?? '—';

  let phoneFormat = '—';
  try {
    if (countryCode) {
      const ex = getExampleNumber(
        countryCode as CountryCode,
        examples as unknown as Examples,
      );
      phoneFormat = ex ? ex.formatInternational() : '—';
    }
  } catch {
    phoneFormat = '—';
  }

  const handleSave = () => {
    const data: LocationData = {
      country:     selectedCountry?.name ?? '',
      countryCode,
      city:        cityName,
      timezone,
      lat:         selectedCity?.latitude  ? parseFloat(selectedCity.latitude)  : null,
      lon:         selectedCity?.longitude ? parseFloat(selectedCity.longitude) : null,
      phoneFormat,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 max-w-sm">
      <h2 className="text-subheading text-white mb-6">Локация</h2>

      <div className="flex flex-col gap-4">
        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption text-gray-400">Страна</label>
          <select
            value={countryCode}
            onChange={(e) => { setCountryCode(e.target.value); setCityName(''); }}
            className="glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none w-full cursor-pointer"
            style={{ background: '#0d0d1a' }}
          >
            <option value="">— выберите страну —</option>
            {countries.map((c) => (
              <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption text-gray-400">Город</label>
          <select
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            disabled={!countryCode}
            className="glass rounded-xl px-4 py-2.5 text-body text-gray-200 outline-none w-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#0d0d1a' }}
          >
            <option value="">— выберите город —</option>
            {cities.map((c) => (
              <option key={`${c.name}-${c.stateCode}`} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Timezone (read-only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption text-gray-400">Часовой пояс</label>
          <div className="glass rounded-xl px-4 py-2.5 text-body text-gray-400">{timezone}</div>
        </div>

        {/* Phone format (read-only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-caption text-gray-400">Формат телефона</label>
          <div className="glass rounded-xl px-4 py-2.5 text-body text-gray-400">{phoneFormat}</div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!countryCode || !cityName}
          className="mt-2 rounded-xl bg-teal px-6 py-2.5 text-body font-semibold text-gray-950 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved ? 'Сохранено ✓' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
