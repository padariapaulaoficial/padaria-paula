'use client';

// CatalogoPrincipal - Padaria Paula
// Catálogo público para clientes fazerem pedidos

import { useState, useEffect, useMemo } from 'react';
import { useCatalogoStore, ItemCatalogo } from '@/store/useCatalogoStore';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Lock,
  ArrowLeft,
  ArrowRight,
  Check,
  Cake,
  Cookie,
  Croissant,
  Store,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { formatarMoeda } from '@/store/usePedidoStore';

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

// Ícones por categoria
const categoriaIcones: Record<string, React.ReactNode> = {
  'Tortas': <Cake className="w-5 h-5" />,
  'Doces': <Cookie className="w-5 h-5" />,
  'Docinhos': <Cookie className="w-5 h-5" />,
  'Salgados': <Croissant className="w-5 h-5" />,
  'Salgadinhos': <Croissant className="w-5 h-5" />,
  'Pães': <Store className="w-5 h-5" />,
  'Bolos': <Cake className="w-5 h-5" />,
  'default': <Sparkles className="w-5 h-5" />,
};

export default function CatalogoPrincipal() {
  const { toast } = useToast();
  const {
    itens,
    cliente,
    etapa,
    adicionarItem,
    removerItem,
    atualizarQuantidade,
    limparCarrinho,
    setCliente,
    setEtapa,
    getTotal,
    getTotalItens,
  } = useCatalogoStore();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('TODOS');
  const [enviando, setEnviando] = useState(false);

  // Carregar produtos
  useEffect(() => {
    fetch('/api/produtos?ativo=true')
      .then((res) => res.json())
      .then((data) => {
        setProdutos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar produtos:', err);
        setLoading(false);
      });
  }, []);

  // Extrair categorias únicas
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    produtos.forEach((p) => {
      if (p.categoria) cats.add(p.categoria);
    });
    return ['TODOS', ...Array.from(cats)];
  }, [produtos]);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    let lista = produtos;

    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter((p) => p.nome.toLowerCase().includes(termo));
    }

    if (categoriaAtiva !== 'TODOS') {
      lista = lista.filter((p) => p.categoria === categoriaAtiva);
    }

    return lista;
  }, [produtos, busca, categoriaAtiva]);

  // Adicionar produto ao carrinho
  const handleAdicionar = (produto: Produto, tamanho?: string) => {
    const preco = tamanho
      ? produto.precosTamanhos?.[tamanho] || produto.valorUnit
      : produto.valorUnit;

    const item: ItemCatalogo = {
      produtoId: produto.id,
      nome: produto.nome,
      quantidade: produto.tipoVenda === 'UNIDADE' ? 1 : 0.5,
      valorUnit: preco,
      tipoVenda: produto.tipoVenda,
      tamanho,
      subtotal: (produto.tipoVenda === 'UNIDADE' ? 1 : 0.5) * preco,
    };

    adicionarItem(item);

    toast({
      title: 'Adicionado!',
      description: `${produto.nome}${tamanho ? ` (${tamanho})` : ''} foi adicionado ao carrinho.`,
    });
  };

  // Enviar pedido
  const handleEnviarPedido = async () => {
    if (!cliente.nome || !cliente.telefone || !cliente.dataEntrega) {
      toast({
        title: 'Preencha todos os dados',
        description: 'Nome, telefone e data de entrega são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nome: cliente.nome,
            telefone: cliente.telefone,
          },
          itens: itens.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            valorUnit: item.valorUnit,
            subtotal: item.subtotal,
            observacao: item.observacao,
            tamanho: item.tamanho,
          })),
          observacoes: cliente.observacoes,
          dataEntrega: cliente.dataEntrega,
          horarioEntrega: cliente.horarioEntrega || undefined,
          tipoEntrega: 'RETIRA',
          total: getTotal(),
        }),
      });

      if (!response.ok) throw new Error('Erro ao enviar pedido');

      setEtapa('confirmacao');
      toast({
        title: 'Pedido enviado!',
        description: 'Seu pedido foi recebido. Entraremos em contato para confirmar.',
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar seu pedido. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setEnviando(false);
    }
  };

  // Renderizar etapa atual
  const renderEtapa = () => {
    switch (etapa) {
      case 'catalogo':
        return (
          <>
            {/* Busca e Categorias */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b py-3 px-4">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    className="pl-9"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <Link href="/admin">
                  <Button variant="outline" size="icon" title="Área Administrativa">
                    <Lock className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Categorias */}
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-1">
                  {categorias.map((cat) => (
                    <Button
                      key={cat}
                      variant={categoriaAtiva === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoriaAtiva(cat)}
                      className="whitespace-nowrap"
                    >
                      {cat === 'TODOS' ? 'Todos' : cat}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Lista de Produtos */}
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando produtos...
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtosFiltrados.map((produto) => (
                    <Card key={produto.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {categoriaIcones[produto.categoria || 'default'] || categoriaIcones['default']}
                            <CardTitle className="text-base">{produto.nome}</CardTitle>
                          </div>
                          {produto.tipoProduto === 'ESPECIAL' && (
                            <Badge variant="secondary" className="text-xs">
                              Especial
                            </Badge>
                          )}
                        </div>
                        {produto.descricao && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {produto.descricao}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        {produto.tipoProduto === 'ESPECIAL' && produto.tamanhos ? (
                          <div className="space-y-2">
                            {produto.tamanhos.map((tamanho) => (
                              <div
                                key={tamanho}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                              >
                                <div>
                                  <span className="font-medium text-sm">{tamanho}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {formatarMoeda(
                                      produto.precosTamanhos?.[tamanho] || produto.valorUnit
                                    )}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleAdicionar(produto, tamanho)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-primary">
                                {formatarMoeda(produto.valorUnit)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                /{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                              </span>
                            </div>
                            <Button onClick={() => handleAdicionar(produto)}>
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Carrinho Flutuante */}
            {itens.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-4 z-50">
                <div className="container mx-auto max-w-7xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
                      {getTotalItens()}
                    </div>
                    <div>
                      <p className="font-medium">{itens.length} item(ns)</p>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatarMoeda(getTotal())}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setEtapa('carrinho')}>
                    Ver Carrinho
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        );

      case 'carrinho':
        return (
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={() => setEtapa('catalogo')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Continuar comprando
            </Button>

            <h2 className="text-xl font-bold mb-4">Seu Carrinho</h2>

            {itens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Seu carrinho está vazio</p>
                <Button className="mt-4" onClick={() => setEtapa('catalogo')}>
                  Ver produtos
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.nome}
                            {item.tamanho && (
                              <Badge variant="outline" className="ml-2">
                                {item.tamanho}
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatarMoeda(item.valorUnit)} /{' '}
                            {item.tipoVenda === 'KG' ? 'kg' : 'un'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              atualizarQuantidade(
                                index,
                                item.tipoVenda === 'KG'
                                  ? item.quantidade - 0.5
                                  : item.quantidade - 1
                              )
                            }
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {item.tipoVenda === 'KG'
                              ? item.quantidade.toFixed(1)
                              : item.quantidade}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              atualizarQuantidade(
                                index,
                                item.tipoVenda === 'KG'
                                  ? item.quantidade + 0.5
                                  : item.quantidade + 1
                              )
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removerItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span className="font-bold text-primary">
                          {formatarMoeda(item.subtotal)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Total */}
                <div className="bg-muted rounded-lg p-4 flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {formatarMoeda(getTotal())}
                  </span>
                </div>

                <Button className="w-full" onClick={() => setEtapa('dados')}>
                  Finalizar Pedido
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'dados':
        return (
          <div className="p-4 max-w-md mx-auto">
            <Button
              variant="ghost"
              onClick={() => setEtapa('carrinho')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao carrinho
            </Button>

            <h2 className="text-xl font-bold mb-4">Seus Dados</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={cliente.nome}
                  onChange={(e) =>
                    setCliente({ ...cliente, nome: e.target.value })
                  }
                  placeholder="Seu nome completo"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                <Input
                  id="telefone"
                  value={cliente.telefone}
                  onChange={(e) =>
                    setCliente({ ...cliente, telefone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="data">Data de Entrega *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={cliente.dataEntrega}
                    onChange={(e) =>
                      setCliente({ ...cliente, dataEntrega: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="horario">Horário</Label>
                  <Select
                    value={cliente.horarioEntrega}
                    onValueChange={(v) =>
                      setCliente({ ...cliente, horarioEntrega: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        '07:00',
                        '08:00',
                        '09:00',
                        '10:00',
                        '11:00',
                        '12:00',
                        '13:00',
                        '14:00',
                        '15:00',
                        '16:00',
                        '17:00',
                        '18:00',
                        '19:00',
                        '20:00',
                      ].map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  value={cliente.observacoes}
                  onChange={(e) =>
                    setCliente({ ...cliente, observacoes: e.target.value })
                  }
                  placeholder="Alguma observação para seu pedido?"
                  rows={3}
                />
              </div>

              {/* Resumo */}
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-medium mb-2">Resumo do Pedido</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {itens.length} item(ns) - Total:{' '}
                  <span className="font-bold text-primary">
                    {formatarMoeda(getTotal())}
                  </span>
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleEnviarPedido}
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar Pedido'}
              </Button>
            </div>
          </div>
        );

      case 'confirmacao':
        return (
          <div className="p-4 max-w-md mx-auto text-center py-12">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Pedido Enviado!</h2>
            <p className="text-muted-foreground mb-6">
              Recebemos seu pedido. Entraremos em contato pelo WhatsApp para
              confirmar.
            </p>
            <Button
              onClick={() => {
                limparCarrinho();
              }}
            >
              Fazer Novo Pedido
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Padaria Paula</h1>
            <p className="text-xs opacity-90">Cardápio Online</p>
          </div>
          <Link href="/admin">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Lock className="w-4 h-4 mr-1" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="pb-20">{renderEtapa()}</main>
    </div>
  );
}
