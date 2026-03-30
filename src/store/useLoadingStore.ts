import { create } from 'zustand';

// Store global para gerenciar loading overlay
// Usado para mostrar animação durante operações com delay

interface LoadingState {
  isVisible: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isVisible: false,
  message: 'Atualizando...',
  showLoading: (message = 'Atualizando...') => set({ isVisible: true, message }),
  hideLoading: () => set({ isVisible: false }),
}));

// Hook helper para usar em operações async
export function useLoading() {
  const { showLoading, hideLoading } = useLoadingStore();

  // Executa uma função async mostrando o loading
  const withLoading = async <T,>(
    fn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      showLoading(message);
      const result = await fn();
      return result;
    } finally {
      hideLoading();
    }
  };

  return { showLoading, hideLoading, withLoading };
}
