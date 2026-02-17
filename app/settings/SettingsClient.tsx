'use client';

import Header from '@/components/layout/Header';
import SettingsForm from '@/components/tabs/SettingsForm';

export default function SettingsClient() {
  return (
    <>
      <Header title="Настройки" />
      <SettingsForm />
    </>
  );
}
