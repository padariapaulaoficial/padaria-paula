'use client';

// HistoricoPedidos - Padaria Paula
// Lista de pedidos com edição de itens e reimpressão

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, RefreshCw, Eye, Printer, Calendar, Trash2, AlertTriangle, FileText, Edit2, Scale, Check, X, MapPin, Truck, Store, Lock, Loader2, Clock, Package, MessageCircle, Plus, Hash, DollarSign, CreditCard, Banknote, Smartphone, Bell, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
import {
  gerarCupomCliente,
  gerarCupomCozinhaGrande,
  imprimirViaDialogo,
  formatarNumeroPedido
} from '@/lib/escpos';
import AlertaProducao from './AlertaProducao';


interface ItemPedido {
  id: string;
  produto: {
    nome: string;
    tipoVenda: string;
  };
  quantidade: number;
  quantidadePedida: number;
  valorUnit: number;
  subtotal: number;
  subtotalPedida: number;
  observacao?: string;
  tamanho?: string;
}

interface Pedido {
  id: string;
  numero: number;
  cliente: {
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
  valorEntrada?: number;
  formaPagamentoEntrada?: string;
  dataEntrada?: string;
  alertaProducaoEnviado?: boolean;
}

interface Configuracao {
  id?: string;
  nomeLoja: string;
  endereco: string;
  telefone: string;
  cnpj: string;
  logoUrl?: string | null;
  senha?: string;
  createdAt?: Date;
  updatedAt?: Date;
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

// Opções de KG
const OPCOES_KG = [
  { valor: 0, label: 'Selecione' },
  { valor: 0.5, label: '500g' },
  { valor: 1.0, label: '1 kg' },
  { valor: 1.5, label: '1,5 kg' },
  { valor: 2.0, label: '2 kg' },
  { valor: 2.5, label: '2,5 kg' },
  { valor: 3.0, label: '3 kg' },
  { valor: 4.0, label: '4 kg' },
  { valor: 5.0, label: '5 kg' },
  { valor: 6.0, label: '6 kg' },
  { valor: 7.0, label: '7 kg' },
  { valor: 8.0, label: '8 kg' },
  { valor: 9.0, label: '9 kg' },
  { valor: 10.0, label: '10 kg' },
];

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
  
  // PIN para exclusão - layout igual ao login principal
  const [pinParaExcluir, setPinParaExcluir] = useState(['', '', '', '']);
  const [verificandoPin, setVerificandoPin] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Adicionar produtos ao pedido
  const [modoAdicao, setModoAdicao] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('');
  const [observacaoNovoItem, setObservacaoNovoItem] = useState('');
  const [adicionandoProduto, setAdicionandoProduto] = useState(false);
  
  // Registro de entrada
  const [modoEntrada, setModoEntrada] = useState(false);
  const [valorEntrada, setValorEntrada] = useState('');
  const [formaPagamentoEntrada, setFormaPagamentoEntrada] = useState('');
  const [salvandoEntrada, setSalvandoEntrada] = useState(false);

  // Carregar configurações
  useEffect(() => {
    fetch('/api/configuracao')
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);
  
  // Carregar produtos para adição
  useEffect(() => {
    if (modoAdicao) {
      fetch('/api/produtos?ativo=true')
        .then(res => res.json())
        .then(data => setProdutos(data))
        .catch(console.error);
    }
  }, [modoAdicao]);

  // Filtrar produtos pela busca
  const produtosFiltrados = useMemo(() => {
    if (!buscaProduto) return produtos.slice(0, 20);
    const termo = buscaProduto.toLowerCase();
    return produtos.filter(p => p.nome.toLowerCase().includes(termo)).slice(0, 20);
  }, [produtos, buscaProduto]);

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
  const handleImprimirCliente = (pedido: Pedido) => {
    if (!config) return;
    
    const cupom = gerarCupomCliente(pedido as Parameters<typeof gerarCupomCliente>[0], config);
    
    imprimirViaDialogo(cupom, `Cupom Cliente #${formatarNumeroPedido(pedido.numero)}`);
    
    toast({
      title: 'Impressão iniciada!',
      description: `Cupom do cliente enviado para impressão.`,
    });
  };

  // Imprimir comanda da cozinha
  const handleImprimirCozinha = (pedido: Pedido) => {
    if (!config) return;
    
    const cupom = gerarCupomCozinhaGrande(pedido as Parameters<typeof gerarCupomCozinhaGrande>[0], config);
    
    imprimirViaDialogo(cupom, `Comanda Cozinha #${formatarNumeroPedido(pedido.numero)}`);
    
    toast({
      title: 'Impressão iniciada!',
      description: `Comanda da cozinha enviada para impressão.`,
    });
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
      // Verificar PIN de ADMIN para exclusão
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha, tipo: 'admin' }),
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

  // Enviar mensagem quando status PRONTO
  const handleEnviarMensagemPronto = (pedido: Pedido) => {
    const telefone = pedido.cliente.telefone.replace(/\D/g, '');
    const telefoneCompleto = telefone.length === 11 ? `55${telefone}` : telefone;
    
    const tipoEntrega = pedido.tipoEntrega || 'RETIRA';
    
    let mensagem = `*Padaria e Confeitaria Paula*\n\n`;
    mensagem += `Olá, *${pedido.cliente.nome}*!\n\n`;
    
    if (tipoEntrega === 'RETIRA') {
      mensagem += `Seu pedido #${formatarNumeroPedido(pedido.numero)} está *PRONTO* e esperando por você!\n\n`;
      mensagem += `Pode vir buscar quando quiser. 🥖\n\n`;
    } else {
      mensagem += `Seu pedido #${formatarNumeroPedido(pedido.numero)} está *PRONTO* e já está a caminho!\n\n`;
      mensagem += `Em breve você receberá. 🚚\n\n`;
    }
    
    mensagem += `Agradecemos pela preferência! 💛`;
    
    const mensagemCodificada = encodeURIComponent(mensagem);
    window.open(`https://wa.me/${telefoneCompleto}?text=${mensagemCodificada}`, '_blank');
    
    toast({
      title: 'Mensagem enviada!',
      description: `WhatsApp aberto para ${pedido.cliente.nome}`,
    });
  };
  
  // Adicionar produto ao pedido existente
  const handleAdicionarProduto = async () => {
    if (!pedidoSelecionado || !produtoSelecionado) return;
    
    // Verificar se o pedido já foi entregue
    if (pedidoSelecionado.status === 'ENTREGUE') {
      toast({
        title: 'Não permitido',
        description: 'Não é possível adicionar itens a um pedido já entregue.',
        variant: 'destructive',
      });
      return;
    }
    
    let quantidade = 0;
    let valorUnit = 0;
    let tamanho: string | undefined = undefined;
    
    if (produtoSelecionado.tipoProduto === 'ESPECIAL') {
      if (!tamanhoSelecionado) {
        toast({
          title: 'Selecione o tamanho',
          description: 'Escolha um tamanho para a torta.',
          variant: 'destructive',
        });
        return;
      }
      const precoTamanho = produtoSelecionado.precosTamanhos?.[tamanhoSelecionado];
      valorUnit = (precoTamanho !== undefined && precoTamanho !== null && !isNaN(precoTamanho) && precoTamanho > 0)
        ? precoTamanho
        : produtoSelecionado.valorUnit;
      quantidade = 1;
      tamanho = tamanhoSelecionado;
    } else {
      quantidade = parseFloat(quantidadeAdicionar.replace(',', '.')) || 0;
      valorUnit = produtoSelecionado.valorUnit;
      
      if (quantidade <= 0) {
        toast({
          title: 'Quantidade inválida',
          description: 'Digite uma quantidade maior que zero.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    const subtotal = quantidade * valorUnit;
    
    setAdicionandoProduto(true);
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          novosItens: [{
            produtoId: produtoSelecionado.id,
            quantidade,
            valorUnit,
            subtotal,
            observacao: observacaoNovoItem || undefined,
            tamanho,
          }],
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      if (!response.ok) {
        throw new Error(pedidoAtualizado.error || 'Erro ao adicionar produto');
      }
      
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      
      // Limpar formulário
      setProdutoSelecionado(null);
      setQuantidadeAdicionar('');
      setTamanhoSelecionado('');
      setObservacaoNovoItem('');
      setBuscaProduto('');
      setModoAdicao(false);
      
      toast({
        title: 'Produto adicionado!',
        description: `${produtoSelecionado.nome} foi adicionado ao pedido.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar o produto ao pedido.',
        variant: 'destructive',
      });
    } finally {
      setAdicionandoProduto(false);
    }
  };

  // Salvar entrada de pagamento
  const handleSalvarEntrada = async () => {
    if (!pedidoSelecionado) return;
    
    const valor = parseFloat(valorEntrada.replace(',', '.')) || 0;
    
    if (valor <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Digite um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }
    
    if (valor > pedidoSelecionado.total) {
      toast({
        title: 'Valor excede o total',
        description: `O valor não pode ser maior que ${formatarMoeda(pedidoSelecionado.total)}.`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!formaPagamentoEntrada) {
      toast({
        title: 'Forma de pagamento obrigatória',
        description: 'Selecione uma forma de pagamento.',
        variant: 'destructive',
      });
      return;
    }
    
    setSalvandoEntrada(true);
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          valorEntrada: valor,
          formaPagamentoEntrada,
          dataEntrada: new Date().toISOString(),
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      if (!response.ok) {
        throw new Error(pedidoAtualizado.error || 'Erro ao salvar entrada');
      }
      
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      
      // Limpar formulário
      setValorEntrada('');
      setFormaPagamentoEntrada('');
      setModoEntrada(false);
      
      toast({
        title: 'Entrada registrada!',
        description: `${formatarMoeda(valor)} recebido via ${formaPagamentoEntrada.toLowerCase()}.`,
      });
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível registrar a entrada.',
        variant: 'destructive',
      });
    } finally {
      setSalvandoEntrada(false);
    }
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
            <Button variant="outline" size="sm" onClick={carregarPedidos} className="h-10">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de Produção - Pedidos Programados */}
      <AlertaProducao />

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

      {/* Dialog de detalhes com preview do cupom */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Pedido #{pedidoSelecionado && formatarNumeroPedido(pedidoSelecionado.numero)}
            </DialogTitle>
            <DialogDescription>
              {pedidoSelecionado && formatarData(pedidoSelecionado.createdAt)} - {pedidoSelecionado?.cliente?.nome}
            </DialogDescription>
          </DialogHeader>

          {pedidoSelecionado && (
            <div className="space-y-3">
              {/* Sistema de Status - Melhorado */}
              <div className="bg-muted/30 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-3">Status do Pedido</h4>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, 'PENDENTE')}
                    disabled={pedidoSelecionado.status === 'PENDENTE'}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                      pedidoSelecionado.status === 'PENDENTE' 
                        ? 'bg-yellow-500 text-white shadow-md' 
                        : 'bg-muted hover:bg-yellow-100 text-muted-foreground hover:text-yellow-700'
                    }`}
                  >
                    <Clock className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Pendente</span>
                  </button>
                  <button
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, 'PRODUCAO')}
                    disabled={pedidoSelecionado.status === 'PRODUCAO'}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                      pedidoSelecionado.status === 'PRODUCAO' 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'bg-muted hover:bg-blue-100 text-muted-foreground hover:text-blue-700'
                    }`}
                  >
                    <Package className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Produção</span>
                  </button>
                  <button
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, 'PRONTO')}
                    disabled={pedidoSelecionado.status === 'PRONTO'}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                      pedidoSelecionado.status === 'PRONTO' 
                        ? 'bg-green-500 text-white shadow-md' 
                        : 'bg-muted hover:bg-green-100 text-muted-foreground hover:text-green-700'
                    }`}
                  >
                    <Check className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Pronto</span>
                  </button>
                  <button
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, 'ENTREGUE')}
                    disabled={pedidoSelecionado.status === 'ENTREGUE'}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                      pedidoSelecionado.status === 'ENTREGUE' 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary'
                    }`}
                  >
                    <Truck className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">Entregue</span>
                  </button>
                </div>
              </div>

              {/* Dados do cliente e entrega */}
              <div className="bg-muted/30 rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-1">Cliente</h4>
                <p className="text-sm"><strong>Nome:</strong> {pedidoSelecionado.cliente.nome}</p>
                <p className="text-sm"><strong>Telefone:</strong> {pedidoSelecionado.cliente.telefone}</p>
                {pedidoSelecionado.cliente.cpfCnpj && (
                  <p className="text-sm"><strong>{pedidoSelecionado.cliente.tipoPessoa || 'CPF'}:</strong> {pedidoSelecionado.cliente.cpfCnpj}</p>
                )}
                
                {/* Dados de Entrega */}
                {pedidoSelecionado.tipoEntrega && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      {pedidoSelecionado.tipoEntrega === 'RETIRA' ? (
                        <>
                          <Store className="w-4 h-4 text-primary" />
                          <span className="font-medium">Cliente Retira</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4 text-primary" />
                          <span className="font-medium">Tele Entrega</span>
                        </>
                      )}
                    </div>
                    {pedidoSelecionado.dataEntrega && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatarDataEntrega(pedidoSelecionado.dataEntrega)}</span>
                        </div>
                        {pedidoSelecionado.horarioEntrega && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{pedidoSelecionado.horarioEntrega}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {pedidoSelecionado.tipoEntrega === 'TELE_ENTREGA' && pedidoSelecionado.enderecoEntrega && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {pedidoSelecionado.enderecoEntrega}
                        {pedidoSelecionado.bairroEntrega && ` - ${pedidoSelecionado.bairroEntrega}`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Itens com edição */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Itens</h4>
                  {!modoEdicao && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModoEdicao(true)}
                      className="h-8"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {pedidoSelecionado.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1.5 border-b border-border/50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.produto.nome}
                          {item.tamanho && <span className="text-primary ml-1">({item.tamanho})</span>}
                        </p>
                        
                        {/* Modo edição para qualquer tipo de produto */}
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
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {formatarQuantidade(item.quantidade, item.produto.tipoVenda as 'KG' | 'UNIDADE')} × {formatarMoeda(item.valorUnit)}
                            {item.observacao && <span className="ml-2 text-primary italic">({item.observacao})</span>}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-sm">
                        {formatarMoeda(
                          itensEditados[item.id] !== undefined 
                            ? parseFloat(itensEditados[item.id].replace(',', '.')) * item.valorUnit 
                            : item.subtotal
                        )}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Botões de edição */}
                {modoEdicao && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelarEdicao}
                      className="flex-1 h-9"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSalvarEdicao}
                      className="flex-1 btn-padaria h-9"
                      disabled={salvando}
                    >
                      {salvando ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Salvar
                    </Button>
                  </div>
                )}
                
                {/* Botão para adicionar produtos - só aparece se não estiver entregue */}
                {!modoEdicao && !modoAdicao && pedidoSelecionado.status !== 'ENTREGUE' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModoAdicao(true)}
                    className="w-full h-9 mt-2 border-dashed border-2"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Produto
                  </Button>
                )}
                
                {/* Interface de adição de produtos */}
                {modoAdicao && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Adicionar Produto
                      </h5>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setModoAdicao(false);
                          setProdutoSelecionado(null);
                          setQuantidadeAdicionar('');
                          setTamanhoSelecionado('');
                          setObservacaoNovoItem('');
                          setBuscaProduto('');
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Busca de produto */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar produto..."
                        className="pl-10 h-9"
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                      />
                    </div>
                    
                    {/* Lista de produtos */}
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {produtosFiltrados.map(produto => (
                          <button
                            key={produto.id}
                            type="button"
                            onClick={() => setProdutoSelecionado(produto)}
                            className={`w-full p-2 text-left rounded-lg transition-colors ${
                              produtoSelecionado?.id === produto.id 
                                ? 'bg-primary/20 border border-primary' 
                                : 'bg-card hover:bg-muted border border-border/50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-sm">{produto.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {produto.tipoProduto === 'ESPECIAL' ? (
                                    produto.precosTamanhos && Object.entries(produto.precosTamanhos)
                                      .filter(([tam, preco]) => {
                                        const tamanhosValidos = ['P', 'M', 'G', 'GG'];
                                        return tamanhosValidos.includes(tam) && preco && !isNaN(preco) && preco > 0;
                                      })
                                      .sort((a, b) => ['P', 'M', 'G', 'GG'].indexOf(a[0]) - ['P', 'M', 'G', 'GG'].indexOf(b[0]))
                                      .map(([tam, preco]) => `${tam}: ${formatarMoeda(preco)}`)
                                      .join(' | ')
                                  ) : (
                                    `${formatarMoeda(produto.valorUnit)}/${produto.tipoVenda === 'KG' ? 'kg' : 'un'}`
                                  )}
                                </p>
                              </div>
                              {produto.tipoProduto === 'ESPECIAL' ? (
                                <Badge className="text-[10px] bg-primary text-primary-foreground">Torta</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  {produto.tipoVenda === 'KG' ? <Scale className="w-3 h-3 mr-0.5" /> : <Hash className="w-3 h-3 mr-0.5" />}
                                  {produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Configuração do produto selecionado */}
                    {produtoSelecionado && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        {produtoSelecionado.tipoProduto === 'ESPECIAL' ? (
                          <>
                            {/* Seleção de tamanho para torta */}
                            <Label className="text-xs">Tamanho:</Label>
                            <div className="flex gap-1">
                              {['P', 'M', 'G', 'GG']
                                .filter(tam => {
                                  const temTamanho = produtoSelecionado.tamanhos?.includes(tam);
                                  const preco = produtoSelecionado.precosTamanhos?.[tam];
                                  return temTamanho && preco && !isNaN(preco) && preco > 0;
                                })
                                .map(tam => (
                                  <Button
                                    key={tam}
                                    type="button"
                                    variant={tamanhoSelecionado === tam ? 'default' : 'outline'}
                                    size="sm"
                                    className={`h-8 flex-1 ${tamanhoSelecionado === tam ? 'btn-padaria' : ''}`}
                                    onClick={() => setTamanhoSelecionado(tam)}
                                  >
                                    {tam}
                                  </Button>
                                ))}
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Quantidade para produtos normais */}
                            <Label className="text-xs">Quantidade:</Label>
                            {produtoSelecionado.tipoVenda === 'KG' ? (
                              <Select value={quantidadeAdicionar} onValueChange={setQuantidadeAdicionar}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Selecione o peso" />
                                </SelectTrigger>
                                <SelectContent>
                                  {OPCOES_KG.filter(op => op.valor > 0).map(op => (
                                    <SelectItem key={op.valor} value={op.valor.toString()}>
                                      {op.label}
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
                                className="h-9"
                                value={quantidadeAdicionar}
                                onChange={(e) => setQuantidadeAdicionar(e.target.value)}
                              />
                            )}
                          </>
                        )}
                        
                        {/* Observação */}
                        <Input
                          placeholder="Observação (opcional)"
                          className="h-9"
                          value={observacaoNovoItem}
                          onChange={(e) => setObservacaoNovoItem(e.target.value)}
                        />
                        
                        {/* Botões de ação */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setModoAdicao(false);
                              setProdutoSelecionado(null);
                              setQuantidadeAdicionar('');
                              setTamanhoSelecionado('');
                              setObservacaoNovoItem('');
                              setBuscaProduto('');
                            }}
                            className="flex-1 h-9"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAdicionarProduto}
                            className="flex-1 btn-padaria h-9"
                            disabled={adicionandoProduto}
                          >
                            {adicionandoProduto ? (
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-1" />
                            )}
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-border">
                <span>Total:</span>
                <span className="text-primary">
                  {formatarMoeda(
                    modoEdicao ? calcularTotalEditado() : pedidoSelecionado.total
                  )}
                </span>
              </div>

              {/* Seção de Entrada/Pagamento */}
              {pedidoSelecionado.status !== 'ENTREGUE' && pedidoSelecionado.status !== 'CANCELADO' && (
                <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Entrada / Pagamento
                    </h4>
                    {(pedidoSelecionado as any).valorEntrada > 0 && !modoEntrada && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setModoEntrada(true)}
                        className="h-7 text-xs"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Alterar
                      </Button>
                    )}
                  </div>
                  
                  {/* Mostrar entrada já registrada */}
                  {(pedidoSelecionado as any).valorEntrada > 0 && !modoEntrada ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Entrada: {formatarMoeda((pedidoSelecionado as any).valorEntrada)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            {(pedidoSelecionado as any).formaPagamentoEntrada === 'DINHEIRO' && <Banknote className="w-3 h-3" />}
                            {(pedidoSelecionado as any).formaPagamentoEntrada === 'PIX' && <Smartphone className="w-3 h-3" />}
                            {(pedidoSelecionado as any).formaPagamentoEntrada === 'CARTAO' && <CreditCard className="w-3 h-3" />}
                            <span>{(pedidoSelecionado as any).formaPagamentoEntrada}</span>
                            {(pedidoSelecionado as any).dataEntrada && (
                              <span className="ml-2">
                                • {new Date((pedidoSelecionado as any).dataEntrada).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Restante:</p>
                          <p className="font-bold text-primary">
                            {formatarMoeda(pedidoSelecionado.total - ((pedidoSelecionado as any).valorEntrada || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {!modoEntrada ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setModoEntrada(true)}
                          className="w-full h-9 border-dashed border-2"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Registrar Entrada
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          {/* Valor */}
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              max={pedidoSelecionado.total}
                              placeholder="0,00"
                              className="pl-10 h-9"
                              value={valorEntrada}
                              onChange={(e) => setValorEntrada(e.target.value)}
                            />
                          </div>
                          
                          {/* Formas de pagamento */}
                          <div className="grid grid-cols-3 gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={formaPagamentoEntrada === 'DINHEIRO' ? 'default' : 'outline'}
                              onClick={() => setFormaPagamentoEntrada('DINHEIRO')}
                              className={`h-9 flex-col gap-0.5 ${formaPagamentoEntrada === 'DINHEIRO' ? 'btn-padaria' : ''}`}
                            >
                              <Banknote className="w-4 h-4" />
                              <span className="text-[10px]">Dinheiro</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={formaPagamentoEntrada === 'PIX' ? 'default' : 'outline'}
                              onClick={() => setFormaPagamentoEntrada('PIX')}
                              className={`h-9 flex-col gap-0.5 ${formaPagamentoEntrada === 'PIX' ? 'btn-padaria' : ''}`}
                            >
                              <Smartphone className="w-4 h-4" />
                              <span className="text-[10px]">PIX</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={formaPagamentoEntrada === 'CARTAO' ? 'default' : 'outline'}
                              onClick={() => setFormaPagamentoEntrada('CARTAO')}
                              className={`h-9 flex-col gap-0.5 ${formaPagamentoEntrada === 'CARTAO' ? 'btn-padaria' : ''}`}
                            >
                              <CreditCard className="w-4 h-4" />
                              <span className="text-[10px]">Cartão</span>
                            </Button>
                          </div>
                          
                          {/* Botões */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setModoEntrada(false);
                                setValorEntrada('');
                                setFormaPagamentoEntrada('');
                              }}
                              className="flex-1 h-9"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSalvarEntrada}
                              className="flex-1 btn-padaria h-9"
                              disabled={salvandoEntrada || !valorEntrada || !formaPagamentoEntrada}
                            >
                              {salvandoEntrada ? (
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-1" />
                              )}
                              Salvar
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Botão de mensagem quando PRONTO */}
              {pedidoSelecionado.status === 'PRONTO' && (
                <Button 
                  onClick={() => handleEnviarMensagemPronto(pedidoSelecionado)} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Avisar Cliente via WhatsApp
                </Button>
              )}

              {/* Botões de impressão */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Button onClick={() => handleImprimirCliente(pedidoSelecionado)} className="w-full btn-padaria h-11">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Cupom Cliente
                </Button>
                <Button onClick={() => handleImprimirCozinha(pedidoSelecionado)} variant="outline" className="w-full h-11">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Comanda Cozinha
                </Button>
              </div>
            </div>
          )}
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
          
          {/* Campo de PIN - layout igual ao login principal */}
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
