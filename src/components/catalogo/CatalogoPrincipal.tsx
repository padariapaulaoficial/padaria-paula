'use client';

// CatalogoPrincipal - Padaria Paula
// Catálogo estilo boutique com layout premium

import { useState, useEffect, useMemo } from 'react';
import { useCatalogoStore, ItemCatalogo } from '@/store/useCatalogoStore';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Lock,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import Image from 'next/image';

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

// Cores do tema (extraídas da imagem de referência)
const THEME = {
  bgPrimary: 'bg-[#2B1B0E]',        // Marrom chocolate escuro
  bgCard: 'bg-[#EBBDAD]',           // Rosa/bege claro
  bgCarrinho: 'bg-[#FCF9EA]',       // Bege/creme
  textPrimary: 'text-white',        // Texto branco no header
  textDark: 'text-[#2B1B0E]',       // Texto escuro nos cards
  accent: '#8B4513',                // Marrom médio
  accentHover: '#A0522D',           // Marrom mais claro
};

// Cores para imagens placeholder por categoria
const categoriaCores: Record<string, string> = {
  'Tortas': 'from-amber-400 to-orange-500',
  'Doces': 'from-pink-300 to-rose-400',
  'Docinhos': 'from-pink-400 to-purple-400',
  'Salgados': 'from-yellow-400 to-amber-500',
  'Salgadinhos': 'from-orange-400 to-red-400',
  'Pães': 'from-amber-300 to-yellow-500',
  'Bolos': 'from-rose-300 to-pink-400',
  'default': 'from-amber-200 to-orange-300',
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
        description: 'Não foi possível enviar seu pedido.',
        variant: 'destructive',
      });
    } finally {
      setEnviando(false);
    }
  };

  // Tela de confirmação
  if (etapa === 'confirmacao') {
    return (
      <div className="min-h-screen bg-[#2B1B0E] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-[#FCF9EA] rounded-2xl shadow-xl">
          <div className="bg-green-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#2B1B0E] mb-2">Pedido Enviado!</h2>
          <p className="text-[#2B1B0E]/70 mb-6">
            Recebemos seu pedido. Entraremos em contato pelo WhatsApp para confirmar.
          </p>
          <Button 
            onClick={limparCarrinho}
            className="bg-[#8B4513] hover:bg-[#A0522D] text-white rounded-full px-8"
          >
            Fazer Novo Pedido
          </Button>
        </div>
      </div>
    );
  }

  // Tela de dados do cliente
  if (etapa === 'dados') {
    return (
      <div className="min-h-screen bg-[#2B1B0E]">
        {/* Header */}
        <header className="bg-[#2B1B0E] text-white shadow-md">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEtapa('catalogo')}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Finalizar Pedido</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <div className="bg-[#FCF9EA] rounded-2xl p-6 space-y-4">
            <div>
              <Label htmlFor="nome" className="text-[#2B1B0E] font-medium">Nome *</Label>
              <Input
                id="nome"
                value={cliente.nome}
                onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
                placeholder="Seu nome completo"
                className="bg-white border-[#EBBDAD] focus:border-[#8B4513]"
              />
            </div>

            <div>
              <Label htmlFor="telefone" className="text-[#2B1B0E] font-medium">Telefone/WhatsApp *</Label>
              <Input
                id="telefone"
                value={cliente.telefone}
                onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-white border-[#EBBDAD] focus:border-[#8B4513]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data" className="text-[#2B1B0E] font-medium">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={cliente.dataEntrega}
                  onChange={(e) => setCliente({ ...cliente, dataEntrega: e.target.value })}
                  className="bg-white border-[#EBBDAD] focus:border-[#8B4513]"
                />
              </div>
              <div>
                <Label htmlFor="horario" className="text-[#2B1B0E] font-medium">Horário</Label>
                <Select
                  value={cliente.horarioEntrega}
                  onValueChange={(v) => setCliente({ ...cliente, horarioEntrega: v })}
                >
                  <SelectTrigger className="bg-white border-[#EBBDAD]">
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
              <Label htmlFor="obs" className="text-[#2B1B0E] font-medium">Observações</Label>
              <Textarea
                id="obs"
                value={cliente.observacoes}
                onChange={(e) => setCliente({ ...cliente, observacoes: e.target.value })}
                placeholder="Alguma observação?"
                rows={3}
                className="bg-white border-[#EBBDAD] focus:border-[#8B4513] resize-none"
              />
            </div>

            {/* Resumo */}
            <div className="bg-[#EBBDAD] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#2B1B0E]/70">Itens</span>
                <span className="text-[#2B1B0E] font-medium">{getTotalItens()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#2B1B0E] font-bold">Total</span>
                <span className="text-2xl font-bold text-[#8B4513]">{formatarMoeda(getTotal())}</span>
              </div>
            </div>

            <Button 
              className="w-full bg-[#8B4513] hover:bg-[#A0522D] text-white rounded-full py-6 text-lg" 
              onClick={handleEnviarPedido} 
              disabled={enviando}
            >
              {enviando ? 'Enviando...' : 'Enviar Pedido'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Layout principal
  return (
    <div className="h-screen bg-[#2B1B0E] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-[#2B1B0E] shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#EBBDAD] flex items-center justify-center">
              <span className="text-[#2B1B0E] font-bold text-xl">P</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Paula</h1>
          </div>
          
          {/* Admin Link */}
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              <Lock className="w-4 h-4 mr-1" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Categorias */}
      <div className="bg-[#2B1B0E] shrink-0 pb-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  categoriaAtiva === cat
                    ? 'bg-[#EBBDAD] text-[#2B1B0E]'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {cat === 'TODOS' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Produtos */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Busca */}
          <div className="p-3 bg-[#2B1B0E] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar..."
                className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#EBBDAD]"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          {/* Grid de Produtos */}
          <ScrollArea className="flex-1 bg-[#2B1B0E]">
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8 text-white/60">
                  Carregando...
                </div>
              ) : produtosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  Nenhum produto
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {produtosFiltrados.map((produto) => (
                    <div
                      key={produto.id}
                      className="bg-[#EBBDAD] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                    >
                      {/* Imagem do Produto */}
                      <div className={`aspect-square bg-gradient-to-br ${categoriaCores[produto.categoria || 'default'] || categoriaCores['default']} relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl opacity-80">
                            {produto.categoria === 'Tortas' && '🥧'}
                            {produto.categoria === 'Doces' && '🍬'}
                            {produto.categoria === 'Docinhos' && '🍫'}
                            {produto.categoria === 'Salgados' && '🥟'}
                            {produto.categoria === 'Salgadinhos' && '🥮'}
                            {produto.categoria === 'Pães' && '🥖'}
                            {produto.categoria === 'Bolos' && '🎂'}
                            {!['Tortas', 'Doces', 'Docinhos', 'Salgados', 'Salgadinhos', 'Pães', 'Bolos'].includes(produto.categoria || '') && '✨'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Info do Produto */}
                      <div className="p-3">
                        <h3 className="font-semibold text-[#2B1B0E] text-sm truncate">
                          {produto.nome}
                        </h3>

                        {produto.tipoProduto === 'ESPECIAL' && produto.tamanhos ? (
                          <div className="mt-2 space-y-1">
                            {produto.tamanhos.slice(0, 2).map((tamanho) => (
                              <div
                                key={tamanho}
                                className="flex items-center justify-between"
                              >
                                <span className="text-xs text-[#2B1B0E]/70">{tamanho}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-bold text-[#8B4513]">
                                    {formatarMoeda(produto.precosTamanhos?.[tamanho] || produto.valorUnit)}
                                  </span>
                                  <button
                                    onClick={() => handleAdicionar(produto, tamanho)}
                                    className="w-6 h-6 bg-[#8B4513] hover:bg-[#A0522D] text-white rounded-full flex items-center justify-center transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {produto.tamanhos.length > 2 && (
                              <p className="text-[10px] text-[#2B1B0E]/50">
                                +{produto.tamanhos.length - 2} tamanhos
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              <span className="text-sm font-bold text-[#8B4513]">
                                {formatarMoeda(produto.valorUnit)}
                              </span>
                              <span className="text-[10px] text-[#2B1B0E]/60 ml-0.5">
                                /{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleAdicionar(produto)}
                              className="w-8 h-8 bg-[#8B4513] hover:bg-[#A0522D] text-white rounded-full flex items-center justify-center transition-colors shadow-md"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Carrinho Lateral - Desktop */}
        <div className="hidden lg:block w-80 bg-[#FCF9EA] shrink-0 border-l border-[#EBBDAD]">
          <div className="h-full flex flex-col">
            {/* Header do Carrinho */}
            <div className="p-4 border-b border-[#EBBDAD]">
              <h2 className="font-bold text-lg text-[#2B1B0E]">Seu Pedido</h2>
              {itens.length > 0 && (
                <p className="text-sm text-[#2B1B0E]/60">
                  {getTotalItens()} {getTotalItens() === 1 ? 'item' : 'itens'}
                </p>
              )}
            </div>

            {/* Itens do Carrinho */}
            <ScrollArea className="flex-1">
              {itens.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-[#EBBDAD] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <p className="text-[#2B1B0E]/60">Seu carrinho está vazio</p>
                  <p className="text-sm text-[#2B1B0E]/40 mt-1">Adicione produtos</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {itens.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-3 shadow-sm border border-[#EBBDAD]"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#2B1B0E] truncate text-sm">
                            {item.nome}
                          </p>
                          {item.tamanho && (
                            <span className="text-[10px] text-[#8B4513] bg-[#EBBDAD] px-1.5 py-0.5 rounded">
                              {item.tamanho}
                            </span>
                          )}
                          <p className="text-xs text-[#2B1B0E]/60 mt-0.5">
                            {formatarMoeda(item.valorUnit)}/{item.tipoVenda === 'KG' ? 'kg' : 'un'}
                          </p>
                        </div>
                        <button
                          onClick={() => removerItem(index)}
                          className="w-6 h-6 text-[#2B1B0E]/40 hover:text-red-500 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#EBBDAD]">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              atualizarQuantidade(
                                index,
                                item.tipoVenda === 'KG'
                                  ? item.quantidade - 0.5
                                  : item.quantidade - 1
                              )
                            }
                            className="w-6 h-6 bg-[#EBBDAD] hover:bg-[#D4A99A] rounded-full flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3 text-[#2B1B0E]" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium text-[#2B1B0E]">
                            {item.tipoVenda === 'KG'
                              ? item.quantidade.toFixed(1)
                              : item.quantidade}
                          </span>
                          <button
                            onClick={() =>
                              atualizarQuantidade(
                                index,
                                item.tipoVenda === 'KG'
                                  ? item.quantidade + 0.5
                                  : item.quantidade + 1
                              )
                            }
                            className="w-6 h-6 bg-[#EBBDAD] hover:bg-[#D4A99A] rounded-full flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3 text-[#2B1B0E]" />
                          </button>
                        </div>
                        <span className="font-bold text-[#8B4513]">
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
              <div className="p-4 border-t border-[#EBBDAD] bg-white">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#2B1B0E]/70">Total</span>
                  <span className="text-2xl font-bold text-[#8B4513]">
                    {formatarMoeda(getTotal())}
                  </span>
                </div>
                <Button 
                  className="w-full bg-[#8B4513] hover:bg-[#A0522D] text-white rounded-full py-6" 
                  onClick={() => setEtapa('dados')}
                >
                  Finalizar Pedido
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carrinho Mobile - Flutuante */}
      {itens.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FCF9EA] border-t border-[#EBBDAD] shadow-lg p-3 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#8B4513] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                {getTotalItens()}
              </div>
              <div>
                <p className="font-medium text-[#2B1B0E]">{getTotalItens()} item(ns)</p>
                <p className="text-sm text-[#8B4513] font-bold">
                  {formatarMoeda(getTotal())}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setEtapa('dados')}
              className="bg-[#8B4513] hover:bg-[#A0522D] text-white rounded-full"
            >
              Finalizar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
