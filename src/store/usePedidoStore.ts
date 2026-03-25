// Store do pedido atual - Padaria Paula
// Gerencia cliente, carrinho, entrega e cálculos

import { create } from 'zustand';

// Tipos - apenas KG e UNIDADE
export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  quantidadePedida: number; // Quantidade original pedida
  quantidade: number;       // Quantidade final (ajustada para KG)
  valorUnit: number;
  tipoVenda: 'KG' | 'UNIDADE';
  subtotalPedida: number;   // Subtotal original
  subtotal: number;         // Subtotal final
  observacao?: string;
  tamanho?: string;         // Tamanho para produtos especiais (P, M, G, GG)
}

// Dados do cliente (apenas para seleção)
export interface ClienteSelecionado {
  id: string;
  nome: string;
  telefone: string;
  cpfCnpj: string | null;
  tipoPessoa: 'CPF' | 'CNPJ';
  endereco?: string | null;
  bairro?: string | null;
}

// Dados de entrega (do pedido, não do cliente)
export interface DadosEntrega {
  tipoEntrega: 'RETIRA' | 'TELE_ENTREGA';
  dataEntrega: string; // OBRIGATÓRIO
  horarioEntrega: string; // Horário de entrega
  enderecoEntrega: string;
  bairroEntrega: string;
  valorTeleEntrega: number; // Valor da taxa de tele-entrega
}

interface PedidoState {
  // Cliente selecionado
  cliente: ClienteSelecionado | null;
  setCliente: (cliente: ClienteSelecionado) => void;
  clearCliente: () => void;
  
  // Dados de entrega (do pedido)
  entrega: DadosEntrega;
  setEntrega: (entrega: Partial<DadosEntrega>) => void;
  
  // Carrinho
  itens: ItemCarrinho[];
  adicionarItem: (item: ItemCarrinho) => void;
  removerItem: (index: number) => void;
  atualizarItem: (index: number, item: Partial<ItemCarrinho>) => void;
  atualizarPesoFinal: (index: number, pesoFinal: number) => void;
  clearCarrinho: () => void;
  
  // Observações do pedido
  observacoes: string;
  setObservacoes: (obs: string) => void;
  
  // Cálculos
  total: number;
  totalPedida: number;
  
  // Reset completo
  resetPedido: () => void;
}

const entregaInicial: DadosEntrega = {
  tipoEntrega: 'RETIRA',
  dataEntrega: '',
  horarioEntrega: '',
  enderecoEntrega: '',
  bairroEntrega: '',
  valorTeleEntrega: 0,
};

export const usePedidoStore = create<PedidoState>((set, get) => ({
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
  totalPedida: 0,
  
  adicionarItem: (item) => {
    const itens = [...get().itens, item];
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    const totalPedida = itens.reduce((sum, i) => sum + i.subtotalPedida, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
      totalPedida: Math.round(totalPedida * 100) / 100,
    });
  },
  
  removerItem: (index) => {
    const itens = get().itens.filter((_, i) => i !== index);
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    const totalPedida = itens.reduce((sum, i) => sum + i.subtotalPedida, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
      totalPedida: Math.round(totalPedida * 100) / 100,
    });
  },
  
  atualizarItem: (index, itemAtualizado) => {
    const itens = [...get().itens];
    itens[index] = { ...itens[index], ...itemAtualizado };
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    const totalPedida = itens.reduce((sum, i) => sum + i.subtotalPedida, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
      totalPedida: Math.round(totalPedida * 100) / 100,
    });
  },
  
  // Atualizar peso final para produtos KG
  atualizarPesoFinal: (index, pesoFinal) => {
    const itens = [...get().itens];
    const item = itens[index];
    
    if (item && item.tipoVenda === 'KG') {
      const novoSubtotal = pesoFinal * item.valorUnit;
      itens[index] = {
        ...item,
        quantidade: pesoFinal,
        subtotal: Math.round(novoSubtotal * 100) / 100,
      };
      
      const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
      set({ 
        itens, 
        total: Math.round(total * 100) / 100,
      });
    }
  },
  
  clearCarrinho: () => set({ itens: [], total: 0, totalPedida: 0 }),
  
  total: 0,
  
  resetPedido: () => set({
    cliente: null,
    entrega: entregaInicial,
    itens: [],
    observacoes: '',
    total: 0,
    totalPedida: 0,
  }),
}));

// Utilitários para cálculos - apenas KG e UNIDADE
export function calcularSubtotal(
  quantidade: number,
  valorUnit: number,
  tipoVenda: 'KG' | 'UNIDADE'
): number {
  const subtotal = quantidade * valorUnit;
  return Math.round(subtotal * 100) / 100;
}

export function formatarQuantidade(
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

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}
