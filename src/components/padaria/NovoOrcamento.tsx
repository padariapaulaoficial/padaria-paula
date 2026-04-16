'use client';

// NovoOrcamento - Padaria Paula
// Criação de orçamentos com cliente, produtos e entrega
// Otimizado para listas grandes de produtos (50+)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, User, Phone, Calendar, Truck, Store, MapPin, Plus, Check, Clock,
  Package, Scale, Hash, Trash2, FileText, X, DollarSign, LayoutGrid, List, ShoppingCart, Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrcamentoStore } from '@/store/useOrcamentoStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  cpfCnpj: string | null;
  tipoPessoa: string;
  endereco?: string | null;
  bairro?: string | null;
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

// Horários comerciais disponíveis
const HORARIOS_COMERCIAIS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
];

// Opções de KG - mais compactas (sem opção 0)
const OPCOES_KG = [
  { valor: 0.5, label: '500g' },
  { valor: 1.0, label: '1kg' },
  { valor: 1.5, label: '1.5kg' },
  { valor: 2.0, label: '2kg' },
  { valor: 2.5, label: '2.5kg' },
  { valor: 3.0, label: '3kg' },
  { valor: 4.0, label: '4kg' },
  { valor: 5.0, label: '5kg' },
  { valor: 6.0, label: '6kg' },
  { valor: 7.0, label: '7kg' },
  { valor: 8.0, label: '8kg' },
  { valor: 9.0, label: '9kg' },
  { valor: 10.0, label: '10kg' },
];

export default function NovoOrcamento() {
  const { 
    cliente, setCliente, clearCliente,
    entrega, setEntrega,
    itens, adicionarItem, removerItem, atualizarItem,
    observacoes, setObservacoes,
    total,
    resetOrcamento
  } = useOrcamentoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();
  
  // Estados do cliente
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSelecionadoLocal, setClienteSelecionadoLocal] = useState<Cliente | null>(null);
  
  // Estados dos produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  
  // Estados de entrega
  const [tipoEntrega, setTipoEntrega] = useState<'RETIRA' | 'TELE_ENTREGA'>('RETIRA');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('');
  const [enderecoEntrega, setEnderecoEntrega] = useState('');
  const [bairroEntrega, setBairroEntrega] = useState('');
  const [valorTeleEntrega, setValorTeleEntrega] = useState('');
  const [observacoesTexto, setObservacoesTexto] = useState('');
  
  // Estados de controle
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState<'cliente' | 'produtos'>('cliente');
  
  // Estado unificado para seleções - mais eficiente
  const [selecoes, setSelecoes] = useState<Record<string, {quantidade: number, tamanho?: string, observacao?: string}>>({});
  
  // Modo de visualização: lista ou grade compacta (lista é o padrão)
  const [modoVisualizacao, setModoVisualizacao] = useState<'lista' | 'grade'>('lista');
  
  // Estado do Sheet do carrinho (mobile)
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  
  // Estado para edição de item (tamanho/observação)
  const [editandoItem, setEditandoItem] = useState<number | null>(null);
  const [novoTamanho, setNovoTamanho] = useState<string>('');
  const [novaObservacao, setNovaObservacao] = useState<string>('');

  // Carregar produtos
  useEffect(() => {
    fetch('/api/produtos?ativo=true')
      .then(res => res.json())
      .then(data => {
        setProdutos(data);
        setLoadingProdutos(false);
      })
      .catch(err => {
        console.error('Erro ao carregar produtos:', err);
        setLoadingProdutos(false);
      });
  }, []);

  // Verificar se cliente já está selecionado
  useEffect(() => {
    if (cliente && !clienteSelecionadoLocal) {
      setClienteSelecionadoLocal({
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        cpfCnpj: cliente.cpfCnpj,
        tipoPessoa: cliente.tipoPessoa,
        endereco: cliente.endereco,
        bairro: cliente.bairro,
      });
      
      if (cliente.endereco) setEnderecoEntrega(cliente.endereco);
      if (cliente.bairro) setBairroEntrega(cliente.bairro);
      
      if (entrega.dataEntrega && entrega.horarioEntrega) {
        setDataEntrega(entrega.dataEntrega);
        setHorarioEntrega(entrega.horarioEntrega);
        setTipoEntrega(entrega.tipoEntrega);
        if (entrega.enderecoEntrega) setEnderecoEntrega(entrega.enderecoEntrega);
        if (entrega.bairroEntrega) setBairroEntrega(entrega.bairroEntrega);
        setEtapa('produtos');
      }
    }
  }, [cliente, entrega]);

  // Carregar clientes com debounce
  useEffect(() => {
    const buscarClientes = async () => {
      if (buscaCliente.length >= 2) {
        setLoadingClientes(true);
        try {
          const res = await fetch(`/api/clientes?busca=${encodeURIComponent(buscaCliente)}`);
          const data = await res.json();
          setClientes(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Erro ao buscar clientes:', error);
          setClientes([]);
        } finally {
          setLoadingClientes(false);
        }
      } else {
        setClientes([]);
      }
    };
    
    const timeout = setTimeout(buscarClientes, 300);
    return () => clearTimeout(timeout);
  }, [buscaCliente]);

  // Categorias únicas
  const categorias = useMemo(() => {
    const cats = new Set(produtos.map(p => p.categoria || 'Outros'));
    return ['Todos', ...Array.from(cats)];
  }, [produtos]);

  // Filtrar produtos - otimizado
  const produtosFiltrados = useMemo(() => {
    const buscaLower = buscaProduto.toLowerCase();
    return produtos.filter(produto => {
      const matchBusca = !buscaProduto || 
        produto.nome.toLowerCase().includes(buscaLower);
      const matchCategoria = categoriaAtiva === 'Todos' || produto.categoria === categoriaAtiva;
      return matchBusca && matchCategoria;
    });
  }, [produtos, buscaProduto, categoriaAtiva]);

  // Agrupar por categoria
  const produtosPorCategoria = useMemo(() => {
    if (categoriaAtiva !== 'Todos') {
      return { [categoriaAtiva]: produtosFiltrados };
    }
    const grupos: Record<string, Produto[]> = {};
    produtosFiltrados.forEach(produto => {
      const cat = produto.categoria || 'Outros';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(produto);
    });
    return grupos;
  }, [produtosFiltrados, categoriaAtiva]);

  // Handlers do cliente
  const handleSelecionarCliente = (c: Cliente) => {
    setClienteSelecionadoLocal(c);
    setBuscaCliente('');
    setClientes([]);
    if (c.endereco) setEnderecoEntrega(c.endereco);
    if (c.bairro) setBairroEntrega(c.bairro);
  };

  const handleTrocarCliente = () => {
    setClienteSelecionadoLocal(null);
    clearCliente();
  };

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  // Continuar para produtos
  const handleContinuarParaProdutos = () => {
    if (!clienteSelecionadoLocal) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' });
      return;
    }
    if (!dataEntrega) {
      toast({ title: 'Data obrigatória', variant: 'destructive' });
      return;
    }
    if (!horarioEntrega) {
      toast({ title: 'Horário obrigatório', variant: 'destructive' });
      return;
    }
    if (tipoEntrega === 'TELE_ENTREGA' && (!enderecoEntrega || !bairroEntrega)) {
      toast({ title: 'Endereço obrigatório', variant: 'destructive' });
      return;
    }
    
    setCliente({
      id: clienteSelecionadoLocal.id,
      nome: clienteSelecionadoLocal.nome,
      telefone: clienteSelecionadoLocal.telefone,
      cpfCnpj: clienteSelecionadoLocal.cpfCnpj || '',
      tipoPessoa: clienteSelecionadoLocal.tipoPessoa as 'CPF' | 'CNPJ',
      endereco: clienteSelecionadoLocal.endereco,
      bairro: clienteSelecionadoLocal.bairro,
    });
    
    setEntrega({ tipoEntrega, dataEntrega, horarioEntrega, enderecoEntrega, bairroEntrega, valorTeleEntrega: parseFloat(valorTeleEntrega.replace(',', '.')) || 0 });
    setEtapa('produtos');
  };

  // Atualizar seleção - função unificada
  const atualizarSelecao = useCallback((produtoId: string, dados: Partial<{quantidade: number, tamanho: string, observacao: string}>) => {
    setSelecoes(prev => ({
      ...prev,
      [produtoId]: { ...prev[produtoId], ...dados }
    }));
  }, []);

  // Limpar seleção
  const limparSelecao = useCallback((produtoId: string) => {
    setSelecoes(prev => {
      const novo = { ...prev };
      delete novo[produtoId];
      return novo;
    });
  }, []);

  // Adicionar produto ao carrinho - otimizado
  const handleAdicionarProduto = useCallback((produto: Produto) => {
    const selecao = selecoes[produto.id];
    
    if (produto.tipoProduto === 'ESPECIAL') {
      if (!selecao?.tamanho) {
        toast({ title: 'Selecione o tamanho', variant: 'destructive' });
        return;
      }

      const precoTamanho = produto.precosTamanhos?.[selecao.tamanho];
      // Garantir que o preço é um número válido
      const preco = (precoTamanho !== undefined && precoTamanho !== null && !isNaN(precoTamanho) && precoTamanho > 0)
        ? precoTamanho
        : produto.valorUnit;
      
      adicionarItem({
        produtoId: produto.id,
        nome: `${produto.nome} (${selecao.tamanho})`,
        quantidade: 1,
        valorUnit: preco,
        tipoVenda: 'UNIDADE',
        subtotal: preco,
        tamanho: selecao.tamanho,
        observacao: selecao.observacao || undefined,
      });

      limparSelecao(produto.id);
      toast({ title: 'Adicionado!', description: `${produto.nome} (${selecao.tamanho})` });
      return;
    }

    const quantidade = selecao?.quantidade || 0;
    if (!quantidade || quantidade <= 0) {
      toast({ title: 'Selecione a quantidade', variant: 'destructive' });
      return;
    }

    const subtotal = quantidade * produto.valorUnit;

    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      quantidade,
      valorUnit: produto.valorUnit,
      tipoVenda: produto.tipoVenda,
      subtotal: Math.round(subtotal * 100) / 100,
    });

    limparSelecao(produto.id);
    toast({ title: 'Adicionado!', description: `${produto.nome}` });
  }, [selecoes, adicionarItem, limparSelecao, toast]);

  // Calcular total com taxa de entrega
  const totalComTaxa = useMemo(() => {
    const taxa = entrega.tipoEntrega === 'TELE_ENTREGA' && entrega.valorTeleEntrega > 0
      ? entrega.valorTeleEntrega
      : 0;
    return total + taxa;
  }, [total, entrega.tipoEntrega, entrega.valorTeleEntrega]);

  // Salvar orçamento
  const handleSalvarOrcamento = async () => {
    if (!cliente) {
      toast({ title: 'Cliente não selecionado', variant: 'destructive' });
      return;
    }
    if (itens.length === 0) {
      toast({ title: 'Carrinho vazio', variant: 'destructive' });
      return;
    }

    setSalvando(true);

    try {
      const response = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: cliente.id,
          itens: itens.map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            valorUnit: item.valorUnit,
            subtotal: item.subtotal,
            observacao: item.observacao,
            tamanho: item.tamanho,
          })),
          observacoes: observacoesTexto,
          total: totalComTaxa,
          tipoEntrega: entrega.tipoEntrega,
          dataEntrega: entrega.dataEntrega,
          horarioEntrega: entrega.horarioEntrega,
          enderecoEntrega: entrega.enderecoEntrega,
          bairroEntrega: entrega.bairroEntrega,
          valorTeleEntrega: entrega.valorTeleEntrega || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar orçamento');
      }

      toast({ title: 'Orçamento criado!', description: `#${data.numero.toString().padStart(4, '0')}` });
      resetOrcamento();
      setTela('orcamentos');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const dataMinima = new Date().toISOString().split('T')[0];

  // Função para obter preços de tamanho do produto
  const obterPrecosTamanhos = useCallback((produtoId: string): Record<string, number> | null => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.precosTamanhos || null;
  }, [produtos]);

  // Função para iniciar edição de item
  const handleEditarItem = useCallback((index: number) => {
    const item = itens[index];
    if (item && item.tamanho) {
      setEditandoItem(index);
      setNovoTamanho(item.tamanho);
      setNovaObservacao(item.observacao || '');
    }
  }, [itens]);

  // Função para salvar edição do item
  const handleSalvarEdicao = useCallback((index: number) => {
    const item = itens[index];
    if (!item) return;

    const precos = obterPrecosTamanhos(item.produtoId);
    let novoValorUnit = item.valorUnit;
    let novoSubtotal = item.subtotal;

    // Se mudou o tamanho, atualizar preço
    if (novoTamanho && novoTamanho !== item.tamanho && precos) {
      const novoPreco = precos[novoTamanho];
      if (novoPreco !== undefined && novoPreco !== null && !isNaN(novoPreco) && novoPreco > 0) {
        novoValorUnit = novoPreco;
        novoSubtotal = novoPreco; // Para tortas, quantidade é sempre 1
      }
    }

    // Atualizar nome se tamanho mudou
    const novoNome = novoTamanho !== item.tamanho 
      ? item.nome.replace(/\([A-Z]+\)$/, `(${novoTamanho})`)
      : item.nome;

    atualizarItem(index, {
      nome: novoNome,
      tamanho: novoTamanho,
      observacao: novaObservacao || undefined,
      valorUnit: novoValorUnit,
      subtotal: novoSubtotal,
    });

    setEditandoItem(null);
    setNovoTamanho('');
    setNovaObservacao('');

    toast({ title: 'Item atualizado!' });
  }, [itens, novoTamanho, novaObservacao, obterPrecosTamanhos, atualizarItem, toast]);

  // Função para cancelar edição
  const handleCancelarEdicao = useCallback(() => {
    setEditandoItem(null);
    setNovoTamanho('');
    setNovaObservacao('');
  }, []);

  // Renderizar card COMPACTO para grade (4 por linha) - OTIMIZADO PARA CLIQUE
  const renderProdutoCardCompacto = useCallback((produto: Produto) => {
    const selecao = selecoes[produto.id] || {};
    const temSelecao = produto.tipoProduto === 'ESPECIAL' 
      ? !!selecao.tamanho 
      : (selecao.quantidade && selecao.quantidade > 0);
    
    return (
      <div 
        key={produto.id}
        className="p-2 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors flex flex-col"
      >
        {/* Nome - truncado */}
        <div className="text-xs font-medium truncate mb-0.5" title={produto.nome}>
          {produto.nome}
        </div>
        
        {/* Preço compacto */}
        <div className="text-[11px] text-primary font-semibold mb-1.5">
          {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
            <span className="truncate block">
              {Object.entries(produto.precosTamanhos)
                .filter(([tam, preco]) => {
                  const tamanhosValidos = ['PP', 'P', 'M', 'G'];
                  return tamanhosValidos.includes(tam) && preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                })
                .sort((a, b) => ['PP', 'P', 'M', 'G'].indexOf(a[0]) - ['PP', 'P', 'M', 'G'].indexOf(b[0]))
                .map(([tam, preco]) => `${tam}:${formatarMoeda(preco)}`)
                .join(' ')}
            </span>
          ) : (
            <span>{formatarMoeda(produto.valorUnit)}/{produto.tipoVenda === 'KG' ? 'kg' : 'un'}</span>
          )}
        </div>

        {/* Seletor compacto - TAMANHO MAIOR PARA FACILITAR CLIQUE */}
        <div className="flex items-center gap-1.5">
          {produto.tipoProduto === 'ESPECIAL' ? (
            <div className="flex gap-1 flex-1">
              {['PP', 'P', 'M', 'G']
                .filter(tam => {
                  const temTamanho = produto.tamanhos?.includes(tam);
                  const preco = produto.precosTamanhos?.[tam];
                  const temPrecoValido = preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                  return temTamanho && temPrecoValido;
                })
                .map(tam => (
                  <Button
                    key={tam}
                    type="button"
                    variant={selecao.tamanho === tam ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 w-8 p-0 text-xs font-bold ${selecao.tamanho === tam ? 'btn-padaria' : ''}`}
                    onClick={() => atualizarSelecao(produto.id, { tamanho: selecao.tamanho === tam ? undefined : tam })}
                  >
                    {tam}
                  </Button>
                ))}
            </div>
          ) : produto.tipoVenda === 'KG' ? (
            <Select
              value={selecao.quantidade?.toString() || ''}
              onValueChange={(value) => atualizarSelecao(produto.id, { quantidade: parseFloat(value) })}
            >
              <SelectTrigger className="h-8 flex-1 text-xs px-2">
                <SelectValue placeholder="Qtd" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {OPCOES_KG.map((opcao) => (
                  <SelectItem key={opcao.valor} value={opcao.valor.toString()} className="text-sm">
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Qtd"
              className="h-8 flex-1 text-xs text-center px-2"
              value={selecao.quantidade || ''}
              onChange={(e) => atualizarSelecao(produto.id, { quantidade: e.target.value ? parseFloat(e.target.value) : 0 })}
            />
          )}

          {/* Botão adicionar - MAIOR E MAIS VISÍVEL */}
          <Button
            onClick={() => handleAdicionarProduto(produto)}
            className="h-8 w-8 p-0 btn-padaria shrink-0"
            disabled={!temSelecao}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Campo observação para torta especial quando tamanho selecionado */}
        {produto.tipoProduto === 'ESPECIAL' && selecao.tamanho && (
          <Input
            placeholder="Obs..."
            className="h-7 text-[10px] mt-1.5 px-2"
            value={selecao.observacao || ''}
            onChange={(e) => atualizarSelecao(produto.id, { observacao: e.target.value })}
          />
        )}
      </div>
    );
  }, [selecoes, atualizarSelecao, handleAdicionarProduto]);

  // Renderizar card do produto - memoizado
  const renderProdutoCard = useCallback((produto: Produto) => {
    const selecao = selecoes[produto.id] || {};
    const temSelecao = produto.tipoProduto === 'ESPECIAL' 
      ? !!selecao.tamanho 
      : (selecao.quantidade && selecao.quantidade > 0);
    
    // Calcular subtotal com verificação de preço válido
    let subtotal = 0;
    if (produto.tipoProduto === 'ESPECIAL' && selecao.tamanho) {
      const precoTamanho = produto.precosTamanhos?.[selecao.tamanho];
      subtotal = (precoTamanho !== undefined && precoTamanho !== null && !isNaN(precoTamanho) && precoTamanho > 0)
        ? precoTamanho
        : 0;
    } else {
      subtotal = (selecao.quantidade || 0) * produto.valorUnit;
    }

    return (
      <div 
        key={produto.id}
        className="p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
      >
        {/* Nome e preço */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate flex-1">{produto.nome}</span>
            {produto.tipoProduto === 'ESPECIAL' ? (
              <Badge className="text-[10px] px-1.5 py-0.5 h-5 bg-primary text-primary-foreground">Torta</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
                {produto.tipoVenda === 'KG' ? <Scale className="w-3 h-3 mr-0.5" /> : <Hash className="w-3 h-3 mr-0.5" />}
                {produto.tipoVenda === 'KG' ? 'kg' : 'un'}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
              <span className="text-primary font-medium">
                {Object.entries(produto.precosTamanhos)
                  .filter(([tam, preco]) => {
                    // Filtrar apenas tamanhos válidos (PP, P, M, G) e preços válidos
                    const tamanhosValidos = ['PP', 'P', 'M', 'G'];
                    return tamanhosValidos.includes(tam) && preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                  })
                  .sort((a, b) => ['PP', 'P', 'M', 'G'].indexOf(a[0]) - ['PP', 'P', 'M', 'G'].indexOf(b[0]))
                  .map(([tam, preco]) => `${tam}:${formatarMoeda(preco)}`)
                  .join(' ')}
              </span>
            ) : (
              <span className="text-primary font-semibold text-base">{formatarMoeda(produto.valorUnit)}/{produto.tipoVenda === 'KG' ? 'kg' : 'un'}</span>
            )}
          </div>
        </div>

        {/* Seletor */}
        <div className="flex items-center gap-2">
          {produto.tipoProduto === 'ESPECIAL' ? (
            <div className="flex items-center gap-1 flex-1">
              {['PP', 'P', 'M', 'G']
                .filter(tam => {
                  const temTamanho = produto.tamanhos?.includes(tam);
                  const preco = produto.precosTamanhos?.[tam];
                  const temPrecoValido = preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                  return temTamanho && temPrecoValido;
                })
                .map(tam => (
                  <Button
                    key={tam}
                    type="button"
                    variant={selecao.tamanho === tam ? 'default' : 'outline'}
                    size="sm"
                    className={`h-10 w-10 p-0 text-sm font-semibold ${selecao.tamanho === tam ? 'btn-padaria' : ''}`}
                    onClick={() => atualizarSelecao(produto.id, { tamanho: selecao.tamanho === tam ? undefined : tam })}
                  >
                    {tam}
                  </Button>
                ))}
            </div>
          ) : produto.tipoVenda === 'KG' ? (
            <Select
              value={selecao.quantidade?.toString() || '0'}
              onValueChange={(value) => atualizarSelecao(produto.id, { quantidade: parseFloat(value) || 0 })}
            >
              <SelectTrigger className="h-10 w-28 text-sm font-medium">
                <SelectValue placeholder="Quantidade" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {OPCOES_KG.map((opcao) => (
                  <SelectItem key={opcao.valor} value={opcao.valor.toString()} className="text-sm">
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="Qtd"
              className="h-10 w-24 text-sm text-center font-medium"
              value={selecao.quantidade || ''}
              onChange={(e) => atualizarSelecao(produto.id, { quantidade: e.target.value ? parseFloat(e.target.value) : 0 })}
            />
          )}

          {/* Botão adicionar */}
          <Button
            onClick={() => handleAdicionarProduto(produto)}
            className="h-10 w-10 p-0 btn-padaria shrink-0"
            disabled={!temSelecao}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Campo observação para torta especial */}
        {produto.tipoProduto === 'ESPECIAL' && selecao.tamanho && (
          <Input
            placeholder="Observação (ex: sem cebola, mais queijo...)"
            className="h-9 text-sm mt-2"
            value={selecao.observacao || ''}
            onChange={(e) => atualizarSelecao(produto.id, { observacao: e.target.value })}
          />
        )}
      </div>
    );
  }, [selecoes, atualizarSelecao, handleAdicionarProduto]);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Etapa 1: Cliente e Entrega - LAYOUT SUPER COMPACTO */}
      {etapa === 'cliente' && (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-1.5">
          {/* Header compacto */}
          <div className="flex items-center justify-center py-0.5">
            <h2 className="text-base font-bold text-primary">Novo Orçamento</h2>
          </div>
          
          {/* Conteúdo principal - duas colunas */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-h-0">
            {/* COLUNA ESQUERDA - Cliente */}
            <Card className="card-padaria flex flex-col">
              <CardHeader className="pb-0.5 pt-1.5 px-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 px-2 pb-2 flex-1 flex flex-col">
                {clienteSelecionadoLocal ? (
                  <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/30 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="bg-primary/20 rounded-full p-0.5">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-xs">{clienteSelecionadoLocal.nome}</p>
                        <p className="text-[10px] text-muted-foreground">
                          <Phone className="w-2 h-2 inline mr-0.5" />
                          {formatarTelefone(clienteSelecionadoLocal.telefone)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => setTela('clientes')}>
                      Trocar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="Nome ou telefone..."
                        className="pl-7 h-7 text-xs"
                        value={buscaCliente}
                        onChange={(e) => setBuscaCliente(e.target.value)}
                      />
                    </div>
                    
                    {/* Lista de clientes */}
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {clientes.length > 0 ? (
                        <div className="space-y-0.5">
                          {clientes.map((c) => (
                            <button
                              key={c.id}
                              className="w-full p-1.5 text-left hover:bg-muted rounded transition-colors flex items-center justify-between"
                              onClick={() => handleSelecionarCliente(c)}
                            >
                              <div>
                                <p className="font-medium text-xs">{c.nome}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatarTelefone(c.telefone)}
                                </p>
                              </div>
                              <Plus className="w-3 h-3 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      ) : loadingClientes ? (
                        <p className="text-[10px] text-muted-foreground text-center py-1">Buscando...</p>
                      ) : buscaCliente.length >= 2 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-1">Nenhum cliente</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground text-center py-1">Digite para buscar</p>
                      )}
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full h-7 text-[10px]" onClick={() => setTela('clientes')}>
                      <Plus className="w-2.5 h-2.5 mr-0.5" />
                      Novo Cliente
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* COLUNA DIREITA - Entrega */}
            <Card className="card-padaria flex flex-col">
              <CardHeader className="pb-0.5 pt-1.5 px-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 px-2 pb-2">
                {/* Tipo de entrega - compacto */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    className={`p-1.5 rounded-lg border-2 cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                      tipoEntrega === 'RETIRA' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setTipoEntrega('RETIRA')}
                  >
                    <Store className="w-3 h-3" />
                    <span className="text-[10px] font-medium">Retira</span>
                  </button>
                  <button
                    type="button"
                    className={`p-1.5 rounded-lg border-2 cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                      tipoEntrega === 'TELE_ENTREGA' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setTipoEntrega('TELE_ENTREGA')}
                  >
                    <Truck className="w-3 h-3" />
                    <span className="text-[10px] font-medium">Entrega</span>
                  </button>
                </div>

                {/* Data e Horário */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <Label className="text-[9px] text-muted-foreground">Data *</Label>
                    <Input
                      type="date"
                      min={dataMinima}
                      className="h-7 text-xs"
                      value={dataEntrega}
                      onChange={(e) => setDataEntrega(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-[9px] text-muted-foreground">Horário *</Label>
                    <Select value={horarioEntrega} onValueChange={setHorarioEntrega}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {HORARIOS_COMERCIAIS.map((h) => (
                          <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Endereço para tele-entrega */}
                {tipoEntrega === 'TELE_ENTREGA' && (
                  <div className="space-y-1 p-1.5 bg-muted/50 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-primary">
                      <MapPin className="w-2.5 h-2.5" />
                      Endereço
                    </div>
                    <Input
                      placeholder="Endereço *"
                      className="h-7 text-xs"
                      value={enderecoEntrega}
                      onChange={(e) => setEnderecoEntrega(e.target.value)}
                    />
                    <Input
                      placeholder="Bairro *"
                      className="h-7 text-xs"
                      value={bairroEntrega}
                      onChange={(e) => setBairroEntrega(e.target.value)}
                    />
                    <div>
                      <Label className="text-[9px] text-muted-foreground">Taxa</Label>
                      <Input
                        placeholder="R$ 0,00"
                        className="h-7 text-xs"
                        value={valorTeleEntrega}
                        onChange={(e) => setValorTeleEntrega(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botão Continuar - SEMPRE VISÍVEL */}
          <Button
            className="w-full btn-padaria h-9 text-xs shrink-0"
            onClick={handleContinuarParaProdutos}
            disabled={!clienteSelecionadoLocal || !dataEntrega || !horarioEntrega}
          >
            Continuar para Produtos
          </Button>
        </div>
      )}

      {/* Etapa 2: Produtos - LAYOUT DUAS COLUNAS (Desktop) / COLUNA ÚNICA (Mobile) */}
      {etapa === 'produtos' && (
        <div className="flex flex-col lg:flex-row gap-3 lg:h-[calc(100vh-140px)]">
          {/* COLUNA ESQUERDA - PRODUTOS */}
          <div className="flex-1 flex flex-col gap-2 min-w-0 pb-20 lg:pb-0">
            {/* Resumo do Cliente - COMPACTO */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm text-primary truncate max-w-[120px]">{cliente?.nome}</span>
                <Badge variant="outline" className="text-[9px] h-5 px-1.5">
                  {entrega.tipoEntrega === 'RETIRA' ? <Store className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                </Badge>
                <Badge variant="secondary" className="text-[9px] h-5 px-1.5">
                  {new Date(entrega.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')} {entrega.horarioEntrega}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setEtapa('cliente')}>
                Editar
              </Button>
            </div>

            {/* Busca e Filtros - COMPACTO */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="input-padaria pl-9 h-8 text-sm"
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                />
                {buscaProduto && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                    onClick={() => setBuscaProduto('')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <Select value={categoriaAtiva} onValueChange={setCategoriaAtiva}>
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue placeholder="Cat." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-0.5">
                <Button
                  variant={modoVisualizacao === 'grade' ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-8 w-8 p-0 ${modoVisualizacao === 'grade' ? 'btn-padaria' : ''}`}
                  onClick={() => setModoVisualizacao('grade')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={modoVisualizacao === 'lista' ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-8 w-8 p-0 ${modoVisualizacao === 'lista' ? 'btn-padaria' : ''}`}
                  onClick={() => setModoVisualizacao('lista')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Lista de Produtos - OCUPA ESPAÇO RESTANTE */}
            <Card className="card-padaria flex-1 min-h-0">
              <CardContent className="p-0 h-full">
                <div className="h-full overflow-y-auto">
                  {loadingProdutos ? (
                    <div className="flex items-center justify-center py-12">
                      <Package className="w-8 h-8 animate-pulse text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Carregando...</span>
                    </div>
                  ) : modoVisualizacao === 'grade' ? (
                    /* GRADE COMPACTA - 4 por linha */
                    <div className="p-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {produtosFiltrados.map(produto => renderProdutoCardCompacto(produto))}
                      </div>
                      
                      {produtosFiltrados.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum produto encontrado</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* LISTA COMPLETA - com categorias */
                    <div className="p-2">
                      {Object.entries(produtosPorCategoria).map(([categoria, prods]) => (
                        <div key={categoria} className="mb-4">
                          {categoriaAtiva === 'Todos' && (
                            <div className="flex items-center gap-2 px-1 py-2 sticky top-0 bg-card z-10 border-b border-border/50 mb-2">
                              <Badge variant="outline" className="text-xs font-semibold">{categoria}</Badge>
                              <span className="text-xs text-muted-foreground">{prods.length} produtos</span>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {prods.map(produto => renderProdutoCard(produto))}
                          </div>
                        </div>
                      ))}
                      
                      {produtosFiltrados.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhum produto encontrado</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUNA DIREITA - CARRINHO LATERAL (Desktop) */}
          <div className="hidden lg:flex w-72 flex-col gap-2 shrink-0">
            {/* Header do Carrinho */}
            <div className="flex items-center justify-between px-3 py-2 bg-primary rounded-lg">
              <div className="flex items-center gap-2 text-primary-foreground">
                <FileText className="w-4 h-4" />
                <span className="font-semibold text-sm">Itens</span>
                <Badge className="bg-white/20 text-white text-[10px] h-5 px-1.5">
                  {itens.length}
                </Badge>
              </div>
            </div>

            {/* Lista de Itens do Carrinho */}
            <Card className="card-padaria flex-1 min-h-0">
              <CardContent className="p-0 h-full flex flex-col">
                {itens.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Nenhum item</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Itens com scroll */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {itens.map((item, index) => {
                        const precos = obterPrecosTamanhos(item.produtoId);
                        const tamanhosDisponiveis = precos 
                          ? ['PP', 'P', 'M', 'G'].filter(tam => {
                              const preco = precos[tam];
                              return preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                            })
                          : [];
                        
                        return (
                        <div key={index} className="p-2 bg-muted/50 rounded-lg">
                          {editandoItem === index ? (
                            /* Modo edição */
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] text-muted-foreground mr-1">Tamanho:</span>
                                {tamanhosDisponiveis.map(tam => (
                                  <Button
                                    key={tam}
                                    type="button"
                                    variant={novoTamanho === tam ? 'default' : 'outline'}
                                    size="sm"
                                    className={`h-6 w-6 p-0 text-[10px] font-bold ${novoTamanho === tam ? 'btn-padaria' : ''}`}
                                    onClick={() => setNovoTamanho(tam)}
                                  >
                                    {tam}
                                  </Button>
                                ))}
                              </div>
                              <Input
                                placeholder="Observação..."
                                className="h-6 text-[10px]"
                                value={novaObservacao}
                                onChange={(e) => setNovaObservacao(e.target.value)}
                              />
                              <div className="flex gap-1">
                                <Button size="sm" className="h-6 text-[10px] btn-padaria flex-1" onClick={() => handleSalvarEdicao(index)}>
                                  Salvar
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={handleCancelarEdicao}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Modo visualização */
                            <>
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs truncate">{item.nome}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatarQuantidade(item.quantidade, item.tipoVenda)} × {formatarMoeda(item.valorUnit)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="font-semibold text-xs text-primary">{formatarMoeda(item.subtotal)}</span>
                                  {item.tamanho && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                                      onClick={() => handleEditarItem(index)}
                                      title="Editar tamanho/observação"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removerItem(index)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {/* Observação do item - menos destaque */}
                              {item.observacao && (
                                <p className="text-[9px] text-orange-600 mt-1 italic truncate" title={item.observacao}>
                                  ℹ {item.observacao}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        );
                      })}
                    </div>

                    {/* Totais e Ações - FIXO NA PARTE INFERIOR */}
                    <div className="border-t border-border p-2 space-y-2 bg-card">
                      {/* Subtotal */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">{formatarMoeda(total)}</span>
                      </div>
                      
                      {/* Taxa de entrega */}
                      {entrega.tipoEntrega === 'TELE_ENTREGA' && entrega.valorTeleEntrega > 0 && (
                        <div className="flex justify-between items-center text-xs text-primary">
                          <span>Taxa entrega:</span>
                          <span className="font-medium">{formatarMoeda(entrega.valorTeleEntrega)}</span>
                        </div>
                      )}
                      
                      {/* Total */}
                      <div className="flex justify-between items-center pt-1 border-t border-border">
                        <span className="font-semibold text-sm">TOTAL:</span>
                        <span className="font-bold text-lg text-primary">
                          {formatarMoeda(totalComTaxa)}
                        </span>
                      </div>

                      {/* Observações gerais */}
                      <Textarea
                        placeholder="Observações gerais..."
                        className="input-padaria min-h-[40px] text-xs"
                        value={observacoesTexto}
                        onChange={(e) => setObservacoesTexto(e.target.value)}
                      />

                      {/* Botões de ação */}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 h-8 text-xs" onClick={() => setEtapa('cliente')}>
                          Voltar
                        </Button>
                        <Button
                          className="flex-1 btn-padaria h-8 text-xs"
                          onClick={handleSalvarOrcamento}
                          disabled={salvando || itens.length === 0}
                        >
                          {salvando ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* FAB do Carrinho - MOBILE */}
          <div className="fixed bottom-20 right-4 z-40 lg:hidden">
            <Sheet open={carrinhoAberto} onOpenChange={setCarrinhoAberto}>
              <SheetTrigger asChild>
                <Button
                  className="h-14 w-14 rounded-full shadow-lg btn-padaria relative"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {itens.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-accent text-accent-foreground">
                      {itens.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col">
                <SheetHeader className="px-4 py-3 border-b bg-primary text-primary-foreground">
                  <SheetTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Carrinho
                    <Badge className="bg-white/20 text-white">{itens.length}</Badge>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-3">
                  {itens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Package className="w-12 h-12 mb-2 opacity-30" />
                      <p className="text-sm">Nenhum item</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {itens.map((item, index) => {
                        const precos = obterPrecosTamanhos(item.produtoId);
                        const tamanhosDisponiveis = precos 
                          ? ['PP', 'P', 'M', 'G'].filter(tam => {
                              const preco = precos[tam];
                              return preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                            })
                          : [];
                        
                        return (
                        <div key={index} className="p-2 bg-muted/50 rounded-lg">
                          {editandoItem === index ? (
                            /* Modo edição */
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-xs text-muted-foreground mr-1">Tamanho:</span>
                                {tamanhosDisponiveis.map(tam => (
                                  <Button
                                    key={tam}
                                    type="button"
                                    variant={novoTamanho === tam ? 'default' : 'outline'}
                                    size="sm"
                                    className={`h-7 w-7 p-0 text-xs font-bold ${novoTamanho === tam ? 'btn-padaria' : ''}`}
                                    onClick={() => setNovoTamanho(tam)}
                                  >
                                    {tam}
                                  </Button>
                                ))}
                              </div>
                              <Input
                                placeholder="Observação..."
                                className="h-8 text-sm"
                                value={novaObservacao}
                                onChange={(e) => setNovaObservacao(e.target.value)}
                              />
                              <div className="flex gap-1">
                                <Button size="sm" className="h-7 text-xs btn-padaria flex-1" onClick={() => handleSalvarEdicao(index)}>
                                  Salvar
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCancelarEdicao}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Modo visualização */
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.nome}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatarQuantidade(item.quantidade, item.tipoVenda)} × {formatarMoeda(item.valorUnit)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-primary">{formatarMoeda(item.subtotal)}</span>
                                  {item.tamanho && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                      onClick={() => handleEditarItem(index)}
                                      title="Editar tamanho/observação"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removerItem(index)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {item.observacao && (
                                <p className="text-[10px] text-orange-600 mt-1 italic truncate">{item.observacao}</p>
                              )}
                            </>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {itens.length > 0 && (
                  <div className="border-t p-3 space-y-2 bg-card">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatarMoeda(total)}</span>
                    </div>
                    
                    {entrega.tipoEntrega === 'TELE_ENTREGA' && entrega.valorTeleEntrega > 0 && (
                      <div className="flex justify-between items-center text-sm text-primary">
                        <span>Taxa entrega:</span>
                        <span className="font-medium">{formatarMoeda(entrega.valorTeleEntrega)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="font-semibold">TOTAL:</span>
                      <span className="font-bold text-lg text-primary">{formatarMoeda(totalComTaxa)}</span>
                    </div>
                    
                    <Textarea
                      placeholder="Observações..."
                      className="min-h-[50px] text-sm"
                      value={observacoesTexto}
                      onChange={(e) => setObservacoesTexto(e.target.value)}
                    />
                    
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => setEtapa('cliente')}>
                        Voltar
                      </Button>
                      <Button
                        className="flex-1 btn-padaria h-9 text-sm"
                        onClick={handleSalvarOrcamento}
                        disabled={salvando || itens.length === 0}
                      >
                        {salvando ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}
    </div>
  );
}
// v1774535288
