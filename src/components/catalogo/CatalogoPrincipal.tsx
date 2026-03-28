'use client';

// CatalogoPrincipal - Padaria Paula
// Catálogo público estilo boutique com carrinho lateral

import { useState, useEffect, useMemo } from 'react';
import { useCatalogoStore, ItemCatalogo } from '@/store/useCatalogoStore';
import {
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
  ShoppingCart,
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
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
  'Tortas': <Cake className="w-4 h-4" />,
  'Doces': <Cookie className="w-4 h-4" />,
  'Docinhos': <Cookie className="w-4 h-4" />,
  'Salgados': <Croissant className="w-4 h-4" />,
  'Salgadinhos': <Croissant className="w-4 h-4" />,
  'Pães': <Store className="w-4 h-4" />,
  'Bolos': <Cake className="w-4 h-4" />,
  'default': <Sparkles className="w-4 h-4" />,
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
      description: `${produto.nome}${tamanho ? ` (${tamanho})` : ''}`,
      duration: 1500,
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

  // Renderizar etapa de confirmação
  if (etapa === 'confirmacao') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Pedido Enviado!</h2>
          <p className="text-muted-foreground mb-6">
            Recebemos seu pedido. Entraremos em contato pelo WhatsApp para confirmar.
          </p>
          <Button onClick={limparCarrinho}>
            Fazer Novo Pedido
          </Button>
        </div>
      </div>
    );
  }

  // Renderizar etapa de dados
  if (etapa === 'dados') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground shadow-md">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEtapa('catalogo')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            <div>
              <h1 className="text-lg font-bold">Finalizar Pedido</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome *
              </Label>
              <Input
                id="nome"
                value={cliente.nome}
                onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <Label htmlFor="telefone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone/WhatsApp *
              </Label>
              <Input
                id="telefone"
                value={cliente.telefone}
                onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data *
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={cliente.dataEntrega}
                  onChange={(e) => setCliente({ ...cliente, dataEntrega: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="horario" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horário
                </Label>
                <Select
                  value={cliente.horarioEntrega}
                  onValueChange={(v) => setCliente({ ...cliente, horarioEntrega: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="obs" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Observações
              </Label>
              <Textarea
                id="obs"
                value={cliente.observacoes}
                onChange={(e) => setCliente({ ...cliente, observacoes: e.target.value })}
                placeholder="Alguma observação para seu pedido?"
                rows={3}
              />
            </div>

            {/* Resumo */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Itens</span>
                  <span>{getTotalItens()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold text-primary">{formatarMoeda(getTotal())}</span>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" onClick={handleEnviarPedido} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar Pedido'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Layout principal: Catálogo + Carrinho
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Paula</h1>
          </div>
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <Lock className="w-4 h-4 mr-1" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Categorias */}
      <div className="bg-card border-b shrink-0">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categorias.map((cat) => (
              <Button
                key={cat}
                variant={categoriaAtiva === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoriaAtiva(cat)}
                className="whitespace-nowrap rounded-full"
              >
                {cat === 'TODOS' ? 'Todos' : cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Produtos */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Busca */}
          <div className="p-3 border-b bg-background shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          {/* Grid de Produtos */}
          <ScrollArea className="flex-1">
            <div className="p-3">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando produtos...
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {produtosFiltrados.map((produto) => (
                    <Card key={produto.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          {categoriaIcones[produto.categoria || 'default'] || categoriaIcones['default']}
                          <span className="text-xs text-muted-foreground">{produto.categoria}</span>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
                          {produto.nome}
                        </h3>

                        {produto.tipoProduto === 'ESPECIAL' && produto.tamanhos ? (
                          <div className="space-y-1">
                            {produto.tamanhos.slice(0, 2).map((tamanho) => (
                              <div
                                key={tamanho}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-muted-foreground">{tamanho}</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {formatarMoeda(produto.precosTamanhos?.[tamanho] || produto.valorUnit)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleAdicionar(produto, tamanho)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {produto.tamanhos.length > 2 && (
                              <p className="text-[10px] text-muted-foreground">
                                +{produto.tamanhos.length - 2} tamanhos
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-bold text-primary">
                                {formatarMoeda(produto.valorUnit)}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-0.5">
                                /{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAdicionar(produto)}
                              className="h-7"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Carrinho Lateral - Desktop */}
        <div className="hidden lg:block w-80 border-l bg-card shrink-0">
          <div className="h-full flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-3 border-b">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Seu Pedido</h2>
                {itens.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {getTotalItens()} {getTotalItens() === 1 ? 'item' : 'itens'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Itens do Carrinho */}
            <ScrollArea className="flex-1">
              {itens.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Seu carrinho está vazio</p>
                  <p className="text-xs mt-1">Adicione produtos ao lado</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {itens.map((item, index) => (
                    <div
                      key={index}
                      className="bg-background rounded-lg p-2 border"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.nome}
                          </p>
                          {item.tamanho && (
                            <Badge variant="outline" className="text-[10px] h-4 mt-0.5">
                              {item.tamanho}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatarMoeda(item.valorUnit)}/{item.tipoVenda === 'KG' ? 'kg' : 'un'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removerItem(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              atualizarQuantidade(
                                index,
                                item.tipoVenda === 'KG'
                                  ? item.quantidade - 0.5
                                  : item.quantidade - 1
                              )
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium">
                            {item.tipoVenda === 'KG'
                              ? item.quantidade.toFixed(1)
                              : item.quantidade}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() =>
                              atualizarQuantidade(
                                index,
                                item.tipoVenda === 'KG'
                                  ? item.quantidade + 0.5
                                  : item.quantidade + 1
                              )
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {formatarMoeda(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer do Carrinho */}
            {itens.length > 0 && (
              <div className="p-3 border-t bg-background">
                <div className="flex justify-between items-center mb-3">
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
        </div>
      </div>

      {/* Carrinho Mobile - Flutuante */}
      {itens.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-3 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
                {getTotalItens()}
              </div>
              <div>
                <p className="font-medium text-sm">{getTotalItens()} item(ns)</p>
                <p className="text-xs text-muted-foreground">
                  Total: {formatarMoeda(getTotal())}
                </p>
              </div>
            </div>
            <Button onClick={() => setEtapa('dados')}>
              Finalizar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
