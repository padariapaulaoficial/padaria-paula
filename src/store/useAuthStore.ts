import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  autenticado: boolean;
  login: (senha: string) => Promise<boolean>;
  logout: () => void;
  verificarAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      autenticado: false,

      login: async (senha: string) => {
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha }),
          });

          const data = await res.json();

          if (data.autenticado) {
            set({ autenticado: true });
            return true;
          }

          return false;
        } catch (error) {
          console.error('Erro no login:', error);
          return false;
        }
      },

      logout: () => {
        set({ autenticado: false });
      },

      verificarAuth: async () => {
        try {
          const res = await fetch('/api/auth');
          const data = await res.json();
          set({ autenticado: data.autenticado });
          return data.autenticado;
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          return false;
        }
      },
    }),
    {
      name: 'padaria-auth',
      partialize: (state) => ({ autenticado: state.autenticado }),
    }
  )
);
