'use client';

// ProdutosLista - Padaria Paula
// Lista de produtos com seletores de quantidade

import { useState, useEffect, useMemo } from 'react';
import { Search, Package, Scale, Hash, Plus, User, Phone, MapPin, Edit2, Truck, Store, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePedidoStore, calcularSubtotal, formatarMoeda, formatarQuantidade, ItemCarrinho } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda as formatarValor } from '@/store/usePedidoStore';

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

// Opções de KG: 500g até 10kg (de 500g em 500g)
const OPCOES_KG = [
  { valor: 0, label: 'Selecione' },
  { valor: 0.5, label: '500g' },
  { valor: 1.0, label: '1 kg' },
  { valor: 1.5, label: '1,5 kg' },
  { valor: 2.0, label: '2 kg' },
  { valor: 2.5, label: '2,5 kg' },
  { valor: 3.0, label: '3 kg' },
  { valor: 3.5, label: '3,5 kg' },
  { valor: 4.0, label: '4 kg' },
  { valor: 4.5, label: '4,5 kg' },
  { valor: 5.0, label: '5 kg' },
  { valor: 5.5, label: '5,5 kg' },
  { valor: 6.0, label: '6 kg' },
  { valor: 6.5, label: '6,5 kg' },
  { valor: 7.0, label: '7 kg' },
  { valor: 7.5, label: '7,5 kg' },
  { valor: 8.0, label: '8 kg' },
  { valor: 8.5, label: '8,5 kg' },
  { valor: 9.0, label: '9 kg' },
  { valor: 9.5, label: '9,5 kg' },
  { valor: 10.0, label: '10 kg' },
];

export default function ProdutosLista() {
  const { adicionarItem, itens, cliente, entrega } = usePedidoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [quantidadesKG, setQuantidadesKG] = useState<Record<string, number>>({});
  const [quantidadesUnidade, setQuantidadesUnidade] = useState<Record<string, string>>({});
  // Estados para produtos especiais (tortas)
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});

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

  // Extrair categorias únicas
  const categorias = useMemo(() => {
    const cats = new Set(produtos.map(p => p.categoria || 'Outros'));
    return ['Todos', ...Array.from(cats)];
  }, [produtos]);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(produto => {
      const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
                         (produto.descricao?.toLowerCase().includes(busca.toLowerCase()));
      const matchCategoria = categoriaAtiva === 'Todos' || produto.categoria === categoriaAtiva;
      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, categoriaAtiva]);

  // Agrupar por categoria
  const produtosPorCategoria = useMemo(() => {
    const grupos: Record<string, Produto[]> = {};
    produtosFiltrados.forEach(produto => {
      const cat = produto.categoria || 'Outros';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(produto);
    });
    return grupos;
  }, [produtosFiltrados]);

  // Ícone por tipo de venda
  const getIconeTipoVenda = (tipo: string) => {
    switch (tipo) {
      case 'KG': return <Scale className="w-4 h-4" />;
      case 'UNIDADE':
      default: return <Hash className="w-4 h-4" />;
    }
  };

  // Adicionar ao carrinho
  const handleAdicionar = (produto: Produto) => {
    // Produto especial (Torta) - precisa de tamanho selecionado
    if (produto.tipoProduto === 'ESPECIAL') {
      const tamanho = tamanhosSelecionados[produto.id];
      if (!tamanho) {
        toast({
          title: 'Selecione o tamanho',
          description: 'Escolha um tamanho para a torta.',
          variant: 'destructive',
        });
        return;
      }

      const precoTamanho = produto.precosTamanhos?.[tamanho];
      // Garantir que o preço é um número válido
      const preco = (precoTamanho !== undefined && precoTamanho !== null && !isNaN(precoTamanho) && precoTamanho > 0)
        ? precoTamanho
        : produto.valorUnit;
      const observacao = observacoes[produto.id] || '';

      adicionarItem({
        produtoId: produto.id,
        nome: `${produto.nome} (${tamanho})`,
        quantidadePedida: 1,
        quantidade: 1,
        valorUnit: preco,
        tipoVenda: 'UNIDADE',
        subtotalPedida: preco,
        subtotal: preco,
        observacao: observacao || undefined,
        tamanho: tamanho,
      });

      // Limpar seleção
      setTamanhosSelecionados(prev => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });
      setObservacoes(prev => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });

      toast({
        title: 'Produto adicionado!',
        description: `${produto.nome} (${tamanho}) - ${formatarMoeda(preco)}`,
      });
      return;
    }

    // Produto normal
    let quantidade = 0;

    if (produto.tipoVenda === 'KG') {
      quantidade = quantidadesKG[produto.id] || 0;
    } else {
      const valor = quantidadesUnidade[produto.id];
      quantidade = valor ? parseFloat(valor) : 0;
    }

    if (!quantidade || quantidade <= 0) {
      toast({
        title: 'Selecione a quantidade',
        description: 'Escolha uma quantidade para adicionar ao pedido.',
        variant: 'destructive',
      });
      return;
    }

    const subtotal = calcularSubtotal(quantidade, produto.valorUnit, produto.tipoVenda);

    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      quantidadePedida: quantidade,  // Quantidade original
      quantidade: quantidade,        // Quantidade final (inicialmente igual)
      valorUnit: produto.valorUnit,
      tipoVenda: produto.tipoVenda,
      subtotalPedida: subtotal,      // Subtotal original
      subtotal: subtotal,            // Subtotal final (inicialmente igual)
    });

    // Limpar seleção
    if (produto.tipoVenda === 'KG') {
      setQuantidadesKG(prev => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });
    } else {
      setQuantidadesUnidade(prev => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });
    }

    toast({
      title: 'Produto adicionado!',
      description: `${produto.nome} - ${formatarQuantidade(quantidade, produto.tipoVenda)}`,
    });
  };

  // Calcular total
  const total = itens.reduce((sum, item) => sum + item.subtotal, 0);

  // Verificar se produto tem quantidade válida
  const temQuantidadeValida = (produto: Produto): boolean => {
    // Produto especial - precisa de tamanho selecionado
    if (produto.tipoProduto === 'ESPECIAL') {
      return !!tamanhosSelecionados[produto.id];
    }
    // Produto normal
    if (produto.tipoVenda === 'KG') {
      const qtd = quantidadesKG[produto.id];
      return qtd !== undefined && qtd > 0;
    } else {
      const valor = quantidadesUnidade[produto.id];
      return valor !== undefined && parseFloat(valor) > 0;
    }
  };

  // Obter subtotal do produto selecionado
  const obterSubtotal = (produto: Produto) => {
    // Produto especial
    if (produto.tipoProduto === 'ESPECIAL') {
      const tamanho = tamanhosSelecionados[produto.id];
      if (tamanho && produto.precosTamanhos) {
        const preco = produto.precosTamanhos[tamanho];
        // Retornar apenas se o preço for válido
        if (preco !== undefined && preco !== null && !isNaN(preco) && preco > 0) {
          return preco;
        }
      }
      return null;
    }
    // Produto normal
    let quantidade = 0;
    if (produto.tipoVenda === 'KG') {
      quantidade = quantidadesKG[produto.id] || 0;
    } else {
      const valor = quantidadesUnidade[produto.id];
      quantidade = valor ? parseFloat(valor) : 0;
    }
    if (quantidade > 0) {
      return calcularSubtotal(quantidade, produto.valorUnit, produto.tipoVenda);
    }
    return null;
  };

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
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in pb-20 lg:pb-0">
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

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          className="input-padaria pl-10 h-11"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Tabs de categorias */}
      <Tabs value={categoriaAtiva} onValueChange={setCategoriaAtiva} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="flex flex-nowrap h-auto gap-1 bg-muted/50 p-1 w-max">
            {categorias.map(cat => (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap px-3"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <TabsContent value={categoriaAtiva} className="mt-3">
          <ScrollArea className="h-[calc(100vh-340px)] sm:h-[calc(100vh-320px)] pr-2">
            {Object.entries(produtosPorCategoria).map(([categoria, prods]) => (
              <div key={categoria} className="mb-4 last:mb-0">
                {categoriaAtiva === 'Todos' && (
                  <h3 className="font-display text-base font-semibold mb-2 text-primary border-b border-border pb-1">
                    {categoria}
                  </h3>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {prods.map(produto => (
                    <ProdutoCard
                      key={produto.id}
                      produto={produto}
                      quantidadeKG={quantidadesKG[produto.id]}
                      quantidadeUnidade={quantidadesUnidade[produto.id]}
                      tamanhoSelecionado={tamanhosSelecionados[produto.id]}
                      observacao={observacoes[produto.id]}
                      onSelectKG={(qtd) => setQuantidadesKG(prev => ({ ...prev, [produto.id]: qtd }))}
                      onChangeUnidade={(val) => setQuantidadesUnidade(prev => ({ ...prev, [produto.id]: val }))}
                      onSelectTamanho={(tam) => setTamanhosSelecionados(prev => ({ ...prev, [produto.id]: tam }))}
                      onChangeObservacao={(obs) => setObservacoes(prev => ({ ...prev, [produto.id]: obs }))}
                      onAdicionar={() => handleAdicionar(produto)}
                      iconeTipo={getIconeTipoVenda(produto.tipoVenda)}
                      temQuantidade={temQuantidadeValida(produto)}
                      subtotal={obterSubtotal(produto)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {produtosFiltrados.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Carrinho Resumo - Mobile */}
      {itens.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-40 safe-area-bottom">
          <div className="p-2 space-y-2">
            {/* Total */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{itens.length} {itens.length === 1 ? 'item' : 'itens'}</Badge>
              </div>
              <span className="font-bold text-lg text-primary">{formatarValor(total)}</span>
            </div>
            
            {/* Botões */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => setTela('novo-pedido')}
              >
                Cliente
              </Button>
              <Button
                size="sm"
                className="flex-1 btn-padaria h-9"
                onClick={() => setTela('resumo')}
              >
                Ver Pedido
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// Componente do Card de Produto
interface ProdutoCardProps {
  produto: Produto;
  quantidadeKG: number | undefined;
  quantidadeUnidade: string | undefined;
  tamanhoSelecionado: string | undefined;
  observacao: string | undefined;
  onSelectKG: (qtd: number) => void;
  onChangeUnidade: (val: string) => void;
  onSelectTamanho: (tam: string) => void;
  onChangeObservacao: (obs: string) => void;
  onAdicionar: () => void;
  iconeTipo: React.ReactNode;
  temQuantidade: boolean;
  subtotal: number | null;
}

function ProdutoCard({
  produto,
  quantidadeKG,
  quantidadeUnidade,
  tamanhoSelecionado,
  observacao,
  onSelectKG,
  onChangeUnidade,
  onSelectTamanho,
  onChangeObservacao,
  onAdicionar,
  iconeTipo,
  temQuantidade,
  subtotal
}: ProdutoCardProps) {
  // Ordenar tamanhos e filtrar apenas os que têm preço válido
  const ordemTamanhos = ['P', 'M', 'G', 'GG'];
  const tamanhosOrdenados = produto.tamanhos
    ? [...produto.tamanhos]
        .filter(tam => {
          const preco = produto.precosTamanhos?.[tam];
          return preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
        })
        .sort((a, b) => ordemTamanhos.indexOf(a) - ordemTamanhos.indexOf(b))
    : [];

  return (
    <Card className={`card-padaria hover:shadow-md transition-shadow ${produto.tipoProduto === 'ESPECIAL' ? 'ring-2 ring-primary/30' : ''}`}>
      <CardContent className="p-3">
        {/* Header do produto */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">{produto.nome}</h4>
            {produto.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{produto.descricao}</p>
            )}
          </div>
          {produto.tipoProduto === 'ESPECIAL' ? (
            <Badge className="ml-2 shrink-0 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground">
              Torta
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-2 flex items-center gap-1 shrink-0 text-[10px] px-1.5 py-0.5">
              {iconeTipo}
              {produto.tipoVenda === 'KG' ? 'Kg' : 'Un'}
            </Badge>
          )}
        </div>

        {/* Preço */}
        {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
          <div className="mb-3 text-xs text-muted-foreground">
            {tamanhosOrdenados
              .filter(tam => {
                const preco = produto.precosTamanhos?.[tam];
                return preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
              })
              .map(tam => (
                <span key={tam} className="mr-2">
                  <strong className="text-primary">{tam}</strong>: {formatarMoeda(produto.precosTamanhos![tam])}
                </span>
              ))}
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-lg font-bold text-primary">
              {formatarMoeda(produto.valorUnit)}
            </span>
            <span className="text-xs text-muted-foreground">
              /{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
            </span>
          </div>
        )}

        {/* Seletor de quantidade / tamanho */}
        <div className="space-y-2">
          {produto.tipoProduto === 'ESPECIAL' ? (
            <>
              {/* Seleção de tamanho para torta */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tamanho:</Label>
                <div className="flex gap-1">
                  {tamanhosOrdenados.map(tam => (
                    <Button
                      key={tam}
                      type="button"
                      variant={tamanhoSelecionado === tam ? 'default' : 'outline'}
                      size="sm"
                      className={`flex-1 h-8 text-xs ${tamanhoSelecionado === tam ? 'btn-padaria' : ''}`}
                      onClick={() => onSelectTamanho(tam)}
                    >
                      {tam}
                    </Button>
                  ))}
                </div>
              </div>
              {/* Campo de observação */}
              <Input
                placeholder="Observação (opcional)"
                className="h-9 text-sm"
                value={observacao || ''}
                onChange={(e) => onChangeObservacao(e.target.value)}
              />
            </>
          ) : produto.tipoVenda === 'KG' ? (
            // Select para KG
            <Select
              value={quantidadeKG?.toString() || '0'}
              onValueChange={(value) => onSelectKG(parseFloat(value))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Quantidade" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {OPCOES_KG.map((opcao) => (
                  <SelectItem
                    key={opcao.valor}
                    value={opcao.valor.toString()}
                    className="text-sm"
                  >
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            // Input livre para Unidades
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Digite a quantidade"
              className="h-9 text-sm"
              value={quantidadeUnidade || ''}
              onChange={(e) => onChangeUnidade(e.target.value)}
            />
          )}
        </div>

        {/* Botão adicionar */}
        <Button
          onClick={onAdicionar}
          className="w-full btn-padaria mt-2 h-9"
          disabled={!temQuantidade}
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
          {subtotal && (
            <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-primary-foreground text-[10px]">
              {formatarMoeda(subtotal)}
            </Badge>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
