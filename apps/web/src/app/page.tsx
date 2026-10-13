'use client';

import React from 'react';
import { BootSequence } from '@/features/splash/BootSequence';

export default function RootPage() {
  return <BootSequence autoRoute={true} />;
}
