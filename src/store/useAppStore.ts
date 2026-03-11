// Store principal da aplicação - Padaria Paula
// Gerencia navegação e estado geral

import { create } from 'zustand';

export type Tela = 'produtos' | 'resumo' | 'impressao' | 'historico' | 'admin' | 'clientes' | 'entregas' | 'orcamentos' | 'novo-orcamento';

interface AppState {
  telaAtual: Tela;
  setTela: (tela: Tela) => void;
  
  // Pedido recém-criado para impressão
  pedidoParaImpressao: string | null;
  setPedidoParaImpressao: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  telaAtual: 'clientes', // Tela inicial
  setTela: (tela) => set({ telaAtual: tela }),
  
  pedidoParaImpressao: null,
  setPedidoParaImpressao: (id) => set({ pedidoParaImpressao: id }),
}));
