// Store do pedido atual - Padaria Paula
// Gerencia cliente, carrinho, entrega e cálculos

import { create } from 'zustand';

// ============================================
// ORDEM DE CATEGORIAS - REGRA OBRIGATÓRIA:
// 1. TORTAS E TABUAS
// 2. BOLOS E CUCA
// 3. SALGADOS FRITOS
// 4. SALGADOS ASSADOS
// 5. DOCES FOLHADOS
// 6. DOCES
// 7. PAES
// 8. BEBIDAS
// 9. DESCARTAVEIS
// 10. OUTROS
// ============================================
export const ORDEM_CATEGORIAS: Record<string, number> = {
  // 0. TORTAS ESPECIAIS (com tamanho) - sempre primeiro
  'TORTA ESPECIAL': 0,
  'TORTAS ESPECIAIS': 0,
  
  // 1. TORTAS E TABUAS
  'TORTAS E TABUAS': 1,
  'TORTA E TABUA': 1,
  'TORTAS': 1,
  'TORTA': 1,
  'TABUAS': 1,
  'TABUA': 1,
  
  // 2. BOLOS E CUCA
  'BOLOS E CUCA': 2,
  'BOLO E CUCA': 2,
  'BOLOS': 2,
  'BOLO': 2,
  'CUCAS': 2,
  'CUCA': 2,
  
  // 3. SALGADOS FRITOS
  'SALGADOS FRITOS': 3,
  'SALGADO FRITO': 3,
  'FRITOS': 3,
  'FRITO': 3,
  
  // 4. SALGADOS ASSADOS
  'SALGADOS ASSADOS': 4,
  'SALGADO ASSADO': 4,
  'ASSADOS': 4,
  'ASSADO': 4,
  
  // 5. DOCES FOLHADOS
  'DOCES FOLHADOS': 5,
  'DOCE FOLHADO': 5,
  'FOLHADOS': 5,
  'FOLHADO': 5,
  
  // 6. DOCES
  'DOCES': 6,
  'DOCE': 6,
  'DOCINHOS': 6,
  'DOCINHO': 6,
  
  // 7. PAES
  'PÃES': 7,
  'PAES': 7,
  'PÃO': 7,
  'PAO': 7,
  
  // 8. BEBIDAS
  'BEBIDAS': 8,
  'BEBIDA': 8,
  
  // 9. DESCARTAVEIS
  'DESCARTÁVEIS': 9,
  'DESCARTAVEIS': 9,
  
  // 10. OUTROS
  'OUTROS': 10,
  'OUTRO': 10,
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
export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  quantidadePedida: number; // Quantidade original pedida
  quantidade: number;       // Quantidade final (ajustada para KG)
  valorUnit: number;
  tipoVenda: 'KG' | 'UNIDADE';
  tipoProduto?: 'NORMAL' | 'ESPECIAL'; // Tipo do produto para edição
  precosTamanhos?: Record<string, number> | null; // Preços por tamanho para edição
  subtotalPedida: number;   // Subtotal original
  subtotal: number;         // Subtotal final
  observacao?: string;
  tamanho?: string;         // Tamanho para produtos especiais (PP, P, M, G)
  categoria?: string | null; // Categoria do produto para ordenação
}

// Função para obter ordem de categoria
export function obterOrdemCategoria(categoria: string | null | undefined): number {
  if (!categoria) return 99;
  const catUpper = categoria.toUpperCase().trim();
  
  // Busca exata primeiro
  if (ORDEM_CATEGORIAS[catUpper] !== undefined) {
    return ORDEM_CATEGORIAS[catUpper];
  }
  
  // Busca parcial
  for (const [key, ordem] of Object.entries(ORDEM_CATEGORIAS)) {
    if (catUpper.includes(key) || key.includes(catUpper)) {
      return ordem;
    }
  }
  
  return 99;
}

// Função para ordenar itens por categoria
export function ordenarItensPorCategoria<T extends { categoria?: string | null; tamanho?: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => {
    // Tortas especiais (com tamanho) primeiro
    const temTamanhoA = a.tamanho ? 0 : 1;
    const temTamanhoB = b.tamanho ? 0 : 1;
    if (temTamanhoA !== temTamanhoB) return temTamanhoA - temTamanhoB;
    
    // Depois ordenar por categoria
    const ordemA = obterOrdemCategoria(a.categoria);
    const ordemB = obterOrdemCategoria(b.categoria);
    return ordemA - ordemB;
  });
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
  
  // ADICIONAR ITEM - ORDENA AUTOMATICAMENTE
  adicionarItem: (item) => {
    // Adicionar novo item e ORDENAR por categoria
    const novosItens = [...get().itens, item];
    const itensOrdenados = ordenarItensPorCategoria(novosItens);
    const total = itensOrdenados.reduce((sum, i) => sum + i.subtotal, 0);
    const totalPedida = itensOrdenados.reduce((sum, i) => sum + i.subtotalPedida, 0);
    set({ 
      itens: itensOrdenados, 
      total: Math.round(total * 100) / 100,
      totalPedida: Math.round(totalPedida * 100) / 100,
    });
  },
  
  // REMOVER ITEM - REORDENA APÓS REMOÇÃO
  removerItem: (index) => {
    const itens = get().itens.filter((_, i) => i !== index);
    // Reordenar após remoção
    const itensOrdenados = ordenarItensPorCategoria(itens);
    const total = itensOrdenados.reduce((sum, i) => sum + i.subtotal, 0);
    const totalPedida = itensOrdenados.reduce((sum, i) => sum + i.subtotalPedida, 0);
    set({ 
      itens: itensOrdenados, 
      total: Math.round(total * 100) / 100,
      totalPedida: Math.round(totalPedida * 100) / 100,
    });
  },
  
  // ATUALIZAR ITEM - REORDENA APÓS ATUALIZAÇÃO
  atualizarItem: (index, itemAtualizado) => {
    const itens = [...get().itens];
    itens[index] = { ...itens[index], ...itemAtualizado };
    // Reordenar após atualização
    const itensOrdenados = ordenarItensPorCategoria(itens);
    const total = itensOrdenados.reduce((sum, i) => sum + i.subtotal, 0);
    const totalPedida = itensOrdenados.reduce((sum, i) => sum + i.subtotalPedida, 0);
    set({ 
      itens: itensOrdenados, 
      total: Math.round(total * 100) / 100,
      totalPedida: Math.round(totalPedida * 100) / 100,
    });
  },
  
  // Atualizar peso final para produtos KG - REORDENA
  atualizarPesoFinal: (index, pesoFinal) => {
    const itensAtualizados = [...get().itens];
    const item = itensAtualizados[index];
    
    if (item && item.tipoVenda === 'KG') {
      const novoSubtotal = pesoFinal * item.valorUnit;
      itensAtualizados[index] = {
        ...item,
        quantidade: pesoFinal,
        subtotal: Math.round(novoSubtotal * 100) / 100,
      };
      
      // Reordenar após atualização
      const itensOrdenados = ordenarItensPorCategoria(itensAtualizados);
      const total = itensOrdenados.reduce((sum, i) => sum + i.subtotal, 0);
      set({ 
        itens: itensOrdenados, 
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
