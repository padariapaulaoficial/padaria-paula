import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  autenticado: boolean;
  login: (senha: string) => Promise<boolean>;
  logout: () => void;
  verificarAuth: () => Promise<boolean>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      autenticado: false,

      login: async (senha: string) => {
        try {
          const res = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha, tipo: 'admin' }),
          });

          const data = await res.json();

          if (data.autenticado) {
            set({ autenticado: true });
            return true;
          }

          return false;
        } catch (error) {
          console.error('Erro no login admin:', error);
          return false;
        }
      },

      logout: () => {
        set({ autenticado: false });
      },

      verificarAuth: async () => {
        try {
          const res = await fetch('/api/auth?tipo=admin');
          const data = await res.json();
          set({ autenticado: data.autenticado });
          return data.autenticado;
        } catch (error) {
          console.error('Erro ao verificar autenticação admin:', error);
          return false;
        }
      },
    }),
    {
      name: 'padaria-admin-auth',
      partialize: (state) => ({ autenticado: state.autenticado }),
    }
  )
);
