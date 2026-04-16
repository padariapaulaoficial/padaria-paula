'use client';

// Hook para fazer fetch com loading automático
// Use este hook para todas as operações que precisam mostrar o loading overlay

import { useCallback } from 'react';
import { useLoadingStore } from '@/store/useLoadingStore';

interface FetchOptions extends RequestInit {
  loadingMessage?: string;
}

export function useLoadingFetch() {
  const { showLoading, hideLoading } = useLoadingStore();

  const loadingFetch = useCallback(async <T,>(
    url: string,
    options?: FetchOptions
  ): Promise<T> => {
    const { loadingMessage = 'Atualizando...', ...fetchOptions } = options || {};
    
    try {
      showLoading(loadingMessage);
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}`);
      }
      
      return data;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  // Função para envolver qualquer promise com loading
  const withLoading = useCallback(async <T,>(
    promise: Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      showLoading(message || 'Atualizando...');
      const result = await promise;
      return result;
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  return { loadingFetch, withLoading, showLoading, hideLoading };
}
