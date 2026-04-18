'use client';

// ClientesLista - Padaria Paula
// Lista de clientes cadastrados com opção de criar orçamento

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Edit, Trash2, AlertTriangle, MapPin, MessageCircle, FileText, ChevronRight, Package, Eye, Clock, Calendar, Truck, Store, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { useOrcamentoStore } from '@/store/useOrcamentoStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda } from '@/store/usePedidoStore';
import {
  gerarCupomCliente,
  gerarCupomCozinhaGrande,
  imprimirViaDialogo,
  formatarNumeroPedido
} from '@/lib/escpos';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  cpfCnpj: string | null;
  tipoPessoa: string | null;
  endereco: string | null;
  bairro: string | null;
  createdAt: string;
  _count?: { pedidos: number };
}

interface PedidoCliente {
  id: string;
  numero: number;
  createdAt: string;
  total: number;
  totalPedida: number;
  status: string;
  dataEntrega: string;
  horarioEntrega: string | null;
  tipoEntrega: string;
  enderecoEntrega: string | null;
  bairroEntrega: string | null;
  observacoes: string | null;
  cliente: {
    nome: string;
    telefone: string;
    cpfCnpj?: string | null;
    tipoPessoa?: string;
    endereco?: string | null;
    bairro?: string | null;
  };
  itens: {
    id: string;
    produto: {
      nome: string;
      tipoVenda: string;
    };
    quantidade: number;
    quantidadePedida: number;
    valorUnit: number;
    subtotal: number;
    observacao?: string | null;
    tamanho?: string | null;
  }[];
}

export default function ClientesLista() {
  const { setCliente: setClienteOrcamento } = useOrcamentoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Estado para modal de detalhes do cliente
  const [clienteDetalhes, setClienteDetalhes] = useState<Cliente | null>(null);
  const [pedidosCliente, setPedidosCliente] = useState<PedidoCliente[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  
  // Estado para modal de detalhes do pedido
  const [pedidoDetalhes, setPedidoDetalhes] = useState<PedidoCliente | null>(null);
  const [modalPedidoDetalhesOpen, setModalPedidoDetalhesOpen] = useState(false);
  const [config, setConfig] = useState<{ nomeLoja: string; endereco: string; telefone: string; cnpj: string } | null>(null);

  // Form state - dados do cliente
  const [formNome, setFormNome] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formCpfCnpj, setFormCpfCnpj] = useState('');
  const [formTipoPessoa, setFormTipoPessoa] = useState<'CPF' | 'CNPJ'>('CPF');
  const [formEndereco, setFormEndereco] = useState('');
  const [formBairro, setFormBairro] = useState('');

  // PIN para exclusão de cliente - senha admin necessária
  const [pinParaExcluir, setPinParaExcluir] = useState(['', '', '', '']);
  const [verificandoPin, setVerificandoPin] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Carregar clientes
  useEffect(() => {
    carregarClientes();
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    try {
      const res = await fetch('/api/configuracao');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const carregarClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      const data = await response.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de clientes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar pedidos do cliente
  const carregarPedidosCliente = async (clienteId: string) => {
    setLoadingPedidos(true);
    try {
      const response = await fetch(`/api/pedidos?clienteId=${clienteId}&limite=10`);
      const data = await response.json();
      setPedidosCliente(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidosCliente([]);
    } finally {
      setLoadingPedidos(false);
    }
  };

  // Abrir detalhes do cliente
  const handleVerDetalhes = (cliente: Cliente) => {
    setClienteDetalhes(cliente);
    setModalDetalhesOpen(true);
    carregarPedidosCliente(cliente.id);
  };

  // Ver detalhes do pedido
  const handleVerPedidoDetalhes = async (pedidoId: string) => {
    try {
      const response = await fetch(`/api/pedidos?id=${pedidoId}`);
      const data = await response.json();
      setPedidoDetalhes(data);
      setModalPedidoDetalhesOpen(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do pedido.',
        variant: 'destructive',
      });
    }
  };

  // Imprimir cupom do pedido
  const handleImprimirCupom = (pedido: PedidoCliente) => {
    if (!config) return;
    
    const cupom = gerarCupomCliente(pedido as Parameters<typeof gerarCupomCliente>[0], config);
    imprimirViaDialogo(cupom, `Cupom Cliente #${formatarNumeroPedido(pedido.numero)}`);
  };

  // Imprimir comanda da cozinha
  const handleImprimirComanda = (pedido: PedidoCliente) => {
    if (!config) return;
    
    const cupom = gerarCupomCozinhaGrande(pedido as Parameters<typeof gerarCupomCozinhaGrande>[0], config);
    imprimirViaDialogo(cupom, `Comanda Cozinha #${formatarNumeroPedido(pedido.numero)}`);
  };

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    if (!Array.isArray(clientes)) return [];
    if (!busca) return clientes;
    const termo = busca.toLowerCase();
    return clientes.filter(c => 
      c.nome.toLowerCase().includes(termo) ||
      c.telefone.includes(termo)
    );
  }, [clientes, busca]);

  // Iniciar novo orçamento para cliente
  const handleNovoOrcamento = (cliente: Cliente) => {
    setClienteOrcamento({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone,
      cpfCnpj: cliente.cpfCnpj || '',
      tipoPessoa: (cliente.tipoPessoa as 'CPF' | 'CNPJ') || 'CPF',
      endereco: cliente.endereco,
      bairro: cliente.bairro,
    });
    
    toast({
      title: 'Cliente selecionado',
      description: `Iniciando orçamento para ${cliente.nome}`,
    });
    
    setTela('novo-orcamento');
  };

  // Abrir modal de edição
  const handleEditar = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setFormNome(cliente.nome);
    setFormTelefone(cliente.telefone);
    setFormCpfCnpj(cliente.cpfCnpj || '');
    setFormTipoPessoa((cliente.tipoPessoa as 'CPF' | 'CNPJ') || 'CPF');
    setFormEndereco(cliente.endereco || '');
    setFormBairro(cliente.bairro || '');
    setModalAberto(true);
  };

  // Formatar telefone
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  // Formatar CPF
  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
  };

  // Formatar CNPJ
  const formatarCNPJ = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
    if (numeros.length <= 8) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
    if (numeros.length <= 12) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`;
  };

  // Handler para troca de tipo de pessoa
  const handleTrocarTipoPessoa = (isCNPJ: boolean) => {
    const novoTipo = isCNPJ ? 'CNPJ' : 'CPF';
    setFormTipoPessoa(novoTipo);
    setFormCpfCnpj('');
  };

  // Salvar edição
  const handleSalvar = async () => {
    if (!formNome || !formTelefone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e telefone.',
        variant: 'destructive',
      });
      return;
    }

    setSalvando(true);

    try {
      const response = await fetch('/api/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clienteEditando?.id,
          nome: formNome,
          telefone: formTelefone,
          cpfCnpj: formCpfCnpj || null,
          tipoPessoa: formTipoPessoa,
          endereco: formEndereco || null,
          bairro: formBairro || null,
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { error: responseText || 'Erro desconhecido' };
      }

      if (!response.ok) {
        toast({
          title: 'Erro ao atualizar',
          description: data.error || `Erro ${response.status}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Cliente atualizado!',
        description: 'Dados salvos com sucesso.',
      });

      setModalAberto(false);
      carregarClientes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o cliente.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  // Novo cliente
  const handleNovoCliente = () => {
    setClienteEditando(null);
    setFormNome('');
    setFormTelefone('');
    setFormCpfCnpj('');
    setFormTipoPessoa('CPF');
    setFormEndereco('');
    setFormBairro('');
    setModalAberto(true);
  };

  // Criar novo cliente
  const handleCriarNovo = async () => {
    if (!formNome || !formTelefone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e telefone.',
        variant: 'destructive',
      });
      return;
    }

    setSalvando(true);

    try {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formNome,
          telefone: formTelefone,
          cpfCnpj: formCpfCnpj || null,
          tipoPessoa: formTipoPessoa,
          endereco: formEndereco || null,
          bairro: formBairro || null,
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { error: responseText || 'Erro desconhecido' };
      }

      if (!response.ok) {
        toast({
          title: 'Erro ao criar',
          description: data.error || `Erro ${response.status}`,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Cliente criado!',
        description: 'Cliente cadastrado com sucesso.',
      });

      setModalAberto(false);
      setBusca('');
      carregarClientes();
    } catch (error) {
      console.error('Erro ao criar:', error);
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível cadastrar o cliente.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  // Abrir diálogo de exclusão
  const handleConfirmarExclusao = (cliente: Cliente) => {
    setClienteParaExcluir(cliente);
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

  // Excluir cliente com verificação de PIN Admin
  const handleExcluirCliente = async () => {
    if (!clienteParaExcluir) return;

    const senha = pinParaExcluir.join('');
    if (senha.length !== 4) {
      toast({
        title: 'PIN incompleto',
        description: 'Digite os 4 dígitos da senha Admin.',
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
          title: 'Senha incorreta',
          description: 'A senha Admin digitada está incorreta.',
          variant: 'destructive',
        });
        setVerificandoPin(false);
        setPinParaExcluir(['', '', '', '']);
        pinInputRefs.current[0]?.focus();
        return;
      }

      // PIN correto, excluir cliente
      const response = await fetch(`/api/clientes?id=${clienteParaExcluir.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Não foi possível excluir',
          description: data.error || 'Erro ao excluir cliente.',
          variant: 'destructive',
        });
        setDialogExcluirOpen(false);
        setVerificandoPin(false);
        return;
      }

      setClientes(clientes.filter(c => c.id !== clienteParaExcluir.id));
      setClienteParaExcluir(null);
      setDialogExcluirOpen(false);

      toast({
        title: 'Cliente excluído!',
        description: 'O cliente foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o cliente.',
        variant: 'destructive',
      });
    } finally {
      setVerificandoPin(false);
    }
  };

  // Formatar status
  const formatarStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'EM_PRODUCAO': 'Em Produção',
      'PRONTO': 'Pronto',
      'ENTREGUE': 'Entregue',
    };
    return statusMap[status] || status;
  };

  // Cor do status
  const corStatus = (status: string) => {
    const cores: Record<string, string> = {
      'PENDENTE': 'bg-yellow-100 text-yellow-800',
      'EM_PRODUCAO': 'bg-blue-100 text-blue-800',
      'PRONTO': 'bg-green-100 text-green-800',
      'ENTREGUE': 'bg-gray-100 text-gray-800',
    };
    return cores[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="input-padaria pl-9 h-9 text-sm"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Button onClick={handleNovoCliente} className="btn-padaria h-9">
          <Plus className="w-4 h-4 mr-1" />
          Novo
        </Button>
      </div>

      {/* Lista de clientes */}
      <ScrollArea className="h-[calc(100vh-180px)] pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="card-padaria hover:shadow-md transition-shadow">
              <CardContent className="p-2">
                {/* Dados do cliente */}
                <div 
                  onClick={() => handleVerDetalhes(cliente)}
                  className="cursor-pointer mb-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs truncate">{cliente.nome}</h4>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </div>
                  {cliente._count && cliente._count.pedidos > 0 && (
                    <Badge variant="secondary" className="text-[10px] mt-0.5 h-4 px-1">
                      {cliente._count.pedidos} ped
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-0.5 text-[10px] text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-green-600" />
                    <span className="truncate">{cliente.telefone}</span>
                  </div>
                  {cliente.cpfCnpj && (
                    <div className="truncate">
                      {cliente.tipoPessoa || 'CPF'}: {cliente.cpfCnpj}
                    </div>
                  )}
                  {(cliente.endereco || cliente.bairro) && (
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {cliente.endereco}{cliente.bairro && cliente.endereco && ', '}{cliente.bairro}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="flex-1 btn-padaria h-7 text-[10px]"
                    onClick={() => handleNovoOrcamento(cliente)}
                  >
                    <FileText className="w-3 h-3 mr-0.5" />
                    Orçamento
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleEditar(cliente)}
                    title="Editar"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleConfirmarExclusao(cliente)}
                    title="Excluir"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clientesFiltrados.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>Nenhum cliente encontrado</p>
          </div>
        )}
      </ScrollArea>

      {/* Modal de detalhes do cliente */}
      <Dialog open={modalDetalhesOpen} onOpenChange={setModalDetalhesOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-3 border-b border-border shrink-0">
            <DialogTitle className="text-base">{clienteDetalhes?.nome}</DialogTitle>
            <DialogDescription className="text-xs">
              Detalhes e histórico de pedidos
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Dados do cliente */}
            <div className="space-y-0.5 text-xs">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                <span>{clienteDetalhes?.telefone}</span>
              </div>
              {clienteDetalhes?.cpfCnpj && (
                <div className="text-muted-foreground">
                  {clienteDetalhes.tipoPessoa || 'CPF'}: {clienteDetalhes.cpfCnpj}
                </div>
              )}
              {(clienteDetalhes?.endereco || clienteDetalhes?.bairro) && (
                <div className="flex items-start gap-1.5 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    {clienteDetalhes?.endereco}
                    {clienteDetalhes?.bairro && clienteDetalhes?.endereco && ', '}
                    {clienteDetalhes?.bairro}
                  </span>
                </div>
              )}
            </div>

            {/* Histórico de pedidos */}
            <div>
              <h4 className="font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Últimos Pedidos
              </h4>
              
              {loadingPedidos ? (
                <p className="text-xs text-muted-foreground text-center py-2">Carregando...</p>
              ) : pedidosCliente.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum pedido</p>
              ) : (
                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {pedidosCliente.map((pedido) => (
                      <div key={pedido.id} className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-xs">
                        <div className="flex-1">
                          <div className="font-medium">#{pedido.numero.toString().padStart(4, '0')}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="text-right">
                            <div className="font-semibold text-primary">{formatarMoeda(pedido.total)}</div>
                            <Badge className={`text-[10px] h-4 ${corStatus(pedido.status)}`}>
                              {formatarStatus(pedido.status)}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleVerPedidoDetalhes(pedido.id)}
                            title="Ver"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setModalDetalhesOpen(false)}
              >
                Fechar
              </Button>
              <Button
                size="sm"
                className="flex-1 btn-padaria h-8 text-xs"
                onClick={() => {
                  if (clienteDetalhes) {
                    handleNovoOrcamento(clienteDetalhes);
                    setModalDetalhesOpen(false);
                  }
                }}
              >
                <FileText className="w-3 h-3 mr-1" />
                Novo Orçamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edição/criação */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-3 border-b border-border shrink-0">
            <DialogTitle className="text-base">
              {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {clienteEditando ? 'Atualize os dados' : 'Preencha os dados'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="space-y-1">
              <Label htmlFor="nome" className="text-xs">Nome *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome completo"
                className="input-padaria h-9 text-sm"
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="telefone" className="text-xs flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-green-600" />
                WhatsApp *
              </Label>
              <Input
                id="telefone"
                value={formTelefone}
                onChange={(e) => setFormTelefone(formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="input-padaria h-9 text-sm"
                maxLength={15}
                autoComplete="off"
              />
            </div>
            
            {/* CPF/CNPJ com Switch */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  {formTipoPessoa === 'CPF' ? 'CPF' : 'CNPJ'}
                </Label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">CPF</span>
                  <Switch
                    checked={formTipoPessoa === 'CNPJ'}
                    onCheckedChange={handleTrocarTipoPessoa}
                    className="h-4 w-7"
                  />
                  <span className="text-[10px] text-muted-foreground">CNPJ</span>
                </div>
              </div>
              <Input
                id="cpfCnpj"
                value={formCpfCnpj}
                onChange={(e) => {
                  const formatado = formTipoPessoa === 'CPF' 
                    ? formatarCPF(e.target.value) 
                    : formatarCNPJ(e.target.value);
                  setFormCpfCnpj(formatado);
                }}
                placeholder={formTipoPessoa === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                className="input-padaria h-9 text-sm"
                maxLength={formTipoPessoa === 'CPF' ? 14 : 18}
                autoComplete="off"
              />
            </div>
            
            {/* Endereço e Bairro */}
            <div className="space-y-1">
              <Label htmlFor="endereco" className="text-xs">Endereço</Label>
              <Input
                id="endereco"
                value={formEndereco}
                onChange={(e) => setFormEndereco(e.target.value)}
                placeholder="Rua, número"
                className="input-padaria h-9 text-sm"
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="bairro" className="text-xs">Bairro</Label>
              <Input
                id="bairro"
                value={formBairro}
                onChange={(e) => setFormBairro(e.target.value)}
                placeholder="Bairro"
                className="input-padaria h-9 text-sm"
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="flex gap-1.5 p-3 border-t border-border shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs"
              onClick={() => setModalAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1 btn-padaria h-9 text-xs"
              onClick={clienteEditando ? handleSalvar : handleCriarNovo}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão com PIN Admin */}
      <AlertDialog open={dialogExcluirOpen} onOpenChange={setDialogExcluirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para excluir o cliente <strong>{clienteParaExcluir?.nome}</strong>, digite a senha Admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* PIN Input */}
          <div className="flex justify-center gap-2 py-4">
            {[0, 1, 2, 3].map((index) => (
              <Input
                key={index}
                ref={(el) => { pinInputRefs.current[index] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={pinParaExcluir[index]}
                onChange={(e) => handlePinInputChange(index, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(index, e)}
                onPaste={index === 0 ? handlePinPaste : undefined}
                className="w-12 h-14 text-center text-xl font-bold"
                disabled={verificandoPin}
              />
            ))}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={verificandoPin}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirCliente}
              disabled={verificandoPin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

      {/* Modal de detalhes do pedido */}
      <Dialog open={modalPedidoDetalhesOpen} onOpenChange={setModalPedidoDetalhesOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-3 border-b border-border shrink-0">
            <DialogTitle className="flex items-center gap-1.5 text-base">
              <Package className="w-4 h-4" />
              Pedido #{pedidoDetalhes && formatarNumeroPedido(pedidoDetalhes.numero)}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {pedidoDetalhes && new Date(pedidoDetalhes.createdAt).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          
          {pedidoDetalhes && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Status e tipo de entrega */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className={`text-[10px] h-5 ${corStatus(pedidoDetalhes.status)}`}>
                  {formatarStatus(pedidoDetalhes.status)}
                </Badge>
                <Badge variant="outline" className="text-[10px] h-5">
                  {pedidoDetalhes.tipoEntrega === 'RETIRA' ? (
                    <><Store className="w-3 h-3 mr-0.5" />Retira</>
                  ) : (
                    <><Truck className="w-3 h-3 mr-0.5" />Entrega</>
                  )}
                </Badge>
              </div>

              {/* Dados de entrega */}
              <div className="bg-muted/30 rounded-lg p-1.5 text-[10px] space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(pedidoDetalhes.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  {pedidoDetalhes.horarioEntrega && (
                    <>
                      <Clock className="w-3 h-3 ml-1" />
                      <span>{pedidoDetalhes.horarioEntrega}</span>
                    </>
                  )}
                </div>
                {pedidoDetalhes.tipoEntrega === 'TELE_ENTREGA' && pedidoDetalhes.enderecoEntrega && (
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5" />
                    <span>{pedidoDetalhes.enderecoEntrega}{pedidoDetalhes.bairroEntrega && ` - ${pedidoDetalhes.bairroEntrega}`}</span>
                  </div>
                )}
              </div>

              {/* Itens */}
              <div>
                <h4 className="font-semibold text-xs mb-1">Itens</h4>
                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                  {pedidoDetalhes.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-0.5 border-b border-border/30 text-xs">
                      <div>
                        <span className="font-medium">{item.produto.nome}</span>
                        {item.tamanho && <span className="text-primary ml-1">({item.tamanho})</span>}
                        <p className="text-[10px] text-muted-foreground">
                          {item.quantidade}{item.produto.tipoVenda === 'KG' ? 'kg' : 'un'} × {formatarMoeda(item.valorUnit)}
                          {item.observacao && <span className="text-primary italic ml-1">({item.observacao})</span>}
                        </p>
                      </div>
                      <span className="font-semibold">{formatarMoeda(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-border">
                <span>Total:</span>
                <span className="text-primary">{formatarMoeda(pedidoDetalhes.total)}</span>
              </div>

              {/* Botões de impressão */}
              <div className="flex gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleImprimirCupom(pedidoDetalhes)}
                >
                  <FileText className="w-3 h-3 mr-0.5" />
                  Cupom
                </Button>
                <Button
                  size="sm"
                  className="flex-1 btn-padaria h-8 text-xs"
                  onClick={() => handleImprimirComanda(pedidoDetalhes)}
                >
                  <Package className="w-3 h-3 mr-0.5" />
                  Comanda
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
