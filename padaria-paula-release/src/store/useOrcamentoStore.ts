// Store do orçamento atual - Padaria Paula
// Gerencia cliente, carrinho, entrega e cálculos para orçamentos

import { create } from 'zustand';

// Tipos - apenas KG e UNIDADE
export interface ItemOrcamentoCarrinho {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnit: number;
  tipoVenda: 'KG' | 'UNIDADE';
  subtotal: number;
  observacao?: string;
  tamanho?: string; // Tamanho para produtos especiais (P, M, G, GG)
}

// Dados do cliente (apenas para seleção)
export interface ClienteOrcamento {
  id: string;
  nome: string;
  telefone: string;
  cpfCnpj: string | null;
  tipoPessoa: 'CPF' | 'CNPJ';
  endereco?: string | null;
  bairro?: string | null;
}

// Dados de entrega (do orçamento, não do cliente)
export interface DadosEntregaOrcamento {
  tipoEntrega: 'RETIRA' | 'TELE_ENTREGA';
  dataEntrega: string; // OBRIGATÓRIO
  horarioEntrega: string; // Horário de entrega
  enderecoEntrega: string;
  bairroEntrega: string;
}

interface OrcamentoState {
  // Cliente selecionado
  cliente: ClienteOrcamento | null;
  setCliente: (cliente: ClienteOrcamento) => void;
  clearCliente: () => void;
  
  // Dados de entrega (do orçamento)
  entrega: DadosEntregaOrcamento;
  setEntrega: (entrega: Partial<DadosEntregaOrcamento>) => void;
  
  // Carrinho
  itens: ItemOrcamentoCarrinho[];
  adicionarItem: (item: ItemOrcamentoCarrinho) => void;
  removerItem: (index: number) => void;
  atualizarItem: (index: number, item: Partial<ItemOrcamentoCarrinho>) => void;
  atualizarQuantidade: (index: number, quantidade: number) => void;
  clearCarrinho: () => void;
  
  // Observações do orçamento
  observacoes: string;
  setObservacoes: (obs: string) => void;
  
  // Cálculos
  total: number;
  
  // Reset completo
  resetOrcamento: () => void;
}

const entregaInicial: DadosEntregaOrcamento = {
  tipoEntrega: 'RETIRA',
  dataEntrega: '',
  horarioEntrega: '',
  enderecoEntrega: '',
  bairroEntrega: '',
};

export const useOrcamentoStore = create<OrcamentoState>((set, get) => ({
  cliente: null,
  setCliente: (cliente) => set({ cliente }),
  clearCliente: () => set({ cliente: null }),
  
  entrega: entregaInicial,
  setEntrega: (novosDados) => set((state) => ({
    entrega: { ...state.entrega, ...novosDados }
  })),
  
  itens: [],
  observacoes: '',
  setObservacoes: (observacoes) => set({ observacoes }),
  
  adicionarItem: (item) => {
    const itens = [...get().itens, item];
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
    });
  },
  
  removerItem: (index) => {
    const itens = get().itens.filter((_, i) => i !== index);
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
    });
  },
  
  atualizarItem: (index, itemAtualizado) => {
    const itens = [...get().itens];
    itens[index] = { ...itens[index], ...itemAtualizado };
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
    });
  },
  
  // Atualizar quantidade e recalcular subtotal
  atualizarQuantidade: (index, quantidade) => {
    const itens = [...get().itens];
    const item = itens[index];
    
    if (item) {
      const novoSubtotal = quantidade * item.valorUnit;
      itens[index] = {
        ...item,
        quantidade,
        subtotal: Math.round(novoSubtotal * 100) / 100,
      };
      
      const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
      set({ 
        itens, 
        total: Math.round(total * 100) / 100,
      });
    }
  },
  
  clearCarrinho: () => set({ itens: [], total: 0 }),
  
  total: 0,
  
  resetOrcamento: () => set({
    cliente: null,
    entrega: entregaInicial,
    itens: [],
    observacoes: '',
    total: 0,
  }),
}));

// Utilitários para cálculos - apenas KG e UNIDADE
export function calcularSubtotalOrcamento(
  quantidade: number,
  valorUnit: number,
  tipoVenda: 'KG' | 'UNIDADE'
): number {
  const subtotal = quantidade * valorUnit;
  return Math.round(subtotal * 100) / 100;
}

export function formatarQuantidadeOrcamento(
  quantidade: number,
  tipoVenda: 'KG' | 'UNIDADE'
): string {
  switch (tipoVenda) {
    case 'KG':
      const kgStr = quantidade % 1 === 0 
        ? quantidade.toString() 
        : quantidade.toFixed(3).replace(/\.?0+$/, '');
      return `${kgStr.replace('.', ',')}kg`;
    case 'UNIDADE':
    default:
      return `${Math.round(quantidade)}x`;
  }
}

export function formatarMoedaOrcamento(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}
