'use client';

// OrcamentosLista - Padaria Paula
// Lista de orçamentos com ações de aprovar/rejeitar

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, RefreshCw, Eye, Check, X, FileText, Calendar, Trash2,
  MapPin, Truck, Store, Clock, Package, ShoppingCart, Printer, MessageCircle, Send,
  Edit2, Plus, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';
import {
  gerarCupomOrcamento,
  imprimirViaDialogo,
  formatarNumeroPedido,
  type OrcamentoCompleto,
  type ConfiguracaoCupom,
} from '@/lib/escpos';

interface ItemOrcamento {
  id: string;
  produto: {
    nome: string;
    tipoVenda: string;
  };
  quantidade: number;
  valorUnit: number;
  subtotal: number;
  observacao?: string;
  tamanho?: string;
}

interface Orcamento {
  id: string;
  numero: number;
  cliente: {
    id: string;
    nome: string;
    telefone: string;
    endereco?: string | null;
    bairro?: string | null;
  };
  itens: ItemOrcamento[];
  observacoes?: string;
  total: number;
  status: string;
  tipoEntrega: string;
  dataEntrega: string;
  horarioEntrega?: string;
  enderecoEntrega?: string;
  bairroEntrega?: string;
  createdAt: string;
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

export default function OrcamentosLista() {
  const { toast } = useToast();
  
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('PENDENTE');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orcamentoParaExcluir, setOrcamentoParaExcluir] = useState<Orcamento | null>(null);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [config, setConfig] = useState<ConfiguracaoCupom | null>(null);
  
  // Estados para edição de orçamento
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modoAdicao, setModoAdicao] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('');
  const [observacaoNovoItem, setObservacaoNovoItem] = useState('');
  const [adicionandoProduto, setAdicionandoProduto] = useState(false);
  const [itensEditados, setItensEditados] = useState<Record<string, string>>({});
  
  // Estados para diálogos separados
  const [dialogEdicaoOpen, setDialogEdicaoOpen] = useState(false);
  const [dialogAdicaoOpen, setDialogAdicaoOpen] = useState(false);
  
  // Estados para edição de entrega
  const [dialogEntregaOpen, setDialogEntregaOpen] = useState(false);
  const [editTipoEntrega, setEditTipoEntrega] = useState<'RETIRA' | 'TELE_ENTREGA'>('RETIRA');
  const [editDataEntrega, setEditDataEntrega] = useState('');
  const [editHorarioEntrega, setEditHorarioEntrega] = useState('');
  const [salvandoEntrega, setSalvandoEntrega] = useState(false);

  // Horários comerciais disponíveis
  const HORARIOS_COMERCIAIS = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  // Abrir modal de edição de entrega
  const handleAbrirEdicaoEntrega = (orcamento: Orcamento) => {
    setEditTipoEntrega(orcamento.tipoEntrega as 'RETIRA' | 'TELE_ENTREGA');
    setEditDataEntrega(orcamento.dataEntrega);
    setEditHorarioEntrega(orcamento.horarioEntrega || '');
    setDialogEntregaOpen(true);
  };

  // Salvar edição de entrega
  const handleSalvarEdicaoEntrega = async () => {
    if (!orcamentoSelecionado) return;
    
    if (!editDataEntrega) {
      toast({ title: 'Data obrigatória', variant: 'destructive' });
      return;
    }
    
    setSalvandoEntrega(true);
    
    try {
      const response = await fetch('/api/orcamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orcamentoSelecionado.id,
          tipoEntrega: editTipoEntrega,
          dataEntrega: editDataEntrega,
          horarioEntrega: editHorarioEntrega || null,
        }),
      });
      
      const orcamentoAtualizado = await response.json();
      
      if (!response.ok) throw new Error(orcamentoAtualizado.error || 'Erro ao atualizar');
      
      setOrcamentos(prev => prev.map(o => o.id === orcamentoAtualizado.id ? orcamentoAtualizado : o));
      setOrcamentoSelecionado(orcamentoAtualizado);
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
    }
  };

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
        .then(data => setProdutos(data))
        .catch(console.error);
    }
  }, [dialogAdicaoOpen]);

  // Filtrar produtos pela busca
  const produtosFiltrados = useMemo(() => {
    if (!buscaProduto) return produtos.slice(0, 15);
    const termo = buscaProduto.toLowerCase();
    return produtos.filter(p => p.nome.toLowerCase().includes(termo)).slice(0, 15);
  }, [produtos, buscaProduto]);

  // Carregar orçamentos
  const carregarOrcamentos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orcamentos?status=${statusFiltro}`);
      const data = await res.json();
      setOrcamentos(data);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os orçamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrcamentos();
  }, [statusFiltro]);

  // Filtrar por busca
  const orcamentosFiltrados = orcamentos.filter(orcamento => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      orcamento.numero.toString().includes(termo) ||
      orcamento.cliente.nome.toLowerCase().includes(termo) ||
      orcamento.cliente.telefone.includes(termo)
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
      APROVADO: { variant: 'default', label: 'Aprovado', className: 'bg-green-600' },
      REJEITADO: { variant: 'destructive', label: 'Rejeitado' },
    };
    const cfg = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
  };

  // Visualizar orçamento
  const handleVisualizar = (orcamento: Orcamento) => {
    setOrcamentoSelecionado(orcamento);
    setModoEdicao(false);
    setModoAdicao(false);
    setItensEditados({});
    setBuscaProduto('');
    setProdutoSelecionado(null);
    setQuantidadeAdicionar('');
    setTamanhoSelecionado('');
    setObservacaoNovoItem('');
    setDialogOpen(true);
  };

  // Editar quantidade de item
  const handleEditarQuantidade = (itemId: string, valor: string) => {
    setItensEditados(prev => ({
      ...prev,
      [itemId]: valor,
    }));
  };

  // Salvar edição de quantidades
  const handleSalvarEdicao = async () => {
    if (!orcamentoSelecionado) return;
    
    // Separar itens alterados e itens para remover (quantidade = 0)
    const itensParaRemover: string[] = [];
    const itensParaAtualizar: { id: string; quantidade: number; subtotal: number }[] = [];
    
    orcamentoSelecionado.itens.forEach(item => {
      const novoValor = itensEditados[item.id];
      if (novoValor !== undefined) {
        const novaQtd = parseFloat(novoValor.replace(',', '.'));
        if (!isNaN(novaQtd)) {
          if (novaQtd === 0) {
            // Item com quantidade 0 deve ser removido
            itensParaRemover.push(item.id);
          } else if (novaQtd !== item.quantidade) {
            // Item com quantidade alterada
            itensParaAtualizar.push({
              id: item.id,
              quantidade: novaQtd,
              subtotal: novaQtd * item.valorUnit,
            });
          }
        }
      }
    });

    if (itensParaAtualizar.length === 0 && itensParaRemover.length === 0) {
      toast({ title: 'Nenhuma alteração', description: 'Não há alterações para salvar.' });
      return;
    }
    
    // Verificar se restará pelo menos um item
    const itensRestantes = orcamentoSelecionado.itens.length - itensParaRemover.length;
    if (itensRestantes === 0) {
      toast({
        title: 'Não permitido',
        description: 'O orçamento deve ter pelo menos um item.',
        variant: 'destructive',
      });
      return;
    }

    setProcessando(true);
    try {
      const response = await fetch('/api/orcamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orcamentoSelecionado.id,
          itens: itensParaAtualizar,
          itensParaRemover,
        }),
      });

      const orcamentoAtualizado = await response.json();
      
      if (!response.ok) throw new Error(orcamentoAtualizado.error || 'Erro ao atualizar');

      setOrcamentos(prev => prev.map(o => o.id === orcamentoAtualizado.id ? orcamentoAtualizado : o));
      setOrcamentoSelecionado(orcamentoAtualizado);
      setModoEdicao(false);
      setItensEditados({});
      
      toast({ title: 'Orçamento atualizado!' });
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setProcessando(false);
    }
  };

  // Adicionar produto ao orçamento
  const handleAdicionarProduto = async () => {
    if (!orcamentoSelecionado || !produtoSelecionado) return;

    let quantidade = 0;
    let valorUnit = 0;
    let tamanho: string | undefined = undefined;

    if (produtoSelecionado.tipoProduto === 'ESPECIAL') {
      if (!tamanhoSelecionado) {
        toast({ title: 'Selecione o tamanho', variant: 'destructive' });
        return;
      }
      const precoTamanho = produtoSelecionado.precosTamanhos?.[tamanhoSelecionado];
      valorUnit = (precoTamanho && !isNaN(precoTamanho) && precoTamanho > 0) ? precoTamanho : produtoSelecionado.valorUnit;
      quantidade = 1;
      tamanho = tamanhoSelecionado;
    } else {
      quantidade = parseFloat(quantidadeAdicionar.replace(',', '.')) || 0;
      valorUnit = produtoSelecionado.valorUnit;
      if (quantidade <= 0) {
        toast({ title: 'Quantidade inválida', variant: 'destructive' });
        return;
      }
    }

    const subtotal = quantidade * valorUnit;
    setAdicionandoProduto(true);

    try {
      const response = await fetch('/api/orcamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orcamentoSelecionado.id,
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

      const orcamentoAtualizado = await response.json();
      if (!response.ok) throw new Error(orcamentoAtualizado.error || 'Erro ao adicionar');

      setOrcamentos(prev => prev.map(o => o.id === orcamentoAtualizado.id ? orcamentoAtualizado : o));
      setOrcamentoSelecionado(orcamentoAtualizado);
      
      // Limpar formulário
      setProdutoSelecionado(null);
      setQuantidadeAdicionar('');
      setTamanhoSelecionado('');
      setObservacaoNovoItem('');
      setBuscaProduto('');
      setModoAdicao(false);
      
      toast({ title: 'Produto adicionado!', description: produtoSelecionado.nome });
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({ title: 'Erro ao adicionar', variant: 'destructive' });
    } finally {
      setAdicionandoProduto(false);
    }
  };

  // Imprimir cupom do orçamento
  const handleImprimirOrcamento = (orcamento: Orcamento) => {
    if (!config) return;
    
    const orcamentoCompleto: OrcamentoCompleto = {
      ...orcamento,
      cliente: {
        ...orcamento.cliente,
        cpfCnpj: null,
        tipoPessoa: 'CPF',
        endereco: orcamento.cliente.endereco || null,
        bairro: orcamento.cliente.bairro || null,
      },
      itens: orcamento.itens.map(item => ({
        ...item,
        observacao: item.observacao || null,
      })),
      observacoes: orcamento.observacoes || null,
      horarioEntrega: orcamento.horarioEntrega || null,
      enderecoEntrega: orcamento.enderecoEntrega || null,
      bairroEntrega: orcamento.bairroEntrega || null,
    };
    
    const cupom = gerarCupomOrcamento(orcamentoCompleto, config);
    imprimirViaDialogo(cupom, `Orçamento #${formatarNumeroPedido(orcamento.numero)}`);
    
    toast({
      title: 'Impressão iniciada!',
      description: `Cupom do orçamento enviado para impressão.`,
    });
  };

  // Enviar orçamento via WhatsApp
  const handleEnviarWhatsApp = (orcamento: Orcamento) => {
    const telefone = orcamento.cliente.telefone.replace(/\D/g, '');
    const telefoneCompleto = telefone.length === 11 ? `55${telefone}` : telefone;
    
    // Montar mensagem com português correto
    let mensagem = `*Padaria e Confeitaria Paula*\n\n`;
    mensagem += `Olá, *${orcamento.cliente.nome}*! Tudo bem?\n\n`;
    mensagem += `Preparamos um orçamento especial para você:\n`;
    mensagem += `*Orçamento #${orcamento.numero.toString().padStart(4, '0')}*\n\n`;
    
    // Itens
    mensagem += `*Itens:*\n`;
    orcamento.itens.forEach(item => {
      const qtd = item.quantidade % 1 === 0
        ? item.quantidade.toString()
        : item.quantidade.toFixed(2).replace('.', ',');
      const tipo = item.produto.tipoVenda === 'KG' ? 'kg' : 'un';
      mensagem += `• ${item.produto.nome}${item.tamanho ? ` (${item.tamanho})` : ''} - ${qtd} ${tipo === 'kg' ? 'kg' : 'unidades'} = R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n`;
      if (item.observacao) {
        mensagem += `  _${item.observacao}_\n`;
      }
    });
    
    mensagem += `\n*Total: R$ ${orcamento.total.toFixed(2).replace('.', ',')}*\n\n`;
    
    // Entrega
    mensagem += `*Entrega:* ${formatarDataEntrega(orcamento.dataEntrega)}`;
    if (orcamento.horarioEntrega) {
      mensagem += ` às ${orcamento.horarioEntrega}`;
    }
    mensagem += `\n`;
    
    if (orcamento.tipoEntrega === 'RETIRA') {
      mensagem += `Retirada no local\n`;
    } else {
      mensagem += `Tele Entrega`;
      if (orcamento.enderecoEntrega) {
        mensagem += `\n${orcamento.enderecoEntrega}`;
        if (orcamento.bairroEntrega) {
          mensagem += ` - ${orcamento.bairroEntrega}`;
        }
      }
      mensagem += `\n`;
    }
    
    if (orcamento.observacoes) {
      mensagem += `\nObs: ${orcamento.observacoes}\n`;
    }
    
    mensagem += `\nAguardamos sua aprovação! Se precisar de qualquer alteração, é só nos chamar. Obrigada pela preferência!`;
    
    const mensagemCodificada = encodeURIComponent(mensagem);
    window.open(`https://wa.me/${telefoneCompleto}?text=${mensagemCodificada}`, '_blank');
  };

  // Aprovar orçamento e converter para pedido
  const handleAprovar = async (orcamento: Orcamento) => {
    setProcessando(true);
    try {
      const res = await fetch('/api/orcamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orcamento.id,
          status: 'APROVADO',
          converterParaPedido: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao aprovar orçamento');
      }

      toast({
        title: 'Orçamento aprovado!',
        description: `Pedido #${data.pedido.numero.toString().padStart(4, '0')} criado com sucesso.`,
      });

      // Remover da lista local
      setOrcamentos(prev => prev.filter(o => o.id !== orcamento.id));
      setDialogOpen(false);
      
      // Direcionar para histórico
      const { setTela } = useAppStore.getState();
      setTela('historico');
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: 'Erro ao aprovar',
        description: error instanceof Error ? error.message : 'Não foi possível aprovar o orçamento.',
        variant: 'destructive',
      });
    } finally {
      setProcessando(false);
    }
  };

  // Rejeitar orçamento
  const handleRejeitar = async (orcamento: Orcamento) => {
    setProcessando(true);
    try {
      const res = await fetch('/api/orcamentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orcamento.id,
          status: 'REJEITADO',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao rejeitar orçamento');
      }

      toast({
        title: 'Orçamento rejeitado',
        description: `Orçamento #${orcamento.numero.toString().padStart(4, '0')} foi rejeitado.`,
      });

      // Atualizar lista local
      setOrcamentos(prev => prev.filter(o => o.id !== orcamento.id));
      setDialogOpen(false);
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: 'Erro ao rejeitar',
        description: 'Não foi possível rejeitar o orçamento.',
        variant: 'destructive',
      });
    } finally {
      setProcessando(false);
    }
  };

  // Confirmar exclusão
  const handleConfirmarExclusao = (orcamento: Orcamento) => {
    setOrcamentoParaExcluir(orcamento);
    setDialogExcluirOpen(true);
  };

  // Excluir orçamento
  const handleExcluir = async () => {
    if (!orcamentoParaExcluir) return;

    try {
      const res = await fetch(`/api/orcamentos?id=${orcamentoParaExcluir.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir');
      }

      toast({
        title: 'Orçamento excluído!',
        description: 'O orçamento foi removido com sucesso.',
      });

      setOrcamentos(prev => prev.filter(o => o.id !== orcamentoParaExcluir.id));
      setOrcamentoParaExcluir(null);
      setDialogExcluirOpen(false);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o orçamento.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filtros */}
      <Card className="card-padaria">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Orçamentos
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
            <Button variant="outline" size="sm" onClick={carregarOrcamentos} className="h-10">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs de status */}
          <Tabs value={statusFiltro} onValueChange={setStatusFiltro} className="mt-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="PENDENTE">Pendentes</TabsTrigger>
              <TabsTrigger value="APROVADO">Aprovados</TabsTrigger>
              <TabsTrigger value="REJEITADO">Rejeitados</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lista de Orçamentos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-2 pr-2">
            {orcamentosFiltrados.length === 0 ? (
              <Card className="p-8 text-center card-padaria">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
              </Card>
            ) : (
              orcamentosFiltrados.map((orcamento) => (
                <Card key={orcamento.id} className="card-padaria hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      {/* Info principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-base text-primary">
                            #{orcamento.numero.toString().padStart(4, '0')}
                          </span>
                          {getStatusBadge(orcamento.status)}
                          <Badge variant="outline" className="text-[10px]">
                            {orcamento.tipoEntrega === 'RETIRA' ? (
                              <><Store className="w-3 h-3 mr-1" />Retira</>
                            ) : (
                              <><Truck className="w-3 h-3 mr-1" />Entrega</>
                            )}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm">{orcamento.cliente.nome}</p>
                        <p className="text-xs text-muted-foreground">{orcamento.cliente.telefone}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatarDataEntrega(orcamento.dataEntrega)}</span>
                          {orcamento.horarioEntrega && (
                            <>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>{orcamento.horarioEntrega}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Total e ações */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{orcamento.itens.length} itens</p>
                          <p className="font-bold text-primary">{formatarMoeda(orcamento.total)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVisualizar(orcamento)}
                            className="h-8 w-8 p-0"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleImprimirOrcamento(orcamento)}
                            className="h-8 w-8 p-0"
                            title="Imprimir orçamento"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {orcamento.status === 'PENDENTE' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAprovar(orcamento)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Aprovar e criar pedido"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejeitar(orcamento)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Rejeitar"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmarExclusao(orcamento)}
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

      {/* Dialog de detalhes - COMPACTO */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header compacto */}
          <DialogHeader className="p-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-bold">
                Orçamento #{orcamentoSelecionado?.numero.toString().padStart(4, '0')}
              </DialogTitle>
              {orcamentoSelecionado && getStatusBadge(orcamentoSelecionado.status)}
            </div>
          </DialogHeader>

          {orcamentoSelecionado && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Dados do cliente + Entrega em grid compacto */}
              <div className="grid grid-cols-2 gap-2">
                {/* Cliente */}
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="font-semibold text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium text-sm truncate">{orcamentoSelecionado.cliente.nome}</p>
                  <p className="text-xs text-muted-foreground">{orcamentoSelecionado.cliente.telefone}</p>
                </div>
                {/* Entrega com ícone para alterar */}
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {orcamentoSelecionado.tipoEntrega === 'RETIRA' ? (
                        <><Store className="w-3 h-3 text-primary" /><span className="text-xs font-medium">Retira</span></>
                      ) : (
                        <><Truck className="w-3 h-3 text-primary" /><span className="text-xs font-medium">Entrega</span></>
                      )}
                    </div>
                    {orcamentoSelecionado.status === 'PENDENTE' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                        onClick={() => handleAbrirEdicaoEntrega(orcamentoSelecionado)}
                        title={`Editar dados de entrega`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {orcamentoSelecionado.dataEntrega && formatarDataEntrega(orcamentoSelecionado.dataEntrega)}
                    {orcamentoSelecionado.horarioEntrega && ` ${orcamentoSelecionado.horarioEntrega}`}
                  </div>
                </div>
              </div>

              {/* Endereço se tele-entrega */}
              {orcamentoSelecionado.tipoEntrega === 'TELE_ENTREGA' && orcamentoSelecionado.enderecoEntrega && (
                <div className="bg-muted/30 rounded-lg p-2 flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="text-xs">{orcamentoSelecionado.enderecoEntrega}{orcamentoSelecionado.bairroEntrega && ` - ${orcamentoSelecionado.bairroEntrega}`}</span>
                </div>
              )}

              {/* Itens */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">Itens ({orcamentoSelecionado.itens.length})</h4>
                  {orcamentoSelecionado.status === 'PENDENTE' && (
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => setDialogEdicaoOpen(true)} className="h-6 px-1.5 text-[10px]">
                        <Edit2 className="w-2.5 h-2.5 mr-0.5" />Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDialogAdicaoOpen(true)} className="h-6 px-1.5 text-[10px]">
                        <Plus className="w-2.5 h-2.5 mr-0.5" />Adicionar
                      </Button>
                    </div>
                  )}
                </div>
                <div className="bg-muted/30 rounded-lg p-2 space-y-1 max-h-28 overflow-y-auto">
                  {orcamentoSelecionado.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0 gap-2">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-xs font-medium truncate">{item.produto.nome}{item.tamanho && <span className="text-primary ml-1">({item.tamanho})</span>}</p>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatarQuantidade(item.quantidade, item.produto.tipoVenda as 'KG' | 'UNIDADE')} × {formatarMoeda(item.valorUnit)}
                        </p>
                      </div>
                      <p className="text-xs font-semibold shrink-0">{formatarMoeda(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {orcamentoSelecionado.observacoes && (
                <div className="p-2 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground"><strong>Obs:</strong> {orcamentoSelecionado.observacoes}</p>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center font-bold pt-1 border-t border-border">
                <span className="text-sm">Total:</span>
                <span className="text-base text-primary">{formatarMoeda(orcamentoSelecionado.total)}</span>
              </div>
            </div>
          )}

          {/* Botões de ação - SEMPRE VISÍVEIS */}
          {orcamentoSelecionado && !modoEdicao && !modoAdicao && (
            <div className="shrink-0 p-3 border-t border-border space-y-1.5 bg-background">
              {/* Linha 1: WhatsApp e Impressão */}
              <div className="flex gap-1">
                <Button
                  onClick={() => handleEnviarWhatsApp(orcamentoSelecionado)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-[10px]"
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1" />Confirme o Orçamento pelo WhatsApp
                </Button>
                <Button
                  onClick={() => handleImprimirOrcamento(orcamentoSelecionado)}
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />Imprimir
                </Button>
              </div>
              {/* Linha 2: Aprovar/Rejeitar */}
              {orcamentoSelecionado.status === 'PENDENTE' && (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    onClick={() => handleRejeitar(orcamentoSelecionado)}
                    disabled={processando}
                    className="flex-1 h-8 text-xs text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />Rejeitar
                  </Button>
                  <Button
                    onClick={() => handleAprovar(orcamentoSelecionado)}
                    disabled={processando}
                    className="flex-1 h-8 btn-padaria text-xs"
                  >
                    {processando ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5 mr-1" />}Aprovar Orçamento
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={dialogExcluirOpen} onOpenChange={setDialogExcluirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o orçamento <strong>#{orcamentoParaExcluir?.numero.toString().padStart(4, '0')}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
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
              Ajuste as quantidades dos itens do orçamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-60 overflow-y-auto space-y-2 py-2">
            {orcamentoSelecionado?.itens.map((item) => (
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
                    step={item.produto.tipoVenda === 'KG' ? '0.1' : '1'}
                    min="0"
                    className="w-20 h-8 text-sm text-center"
                    value={itensEditados[item.id] !== undefined ? itensEditados[item.id] : item.quantidade.toString()}
                    onChange={(e) => handleEditarQuantidade(item.id, e.target.value)}
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
              disabled={processando}
              className="btn-padaria"
            >
              {processando ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar Orçamento
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
        <AlertDialogContent className="max-w-sm max-h-[75vh] overflow-hidden flex flex-col p-0">
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
            <div className="space-y-0.5 max-h-28 overflow-y-auto">
              {produtosFiltrados.map(produto => (
                <button
                  key={produto.id}
                  type="button"
                  onClick={() => setProdutoSelecionado(produto)}
                  className={`w-full px-2 py-1 text-left rounded transition-colors ${
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
                      {['P', 'M', 'G', 'GG']
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
                        {OPCOES_KG.map(op => (
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

      {/* Dialog de Edição de Entrega */}
      <Dialog open={dialogEntregaOpen} onOpenChange={setDialogEntregaOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Edit2 className="w-4 h-4" />
              Editar Dados de Entrega
            </DialogTitle>
            <DialogDescription className="text-xs">
              Altere o tipo, data e horário de entrega.
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
