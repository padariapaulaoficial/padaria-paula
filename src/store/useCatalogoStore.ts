// Store para o Carrinho do Catálogo Público
// Gerencia os itens selecionados pelo cliente

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ItemCatalogo {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnit: number;
  tipoVenda: 'KG' | 'UNIDADE';
  tamanho?: string;
  observacao?: string;
  subtotal: number;
}

export interface ClienteCatalogo {
  nome: string;
  telefone: string;
  dataEntrega: string;
  horarioEntrega: string;
  observacoes?: string;
}

interface CatalogoState {
  itens: ItemCatalogo[];
  cliente: ClienteCatalogo;
  etapa: 'catalogo' | 'carrinho' | 'dados' | 'confirmacao';

  // Ações
  adicionarItem: (item: ItemCatalogo) => void;
  removerItem: (index: number) => void;
  atualizarQuantidade: (index: number, quantidade: number) => void;
  atualizarObservacao: (index: number, observacao: string) => void;
  limparCarrinho: () => void;

  // Cliente
  setCliente: (cliente: ClienteCatalogo) => void;

  // Etapa
  setEtapa: (etapa: 'catalogo' | 'carrinho' | 'dados' | 'confirmacao') => void;

  // Total
  getTotal: () => number;
  getTotalItens: () => number;
}

export const useCatalogoStore = create<CatalogoState>()(
  persist(
    (set, get) => ({
      itens: [],
      cliente: {
        nome: '',
        telefone: '',
        dataEntrega: '',
        horarioEntrega: '',
        observacoes: '',
      },
      etapa: 'catalogo',

      adicionarItem: (item) => {
        const itens = get().itens;
        const existente = itens.findIndex(
          (i) => i.produtoId === item.produtoId && i.tamanho === item.tamanho
        );

        if (existente >= 0) {
          // Atualizar quantidade se já existe
          const novosItens = [...itens];
          const novaQtd = novosItens[existente].quantidade + item.quantidade;
          novosItens[existente] = {
            ...novosItens[existente],
            quantidade: novaQtd,
            subtotal: novaQtd * novosItens[existente].valorUnit,
          };
          set({ itens: novosItens });
        } else {
          set({ itens: [...itens, item] });
        }
      },

      removerItem: (index) => {
        const itens = get().itens;
        set({ itens: itens.filter((_, i) => i !== index) });
      },

      atualizarQuantidade: (index, quantidade) => {
        const itens = get().itens;
        if (quantidade <= 0) {
          set({ itens: itens.filter((_, i) => i !== index) });
        } else {
          const novosItens = [...itens];
          novosItens[index] = {
            ...novosItens[index],
            quantidade,
            subtotal: quantidade * novosItens[index].valorUnit,
          };
          set({ itens: novosItens });
        }
      },

      atualizarObservacao: (index, observacao) => {
        const itens = get().itens;
        const novosItens = [...itens];
        novosItens[index] = { ...novosItens[index], observacao };
        set({ itens: novosItens });
      },

      limparCarrinho: () => {
        set({
          itens: [],
          cliente: {
            nome: '',
            telefone: '',
            dataEntrega: '',
            horarioEntrega: '',
            observacoes: '',
          },
          etapa: 'catalogo',
        });
      },

      setCliente: (cliente) => set({ cliente }),

      setEtapa: (etapa) => set({ etapa }),

      getTotal: () => {
        return get().itens.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getTotalItens: () => {
        return get().itens.reduce((sum, item) => sum + item.quantidade, 0);
      },
    }),
    {
      name: 'catalogo-carrinho',
      partialize: (state) => ({
        itens: state.itens,
        cliente: state.cliente,
      }),
    }
  )
);
