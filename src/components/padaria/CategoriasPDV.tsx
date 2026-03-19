'use client';

// CategoriasPDV - Padaria Paula
// Tela inicial do PDV com cards de categorias clicáveis

import { useState, useEffect, useMemo } from 'react';
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
        setProdutos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar produtos:', err);
        setLoading(false);
      });
  }, []);

  // Extrair categorias únicas e contar produtos
  const categorias = useMemo(() => {
    const contagem: Record<string, number> = {};
    produtos.forEach(p => {
      const cat = p.categoria || 'Outros';
      contagem[cat] = (contagem[cat] || 0) + 1;
    });
    return Object.entries(contagem).map(([nome, qtd]) => ({
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
    <div className="space-y-4 animate-fade-in">
      {/* Cliente Selecionado + Dados de Entrega */}
      {cliente && (
        <Card className="card-padaria border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 rounded-full p-2">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-primary truncate">{cliente.nome}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {cliente.telefone}
                    </span>
                  </div>
                  {/* Dados de Entrega */}
                  <div className="mt-1.5 pt-1.5 border-t border-primary/20">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                        {entrega.tipoEntrega === 'RETIRA' ? (
                          <>
                            <Store className="w-3 h-3" />
                            Cliente Retira
                          </>
                        ) : (
                          <>
                            <Truck className="w-3 h-3" />
                            Tele Entrega
                          </>
                        )}
                      </Badge>
                      {entrega.dataEntrega && (
                        <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatarDataEntrega(entrega.dataEntrega)}
                        </Badge>
                      )}
                    </div>
                    {entrega.tipoEntrega === 'TELE_ENTREGA' && entrega.enderecoEntrega && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 shrink-0" />
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
                className="h-7 px-2 text-xs shrink-0"
                onClick={() => setTela('novo-pedido')}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Título */}
      <div className="text-center">
        <h2 className="text-xl font-display font-bold text-primary">Selecione uma Categoria</h2>
        <p className="text-sm text-muted-foreground">Toque em uma categoria para ver os produtos</p>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categorias.map((cat) => (
          <Card
            key={cat.nome}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/30 ${cat.config.bgCor}`}
            onClick={() => handleAbrirCategoria(cat.nome)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className={`${cat.config.cor} mb-2`}>
                {cat.config.icon}
              </div>
              <h3 className={`font-semibold text-sm ${cat.config.cor}`}>{cat.nome}</h3>
              <p className="text-xs text-muted-foreground mt-1">{cat.quantidade} produtos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo do Carrinho */}
      {itens.length > 0 && (
        <Card className="card-padaria border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary rounded-full p-2">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-primary">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'} no carrinho
                  </p>
                  <p className="text-lg font-bold text-primary">{formatarMoeda(total)}</p>
                </div>
              </div>
              <Button
                className="btn-padaria"
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
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2 text-xl text-primary">
              {categoriaSelecionada && CONFIG_CATEGORIAS[categoriaSelecionada] && (
                <span className={CONFIG_CATEGORIAS[categoriaSelecionada].cor}>
                  {CONFIG_CATEGORIAS[categoriaSelecionada].icon}
                </span>
              )}
              {categoriaSelecionada}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-80px)] p-4">
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
