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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { useLoadingFetch } from '@/hooks/useLoadingFetch';
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
  produtoId?: string;
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
  statusPagamento?: string;
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
  valorTeleEntrega?: number;
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

// Horários comerciais disponíveis
const HORARIOS_COMERCIAIS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
];

export default function HistoricoPedidos() {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useLoadingFetch();
  
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [dataFiltro, setDataFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('TODOS');
  const [pagamentoFiltro, setPagamentoFiltro] = useState<string>('TODOS');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState<Pedido | null>(null);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);
  const [config, setConfig] = useState<Configuracao | null>(null);
  
  // Edição de itens - valores livres
  const [itensEditados, setItensEditados] = useState<Record<string, string>>({});
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Estados para edição de tamanho e observação dos itens
  const [tamanhosEditados, setTamanhosEditados] = useState<Record<string, string>>({});
  const [observacoesEditadas, setObservacoesEditadas] = useState<Record<string, string>>({});
  
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
  
  // Estados para edição completa de entrega
  const [dialogEntregaOpen, setDialogEntregaOpen] = useState(false);
  const [editTipoEntrega, setEditTipoEntrega] = useState<'RETIRA' | 'TELE_ENTREGA'>('RETIRA');
  const [editDataEntrega, setEditDataEntrega] = useState('');
  const [editHorarioEntrega, setEditHorarioEntrega] = useState('');
  const [editValorTeleEntrega, setEditValorTeleEntrega] = useState('');
  const [salvandoEntrega, setSalvandoEntrega] = useState(false);
  
  // Diálogos separados
  const [dialogEdicaoOpen, setDialogEdicaoOpen] = useState(false);
  const [dialogAdicaoOpen, setDialogAdicaoOpen] = useState(false);
  const [dialogEntradaOpen, setDialogEntradaOpen] = useState(false);
  const [dialogDataOpen, setDialogDataOpen] = useState(false);
  
  // Diálogo de confirmação de finalização
  const [dialogFinalizarOpen, setDialogFinalizarOpen] = useState(false);
  const [pedidoParaFinalizar, setPedidoParaFinalizar] = useState<Pedido | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  
  // Estados para pagamento final
  const [formaPagamentoFinal, setFormaPagamentoFinal] = useState('');
  const [valorRecebidoFinal, setValorRecebidoFinal] = useState('');

  // Carregar configurações
  useEffect(() => {
    fetch('/api/configuracao')
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);
  
  // Carregar produtos para adição - carrega quando o dialog abre
  useEffect(() => {
    if (dialogAdicaoOpen) {
      fetch('/api/produtos?ativo=true')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setProdutos(data);
          } else {
            console.error('API produtos retornou erro:', data);
            setProdutos([]);
          }
        })
        .catch(err => {
          console.error('Erro ao carregar produtos:', err);
          setProdutos([]);
        });
    }
  }, [dialogAdicaoOpen]);

  // Filtrar produtos pela busca
  const produtosFiltrados = useMemo(() => {
    if (!buscaProduto) return produtos;
    const termo = buscaProduto.toLowerCase();
    return produtos.filter(p => p.nome.toLowerCase().includes(termo));
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
      
      // Verificar se a resposta é um array
      if (Array.isArray(data)) {
        setPedidos(data);
      } else {
        console.error('API retornou erro:', data);
        setPedidos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidos([]);
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

  // Calcular status de pagamento de um pedido
  const calcularStatusPagamento = (pedido: Pedido): string => {
    if (pedido.statusPagamento) return pedido.statusPagamento;
    if (pedido.valorEntrada && pedido.valorEntrada > 0 && pedido.total) {
      if (pedido.valorEntrada >= pedido.total) return 'PAGO';
      return 'PARCIAL';
    }
    return 'PENDENTE';
  };

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
    
    // Filtro por status de pagamento
    if (pagamentoFiltro !== 'TODOS') {
      const statusPagamento = calcularStatusPagamento(pedido);
      if (pagamentoFiltro === 'PENDENTE') {
        // Pendente inclui PENDENTE e PARCIAL
        if (statusPagamento !== 'PENDENTE' && statusPagamento !== 'PARCIAL') return false;
      } else if (statusPagamento !== pagamentoFiltro) {
        return false;
      }
    }
    
    return true;
  });

  // Formatar data com dia da semana
  const formatarData = (data: string) => {
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dataObj = new Date(data);
    const diaSemana = diasSemana[dataObj.getDay()];
    const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${diaSemana} - ${dataFormatada} às ${horaFormatada}`;
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

  // Badge de status de pagamento
  const getStatusPagamentoBadge = (statusPagamento?: string, valorEntrada?: number, total?: number) => {
    // Calcular status automaticamente se não estiver definido
    let status = statusPagamento || 'PENDENTE';
    
    if (valorEntrada && valorEntrada > 0 && total) {
      if (valorEntrada >= total) {
        status = 'PAGO';
      } else {
        status = 'PARCIAL';
      }
    }
    
    const statusConfig: Record<string, { className: string; label: string }> = {
      PENDENTE: { className: 'bg-red-100 text-red-700', label: 'Pag. Pendente' },
      PARCIAL: { className: 'bg-yellow-100 text-yellow-700', label: 'Pag. Parcial' },
      PAGO: { className: 'bg-green-100 text-green-700', label: 'Pago' },
    };
    const cfg = statusConfig[status] || statusConfig.PENDENTE;
    return <Badge className={`text-[10px] ${cfg.className}`}>{cfg.label}</Badge>;
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
    
    // Separar itens alterados e itens para remover (quantidade = 0)
    const itensParaRemover: string[] = [];
    const itensParaAtualizar: { id: string; quantidade: number; subtotal: number; tamanho?: string; observacao?: string; produtoId?: string }[] = [];
    
    pedidoSelecionado.itens.forEach(item => {
      const novoPesoStr = itensEditados[item.id];
      const novoTamanho = tamanhosEditados[item.id];
      const novaObservacao = observacoesEditadas[item.id];
      
      // Verificar se houve alteração em algum campo
      const quantidadeMudou = novoPesoStr !== undefined;
      const tamanhoMudou = novoTamanho !== undefined;
      const observacaoMudou = novaObservacao !== undefined;
      
      if (quantidadeMudou || tamanhoMudou || observacaoMudou) {
        const novoPeso = novoPesoStr ? parseFloat(novoPesoStr.replace(',', '.')) : item.quantidade;
        
        if (!isNaN(novoPeso)) {
          if (novoPeso === 0) {
            // Item com quantidade 0 deve ser removido
            itensParaRemover.push(item.id);
          } else {
            // Preparar atualização do item
            const atualizacao: { id: string; quantidade: number; subtotal: number; tamanho?: string; observacao?: string; produtoId?: string } = {
              id: item.id,
              quantidade: novoPeso,
              subtotal: novoPeso * item.valorUnit,
            };
            
            // Incluir tamanho se foi alterado
            if (tamanhoMudou) {
              atualizacao.tamanho = novoTamanho || undefined;
              atualizacao.produtoId = item.produtoId;
            }
            
            // Incluir observação se foi alterada
            if (observacaoMudou) {
              atualizacao.observacao = novaObservacao || undefined;
            }
            
            // Só adicionar se houve mudança real
            if (novoPeso !== item.quantidade || tamanhoMudou || observacaoMudou) {
              itensParaAtualizar.push(atualizacao);
            }
          }
        }
      }
    });
    
    if (itensParaAtualizar.length === 0 && itensParaRemover.length === 0) {
      toast({
        title: 'Nenhuma alteração',
        description: 'Não há alterações para salvar.',
      });
      return;
    }
    
    // Verificar se restará pelo menos um item
    const itensRestantes = pedidoSelecionado.itens.length - itensParaRemover.length;
    if (itensRestantes === 0 && itensParaAtualizar.length === 0) {
      toast({
        title: 'Não permitido',
        description: 'O pedido deve ter pelo menos um item.',
        variant: 'destructive',
      });
      return;
    }
    
    setSalvando(true);
    showLoading('Salvando alterações...');
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          itens: itensParaAtualizar,
          itensParaRemover,
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
        description: 'As alterações foram salvas. Reimprima a comanda da cozinha se necessário.',
        duration: 5000,
      });
      
      setModoEdicao(false);
      setItensEditados({});
      setTamanhosEditados({});
      setObservacoesEditadas({});
      setDialogEdicaoOpen(false);
      
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o pedido.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
      hideLoading();
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
    // Se for ENTREGUE, mostrar confirmação com pagamento
    if (novoStatus === 'ENTREGUE') {
      setPedidoParaFinalizar(pedido);
      setFormaPagamentoFinal('');
      setValorRecebidoFinal('');
      setDialogFinalizarOpen(true);
      return;
    }
    
    // Para outros status, atualizar diretamente
    await atualizarStatusDireto(pedido, novoStatus);
  };
  
  // Função para atualizar status diretamente (sem confirmação)
  const atualizarStatusDireto = async (pedido: Pedido, novoStatus: string) => {
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
  
  // Confirmar finalização do pedido
  const handleConfirmarFinalizacao = async () => {
    if (!pedidoParaFinalizar) return;
    
    setFinalizando(true);
    showLoading('Finalizando pedido...');
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoParaFinalizar.id,
          status: 'ENTREGUE',
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      setDialogFinalizarOpen(false);
      setPedidoParaFinalizar(null);
      
      toast({
        title: 'Pedido finalizado!',
        description: `Pedido #${formatarNumeroPedido(pedidoParaFinalizar.numero)} marcado como ENTREGUE.`,
      });
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar o pedido.',
        variant: 'destructive',
      });
    } finally {
      setFinalizando(false);
      hideLoading();
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
    mensagem += `Olá, *${pedido.cliente.nome}*! Tudo bem?\n\n`;
    
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
    mensagem += `Olá, *${pedido.cliente.nome}*! Tudo bem? 👋\n\n`;
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
    showLoading('Adicionando produto...');
    
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
      hideLoading();
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
    
    // Calcular valor total já pago (entrada anterior + novo valor)
    const valorJaPago = pedidoSelecionado.valorEntrada || 0;
    const novoTotalPago = valorJaPago + valor;
    
    if (novoTotalPago > pedidoSelecionado.total) {
      toast({
        title: 'Valor excede o total',
        description: `O valor total pago não pode ser maior que ${formatarMoeda(pedidoSelecionado.total)}.`,
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
    
    // Determinar status de pagamento
    let statusPagamento = 'PENDENTE';
    if (novoTotalPago >= pedidoSelecionado.total) {
      statusPagamento = 'PAGO';
    } else if (novoTotalPago > 0) {
      statusPagamento = 'PARCIAL';
    }
    
    setSalvandoEntrada(true);
    showLoading('Salvando pagamento...');
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          valorEntrada: novoTotalPago,
          formaPagamentoEntrada,
          dataEntrada: new Date().toISOString(),
          statusPagamento,
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      if (!response.ok) {
        throw new Error(pedidoAtualizado.error || 'Erro ao salvar pagamento');
      }
      
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      
      // Limpar formulário
      setValorEntrada('');
      setFormaPagamentoEntrada('');
      setModoEntrada(false);
      
      toast({
        title: 'Pagamento registrado!',
        description: `${formatarMoeda(valor)} recebido via ${formaPagamentoEntrada.toLowerCase()}. Total pago: ${formatarMoeda(novoTotalPago)}`,
      });
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      });
    } finally {
      setSalvandoEntrada(false);
      hideLoading();
    }
  };
  
  // Iniciar edição de data de entrega
  const handleIniciarEdicaoData = () => {
    if (pedidoSelecionado) {
      setNovaDataEntrega(pedidoSelecionado.dataEntrega || '');
      setNovoHorarioEntrega(pedidoSelecionado.horarioEntrega || '');
      setDialogDataOpen(true);
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
    showLoading('Atualizando data...');
    
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
      hideLoading();
    }
  };

  // Abrir diálogo de edição completa de entrega
  const handleAbrirEdicaoEntrega = () => {
    if (pedidoSelecionado) {
      setEditTipoEntrega((pedidoSelecionado.tipoEntrega || 'RETIRA') as 'RETIRA' | 'TELE_ENTREGA');
      setEditDataEntrega(pedidoSelecionado.dataEntrega || '');
      setEditHorarioEntrega(pedidoSelecionado.horarioEntrega || '');
      setEditValorTeleEntrega((pedidoSelecionado as any).valorTeleEntrega ? String((pedidoSelecionado as any).valorTeleEntrega) : '');
      setDialogEntregaOpen(true);
    }
  };

  // Salvar edição completa de entrega
  const handleSalvarEdicaoEntrega = async () => {
    if (!pedidoSelecionado) return;
    
    if (!editDataEntrega) {
      toast({ title: 'Data obrigatória', variant: 'destructive' });
      return;
    }
    
    // Validar valor da tele-entrega se for tele-entrega
    if (editTipoEntrega === 'TELE_ENTREGA') {
      const valorTele = parseFloat(editValorTeleEntrega.replace(',', '.')) || 0;
      if (valorTele <= 0) {
        toast({ title: 'Valor da entrega obrigatório', description: 'Informe o valor da taxa de tele-entrega.', variant: 'destructive' });
        return;
      }
    }
    
    setSalvandoEntrega(true);
    showLoading('Salvando entrega...');
    
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoSelecionado.id,
          tipoEntrega: editTipoEntrega,
          dataEntrega: editDataEntrega,
          horarioEntrega: editHorarioEntrega || null,
          valorTeleEntrega: editTipoEntrega === 'TELE_ENTREGA' ? parseFloat(editValorTeleEntrega.replace(',', '.')) || 0 : null,
        }),
      });
      
      const pedidoAtualizado = await response.json();
      
      if (!response.ok) throw new Error(pedidoAtualizado.error || 'Erro ao atualizar');
      
      // Atualizar lista e pedido selecionado
      setPedidos(prev => prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p));
      setPedidoSelecionado(pedidoAtualizado);
      setDialogEntregaOpen(false);
      
      toast({ 
        title: 'Entrega atualizada!',
        description: 'Dados de entrega salvos com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao salvar entrega:', error);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSalvandoEntrega(false);
      hideLoading();
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
            <Select value={pagamentoFiltro} onValueChange={setPagamentoFiltro}>
              <SelectTrigger className="w-full sm:w-40 h-10">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pag. Pendente</SelectItem>
                <SelectItem value="PAGO">Pago</SelectItem>
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
                          {getStatusPagamentoBadge(pedido.statusPagamento, pedido.valorEntrada, pedido.total)}
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
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header compacto com botão WhatsApp discreto (deslocado 15mm à esquerda = ml-4) */}
          <DialogHeader className="p-2 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {pedidoSelecionado && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 rounded-full ml-4"
                    onClick={() => handleConfirmarPedido(pedidoSelecionado)}
                    title="Confirmar pedido via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                )}
                <DialogTitle className="text-base font-bold">
                  Pedido #{pedidoSelecionado && formatarNumeroPedido(pedidoSelecionado.numero)}
                </DialogTitle>
                {pedidoSelecionado && getStatusBadge(pedidoSelecionado.status)}
              </div>
            </div>
          </DialogHeader>

          {pedidoSelecionado && (
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {/* STATUS: 4 botões menores */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { status: 'PENDENTE', icon: Clock, label: 'Pendente', bg: 'bg-yellow-500' },
                  { status: 'PRODUCAO', icon: Package, label: 'Produção', bg: 'bg-blue-500' },
                  { status: 'PRONTO', icon: Check, label: 'Pronto', bg: 'bg-green-500' },
                  { status: 'ENTREGUE', icon: Truck, label: 'Entregue', bg: 'bg-primary' },
                ].map(({ status, icon: Icon, label, bg }) => (
                  <button
                    key={status}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado, status)}
                    disabled={pedidoSelecionado.status === status || pedidoSelecionado.status === 'ENTREGUE'}
                    className={`flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      pedidoSelecionado.status === status 
                        ? `${bg} text-white shadow-md` 
                        : pedidoSelecionado.status === 'ENTREGUE'
                          ? 'bg-muted/50 text-muted-foreground/50 border border-border cursor-not-allowed'
                          : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              
              {/* Aviso de pedido finalizado */}
              {pedidoSelecionado.status === 'ENTREGUE' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">
                    Pedido finalizado - não pode ser editado
                  </p>
                </div>
              )}

              {/* DADOS DO CLIENTE + DATA */}
              <div className="bg-muted/30 rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs">{pedidoSelecionado.cliente.nome}</span>
                    {pedidoSelecionado.tipoEntrega && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        {pedidoSelecionado.tipoEntrega === 'RETIRA' ? <Store className="w-2.5 h-2.5" /> : <Truck className="w-2.5 h-2.5" />}
                      </Badge>
                    )}
                  </div>
                  {pedidoSelecionado.status !== 'ENTREGUE' && (
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px]" onClick={handleAbrirEdicaoEntrega} title="Editar entrega">
                      <Edit2 className="w-2.5 h-2.5 mr-0.5" />Entrega
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{pedidoSelecionado.cliente.telefone}</span>
                  {pedidoSelecionado.dataEntrega && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatarDataEntrega(pedidoSelecionado.dataEntrega)}
                      {pedidoSelecionado.horarioEntrega && ` ${pedidoSelecionado.horarioEntrega}`}
                    </span>
                  )}
                </div>
                {pedidoSelecionado.tipoEntrega === 'TELE_ENTREGA' && pedidoSelecionado.enderecoEntrega && (
                  <div className="flex items-start gap-0.5 text-[10px] text-muted-foreground">
                    <MapPin className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                    <span>{pedidoSelecionado.enderecoEntrega}{pedidoSelecionado.bairroEntrega && ` - ${pedidoSelecionado.bairroEntrega}`}</span>
                  </div>
                )}
                {/* Mostrar taxa de tele-entrega se houver */}
                {pedidoSelecionado.tipoEntrega === 'TELE_ENTREGA' && (pedidoSelecionado as any).valorTeleEntrega > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-primary font-medium">
                    <Truck className="w-2.5 h-2.5" />
                    <span>Taxa de entrega: {formatarMoeda((pedidoSelecionado as any).valorTeleEntrega)}</span>
                  </div>
                )}
              </div>

              {/* LISTA DE PRODUTOS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[10px]">Itens ({pedidoSelecionado.itens.length})</span>
                  {pedidoSelecionado.status !== 'ENTREGUE' && (
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="sm" className="h-5 px-1 text-[9px]" onClick={() => setDialogEdicaoOpen(true)}>
                        <Edit2 className="w-2.5 h-2.5 mr-0.5" />Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-5 px-1 text-[9px]" onClick={() => setDialogAdicaoOpen(true)}>
                        <Plus className="w-2.5 h-2.5 mr-0.5" />Adicionar
                      </Button>
                    </div>
                  )}
                </div>
                <div className="bg-muted/30 rounded-lg p-1.5 space-y-0.5 max-h-24 overflow-y-auto">
                  {pedidoSelecionado.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-0.5 border-b border-border/20 last:border-0">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-medium truncate block">
                          {item.produto.nome}{item.tamanho && <span className="text-primary ml-0.5">({item.tamanho})</span>}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {formatarQuantidade(item.quantidade, item.produto.tipoVenda as 'KG' | 'UNIDADE')} × {formatarMoeda(item.valorUnit)}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold ml-1">{formatarMoeda(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTÃO REGISTRAR ENTRADA - para pedidos não entregues */}
              {pedidoSelecionado.status !== 'ENTREGUE' && pedidoSelecionado.status !== 'CANCELADO' && (
                <Button variant="outline" className="w-full h-7 text-[10px] border-dashed" onClick={() => setDialogEntradaOpen(true)}>
                  <DollarSign className="w-3 h-3 mr-1" />
                  {(pedidoSelecionado as any).valorEntrada ? 'Editar Entrada' : 'Registrar Entrada'}
                </Button>
              )}

              {/* BOTÃO REGISTRAR PAGAMENTO - para pedidos entregues com pagamento pendente */}
              {pedidoSelecionado.status === 'ENTREGUE' && calcularStatusPagamento(pedidoSelecionado) !== 'PAGO' && (
                <Button variant="outline" className="w-full h-7 text-[10px] border-dashed border-yellow-400 bg-yellow-50 hover:bg-yellow-100 text-yellow-700" onClick={() => setDialogEntradaOpen(true)}>
                  <DollarSign className="w-3 h-3 mr-1" />
                  Registrar Pagamento Pendente
                </Button>
              )}

              {/* Entrada existente */}
              {(pedidoSelecionado as any).valorEntrada > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-green-700 dark:text-green-400">Entrada: {formatarMoeda((pedidoSelecionado as any).valorEntrada)}</span>
                  <span className="font-medium">Restante: {formatarMoeda(pedidoSelecionado.total - ((pedidoSelecionado as any).valorEntrada || 0))}</span>
                </div>
              )}

              {/* Status de pagamento para pedidos entregues */}
              {pedidoSelecionado.status === 'ENTREGUE' && (
                <div className="flex items-center justify-between">
                  {getStatusPagamentoBadge(pedidoSelecionado.statusPagamento, pedidoSelecionado.valorEntrada, pedidoSelecionado.total)}
                  {calcularStatusPagamento(pedidoSelecionado) !== 'PAGO' && (
                    <span className="text-[10px] text-red-600 font-medium">
                      Pendente: {formatarMoeda(pedidoSelecionado.total - ((pedidoSelecionado as any).valorEntrada || 0))}
                    </span>
                  )}
                </div>
              )}

              {/* TOTAL */}
              <div className="flex justify-between items-center pt-1 border-t border-border">
                <span className="font-semibold text-xs">Total:</span>
                <span className="text-base font-bold text-primary">{formatarMoeda(pedidoSelecionado.total)}</span>
              </div>
            </div>
          )}

          {/* BOTÕES DE AÇÃO - SEMPRE VISÍVEIS */}
          {pedidoSelecionado && (
            <div className="shrink-0 p-2 border-t border-border bg-background">
              <div className="grid grid-cols-2 gap-1">
                <Button className="h-8 text-[10px] bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleImprimirCliente(pedidoSelecionado)}>
                  <FileText className="w-3 h-3 mr-0.5" />Cupom do Cliente
                </Button>
                <Button className="h-8 text-[10px] btn-padaria" onClick={() => handleImprimirCozinha(pedidoSelecionado)}>
                  <Printer className="w-3 h-3 mr-0.5" />Comanda da Cozinha
                </Button>
              </div>
              {pedidoSelecionado.status === 'PRONTO' && (
                <Button className="w-full mt-1 bg-green-600 hover:bg-green-700 text-white h-8 text-[10px]" onClick={() => handleEnviarMensagemPronto(pedidoSelecionado)}>
                  <MessageCircle className="w-3 h-3 mr-1" />Avisar Cliente - Pedido Pronto
                </Button>
              )}
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
      <AlertDialog open={dialogEdicaoOpen} onOpenChange={(open) => {
        setDialogEdicaoOpen(open);
        if (!open) {
          setItensEditados({});
          setTamanhosEditados({});
          setObservacoesEditadas({});
        }
      }}>
        <AlertDialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" />
              Editar Itens
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ajuste quantidade, tamanho e observações dos itens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto space-y-3 py-2">
            {pedidoSelecionado?.itens.map((item) => {
              // Verificar se é Torta Especial (apenas pelo nome do produto)
              const isTortaEspecial = item.produto.nome.toUpperCase().includes('TORTA ESPECIAL');
              const tamanhosDisponiveis = ['PP', 'P', 'M', 'G'];
              
              return (
                <div key={item.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between gap-2">
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
                        className="w-16 h-8 text-sm text-center"
                        value={itensEditados[item.id] !== undefined ? itensEditados[item.id] : item.quantidade.toString()}
                        onChange={(e) => handleEditarPesoLivre(item.id, e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground w-6">
                        {item.produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tamanho e Observação - apenas para Torta Especial */}
                  {isTortaEspecial && (
                    <>
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-1 block">Tamanho</Label>
                        <div className="flex gap-1">
                          {tamanhosDisponiveis.map((tam) => (
                            <Button
                              key={tam}
                              type="button"
                              variant={(tamanhosEditados[item.id] !== undefined ? tamanhosEditados[item.id] : item.tamanho) === tam ? 'default' : 'outline'}
                              size="sm"
                              className={`flex-1 h-7 text-[10px] ${(tamanhosEditados[item.id] !== undefined ? tamanhosEditados[item.id] : item.tamanho) === tam ? 'btn-padaria' : ''}`}
                              onClick={() => setTamanhosEditados(prev => ({ ...prev, [item.id]: tam }))}
                            >
                              {tam}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-1 block">Observação</Label>
                        <Input
                          placeholder="Ex: sem cebola, mais queijo..."
                          className="h-8 text-xs"
                          value={observacoesEditadas[item.id] !== undefined ? observacoesEditadas[item.id] : (item.observacao || '')}
                          onChange={(e) => setObservacoesEditadas(prev => ({ ...prev, [item.id]: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setItensEditados({}); setTamanhosEditados({}); setObservacoesEditadas({}); }}>Cancelar</AlertDialogCancel>
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

      {/* Dialog de Adição de Produtos - COMPACTO */}
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
        <AlertDialogContent className="max-w-sm max-h-[80vh] overflow-hidden flex flex-col p-0">
          <AlertDialogHeader className="shrink-0 p-3 border-b border-border">
            <AlertDialogTitle className="flex items-center gap-2 text-sm">
              <Plus className="w-3.5 h-3.5" />
              Adicionar Produto
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {/* Busca */}
            <div className="relative shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 h-8 text-xs"
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
              />
            </div>
            
            {/* Lista de produtos compacta */}
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {produtosFiltrados.map(produto => (
                <button
                  key={produto.id}
                  type="button"
                  onClick={() => setProdutoSelecionado(produto)}
                  className={`w-full px-2 py-1.5 text-left rounded transition-colors ${
                    produtoSelecionado?.id === produto.id 
                      ? 'bg-primary/20 border border-primary' 
                      : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[11px] truncate">{produto.nome}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                      {formatarMoeda(produto.valorUnit)}/{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                    </span>
                  </div>
                </button>
              ))}
              {produtosFiltrados.length === 0 && (
                <p className="text-center text-muted-foreground py-2 text-[10px]">Nenhum produto</p>
              )}
            </div>
            
            {/* Seleção de quantidade/tamanho - mais compacta */}
            {produtoSelecionado && (
              <div className="space-y-1.5 pt-2 border-t border-border shrink-0">
                {produtoSelecionado.tipoProduto === 'ESPECIAL' ? (
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-0.5 block">Tamanho</Label>
                    <div className="flex gap-1">
                      {['PP', 'P', 'M', 'G']
                        .filter(tam => {
                          const preco = produtoSelecionado.precosTamanhos?.[tam];
                          return preco && !isNaN(preco) && preco > 0;
                        })
                        .map(tam => {
                          const preco = produtoSelecionado.precosTamanhos?.[tam] || 0;
                          return (
                            <Button
                              key={tam}
                              type="button"
                              variant={tamanhoSelecionado === tam ? 'default' : 'outline'}
                              size="sm"
                              className={`flex-1 h-7 text-[10px] ${tamanhoSelecionado === tam ? 'btn-padaria' : ''}`}
                              onClick={() => setTamanhoSelecionado(tam)}
                            >
                              {tam} {formatarMoeda(preco)}
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                ) : produtoSelecionado.tipoVenda === 'KG' ? (
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-0.5 block">Peso</Label>
                    <Select value={quantidadeAdicionar} onValueChange={setQuantidadeAdicionar}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCOES_KG.filter(op => op.valor > 0).map(op => (
                          <SelectItem key={op.valor} value={op.valor.toString()} className="text-xs">
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label className="text-[10px] text-muted-foreground mb-0.5 block">Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      className="h-8 text-xs"
                      value={quantidadeAdicionar}
                      onChange={(e) => setQuantidadeAdicionar(e.target.value)}
                    />
                  </div>
                )}
                
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-0.5 block">Obs</Label>
                  <Input
                    placeholder="Opcional..."
                    className="h-8 text-xs"
                    value={observacaoNovoItem}
                    onChange={(e) => setObservacaoNovoItem(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          
          <AlertDialogFooter className="shrink-0 p-2 border-t border-border">
            <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdicionarProduto}
              disabled={!produtoSelecionado || adicionandoProduto || 
                (produtoSelecionado?.tipoProduto === 'ESPECIAL' ? !tamanhoSelecionado : !quantidadeAdicionar)}
              className="btn-padaria h-8 text-xs"
            >
              {adicionandoProduto ? (
                <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Adicionando...</>
              ) : (
                <><Plus className="w-3 h-3 mr-1" />Adicionar</>
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
              <Select value={novoHorarioEntrega} onValueChange={setNovoHorarioEntrega}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {HORARIOS_COMERCIAIS.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Dialog de Confirmação de Finalização com Pagamento */}
      <AlertDialog open={dialogFinalizarOpen} onOpenChange={setDialogFinalizarOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Finalizar Pedido #{pedidoParaFinalizar && formatarNumeroPedido(pedidoParaFinalizar.numero)}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <span className="text-amber-600 font-medium">⚠️ Após finalizar, o pedido não poderá mais ser editado.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Informações do pedido */}
          <div className="space-y-3 py-2">
            {/* Valores */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total do pedido:</span>
                <span className="font-bold text-primary">{pedidoParaFinalizar && formatarMoeda(pedidoParaFinalizar.total)}</span>
              </div>
              {pedidoParaFinalizar && (pedidoParaFinalizar as any).valorEntrada > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Entrada já recebida:</span>
                    <span className="font-medium">{formatarMoeda((pedidoParaFinalizar as any).valorEntrada)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Restante a receber:</span>
                    <span className="text-amber-600">{formatarMoeda(pedidoParaFinalizar.total - ((pedidoParaFinalizar as any).valorEntrada || 0))}</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Pergunta sobre pagamento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {pedidoParaFinalizar && (pedidoParaFinalizar as any).valorEntrada > 0 
                  ? 'O restante foi pago?' 
                  : 'O pagamento foi recebido?'}
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={formaPagamentoFinal ? 'outline' : 'default'}
                  className={`flex-1 h-9 text-xs ${!formaPagamentoFinal ? 'btn-padaria' : ''}`}
                  onClick={() => setFormaPagamentoFinal('')}
                >
                  <X className="w-3 h-3 mr-1" />
                  Não
                </Button>
                <Button
                  variant={formaPagamentoFinal ? 'default' : 'outline'}
                  className={`flex-1 h-9 text-xs ${formaPagamentoFinal ? 'btn-padaria' : ''}`}
                  onClick={() => setFormaPagamentoFinal('DINHEIRO')}
                >
                  <Check className="w-3 h-3 mr-1" />
                  Sim
                </Button>
              </div>
            </div>
            
            {/* Se foi pago, mostrar formas de pagamento */}
            {formaPagamentoFinal && (
              <div className="space-y-2 animate-fade-in">
                <Label className="text-sm">Forma de pagamento:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
                    { value: 'PIX', label: 'PIX', icon: Smartphone },
                    { value: 'CARTAO', label: 'Cartão', icon: CreditCard },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={formaPagamentoFinal === value ? 'default' : 'outline'}
                      size="sm"
                      className={`h-10 flex-col gap-0.5 ${formaPagamentoFinal === value ? 'btn-padaria' : ''}`}
                      onClick={() => setFormaPagamentoFinal(value)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finalizando} onClick={() => { setFormaPagamentoFinal(''); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarFinalizacao}
              disabled={finalizando}
              className="bg-green-600 hover:bg-green-700"
            >
              {finalizando ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar Pedido
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição Completa de Entrega */}
      <Dialog open={dialogEntregaOpen} onOpenChange={setDialogEntregaOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Edit2 className="w-4 h-4" />
              Editar Dados de Entrega
            </DialogTitle>
            <DialogDescription className="text-xs">
              Altere o tipo, data, horário e valor da entrega.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            {/* Tipo de Entrega */}
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Tipo de Entrega</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`p-2 rounded-lg border-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                    editTipoEntrega === 'RETIRA' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setEditTipoEntrega('RETIRA')}
                >
                  <Store className="w-4 h-4" />
                  <span className="text-xs font-medium">Retira</span>
                </button>
                <button
                  type="button"
                  className={`p-2 rounded-lg border-2 cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                    editTipoEntrega === 'TELE_ENTREGA' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setEditTipoEntrega('TELE_ENTREGA')}
                >
                  <Truck className="w-4 h-4" />
                  <span className="text-xs font-medium">Entrega</span>
                </button>
              </div>
            </div>

            {/* Data de Entrega */}
            <div>
              <Label className="text-xs font-medium mb-1 block">Data de Entrega</Label>
              <Input
                type="date"
                className="h-9 text-sm"
                value={editDataEntrega}
                onChange={(e) => setEditDataEntrega(e.target.value)}
              />
            </div>

            {/* Horário de Entrega */}
            <div>
              <Label className="text-xs font-medium mb-1 block">Horário de Entrega</Label>
              <Select value={editHorarioEntrega} onValueChange={setEditHorarioEntrega}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {HORARIOS_COMERCIAIS.map((h) => (
                    <SelectItem key={h} value={h} className="text-sm">{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor da Tele-Entrega - só mostra se for TELE_ENTREGA */}
            {editTipoEntrega === 'TELE_ENTREGA' && (
              <div>
                <Label className="text-xs font-medium mb-1 block">Valor da Taxa de Entrega</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    className="h-9 text-sm pl-10"
                    value={editValorTeleEntrega}
                    onChange={(e) => setEditValorTeleEntrega(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Este valor será somado ao total do pedido.</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              className="h-9 text-xs"
              onClick={() => setDialogEntregaOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="btn-padaria h-9 text-xs"
              onClick={handleSalvarEdicaoEntrega}
              disabled={salvandoEntrega || !editDataEntrega}
            >
              {salvandoEntrega ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />Salvando...</>
              ) : (
                <><Check className="w-3.5 h-3.5 mr-1" />Salvar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
