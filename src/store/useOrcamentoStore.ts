// Store do orçamento atual - Padaria Paula
// Gerencia cliente, carrinho, entrega e cálculos para orçamentos

import { create } from 'zustand';

// ============================================
// ORDEM DE CATEGORIAS - REGRA OBRIGATÓRIA:
// 1. TORTAS ESPECIAIS (0)
// 2. TORTAS (1)
// 3. SALGADINHOS (2)
// 4. SALGADOS (3)
// 5. DOCINHOS (4)
// 6. DOCES (5)
// 7. BEBIDAS (6)
// 8. OUTROS (99)
// ============================================
const ORDEM_CATEGORIAS: Record<string, number> = {
  // 1. TORTAS ESPECIAIS
  'TORTA ESPECIAL': 0,
  'TORTAS ESPECIAIS': 0,
  
  // 2. TORTAS
  'TORTAS': 1,
  'TORTA': 1,
  
  // 3. SALGADINHOS
  'SALGADINHOS': 2,
  'SALGADINHO': 2,
  
  // 4. SALGADOS
  'SALGADOS': 3,
  'SALGADO': 3,
  
  // 5. DOCINHOS
  'DOCINHOS': 4,
  'DOCINHO': 4,
  
  // 6. DOCES
  'DOCES': 5,
  'DOCE': 5,
  
  // 7. BEBIDAS
  'BEBIDAS': 6,
  'BEBIDA': 6,
  
  // 8. OUTROS
  'OUTROS': 99,
  'OUTRO': 99,
};

// Função para obter ordem de um item baseado no nome e tamanho
function obterOrdemItem(nome: string, tamanho?: string): number {
  const nomeUpper = nome.toUpperCase();
  
  // Verificar se é Torta Especial (pelo nome OU se tem tamanho e é torta)
  if (nomeUpper.includes('TORTA ESPECIAL')) {
    return 0;
  }
  
  // Se tem tamanho e o nome contém TORTA, tratar como especial
  if (tamanho && nomeUpper.includes('TORTA')) {
    return 0;
  }
  
  // Buscar categoria pelo nome
  let ordem = 99;
  for (const [cat, ordemCat] of Object.entries(ORDEM_CATEGORIAS)) {
    if (nomeUpper.includes(cat)) {
      ordem = Math.min(ordem, ordemCat);
    }
  }
  
  return ordem;
}

// Função para ordenar itens por categoria - USADA EM TODAS AS OPERAÇÕES
function ordenarItens<T extends { nome: string; tamanho?: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => {
    const ordemA = obterOrdemItem(a.nome, a.tamanho);
    const ordemB = obterOrdemItem(b.nome, b.tamanho);
    
    // Se mesma categoria, ordenar por nome
    if (ordemA === ordemB) {
      return a.nome.localeCompare(b.nome);
    }
    
    return ordemA - ordemB;
  });
}

// Tipos - apenas KG e UNIDADE
export interface ItemOrcamentoCarrinho {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnit: number;
  tipoVenda: 'KG' | 'UNIDADE';
  subtotal: number;
  observacao?: string;
  tamanho?: string; // Tamanho para produtos especiais (PP, P, M, G)
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
  valorTeleEntrega: number; // Valor da taxa de tele-entrega
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
  valorTeleEntrega: 0,
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
  
  // ADICIONAR ITEM - ORDENA AUTOMATICAMENTE
  adicionarItem: (item) => {
    const itens = ordenarItens([...get().itens, item]);
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
    });
  },
  
  // REMOVER ITEM - REORDENA APÓS REMOÇÃO
  removerItem: (index) => {
    const itensFiltrados = get().itens.filter((_, i) => i !== index);
    const itens = ordenarItens(itensFiltrados);
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
    });
  },
  
  // ATUALIZAR ITEM - REORDENA APÓS ATUALIZAÇÃO
  atualizarItem: (index, itemAtualizado) => {
    const itensAtualizados = [...get().itens];
    itensAtualizados[index] = { ...itensAtualizados[index], ...itemAtualizado };
    const itens = ordenarItens(itensAtualizados);
    const total = itens.reduce((sum, i) => sum + i.subtotal, 0);
    set({ 
      itens, 
      total: Math.round(total * 100) / 100,
    });
  },
  
  // Atualizar quantidade e recalcular subtotal - REORDENA
  atualizarQuantidade: (index, quantidade) => {
    const itensAtualizados = [...get().itens];
    const item = itensAtualizados[index];
    
    if (item) {
      const novoSubtotal = quantidade * item.valorUnit;
      itensAtualizados[index] = {
        ...item,
        quantidade,
        subtotal: Math.round(novoSubtotal * 100) / 100,
      };
      
      const itens = ordenarItens(itensAtualizados);
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
