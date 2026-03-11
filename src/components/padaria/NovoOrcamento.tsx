'use client';

// NovoOrcamento - Padaria Paula
// Criação de orçamentos com cliente, produtos e entrega
// Otimizado para listas grandes de produtos (50+)

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, User, Phone, Calendar, Truck, Store, MapPin, Plus, Check, Clock,
  Package, Scale, Hash, Trash2, FileText, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
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

// Opções de KG - mais compactas
const OPCOES_KG = [
  { valor: 0, label: 'Qtd' },
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
    itens, adicionarItem, removerItem, 
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
  const [observacoesTexto, setObservacoesTexto] = useState('');
  
  // Estados de controle
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState<'cliente' | 'produtos'>('cliente');
  
  // Estado unificado para seleções - mais eficiente
  const [selecoes, setSelecoes] = useState<Record<string, {quantidade: number, tamanho?: string, observacao?: string}>>({});

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
    
    setEntrega({ tipoEntrega, dataEntrega, horarioEntrega, enderecoEntrega, bairroEntrega });
    setEtapa('produtos');
  };

  // Atualizar seleção - função unificada
  const atualizarSelecao = useCallback((produtoId: string, dados: Partial<{quantidade: number, tamanho: string}>) => {
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

      const preco = produto.precosTamanhos?.[selecao.tamanho] || produto.valorUnit;
      
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
          total,
          tipoEntrega: entrega.tipoEntrega,
          dataEntrega: entrega.dataEntrega,
          horarioEntrega: entrega.horarioEntrega,
          enderecoEntrega: entrega.enderecoEntrega,
          bairroEntrega: entrega.bairroEntrega,
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

  // Renderizar linha do produto - memoizado
  const renderProdutoLinha = useCallback((produto: Produto) => {
    const selecao = selecoes[produto.id] || {};
    const temSelecao = produto.tipoProduto === 'ESPECIAL' 
      ? !!selecao.tamanho 
      : (selecao.quantidade && selecao.quantidade > 0);
    
    const subtotal = produto.tipoProduto === 'ESPECIAL' && selecao.tamanho
      ? produto.precosTamanhos?.[selecao.tamanho] || 0
      : (selecao.quantidade || 0) * produto.valorUnit;

    return (
      <div 
        key={produto.id}
        className="p-2 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Nome e preço */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{produto.nome}</span>
              {produto.tipoProduto === 'ESPECIAL' ? (
                <Badge className="text-[10px] px-1 py-0 h-4 bg-primary text-primary-foreground">Torta</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  {produto.tipoVenda === 'KG' ? <Scale className="w-3 h-3 mr-0.5" /> : <Hash className="w-3 h-3 mr-0.5" />}
                  {produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
                <span className="text-primary font-medium">
                  {Object.entries(produto.precosTamanhos)
                    .filter(([, preco]) => preco)
                    .sort((a, b) => ['P', 'M', 'G', 'GG'].indexOf(a[0]) - ['P', 'M', 'G', 'GG'].indexOf(b[0]))
                    .map(([tam, preco]) => `${tam}:${formatarMoeda(preco)}`)
                    .join(' ')}
                </span>
              ) : (
                <span className="text-primary font-semibold">{formatarMoeda(produto.valorUnit)}/{produto.tipoVenda === 'KG' ? 'kg' : 'un'}</span>
              )}
            </div>
          </div>

          {/* Seletor */}
          <div className="flex items-center gap-1 shrink-0">
            {produto.tipoProduto === 'ESPECIAL' ? (
              <>
                {['P', 'M', 'G', 'GG']
                  .filter(tam => produto.tamanhos?.includes(tam))
                  .map(tam => (
                    <Button
                      key={tam}
                      type="button"
                      variant={selecao.tamanho === tam ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 w-7 p-0 text-xs ${selecao.tamanho === tam ? 'btn-padaria' : ''}`}
                      onClick={() => atualizarSelecao(produto.id, { tamanho: selecao.tamanho === tam ? undefined : tam })}
                    >
                      {tam}
                    </Button>
                  ))}
              </>
            ) : produto.tipoVenda === 'KG' ? (
              <Select
                value={selecao.quantidade?.toString() || '0'}
                onValueChange={(value) => atualizarSelecao(produto.id, { quantidade: parseFloat(value) || 0 })}
              >
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue placeholder="Qtd" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {OPCOES_KG.map((opcao) => (
                    <SelectItem key={opcao.valor} value={opcao.valor.toString()} className="text-xs">
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
                className="h-7 w-16 text-xs text-center"
                value={selecao.quantidade || ''}
                onChange={(e) => atualizarSelecao(produto.id, { quantidade: e.target.value ? parseFloat(e.target.value) : 0 })}
              />
            )}

            {/* Botão adicionar */}
            <Button
              onClick={() => handleAdicionarProduto(produto)}
              className="h-7 w-7 p-0 btn-padaria shrink-0"
              disabled={!temSelecao}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Campo observação para torta especial */}
        {produto.tipoProduto === 'ESPECIAL' && selecao.tamanho && (
          <Input
            placeholder="Observação (ex: sem cebola, mais queijo...)"
            className="h-7 text-xs mt-2"
            value={selecao.observacao || ''}
            onChange={(e) => atualizarSelecao(produto.id, { observacao: e.target.value })}
          />
        )}
      </div>
    );
  }, [selecoes, atualizarSelecao, handleAdicionarProduto]);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-4">
      {/* Etapa 1: Cliente e Entrega */}
      {etapa === 'cliente' && (
        <>
          {/* Seleção de Cliente */}
          <Card className="card-padaria">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Selecionar Cliente
              </CardTitle>
              <CardDescription>Busque por nome ou telefone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {clienteSelecionadoLocal ? (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/20 rounded-full p-2">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{clienteSelecionadoLocal.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {formatarTelefone(clienteSelecionadoLocal.telefone)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleTrocarCliente}>
                        Trocar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite nome ou telefone..."
                      className="input-padaria pl-10 h-11"
                      value={buscaCliente}
                      onChange={(e) => setBuscaCliente(e.target.value)}
                    />
                  </div>
                  
                  {clientes.length > 0 && (
                    <ScrollArea className="h-48">
                      <div className="space-y-1">
                        {clientes.map((c) => (
                          <button
                            key={c.id}
                            className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors flex items-center justify-between"
                            onClick={() => handleSelecionarCliente(c)}
                          >
                            <div>
                              <p className="font-medium">{c.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatarTelefone(c.telefone)}
                                {c.cpfCnpj && ` • ${c.cpfCnpj}`}
                              </p>
                            </div>
                            <Plus className="w-4 h-4 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  
                  {loadingClientes && (
                    <p className="text-sm text-muted-foreground text-center py-4">Buscando...</p>
                  )}
                  
                  <Button variant="outline" className="w-full" onClick={() => setTela('clientes')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Novo Cliente
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Dados de Entrega */}
          <Card className="card-padaria">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dados da Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Entrega *</Label>
                <RadioGroup
                  value={tipoEntrega}
                  onValueChange={(value) => setTipoEntrega(value as 'RETIRA' | 'TELE_ENTREGA')}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    tipoEntrega === 'RETIRA' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value="RETIRA" id="retira" />
                    <Label htmlFor="retira" className="cursor-pointer flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span className="text-sm font-medium">Cliente Retira</span>
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    tipoEntrega === 'TELE_ENTREGA' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value="TELE_ENTREGA" id="tele-entrega" />
                    <Label htmlFor="tele-entrega" className="cursor-pointer flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-medium">Tele Entrega</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dataEntrega" className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    Data *
                  </Label>
                  <Input
                    id="dataEntrega"
                    type="date"
                    min={dataMinima}
                    className="input-padaria h-10"
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="horarioEntrega" className="flex items-center gap-2 text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    Horário *
                  </Label>
                  <Select value={horarioEntrega} onValueChange={setHorarioEntrega}>
                    <SelectTrigger className="input-padaria h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {HORARIOS_COMERCIAIS.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tipoEntrega === 'TELE_ENTREGA' && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border-2 border-primary/30">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Endereço de Entrega
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="endereco" className="text-sm">Endereço *</Label>
                      <Input
                        id="endereco"
                        placeholder="Rua, número, complemento"
                        className="input-padaria h-11 text-base"
                        value={enderecoEntrega}
                        onChange={(e) => setEnderecoEntrega(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bairro" className="text-sm">Bairro *</Label>
                      <Input
                        id="bairro"
                        placeholder="Nome do bairro"
                        className="input-padaria h-11 text-base"
                        value={bairroEntrega}
                        onChange={(e) => setBairroEntrega(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full btn-padaria h-12 text-base"
            onClick={handleContinuarParaProdutos}
            disabled={!clienteSelecionadoLocal || !dataEntrega || !horarioEntrega}
          >
            Continuar para Produtos
          </Button>
        </>
      )}

      {/* Etapa 2: Produtos */}
      {etapa === 'produtos' && (
        <>
          {/* Resumo do Cliente */}
          <Card className="card-padaria border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 rounded-full p-2">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-primary">{cliente?.nome}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">
                        {entrega.tipoEntrega === 'RETIRA' ? (
                          <><Store className="w-3 h-3 mr-1" />Retira</>
                        ) : (
                          <><Truck className="w-3 h-3 mr-1" />Entrega</>
                        )}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {new Date(entrega.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')} - {entrega.horarioEntrega}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setEtapa('cliente')}>
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Busca e Filtros */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                className="input-padaria pl-10 h-10"
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
              />
              {buscaProduto && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setBuscaProduto('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Select value={categoriaAtiva} onValueChange={setCategoriaAtiva}>
              <SelectTrigger className="w-36 h-10">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Produtos - Layout Compacto */}
          <Card className="card-padaria">
            <CardContent className="p-0">
              <div className="h-[calc(100vh-380px)] overflow-y-auto">
                {loadingProdutos ? (
                  <div className="flex items-center justify-center py-12">
                    <Package className="w-8 h-8 animate-pulse text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando...</span>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {Object.entries(produtosPorCategoria).map(([categoria, prods]) => (
                      <div key={categoria} className="mb-3">
                        {categoriaAtiva === 'Todos' && (
                          <div className="flex items-center gap-2 px-1 py-1.5 sticky top-0 bg-card z-10 border-b border-border/50">
                            <Badge variant="outline" className="text-xs font-semibold">{categoria}</Badge>
                            <span className="text-xs text-muted-foreground">{prods.length}</span>
                          </div>
                        )}
                        <div className="space-y-1 mt-1">
                          {prods.map(produto => renderProdutoLinha(produto))}
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

          {/* Carrinho */}
          {itens.length > 0 && (
            <Card className="card-padaria border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Itens ({itens.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ScrollArea className="max-h-40">
                  {itens.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatarQuantidade(item.quantidade, item.tipoVenda)} × {formatarMoeda(item.valorUnit)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{formatarMoeda(item.subtotal)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removerItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-lg text-primary">{formatarMoeda(total)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          <Card className="card-padaria">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Observações gerais..."
                className="input-padaria min-h-[60px]"
                value={observacoesTexto}
                onChange={(e) => setObservacoesTexto(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setEtapa('cliente')}>
              Voltar
            </Button>
            <Button
              className="flex-1 btn-padaria h-12"
              onClick={handleSalvarOrcamento}
              disabled={salvando || itens.length === 0}
            >
              {salvando ? 'Salvando...' : 'Salvar Orçamento'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
