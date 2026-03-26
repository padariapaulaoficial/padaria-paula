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
  const [statusFiltro, setStatusFiltro] = useState<string>('TODOS');
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
  
  // Edição de data de entrega
  const [modoEdicaoData, setModoEdicaoData] = useState(false);
  const [novaDataEntrega, setNovaDataEntrega] = useState('');
  const [novoHorarioEntrega, setNovoHorarioEntrega] = useState('');
  const [salvandoData, setSalvandoData] = useState(false);
  
  // Diálogos separados
  const [dialogEdicaoOpen, setDialogEdicaoOpen] = useState(false);
  const [dialogAdicaoOpen, setDialogAdicaoOpen] = useState(false);
  const [dialogEntradaOpen, setDialogEntradaOpen] = useState(false);
  const [dialogDataOpen, setDialogDataOpen] = useState(false);

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

  // Filtrar pedidos por busca e status
  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro por texto
    if (busca) {
      const termo = busca.toLowerCase();
      const matchTexto = 
        pedido.numero.toString().includes(termo) ||
        pedido.cliente.nome.toLowerCase().includes(termo) ||
        pedido.cliente.telefone.includes(termo);
      if (!matchTexto) return false;
    }
    
    // Filtro por status
    if (statusFiltro !== 'TODOS') {
      if (pedido.status !== statusFiltro) return false;
    }
    
    return true;
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
      PENDENTE: { variant: 'destructive', label: 'Pendente', className: 'bg-red-500 hover:bg-red-600' },
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
        description: 'Os pesos foram ajustados e o total recalculado. Reimprima a comanda da cozinha.',
        duration: 5000,
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

  // Enviar confirmação do pedido via WhatsApp
  const handleConfirmarPedido = (pedido: Pedido) => {
    const telefone = pedido.cliente.telefone.replace(/\D/g, '');
    const telefoneCompleto = telefone.length === 11 ? `55${telefone}` : telefone;
    
    // Data de entrega formatada
    const dataEntrega = pedido.dataEntrega 
      ? new Date(pedido.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')
      : 'a combinar';
    const horarioEntrega = pedido.horarioEntrega || 'a combinar';
    
    // Lista de itens
    let itensStr = '';
    for (const item of pedido.itens) {
      const nomeItem = item.tamanho 
        ? `${item.produto.nome} (${item.tamanho})`
        : item.produto.nome;
      const qtd = item.produto.tipoVenda === 'KG' 
        ? `${item.quantidade}kg`
        : `${Math.round(item.quantidade)}x`;
      itensStr += `• ${qtd} ${nomeItem}\n`;
    }
    
    let mensagem = `*Padaria e Confeitaria Paula*\n`;
    mensagem += `━━━━━━━━━━━━━━━━━━\n\n`;
    mensagem += `Olá, *${pedido.cliente.nome}*! 👋\n\n`;
    mensagem += `Podemos confirmar seu pedido?\n\n`;
    mensagem += `📦 *Pedido #${formatarNumeroPedido(pedido.numero)}*\n\n`;
    mensagem += `*Itens:*\n${itensStr}\n`;
    mensagem += `📅 *Entrega:* ${dataEntrega}\n`;
    mensagem += `⏰ *Horário:* ${horarioEntrega}\n`;
    mensagem += `💰 *Total:* ${formatarMoeda(pedido.total)}\n\n`;
    mensagem += `Por favor, confirme se está tudo correto.\n\n`;
    mensagem += `Agradecemos pela preferência! 💛`;
    
    const mensagemCodificada = encodeURIComponent(mensagem);
    window.open(`https://wa.me/${telefoneCompleto}?text=${mensagemCodificada}`, '_blank');
    
    toast({
      title: 'Confirmação enviada!',
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
  
  // Iniciar edição de data de entrega
  const handleIniciarEdicaoData = () => {
    if (pedidoSelecionado) {
      setNovaDataEntrega(pedidoSelecionado.dataEntrega || '');
      setNovoHorarioEntrega(pedidoSelecionado.horarioEntrega || '');
      setModoEdicaoData(true);
    }
  };
  
  // Cancelar edição de data
  const handleCancelarEdicaoData = () => {
    setModoEdicaoData(false);
    setNovaDataEntrega('');
    setNovoHorarioEntrega('');
  };
  
  // Salvar nova data de entrega
  const handleSalvarDataEntrega = async () => {
    if (!pedidoSelecionado) return;
    
    if (!novaDataEntrega) {
      toast({
        title: 'Data obrigatória',
        description: 'Informe a nova data de entrega.',
        variant: 'destructive',
      });
      return;
    }
    
    setSalvandoData(true);
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          dataEntrega: novaDataEntrega,
          horarioEntrega: novoHorarioEntrega || null,
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      if (!response.ok) {
        throw new Error(pedidoAtualizado.error || 'Erro ao atualizar data');
      }
      
      // Atualizar lista e pedido selecionado
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      
      setModoEdicaoData(false);
      
      toast({
        title: 'Data atualizada!',
        description: `Nova data de entrega: ${formatarDataEntrega(novaDataEntrega)}${novoHorarioEntrega ? ` às ${novoHorarioEntrega}` : ''}`,
      });
    } catch (error) {
      console.error('Erro ao salvar data:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar a data de entrega.',
        variant: 'destructive',
      });
    } finally {
      setSalvandoData(false);
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
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="w-full sm:w-36 h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="PRODUCAO">Em Produção</SelectItem>
                <SelectItem value="PRONTO">Pronto</SelectItem>
                <SelectItem value="ENTREGUE">Entregue</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Dialog de detalhes otimizado para tela única - NOVA ESTRUTURA */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* 1. TOPO: Número do pedido + Status atual */}
          <DialogHeader className="p-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold">
                  Pedido #{pedidoSelecionado && formatarNumeroPedido(pedidoSelecionado.numero)}
                </DialogTitle>
                {pedidoSelecionado && getStatusBadge(pedidoSelecionado.status)}
              </div>
            </div>
          </DialogHeader>

          {pedidoSelecionado && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* 2. STATUS: 4 botões para aplicar status */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { status: 'PENDENTE', icon: Clock, label: 'Pendente', bg: 'bg-yellow-500', hover: 'hover:bg-yellow-100' },
                  { status: 'PRODUCAO', icon: Package, label: 'Produção', bg: 'bg-blue-500', hover: 'hover:bg-blue-100' },
                  { status: 'PRONTO', icon: Check, label: 'Pronto', bg: 'bg-green-500', hover: 'hover:bg-green-100' },
                  { status: 'ENTREGUE', icon: Truck, label: 'Entregue', bg: 'bg-primary', hover: 'hover:bg-primary/20' },
                ].map(({ status, icon: Icon, label, bg, hover }) => (
                  <button
                    key={status}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, status)}
                    disabled={pedidoSelecionado.status === status}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs font-medium transition-all ${
                      pedidoSelecionado.status === status 
                        ? `${bg} text-white shadow-md` 
                        : `bg-muted ${hover} text-muted-foreground border border-border`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* 3. BOTÃO WHATSAPP QUANDO PRONTO */}
              {pedidoSelecionado.status === 'PRONTO' && (
                <Button 
                  onClick={() => handleEnviarMensagemPronto(pedidoSelecionado)} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-10 text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Avisar Cliente via WhatsApp
                </Button>
              )}

              {/* 4. DADOS DO CLIENTE + DATA + ÍCONE EDITAR DATA */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{pedidoSelecionado.cliente.nome}</span>
                    {pedidoSelecionado.tipoEntrega && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        {pedidoSelecionado.tipoEntrega === 'RETIRA' ? (
                          <><Store className="w-3 h-3 mr-0.5" />Retira</>
                        ) : (
                          <><Truck className="w-3 h-3 mr-0.5" />Entrega</>
                        )}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setDialogDataOpen(true)}
                    title="Editar data/hora"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{pedidoSelecionado.cliente.telefone}</span>
                  {pedidoSelecionado.dataEntrega && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatarDataEntrega(pedidoSelecionado.dataEntrega)}
                      {pedidoSelecionado.horarioEntrega && ` às ${pedidoSelecionado.horarioEntrega}`}
                    </span>
                  )}
                </div>
                {pedidoSelecionado.tipoEntrega === 'TELE_ENTREGA' && pedidoSelecionado.enderecoEntrega && (
                  <div className="flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{pedidoSelecionado.enderecoEntrega}{pedidoSelecionado.bairroEntrega && ` - ${pedidoSelecionado.bairroEntrega}`}</span>
                  </div>
                )}
              </div>

              {/* 5. LISTA DE PRODUTOS - ÍCONES EDITAR/ADICIONAR ACIMA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Itens ({pedidoSelecionado.itens.length})</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setDialogEdicaoOpen(true)}
                      title="Editar quantidades"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setDialogAdicaoOpen(true)}
                      title="Adicionar produto"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
                
                {/* Lista otimizada */}
                <div className="bg-muted/30 rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                  {pedidoSelecionado.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium truncate block">
                          {item.produto.nome}
                          {item.tamanho && <span className="text-primary ml-1">({item.tamanho})</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatarQuantidade(item.quantidade, item.produto.tipoVenda as 'KG' | 'UNIDADE')} × {formatarMoeda(item.valorUnit)}
                          {item.observacao && <span className="text-primary italic ml-1">({item.observacao})</span>}
                        </span>
                      </div>
                      <span className="text-xs font-semibold ml-2">{formatarMoeda(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. BOTÃO REGISTRAR ENTRADA (abre modal) */}
              {pedidoSelecionado.status !== 'ENTREGUE' && pedidoSelecionado.status !== 'CANCELADO' && (
                <Button
                  variant="outline"
                  className="w-full h-9 text-sm border-dashed"
                  onClick={() => setDialogEntradaOpen(true)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {(pedidoSelecionado as any).valorEntrada ? 'Editar Entrada' : 'Registrar Entrada'}
                </Button>
              )}

              {/* Entrada existente */}
              {(pedidoSelecionado as any).valorEntrada > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 flex items-center justify-between text-xs">
                  <span className="text-green-700 dark:text-green-400">
                    Entrada: {formatarMoeda((pedidoSelecionado as any).valorEntrada)} ({(pedidoSelecionado as any).formaPagamentoEntrada})
                  </span>
                  <span className="font-medium">
                    Restante: {formatarMoeda(pedidoSelecionado.total - ((pedidoSelecionado as any).valorEntrada || 0))}
                  </span>
                </div>
              )}

              {/* TOTAL */}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-sm">Total:</span>
                <span className="text-lg font-bold text-primary">{formatarMoeda(pedidoSelecionado.total)}</span>
              </div>

              {/* 7. BOTÕES DE AÇÃO */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() => handleImprimirCliente(pedidoSelecionado)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Cupom
                </Button>
                <Button
                  variant="outline"
                  className="h-9 text-xs"
                  onClick={() => handleImprimirCozinha(pedidoSelecionado)}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Comanda
                </Button>
                {pedidoSelecionado.status === 'PRONTO' && (
                  <Button
                    className="col-span-2 bg-green-600 hover:bg-green-700 text-white h-9 text-xs"
                    onClick={() => handleEnviarMensagemPronto(pedidoSelecionado)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp - Avisar Cliente
                  </Button>
                )}
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

      {/* Dialog de Edição de Itens */}
      <AlertDialog open={dialogEdicaoOpen} onOpenChange={setDialogEdicaoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Editar Quantidades
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ajuste as quantidades dos itens do pedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-60 overflow-y-auto space-y-2 py-2">
            {pedidoSelecionado?.itens.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.produto.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarMoeda(item.valorUnit)}/{item.produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step={item.produto.tipoVenda === 'KG' ? '0.001' : '1'}
                    min="0"
                    className="w-20 h-8 text-sm text-center"
                    value={itensEditados[item.id] !== undefined ? itensEditados[item.id] : item.quantidade.toString()}
                    onChange={(e) => handleEditarPesoLivre(item.id, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground w-6">
                    {item.produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setItensEditados({}); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSalvarEdicao}
              disabled={salvando}
              className="btn-padaria"
            >
              {salvando ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Adição de Produtos */}
      <AlertDialog open={dialogAdicaoOpen} onOpenChange={(open) => {
        setDialogAdicaoOpen(open);
        if (!open) {
          setProdutoSelecionado(null);
          setBuscaProduto('');
          setQuantidadeAdicionar('');
          setTamanhoSelecionado('');
          setObservacaoNovoItem('');
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </AlertDialogTitle>
            <AlertDialogDescription>
              Selecione um produto para adicionar ao pedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-2">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                className="pl-10 h-10"
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
              />
            </div>
            
            {/* Lista de produtos */}
            <div className="max-h-40 overflow-y-auto space-y-1">
              {produtosFiltrados.map(produto => (
                <button
                  key={produto.id}
                  type="button"
                  onClick={() => setProdutoSelecionado(produto)}
                  className={`w-full p-2 text-left rounded-lg transition-colors ${
                    produtoSelecionado?.id === produto.id 
                      ? 'bg-primary/20 border-2 border-primary' 
                      : 'bg-muted/30 border border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{produto.nome}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatarMoeda(produto.valorUnit)}/{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                    </span>
                  </div>
                </button>
              ))}
              {produtosFiltrados.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Nenhum produto encontrado
                </p>
              )}
            </div>
            
            {/* Seleção de quantidade/tamanho */}
            {produtoSelecionado && (
              <div className="space-y-2 pt-2 border-t border-border">
                {produtoSelecionado.tipoProduto === 'ESPECIAL' ? (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Tamanho</Label>
                    <div className="flex gap-2">
                      {['P', 'M', 'G', 'GG']
                        .filter(tam => {
                          const preco = produtoSelecionado.precosTamanhos?.[tam];
                          return preco && !isNaN(preco) && preco > 0;
                        })
                        .map(tam => (
                          <Button
                            key={tam}
                            type="button"
                            variant={tamanhoSelecionado === tam ? 'default' : 'outline'}
                            className={`flex-1 ${tamanhoSelecionado === tam ? 'btn-padaria' : ''}`}
                            onClick={() => setTamanhoSelecionado(tam)}
                          >
                            {tam} - {formatarMoeda(produtoSelecionado.precosTamanhos?.[tam] || 0)}
                          </Button>
                        ))}
                    </div>
                  </div>
                ) : produtoSelecionado.tipoVenda === 'KG' ? (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Peso</Label>
                    <Select value={quantidadeAdicionar} onValueChange={setQuantidadeAdicionar}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o peso" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCOES_KG.filter(op => op.valor > 0).map(op => (
                          <SelectItem key={op.valor} value={op.valor.toString()}>
                            {op.label} - {formatarMoeda(op.valor * produtoSelecionado.valorUnit)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Quantidade"
                      value={quantidadeAdicionar}
                      onChange={(e) => setQuantidadeAdicionar(e.target.value)}
                    />
                  </div>
                )}
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Observação (opcional)</Label>
                  <Input
                    placeholder="Ex: Sem cebola..."
                    value={observacaoNovoItem}
                    onChange={(e) => setObservacaoNovoItem(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdicionarProduto}
              disabled={!produtoSelecionado || adicionandoProduto || 
                (produtoSelecionado?.tipoProduto === 'ESPECIAL' ? !tamanhoSelecionado : !quantidadeAdicionar)}
              className="btn-padaria"
            >
              {adicionandoProduto ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Registro de Entrada */}
      <AlertDialog open={dialogEntradaOpen} onOpenChange={(open) => {
        setDialogEntradaOpen(open);
        if (!open) {
          setValorEntrada('');
          setFormaPagamentoEntrada('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Registrar Entrada
            </AlertDialogTitle>
            <AlertDialogDescription>
              Valor restante: <strong>{pedidoSelecionado && formatarMoeda(pedidoSelecionado.total - ((pedidoSelecionado as any).valorEntrada || 0))}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Valor da Entrada</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  max={pedidoSelecionado ? pedidoSelecionado.total - ((pedidoSelecionado as any).valorEntrada || 0) : 0}
                  placeholder="0,00"
                  className="pl-10"
                  value={valorEntrada}
                  onChange={(e) => setValorEntrada(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Forma de Pagamento</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'DINHEIRO', icon: Banknote, label: 'Dinheiro' },
                  { value: 'PIX', icon: Smartphone, label: 'PIX' },
                  { value: 'CARTAO', icon: CreditCard, label: 'Cartão' },
                ].map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={formaPagamentoEntrada === value ? 'default' : 'outline'}
                    onClick={() => setFormaPagamentoEntrada(value)}
                    className={`h-12 flex flex-col ${formaPagamentoEntrada === value ? 'btn-padaria' : ''}`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSalvarEntrada}
              disabled={salvandoEntrada || !valorEntrada || !formaPagamentoEntrada}
              className="btn-padaria"
            >
              {salvandoEntrada ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Entrada
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição de Data/Hora de Entrega */}
      <AlertDialog open={dialogDataOpen} onOpenChange={setDialogDataOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Editar Data/Hora de Entrega
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ajuste a data e horário de {pedidoSelecionado?.tipoEntrega === 'TELE_ENTREGA' ? 'entrega' : 'retirada'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Nova Data</Label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={novaDataEntrega}
                onChange={(e) => setNovaDataEntrega(e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Novo Horário</Label>
              <Input
                type="time"
                value={novoHorarioEntrega}
                onChange={(e) => setNovoHorarioEntrega(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setNovaDataEntrega(''); setNovoHorarioEntrega(''); }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSalvarDataEntrega}
              disabled={salvandoData || !novaDataEntrega}
              className="btn-padaria"
            >
              {salvandoData ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
