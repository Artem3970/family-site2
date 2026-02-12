'use client';

import { Suspense } from 'react';
import LoginContent from './LoginContent';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
