'use client';

// Componente client para renderizar o LoadingOverlay global

import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useLoadingStore } from '@/store/useLoadingStore';

export function GlobalLoading() {
  const { isVisible, message } = useLoadingStore();
  return <LoadingOverlay visible={isVisible} message={message} />;
}
