'use client';

import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import ChangelogPopup from './ChangelogPopup';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
        <ChangelogPopup />
      </NotificationProvider>
    </AuthProvider>
  );
}
