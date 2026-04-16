'use client';

// CategoriasPDV - Padaria Paula
// Tela inicial do PDV com cards de categorias clicáveis

import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Phone, MapPin, Truck, Store, Calendar,
  Cake, Candy, Cookie, Coffee, Croissant, Refrigerator,
  PartyPopper, MoreHorizontal, ShoppingCart, Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePedidoStore, formatarMoeda } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import ProdutosPorCategoria from './ProdutosPorCategoria';

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
  'Tortas Especiais': 0,
  'TORTAS ESPECIAIS': 0,
  'Torta Especial': 0,
  'TORTA ESPECIAL': 0,
  
  // 2. TORTAS
  'Tortas': 1,
  'TORTAS': 1,
  'Torta': 1,
  'TORTA': 1,
  
  // 3. SALGADINHOS
  'Salgadinhos': 2,
  'SALGADINHOS': 2,
  'Salgadinho': 2,
  'SALGADINHO': 2,
  
  // 4. SALGADOS
  'Salgados': 3,
  'SALGADOS': 3,
  'Salgado': 3,
  'SALGADO': 3,
  
  // 5. DOCINHOS
  'Docinhos': 4,
  'DOCINHOS': 4,
  'Docinho': 4,
  'DOCINHO': 4,
  
  // 6. DOCES
  'Doces': 5,
  'DOCES': 5,
  'Doce': 5,
  'DOCE': 5,
  
  // 7. BEBIDAS
  'Bebidas': 6,
  'BEBIDAS': 6,
  'Bebida': 6,
  'BEBIDA': 6,
  
  // 8. OUTROS
  'Outros': 99,
  'OUTROS': 99,
  'Outro': 99,
  'OUTRO': 99,
};

// Função para obter ordem de uma categoria
function obterOrdemCategoria(categoria: string): number {
  return ORDEM_CATEGORIAS[categoria] ?? ORDEM_CATEGORIAS[categoria.toUpperCase()] ?? 99;
}

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  tipoVenda: 'KG' | 'UNIDADE';
  valorUnit: number;
  categoria: string | null;
  ativo: boolean;
  tipoProduto: 'NORMAL' | 'ESPECIAL';
  tamanhos: string[] | null;
  precosTamanhos: Record<string, number> | null;
}

// Configuração das categorias com ícones e cores
const CONFIG_CATEGORIAS: Record<string, { icon: React.ReactNode; cor: string; bgCor: string }> = {
  'Tortas': {
    icon: <Cake className="w-8 h-8" />,
    cor: 'text-amber-700',
    bgCor: 'bg-amber-50 hover:bg-amber-100'
  },
  'Docinhos': {
    icon: <Candy className="w-8 h-8" />,
    cor: 'text-pink-600',
    bgCor: 'bg-pink-50 hover:bg-pink-100'
  },
  'Salgadinhos': {
    icon: <Cookie className="w-8 h-8" />,
    cor: 'text-orange-600',
    bgCor: 'bg-orange-50 hover:bg-orange-100'
  },
  'Bebidas': {
    icon: <Coffee className="w-8 h-8" />,
    cor: 'text-blue-600',
    bgCor: 'bg-blue-50 hover:bg-blue-100'
  },
  'Pães': {
    icon: <Croissant className="w-8 h-8" />,
    cor: 'text-amber-800',
    bgCor: 'bg-amber-50 hover:bg-amber-100'
  },
  'Frios': {
    icon: <Refrigerator className="w-8 h-8" />,
    cor: 'text-cyan-600',
    bgCor: 'bg-cyan-50 hover:bg-cyan-100'
  },
  'Kits Festa': {
    icon: <PartyPopper className="w-8 h-8" />,
    cor: 'text-purple-600',
    bgCor: 'bg-purple-50 hover:bg-purple-100'
  },
  'Outros': {
    icon: <MoreHorizontal className="w-8 h-8" />,
    cor: 'text-gray-600',
    bgCor: 'bg-gray-50 hover:bg-gray-100'
  },
};

export default function CategoriasPDV() {
  const { itens, cliente, entrega } = usePedidoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  // Verificar se tem cliente
  useEffect(() => {
    if (!cliente) {
      toast({
        title: 'Cliente não informado',
        description: 'Por favor, selecione um cliente primeiro.',
        variant: 'destructive',
      });
      setTela('novo-pedido');
    }
  }, [cliente, setTela, toast]);

  // Carregar produtos
  useEffect(() => {
    fetch('/api/produtos?ativo=true')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProdutos(data);
        } else {
          console.error('API produtos retornou erro:', data);
          setProdutos([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar produtos:', err);
        setProdutos([]);
        setLoading(false);
      });
  }, []);

  // Extrair categorias únicas e contar produtos - ORDENADAS
  const categorias = useMemo(() => {
    const contagem: Record<string, number> = {};
    produtos.forEach(p => {
      const cat = p.categoria || 'Outros';
      contagem[cat] = (contagem[cat] || 0) + 1;
    });
    // Ordenar pela ordem definida
    return Object.entries(contagem)
      .sort((a, b) => obterOrdemCategoria(a[0]) - obterOrdemCategoria(b[0]))
      .map(([nome, qtd]) => ({
        nome,
        quantidade: qtd,
        config: CONFIG_CATEGORIAS[nome] || CONFIG_CATEGORIAS['Outros']
      }));
  }, [produtos]);

  // Produtos da categoria selecionada
  const produtosDaCategoria = useMemo(() => {
    if (!categoriaSelecionada) return [];
    return produtos.filter(p => (p.categoria || 'Outros') === categoriaSelecionada);
  }, [produtos, categoriaSelecionada]);

  // Abrir categoria
  const handleAbrirCategoria = (categoria: string) => {
    setCategoriaSelecionada(categoria);
    setDialogAberto(true);
  };

  // Fechar categoria
  const handleFecharCategoria = () => {
    setDialogAberto(false);
    setCategoriaSelecionada(null);
  };

  // Calcular total
  const total = itens.reduce((sum, item) => sum + item.subtotal, 0);

  // Formatar data de entrega
  const formatarDataEntrega = (data: string) => {
    if (!data) return '';
    return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Cliente Selecionado + Dados de Entrega */}
      {cliente && (
        <Card className="card-padaria border-primary/30 bg-primary/5">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="bg-primary/20 rounded-full p-1.5 sm:p-2 shrink-0">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-primary truncate">{cliente.nome}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {cliente.telefone}
                    </span>
                  </div>
                  {/* Dados de Entrega */}
                  <div className="mt-1 sm:mt-1.5 pt-1 sm:pt-1.5 border-t border-primary/20">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] flex items-center gap-0.5 sm:gap-1 h-5 sm:h-auto px-1 sm:px-2 py-0.5">
                        {entrega.tipoEntrega === 'RETIRA' ? (
                          <>
                            <Store className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Cliente Retira
                          </>
                        ) : (
                          <>
                            <Truck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            Tele Entrega
                          </>
                        )}
                      </Badge>
                      {entrega.dataEntrega && (
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] flex items-center gap-0.5 sm:gap-1 h-5 sm:h-auto px-1 sm:px-2 py-0.5">
                          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {formatarDataEntrega(entrega.dataEntrega)}
                        </Badge>
                      )}
                    </div>
                    {entrega.tipoEntrega === 'TELE_ENTREGA' && entrega.enderecoEntrega && (
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                        <span className="truncate">
                          {entrega.enderecoEntrega}
                          {entrega.bairroEntrega && ` - ${entrega.bairroEntrega}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 px-2 sm:px-2.5 text-[10px] sm:text-xs shrink-0"
                onClick={() => setTela('novo-pedido')}
              >
                <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-1" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Título */}
      <div className="text-center px-2">
        <h2 className="text-base sm:text-lg md:text-xl font-display font-bold text-primary">Selecione uma Categoria</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Toque em uma categoria para ver os produtos</p>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {categorias.map((cat) => (
          <Card
            key={cat.nome}
            className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/30 active:scale-95 ${cat.config.bgCor}`}
            onClick={() => handleAbrirCategoria(cat.nome)}
          >
            <CardContent className="p-2 sm:p-3 md:p-4 flex flex-col items-center justify-center text-center">
              <div className={`${cat.config.cor} mb-1 sm:mb-2`}>
                {React.cloneElement(cat.config.icon as React.ReactElement, { 
                  className: 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8' 
                })}
              </div>
              <h3 className={`font-semibold text-xs sm:text-sm ${cat.config.cor}`}>{cat.nome}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{cat.quantidade} produtos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo do Carrinho */}
      {itens.length > 0 && (
        <Card className="card-padaria border-primary/30 bg-primary/5">
          <CardContent className="p-2 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-primary rounded-full p-1.5 sm:p-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-primary">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'} no carrinho
                  </p>
                  <p className="text-base sm:text-lg font-bold text-primary">{formatarMoeda(total)}</p>
                </div>
              </div>
              <Button
                className="btn-padaria text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4"
                onClick={() => setTela('resumo')}
              >
                Ver Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Produtos por Categoria */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] max-h-[90vh] p-0">
          <DialogHeader className="p-3 sm:p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-primary">
              {categoriaSelecionada && CONFIG_CATEGORIAS[categoriaSelecionada] && (
                <span className={CONFIG_CATEGORIAS[categoriaSelecionada].cor}>
                  {React.cloneElement(CONFIG_CATEGORIAS[categoriaSelecionada].icon as React.ReactElement, { 
                    className: 'w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8' 
                  })}
                </span>
              )}
              {categoriaSelecionada}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-60px)] sm:h-[calc(90vh-80px)] p-3 sm:p-4">
            {categoriaSelecionada && (
              <ProdutosPorCategoria
                produtos={produtosDaCategoria}
                categoria={categoriaSelecionada}
                onProdutoAdicionado={() => {
                  // Opcional: fechar dialog após adicionar
                  // setDialogAberto(false);
                }}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
