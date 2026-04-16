'use client';

// HistoricoPedidos - Padaria Paula
// Lista de pedidos com edição de itens e reimpressão - Layout Otimizado

import { useState, useEffect, useRef } from 'react';
import { 
  Search, RefreshCw, Eye, Printer, Calendar, Trash2, AlertTriangle, 
  FileText, Edit2, Check, X, MapPin, Truck, Store, Lock, Loader2, 
  Clock, Plus, Minus, Package, User, Phone, CreditCard, DollarSign,
  MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
import {
  gerarCupomCliente,
  gerarCupomCozinhaGrande,
  imprimirViaDialogo,
  formatarNumeroPedido
} from '@/lib/escpos';


interface Produto {
  id: string;
  nome: string;
  tipoVenda: string;
  valorUnit: number;
  ativo: boolean;
}

interface ItemPedido {
  id: string;
  produto: {
    id: string;
    nome: string;
    tipoVenda: string;
  };
  quantidade: number;
  quantidadePedida: number;
  valorUnit: number;
  subtotal: number;
  subtotalPedida: number;
  observacao?: string;
}

interface Pedido {
  id: string;
  numero: number;
  cliente: {
    id?: string;
    nome: string;
    telefone: string;
    cpfCnpj?: string;
    tipoPessoa?: string;
    endereco?: string | null;
    bairro?: string | null;
  };
  itens: ItemPedido[];
  observacoes?: string;
  total: number;
  totalPedida: number;
  status: string;
  tipoEntrega?: string;
  dataEntrega?: string;
  horarioEntrega?: string;
  enderecoEntrega?: string;
  bairroEntrega?: string;
  createdAt: string;
  updatedAt?: Date;
  clienteId?: string;
  impresso?: boolean;
}

interface Configuracao {
  id?: string;
  nomeLoja: string;
  endereco: string;
  telefone: string;
  cnpj: string;
  logoUrl?: string | null;
  senha?: string;
  mensagemOrcamento?: string;
  mensagemProntoRetira?: string;
  mensagemProntoEntrega?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function HistoricoPedidos() {
  const { toast } = useToast();
  
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<Pedido | null>(null);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);
  const [config, setConfig] = useState<Configuracao | null>(null);
  
  // Edição de itens - valores livres
  const [itensEditados, setItensEditados] = useState<Record<string, string>>({});
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Adicionar produtos
  const [dialogAdicionarOpen, setDialogAdicionarOpen] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<string>('');
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  
  // PIN para exclusão - layout igual ao login principal
  const [pinParaExcluir, setPinParaExcluir] = useState(['', '', '', '']);
  const [verificandoPin, setVerificandoPin] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Prevenção de duplo clique
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null);
  const [imprimindo, setImprimindo] = useState<string | null>(null);

  // Carregar configurações
  useEffect(() => {
    fetch('/api/configuracao')
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  // Carregar pedidos
  const carregarPedidos = async () => {
    setLoading(true);
    try {
      let url = '/api/pedidos?limite=100';
      if (dataFiltro) {
        url += `&data=${dataFiltro}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setPedidos(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, [dataFiltro]);

  // Carregar produtos ao abrir dialog de adicionar
  const carregarProdutos = async () => {
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(data.filter((p: Produto) => p.ativo));
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  // Filtrar pedidos por busca
  const pedidosFiltrados = pedidos.filter(pedido => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      pedido.numero.toString().includes(termo) ||
      pedido.cliente.nome.toLowerCase().includes(termo) ||
      pedido.cliente.telefone.includes(termo)
    );
  });

  // Formatar data
  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatar data de entrega
  const formatarDataEntrega = (data?: string) => {
    if (!data) return '';
    return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  // Badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      PENDENTE: { variant: 'secondary', label: 'Pendente' },
      PRODUCAO: { variant: 'default', label: 'Em Produção', className: 'bg-blue-500' },
      PRONTO: { variant: 'outline', label: 'Pronto', className: 'border-green-500 text-green-600' },
      ENTREGUE: { variant: 'default', label: 'Entregue', className: 'bg-green-600' },
      CANCELADO: { variant: 'destructive', label: 'Cancelado' },
    };
    const cfg = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
  };

  // Visualizar pedido
  const handleVisualizar = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
    setItensEditados({});
    setModoEdicao(false);
    setDialogOpen(true);
  };

  // Imprimir cupom do cliente
  const handleImprimirCliente = async (pedido: Pedido) => {
    if (!config || imprimindo) return;
    setImprimindo(`cliente-${pedido.id}`);
    
    try {
      const cupom = gerarCupomCliente(pedido as Parameters<typeof gerarCupomCliente>[0], config);
      imprimirViaDialogo(cupom, `Cupom Cliente #${formatarNumeroPedido(pedido.numero)}`);
      
      toast({
        title: 'Impressão iniciada!',
        description: `Cupom do cliente enviado para impressão.`,
      });
    } finally {
      setTimeout(() => setImprimindo(null), 1000);
    }
  };

  // Imprimir comanda da cozinha
  const handleImprimirCozinha = async (pedido: Pedido) => {
    if (!config || imprimindo) return;
    setImprimindo(`cozinha-${pedido.id}`);
    
    try {
      const cupom = gerarCupomCozinhaGrande(pedido as Parameters<typeof gerarCupomCozinhaGrande>[0], config);
      imprimirViaDialogo(cupom, `Comanda Cozinha #${formatarNumeroPedido(pedido.numero)}`);
      
      toast({
        title: 'Impressão iniciada!',
        description: `Comanda da cozinha enviada para impressão.`,
      });
    } finally {
      setTimeout(() => setImprimindo(null), 1000);
    }
  };

  // Handler para edição de peso - valor livre
  const handleEditarPesoLivre = (itemId: string, valor: string) => {
    setItensEditados(prev => ({
      ...prev,
      [itemId]: valor,
    }));
  };

  // Salvar edição de itens
  const handleSalvarEdicao = async () => {
    if (!pedidoSelecionado) return;
    
    // Verificar se há alterações
    const itensAlterados = pedidoSelecionado.itens.filter(item => {
      const novoPesoStr = itensEditados[item.id];
      if (novoPesoStr === undefined) return false;
      const novoPeso = parseFloat(novoPesoStr.replace(',', '.'));
      return !isNaN(novoPeso) && novoPeso !== item.quantidade;
    });
    
    if (itensAlterados.length === 0) {
      toast({
        title: 'Nenhuma alteração',
        description: 'Não há alterações para salvar.',
      });
      return;
    }
    
    setSalvando(true);
    
    try {
      // Preparar itens para atualização
      const itensParaAtualizar = pedidoSelecionado.itens.map(item => {
        const novoPesoStr = itensEditados[item.id];
        if (novoPesoStr !== undefined) {
          const novoPeso = parseFloat(novoPesoStr.replace(',', '.'));
          if (!isNaN(novoPeso) && novoPeso !== item.quantidade) {
            return {
              id: item.id,
              quantidade: novoPeso,
              subtotal: novoPeso * item.valorUnit,
            };
          }
        }
        return null;
      }).filter(Boolean);
      
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          itens: itensParaAtualizar,
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      if (!response.ok) {
        throw new Error(pedidoAtualizado.error || 'Erro ao atualizar');
      }
      
      // Atualizar lista local
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      
      toast({
        title: 'Pedido atualizado!',
        description: 'Os pesos foram ajustados e o total recalculado.',
      });
      
      setModoEdicao(false);
      setItensEditados({});
      
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o pedido.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  // Cancelar edição
  const handleCancelarEdicao = () => {
    setItensEditados({});
    setModoEdicao(false);
  };

  // Confirmar exclusão
  const handleConfirmarExclusao = (pedido: Pedido) => {
    setPedidoParaExcluir(pedido);
    setPinParaExcluir(['', '', '', '']);
    setDialogExcluirOpen(true);
    // Focar no primeiro input após abrir o diálogo
    setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
  };

  // Handler para cada dígito do PIN
  const handlePinInputChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const novoPin = [...pinParaExcluir];
    novoPin[index] = value;
    setPinParaExcluir(novoPin);

    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  // Handler para teclas (backspace)
  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinParaExcluir[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  // Handler para colar
  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);

    if (pastedData) {
      const novoPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
      setPinParaExcluir(novoPin);
    }
  };

  // Verificar PIN e excluir pedido
  const handleExcluirPedido = async () => {
    if (!pedidoParaExcluir) return;

    const senha = pinParaExcluir.join('');
    if (senha.length !== 4) {
      toast({
        title: 'PIN incompleto',
        description: 'Digite os 4 dígitos do PIN.',
        variant: 'destructive',
      });
      return;
    }

    setVerificandoPin(true);

    try {
      // Verificar PIN
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      });

      const authData = await authRes.json();

      if (!authData.autenticado) {
        toast({
          title: 'PIN incorreto',
          description: 'O PIN digitado está incorreto.',
          variant: 'destructive',
        });
        setVerificandoPin(false);
        setPinParaExcluir(['', '', '', '']);
        pinInputRefs.current[0]?.focus();
        return;
      }

      // PIN correto, excluir pedido
      const res = await fetch(`/api/pedidos?id=${pedidoParaExcluir.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Erro ao excluir',
          description: data.error || 'Não foi possível excluir o pedido.',
          variant: 'destructive',
        });
        setDialogExcluirOpen(false);
        setVerificandoPin(false);
        return;
      }

      setPedidos(pedidos.filter(p => p.id !== pedidoParaExcluir.id));
      setPedidoParaExcluir(null);
      setDialogExcluirOpen(false);

      toast({
        title: 'Pedido excluído!',
        description: 'O pedido foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o pedido.',
        variant: 'destructive',
      });
    } finally {
      setVerificandoPin(false);
    }
  };

  // Atualizar status
  const handleAtualizarStatus = async (pedido: Pedido, novoStatus: string) => {
    if (atualizandoStatus) return;
    setAtualizandoStatus(pedido.id);
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedido.id,
          status: novoStatus,
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      
      toast({
        title: 'Status atualizado!',
        description: `Pedido #${formatarNumeroPedido(pedido.numero)}: ${novoStatus}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    } finally {
      setAtualizandoStatus(null);
    }
  };

  // Calcular total atualizado com edições
  const calcularTotalEditado = () => {
    if (!pedidoSelecionado) return 0;
    return pedidoSelecionado.itens.reduce((sum, item) => {
      const valorStr = itensEditados[item.id];
      if (valorStr !== undefined) {
        const valor = parseFloat(valorStr.replace(',', '.'));
        if (!isNaN(valor)) {
          return sum + (valor * item.valorUnit);
        }
      }
      return sum + item.subtotal;
    }, 0);
  };

  // Abrir dialog para adicionar produto
  const handleAbrirAdicionar = () => {
    carregarProdutos();
    setProdutoSelecionado('');
    setQuantidadeAdicionar('');
    setDialogAdicionarOpen(true);
  };

  // Adicionar produto ao pedido existente
  const handleAdicionarProduto = async () => {
    if (!pedidoSelecionado || !produtoSelecionado || !quantidadeAdicionar) {
      toast({
        title: 'Dados incompletos',
        description: 'Selecione um produto e informe a quantidade.',
        variant: 'destructive',
      });
      return;
    }
    
    setAdicionando(true);
    
    try {
      const produto = produtos.find(p => p.id === produtoSelecionado);
      if (!produto) return;
      
      const quantidade = parseFloat(quantidadeAdicionar.replace(',', '.'));
      if (isNaN(quantidade) || quantidade <= 0) {
        toast({
          title: 'Quantidade inválida',
          description: 'Informe uma quantidade válida.',
          variant: 'destructive',
        });
        setAdicionando(false);
        return;
      }
      
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          adicionarItem: {
            produtoId: produtoSelecionado,
            quantidade,
            valorUnit: produto.valorUnit,
          },
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      if (!response.ok) {
        throw new Error(pedidoAtualizado.error || 'Erro ao adicionar produto');
      }
      
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      setDialogAdicionarOpen(false);
      
      toast({
        title: 'Produto adicionado!',
        description: `${produto.nome} foi adicionado ao pedido.`,
      });
      
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o produto.',
        variant: 'destructive',
      });
    } finally {
      setAdicionando(false);
    }
  };

  // Remover item do pedido
  const handleRemoverItem = async (itemId: string) => {
    if (!pedidoSelecionado) return;
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          removerItem: itemId,
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      if (!response.ok) {
        throw new Error(pedidoAtualizado.error || 'Erro ao remover item');
      }
      
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      
      toast({
        title: 'Item removido!',
        description: 'O item foi removido do pedido.',
      });
      
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o item.',
        variant: 'destructive',
      });
    }
  };

  // Abrir Google Maps com endereço
  const abrirMapa = (endereco: string, bairro?: string) => {
    const enderecoCompleto = bairro ? `${endereco}, ${bairro}` : endereco;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}`;
    window.open(url, '_blank');
  };

  // Enviar WhatsApp
  const enviarWhatsApp = (pedido: Pedido) => {
    if (!pedido.cliente.telefone) return;
    
    let mensagem = '';
    if (config?.mensagemProntoEntrega && pedido.tipoEntrega === 'TELE_ENTREGA') {
      mensagem = config.mensagemProntoEntrega
        .replace('{nome}', pedido.cliente.nome)
        .replace('{pedido}', formatarNumeroPedido(pedido.numero));
    } else if (config?.mensagemProntoRetira) {
      mensagem = config.mensagemProntoRetira
        .replace('{nome}', pedido.cliente.nome)
        .replace('{pedido}', formatarNumeroPedido(pedido.numero));
    } else {
      mensagem = `Olá ${pedido.cliente.nome}! Seu pedido #${formatarNumeroPedido(pedido.numero)} está pronto.`;
    }
    
    const telefone = pedido.cliente.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filtros */}
      <Card className="card-padaria">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Histórico de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, nome ou telefone..."
                className="input-padaria pl-10 h-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Input
              type="date"
              className="input-padaria w-full sm:w-40 h-10"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={carregarPedidos} className="h-10" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2 pr-2">
            {pedidosFiltrados.length === 0 ? (
              <Card className="p-8 text-center card-padaria">
                <p className="text-muted-foreground">Nenhum pedido encontrado</p>
              </Card>
            ) : (
              pedidosFiltrados.map((pedido) => (
                <Card key={pedido.id} className="card-padaria hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      {/* Info principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base text-primary">
                            #{formatarNumeroPedido(pedido.numero)}
                          </span>
                          {getStatusBadge(pedido.status)}
                          {pedido.tipoEntrega && (
                            <Badge variant="outline" className="text-[10px]">
                              {pedido.tipoEntrega === 'RETIRA' ? (
                                <><Store className="w-3 h-3 mr-1" />Retira</>
                              ) : (
                                <><Truck className="w-3 h-3 mr-1" />Entrega</>
                              )}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm">{pedido.cliente.nome}</p>
                        <p className="text-xs text-muted-foreground">{pedido.cliente.telefone}</p>
                        <p className="text-xs text-muted-foreground">{formatarData(pedido.createdAt)}</p>
                      </div>

                      {/* Total e ações */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{pedido.itens.length} itens</p>
                          <p className="font-bold text-primary">{formatarMoeda(pedido.total)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVisualizar(pedido)}
                            className="h-8 w-8 p-0"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {pedido.tipoEntrega === 'TELE_ENTREGA' && pedido.enderecoEntrega && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirMapa(pedido.enderecoEntrega!, pedido.bairroEntrega)}
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
                              title="Ver no mapa"
                            >
                              <MapPin className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmarExclusao(pedido)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      )}

      {/* Dialog de detalhes OTIMIZADO */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
          {/* Header Compacto */}
          <DialogHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Pedido #{pedidoSelecionado && formatarNumeroPedido(pedidoSelecionado.numero)}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {pedidoSelecionado && formatarData(pedidoSelecionado.createdAt)}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {pedidoSelecionado && getStatusBadge(pedidoSelecionado.status)}
              </div>
            </div>
          </DialogHeader>

          {pedidoSelecionado && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* BOTÕES DE AÇÃO RÁPIDA - STATUS */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={pedidoSelecionado.status === 'PENDENTE' ? 'default' : 'outline'}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, 'PENDENTE')}
                    disabled={pedidoSelecionado.status === 'PENDENTE' || atualizandoStatus !== null}
                    className="flex-1 min-w-[100px]"
                  >
                    {atualizandoStatus === pedidoSelecionado.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : null}
                    Pendente
                  </Button>
                  <Button
                    size="sm"
                    variant={pedidoSelecionado.status === 'PRODUCAO' ? 'default' : 'outline'}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, 'PRODUCAO')}
                    disabled={pedidoSelecionado.status === 'PRODUCAO' || atualizandoStatus !== null}
                    className="flex-1 min-w-[100px] bg-blue-500 hover:bg-blue-600"
                  >
                    Em Produção
                  </Button>
                  <Button
                    size="sm"
                    variant={pedidoSelecionado.status === 'PRONTO' ? 'default' : 'outline'}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, 'PRONTO')}
                    disabled={pedidoSelecionado.status === 'PRONTO' || atualizandoStatus !== null}
                    className="flex-1 min-w-[100px] bg-green-500 hover:bg-green-600"
                  >
                    Pronto
                  </Button>
                  <Button
                    size="sm"
                    variant={pedidoSelecionado.status === 'ENTREGUE' ? 'default' : 'outline'}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, 'ENTREGUE')}
                    disabled={pedidoSelecionado.status === 'ENTREGUE' || atualizandoStatus !== null}
                    className="flex-1 min-w-[100px]"
                  >
                    Entregue
                  </Button>
                </div>

                {/* GRID COM CLIENTE E ENTREGA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARD CLIENTE */}
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2 text-primary">
                        <User className="w-4 h-4" />
                        <span className="font-semibold text-sm">Cliente</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{pedidoSelecionado.cliente.nome}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{pedidoSelecionado.cliente.telefone}</span>
                        </div>
                        {pedidoSelecionado.cliente.cpfCnpj && (
                          <p className="text-sm text-muted-foreground">
                            {pedidoSelecionado.cliente.tipoPessoa || 'CPF'}: {pedidoSelecionado.cliente.cpfCnpj}
                          </p>
                        )}
                        {pedidoSelecionado.cliente.endereco && (
                          <p className="text-sm text-muted-foreground">
                            {pedidoSelecionado.cliente.endereco}
                            {pedidoSelecionado.cliente.bairro && ` - ${pedidoSelecionado.cliente.bairro}`}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* CARD ENTREGA */}
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2 text-blue-500">
                        {pedidoSelecionado.tipoEntrega === 'RETIRA' ? (
                          <Store className="w-4 h-4" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                        <span className="font-semibold text-sm">Entrega</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {pedidoSelecionado.tipoEntrega === 'RETIRA' ? 'Cliente Retira' : 'Tele Entrega'}
                        </p>
                        {pedidoSelecionado.dataEntrega && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{formatarDataEntrega(pedidoSelecionado.dataEntrega)}</span>
                            {pedidoSelecionado.horarioEntrega && (
                              <>
                                <Clock className="w-3 h-3 ml-2" />
                                <span>{pedidoSelecionado.horarioEntrega}</span>
                              </>
                            )}
                          </div>
                        )}
                        {pedidoSelecionado.tipoEntrega === 'TELE_ENTREGA' && pedidoSelecionado.enderecoEntrega && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3 mt-0.5" />
                            <span className="flex-1">
                              {pedidoSelecionado.enderecoEntrega}
                              {pedidoSelecionado.bairroEntrega && ` - ${pedidoSelecionado.bairroEntrega}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={() => abrirMapa(pedidoSelecionado.enderecoEntrega!, pedidoSelecionado.bairroEntrega)}
                              title="Ver no mapa"
                            >
                              <MapPin className="w-3 h-3 text-blue-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* CARD ITENS */}
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Package className="w-4 h-4" />
                        <span className="font-semibold text-sm">Itens do Pedido</span>
                        <Badge variant="secondary" className="text-xs">{pedidoSelecionado.itens.length}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {!modoEdicao && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleAbrirAdicionar}
                              className="h-8"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setModoEdicao(true)}
                              className="h-8"
                            >
                              <Edit2 className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {pedidoSelecionado.itens.map((item, index) => (
                        <div 
                          key={item.id} 
                          className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                            modoEdicao ? 'bg-muted/50' : index % 2 === 0 ? 'bg-muted/30' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.produto.nome}</p>
                            
                            {/* Modo edição */}
                            {modoEdicao ? (
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="number"
                                  step={item.produto.tipoVenda === 'KG' ? '0.001' : '1'}
                                  min="0"
                                  className="w-24 h-8 text-sm"
                                  value={itensEditados[item.id] !== undefined 
                                    ? itensEditados[item.id]
                                    : item.quantidade.toString()
                                  }
                                  onChange={(e) => handleEditarPesoLivre(item.id, e.target.value)}
                                  placeholder={item.produto.tipoVenda === 'KG' ? '0.000' : '0'}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {item.produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  × {formatarMoeda(item.valorUnit)}
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {formatarQuantidade(item.quantidade, item.produto.tipoVenda as 'KG' | 'UNIDADE')} × {formatarMoeda(item.valorUnit)}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-primary">
                              {formatarMoeda(
                                itensEditados[item.id] !== undefined 
                                  ? parseFloat(itensEditados[item.id].replace(',', '.')) * item.valorUnit 
                                  : item.subtotal
                              )}
                            </p>
                            {modoEdicao && pedidoSelecionado.itens.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleRemoverItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botões de edição */}
                    {modoEdicao && (
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelarEdicao}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSalvarEdicao}
                          className="flex-1 btn-padaria"
                          disabled={salvando}
                        >
                          {salvando ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Salvar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* TOTAL E OBSERVAÇÕES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* TOTAL */}
                  <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total do Pedido</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatarMoeda(
                            modoEdicao ? calcularTotalEditado() : pedidoSelecionado.total
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* OBSERVAÇÕES */}
                  {pedidoSelecionado.observacoes && (
                    <Card>
                      <CardContent className="p-3">
                        <p className="text-sm text-muted-foreground">
                          <strong>Obs:</strong> {pedidoSelecionado.observacoes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* AÇÕES DE IMPRESSÃO E WHATSAPP */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button 
                    onClick={() => handleImprimirCliente(pedidoSelecionado)} 
                    className="btn-padaria h-12 text-base"
                    disabled={imprimindo !== null}
                  >
                    {imprimindo === `cliente-${pedidoSelecionado.id}` ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Printer className="w-5 h-5 mr-2" />
                    )}
                    Cupom Cliente
                  </Button>
                  <Button 
                    onClick={() => handleImprimirCozinha(pedidoSelecionado)} 
                    variant="outline" 
                    className="h-12 text-base"
                    disabled={imprimindo !== null}
                  >
                    {imprimindo === `cozinha-${pedidoSelecionado.id}` ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Printer className="w-5 h-5 mr-2" />
                    )}
                    Comanda Cozinha
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-11 bg-green-500 hover:bg-green-600 text-white border-0"
                  onClick={() => enviarWhatsApp(pedidoSelecionado)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Enviar WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar produto */}
      <Dialog open={dialogAdicionarOpen} onOpenChange={setDialogAdicionarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Adicionar Produto ao Pedido
            </DialogTitle>
            <DialogDescription>
              Se o produto já existir, a quantidade será somada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Produto</label>
              <Select value={produtoSelecionado} onValueChange={setProdutoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome} - {formatarMoeda(produto.valorUnit)}/{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="Ex: 0.500 ou 1"
                value={quantidadeAdicionar}
                onChange={(e) => setQuantidadeAdicionar(e.target.value)}
                className="text-lg h-12"
              />
              {produtoSelecionado && (
                <p className="text-xs text-muted-foreground">
                  {produtos.find(p => p.id === produtoSelecionado)?.tipoVenda === 'KG' 
                    ? 'Informe o peso em kg (ex: 0.500 para 500g)' 
                    : 'Informe a quantidade de unidades'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogAdicionarOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleAdicionarProduto} className="flex-1 btn-padaria" disabled={adicionando}>
              {adicionando ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão com PIN */}
      <AlertDialog open={dialogExcluirOpen} onOpenChange={setDialogExcluirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para excluir o pedido <strong>#{pedidoParaExcluir && formatarNumeroPedido(pedidoParaExcluir.numero)}</strong>, digite o PIN de 4 dígitos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Campo de PIN */}
          <div className="py-4">
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={(el) => { pinInputRefs.current[index] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={pinParaExcluir[index]}
                  onChange={(e) => handlePinInputChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  onPaste={handlePinPaste}
                  disabled={verificandoPin}
                  className="w-14 h-16 text-center text-2xl font-bold
                           border-2 border-input rounded-lg
                           bg-background focus:border-destructive focus:ring-2 focus:ring-destructive/20
                           outline-none transition-all
                           disabled:opacity-50"
                />
              ))}
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={verificandoPin}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirPedido}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={pinParaExcluir.some(d => !d) || verificandoPin}
            >
              {verificandoPin ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
