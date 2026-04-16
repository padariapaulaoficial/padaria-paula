'use client';

// NovoOrcamento - Padaria Paula
// Criação de orçamentos com cliente, produtos e entrega

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, User, Phone, Calendar, Truck, Store, MapPin, Plus, Check, Clock,
  Package, Scale, Hash, Trash2, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Opções de KG
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

export default function NovoOrcamento() {
  const { 
    cliente, setCliente, clearCliente,
    entrega, setEntrega,
    itens, adicionarItem, removerItem, atualizarQuantidade, clearCarrinho,
    observacoes, setObservacoes,
    total,
    resetOrcamento
  } = useOrcamentoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();
  
  // Estados
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSelecionadoLocal, setClienteSelecionadoLocal] = useState<Cliente | null>(null);
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  
  const [tipoEntrega, setTipoEntrega] = useState<'RETIRA' | 'TELE_ENTREGA'>('RETIRA');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('');
  const [enderecoEntrega, setEnderecoEntrega] = useState('');
  const [bairroEntrega, setBairroEntrega] = useState('');
  const [observacoesTexto, setObservacoesTexto] = useState('');
  
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState<'cliente' | 'produtos'>('cliente');
  
  // Estados para seleção de produtos
  const [quantidadesKG, setQuantidadesKG] = useState<Record<string, number>>({});
  const [quantidadesUnidade, setQuantidadesUnidade] = useState<Record<string, string>>({});
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<Record<string, string>>({});
  const [observacoesProduto, setObservacoesProduto] = useState<Record<string, string>>({});

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

  // Verificar se cliente já está selecionado na store (vindo de ClientesLista)
  useEffect(() => {
    if (cliente && !clienteSelecionadoLocal) {
      // Cliente já foi selecionado em ClientesLista - pré-preencher
      setClienteSelecionadoLocal({
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        cpfCnpj: cliente.cpfCnpj,
        tipoPessoa: cliente.tipoPessoa,
        endereco: cliente.endereco,
        bairro: cliente.bairro,
      });
      
      // Pré-preencher endereço de entrega
      if (cliente.endereco) setEnderecoEntrega(cliente.endereco);
      if (cliente.bairro) setBairroEntrega(cliente.bairro);
      
      // Se dados de entrega já estão definidos, ir para etapa de produtos
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

  // Carregar clientes
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

  // Extrair categorias únicas
  const categorias = useMemo(() => {
    const cats = new Set(produtos.map(p => p.categoria || 'Outros'));
    return ['Todos', ...Array.from(cats)];
  }, [produtos]);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(produto => {
      const matchBusca = produto.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
                         (produto.descricao?.toLowerCase().includes(buscaProduto.toLowerCase()));
      const matchCategoria = categoriaAtiva === 'Todos' || produto.categoria === categoriaAtiva;
      return matchBusca && matchCategoria;
    });
  }, [produtos, buscaProduto, categoriaAtiva]);

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

  // Selecionar cliente
  const handleSelecionarCliente = (c: Cliente) => {
    setClienteSelecionadoLocal(c);
    setBuscaCliente('');
    setClientes([]);
    
    // Pré-preencher endereço
    if (c.endereco) setEnderecoEntrega(c.endereco);
    if (c.bairro) setBairroEntrega(c.bairro);
  };

  // Trocar cliente
  const handleTrocarCliente = () => {
    setClienteSelecionadoLocal(null);
    clearCliente();
  };

  // Formatar telefone
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  // Continuar para produtos
  const handleContinuarParaProdutos = () => {
    if (!clienteSelecionadoLocal) {
      toast({
        title: 'Selecione um cliente',
        description: 'Você precisa selecionar um cliente para continuar.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!dataEntrega) {
      toast({
        title: 'Data obrigatória',
        description: 'Selecione a data de entrega/retirada.',
        variant: 'destructive',
      });
      return;
    }

    if (!horarioEntrega) {
      toast({
        title: 'Horário obrigatório',
        description: 'Selecione o horário de entrega/retirada.',
        variant: 'destructive',
      });
      return;
    }
    
    if (tipoEntrega === 'TELE_ENTREGA' && (!enderecoEntrega || !bairroEntrega)) {
      toast({
        title: 'Endereço obrigatório',
        description: 'Para tele entrega, preencha o endereço e bairro.',
        variant: 'destructive',
      });
      return;
    }
    
    // Salvar cliente na store
    setCliente({
      id: clienteSelecionadoLocal.id,
      nome: clienteSelecionadoLocal.nome,
      telefone: clienteSelecionadoLocal.telefone,
      cpfCnpj: clienteSelecionadoLocal.cpfCnpj || '',
      tipoPessoa: clienteSelecionadoLocal.tipoPessoa as 'CPF' | 'CNPJ',
      endereco: clienteSelecionadoLocal.endereco,
      bairro: clienteSelecionadoLocal.bairro,
    });
    
    // Salvar dados de entrega
    setEntrega({
      tipoEntrega,
      dataEntrega,
      horarioEntrega,
      enderecoEntrega,
      bairroEntrega,
    });
    
    setEtapa('produtos');
  };

  // Adicionar produto ao carrinho
  const handleAdicionarProduto = (produto: Produto) => {
    // Produto especial (Torta)
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

      const preco = produto.precosTamanhos?.[tamanho] || produto.valorUnit;
      const observacao = observacoesProduto[produto.id] || '';

      adicionarItem({
        produtoId: produto.id,
        nome: `${produto.nome} (${tamanho})`,
        quantidade: 1,
        valorUnit: preco,
        tipoVenda: 'UNIDADE',
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
      setObservacoesProduto(prev => {
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
        description: 'Escolha uma quantidade para adicionar.',
        variant: 'destructive',
      });
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

  // Salvar orçamento
  const handleSalvarOrcamento = async () => {
    if (!cliente) {
      toast({
        title: 'Cliente não selecionado',
        description: 'Selecione um cliente para o orçamento.',
        variant: 'destructive',
      });
      return;
    }

    if (itens.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione pelo menos um produto ao orçamento.',
        variant: 'destructive',
      });
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

      toast({
        title: 'Orçamento criado!',
        description: `Orçamento #${data.numero.toString().padStart(4, '0')} salvo com sucesso.`,
      });

      resetOrcamento();
      setTela('orcamentos');
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Não foi possível salvar o orçamento.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  // Data mínima (hoje)
  const dataMinima = new Date().toISOString().split('T')[0];

  // Verificar se produto tem quantidade válida
  const temQuantidadeValida = (produto: Produto): boolean => {
    if (produto.tipoProduto === 'ESPECIAL') {
      return !!tamanhosSelecionados[produto.id];
    }
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
    if (produto.tipoProduto === 'ESPECIAL') {
      const tamanho = tamanhosSelecionados[produto.id];
      if (tamanho && produto.precosTamanhos) {
        return produto.precosTamanhos[tamanho];
      }
      return null;
    }
    let quantidade = 0;
    if (produto.tipoVenda === 'KG') {
      quantidade = quantidadesKG[produto.id] || 0;
    } else {
      const valor = quantidadesUnidade[produto.id];
      quantidade = valor ? parseFloat(valor) : 0;
    }
    if (quantidade > 0) {
      return quantidade * produto.valorUnit;
    }
    return null;
  };

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
              <CardDescription>
                Busque por nome ou telefone
              </CardDescription>
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
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Buscando...
                    </p>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setTela('clientes')}
                  >
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
              {/* Tipo de Entrega */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Entrega *</Label>
                <RadioGroup
                  value={tipoEntrega}
                  onValueChange={(value) => setTipoEntrega(value as 'RETIRA' | 'TELE_ENTREGA')}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    tipoEntrega === 'RETIRA' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value="RETIRA" id="retira" />
                    <Label htmlFor="retira" className="cursor-pointer flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span className="text-sm font-medium">Cliente Retira</span>
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    tipoEntrega === 'TELE_ENTREGA' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}>
                    <RadioGroupItem value="TELE_ENTREGA" id="tele-entrega" />
                    <Label htmlFor="tele-entrega" className="cursor-pointer flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-medium">Tele Entrega</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Data e Horário */}
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

              {/* Endereço para TELE_ENTREGA */}
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

          {/* Botão Continuar */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setEtapa('cliente')}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Busca de Produtos */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              className="input-padaria pl-10 h-11"
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
            />
          </div>

          {/* Categorias */}
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
              <ScrollArea className="h-[calc(100vh-580px)] pr-2">
                {Object.entries(produtosPorCategoria).map(([categoria, prods]) => (
                  <div key={categoria} className="mb-4 last:mb-0">
                    {categoriaAtiva === 'Todos' && (
                      <h3 className="font-display text-base font-semibold mb-2 text-primary border-b border-border pb-1">
                        {categoria}
                      </h3>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {prods.map(produto => (
                        <Card 
                          key={produto.id} 
                          className={`card-padaria hover:shadow-md transition-shadow ${produto.tipoProduto === 'ESPECIAL' ? 'ring-2 ring-primary/30' : ''}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{produto.nome}</h4>
                              </div>
                              {produto.tipoProduto === 'ESPECIAL' ? (
                                <Badge className="ml-2 shrink-0 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground">
                                  Torta
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="ml-2 flex items-center gap-1 shrink-0 text-[10px] px-1.5 py-0.5">
                                  {produto.tipoVenda === 'KG' ? <Scale className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
                                  {produto.tipoVenda === 'KG' ? 'Kg' : 'Un'}
                                </Badge>
                              )}
                            </div>

                            {/* Preço */}
                            {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
                              <div className="mb-2 text-xs text-muted-foreground">
                                {Object.keys(produto.precosTamanhos)
                                  .sort((a, b) => ['P', 'M', 'G', 'GG'].indexOf(a) - ['P', 'M', 'G', 'GG'].indexOf(b))
                                  .map(tam => (
                                    <span key={tam} className="mr-2">
                                      <strong className="text-primary">{tam}</strong>: {formatarMoeda(produto.precosTamanhos![tam])}
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 mb-2">
                                <span className="text-lg font-bold text-primary">
                                  {formatarMoeda(produto.valorUnit)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  /{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                                </span>
                              </div>
                            )}

                            {/* Seletor de quantidade */}
                            <div className="space-y-2">
                              {produto.tipoProduto === 'ESPECIAL' ? (
                                <>
                                  <div className="flex gap-1">
                                    {['P', 'M', 'G', 'GG']
                                      .filter(tam => produto.tamanhos?.includes(tam))
                                      .map(tam => (
                                        <Button
                                          key={tam}
                                          type="button"
                                          variant={tamanhosSelecionados[produto.id] === tam ? 'default' : 'outline'}
                                          size="sm"
                                          className={`flex-1 h-8 text-xs ${tamanhosSelecionados[produto.id] === tam ? 'btn-padaria' : ''}`}
                                          onClick={() => setTamanhosSelecionados(prev => ({ ...prev, [produto.id]: tam }))}
                                        >
                                          {tam}
                                        </Button>
                                      ))}
                                  </div>
                                  <Input
                                    placeholder="Observação (opcional)"
                                    className="h-8 text-sm"
                                    value={observacoesProduto[produto.id] || ''}
                                    onChange={(e) => setObservacoesProduto(prev => ({ ...prev, [produto.id]: e.target.value }))}
                                  />
                                </>
                              ) : produto.tipoVenda === 'KG' ? (
                                <Select
                                  value={quantidadesKG[produto.id]?.toString() || '0'}
                                  onValueChange={(value) => setQuantidadesKG(prev => ({ ...prev, [produto.id]: parseFloat(value) }))}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Quantidade" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {OPCOES_KG.map((opcao) => (
                                      <SelectItem key={opcao.valor} value={opcao.valor.toString()}>
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
                                  placeholder="Quantidade"
                                  className="h-8 text-sm"
                                  value={quantidadesUnidade[produto.id] || ''}
                                  onChange={(e) => setQuantidadesUnidade(prev => ({ ...prev, [produto.id]: e.target.value }))}
                                />
                              )}
                            </div>

                            {/* Botão adicionar */}
                            <Button
                              onClick={() => handleAdicionarProduto(produto)}
                              className="w-full btn-padaria mt-2 h-8"
                              disabled={!temQuantidadeValida(produto)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                              {obterSubtotal(produto) && (
                                <Badge variant="secondary" className="ml-2 bg-primary-foreground/20 text-primary-foreground text-[10px]">
                                  {formatarMoeda(obterSubtotal(produto)!)}
                                </Badge>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
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

          {/* Carrinho */}
          {itens.length > 0 && (
            <Card className="card-padaria">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Itens do Orçamento ({itens.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {itens.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
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
                placeholder="Observações gerais do orçamento..."
                className="input-padaria min-h-[80px]"
                value={observacoesTexto}
                onChange={(e) => setObservacoesTexto(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setEtapa('cliente')}
            >
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
