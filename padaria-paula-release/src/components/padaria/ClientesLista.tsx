'use client';

// ClientesLista - Padaria Paula
// Lista de clientes cadastrados com opção de criar pedido e ver histórico

import { useState, useEffect, useMemo } from 'react';
import { Search, Phone, ShoppingBag, Plus, Edit, Trash2, AlertTriangle, MapPin, MessageCircle, FileText, History, Printer, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
import { usePedidoStore } from '@/store/usePedidoStore';
import { useOrcamentoStore } from '@/store/useOrcamentoStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
import {
  gerarCupomCliente,
  imprimirViaDialogo,
  formatarNumeroPedido,
  type ConfiguracaoCupom,
  type PedidoCompleto,
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

export default function ClientesLista() {
  const { setCliente } = usePedidoStore();
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

  // Configuração para mensagem WhatsApp
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState<string>('Olá {nome}! Como posso ajudar?');

  // Estados do histórico do cliente
  const [dialogHistoricoOpen, setDialogHistoricoOpen] = useState(false);
  const [clienteHistorico, setClienteHistorico] = useState<Cliente | null>(null);
  const [pedidosHistorico, setPedidosHistorico] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [config, setConfig] = useState<ConfiguracaoCupom | null>(null);

  // Form state - dados do cliente
  const [formNome, setFormNome] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formCpfCnpj, setFormCpfCnpj] = useState('');
  const [formTipoPessoa, setFormTipoPessoa] = useState<'CPF' | 'CNPJ'>('CPF');
  const [formEndereco, setFormEndereco] = useState('');
  const [formBairro, setFormBairro] = useState('');

  // Carregar configurações
  useEffect(() => {
    fetch('/api/configuracao')
      .then(res => res.json())
      .then(data => {
        if (data.mensagemWhatsApp) {
          setMensagemWhatsApp(data.mensagemWhatsApp);
        }
        setConfig(data);
      })
      .catch(console.error);
  }, []);

  // Carregar clientes
  useEffect(() => {
    carregarClientes();
  }, []);

  // Abrir WhatsApp
  const handleAbrirWhatsApp = (cliente: Cliente) => {
    const telefone = cliente.telefone.replace(/\D/g, '');
    const telefoneCompleto = telefone.length === 11 ? `55${telefone}` : telefone;

    let mensagem = mensagemWhatsApp;
    mensagem = mensagem.replace('{nome}', cliente.nome);

    const mensagemCodificada = encodeURIComponent(mensagem);
    window.open(`https://wa.me/${telefoneCompleto}?text=${mensagemCodificada}`, '_blank');
  };

  const carregarClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      const data = await response.json();
      // Garantir que seja um array
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

  // Iniciar novo pedido para cliente - seleciona cliente e vai para tela de novo pedido
  const handleNovoPedido = (cliente: Cliente) => {
    // Salva os dados do cliente incluindo endereço
    setCliente({
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
      description: `Iniciando pedido para ${cliente.nome}`,
    });
    
    // Vai para tela de novo pedido para preencher dados de entrega
    setTela('novo-pedido');
  };

  // Iniciar novo orçamento para cliente
  const handleNovoOrcamento = (cliente: Cliente) => {
    // Salva os dados do cliente
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
    
    // Vai para tela de novo orçamento
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
    setDialogExcluirOpen(true);
  };

  // Excluir cliente
  const handleExcluirCliente = async () => {
    if (!clienteParaExcluir) return;

    try {
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
    }
  };

  // Abrir histórico do cliente
  const handleVerHistorico = async (cliente: Cliente) => {
    setClienteHistorico(cliente);
    setDialogHistoricoOpen(true);
    setLoadingHistorico(true);
    
    try {
      const res = await fetch(`/api/pedidos?clienteId=${cliente.id}`);
      const data = await res.json();
      setPedidosHistorico(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setPedidosHistorico([]);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico.',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Reimprimir cupom do pedido
  const handleReimprimirCupom = (pedido: any) => {
    if (!config) return;
    
    const pedidoCompleto: PedidoCompleto = {
      id: pedido.id,
      numero: pedido.numero,
      createdAt: pedido.createdAt,
      clienteId: pedido.clienteId,
      observacoes: pedido.observacoes || null,
      total: pedido.total,
      totalPedida: pedido.totalPedida || 0,
      status: pedido.status || 'PENDENTE',
      impresso: pedido.impresso || false,
      tipoEntrega: pedido.tipoEntrega || 'RETIRA',
      dataEntrega: pedido.dataEntrega,
      horarioEntrega: pedido.horarioEntrega || null,
      enderecoEntrega: pedido.enderecoEntrega || null,
      bairroEntrega: pedido.bairroEntrega || null,
      cliente: {
        nome: pedido.cliente?.nome || clienteHistorico?.nome || 'Cliente',
        telefone: pedido.cliente?.telefone || clienteHistorico?.telefone || '',
        cpfCnpj: pedido.cliente?.cpfCnpj || null,
        tipoPessoa: pedido.cliente?.tipoPessoa || 'CPF',
        endereco: pedido.cliente?.endereco || null,
        bairro: pedido.cliente?.bairro || null,
      },
      itens: (pedido.itens || []).map((item: any) => ({
        produto: {
          nome: item.produto?.nome || 'Produto',
          tipoVenda: item.produto?.tipoVenda || 'UNIDADE',
        },
        quantidade: item.quantidade,
        quantidadePedida: item.quantidadePedida || item.quantidade,
        valorUnit: item.valorUnit,
        subtotal: item.subtotal,
        subtotalPedida: item.subtotalPedida || item.subtotal,
        observacao: item.observacao || null,
      })),
    };
    
    const cupom = gerarCupomCliente(pedidoCompleto, config);
    imprimirViaDialogo(cupom, `Pedido #${formatarNumeroPedido(pedido.numero)}`);
    
    toast({
      title: 'Impressão iniciada!',
      description: `Cupom do pedido #${formatarNumeroPedido(pedido.numero)} enviado.`,
    });
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
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome ou telefone..."
            className="input-padaria pl-10 h-11"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Button onClick={handleNovoCliente} className="btn-padaria h-11">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Lista de clientes */}
      <ScrollArea className="h-[calc(100vh-220px)] sm:h-[calc(100vh-200px)] pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="card-padaria hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                {/* Dados do cliente */}
                <div className="mb-2">
                  <h4 className="font-semibold text-sm">{cliente.nome}</h4>
                  {cliente._count && cliente._count.pedidos > 0 && (
                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                      {cliente._count.pedidos} pedido{cliente._count.pedidos > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-0.5 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-3 h-3 text-green-600" />
                    <span>{cliente.telefone}</span>
                  </div>
                  {cliente.cpfCnpj && (
                    <div className="text-xs">
                      {cliente.tipoPessoa || 'CPF'}: {cliente.cpfCnpj}
                    </div>
                  )}
                  {(cliente.endereco || cliente.bairro) && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">
                        {cliente.endereco}
                        {cliente.bairro && cliente.endereco && ', '}
                        {cliente.bairro}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-1.5">
                  {/* Botão Pedido - MAIOR */}
                  <Button
                    size="sm"
                    className="flex-[2] btn-padaria h-9 text-xs"
                    onClick={() => handleNovoPedido(cliente)}
                  >
                    <ShoppingBag className="w-4 h-4 mr-1" />
                    Pedido
                  </Button>
                  {/* Botão Orçamento - MENOR */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 text-xs"
                    onClick={() => handleNovoOrcamento(cliente)}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Orç.
                  </Button>
                  {/* Botões de ação */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0"
                    onClick={() => handleVerHistorico(cliente)}
                    title="Ver histórico"
                  >
                    <History className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 text-green-600 border-green-300 hover:bg-green-50"
                    onClick={() => handleAbrirWhatsApp(cliente)}
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0"
                    onClick={() => handleEditar(cliente)}
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleConfirmarExclusao(cliente)}
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clientesFiltrados.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhum cliente encontrado</p>
          </div>
        )}
      </ScrollArea>

      {/* Modal de edição/criação */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {clienteEditando ? 'Atualize os dados do cliente' : 'Preencha os dados do novo cliente'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome completo"
                className="input-padaria"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-green-600" />
                WhatsApp *
              </Label>
              <Input
                id="telefone"
                value={formTelefone}
                onChange={(e) => setFormTelefone(formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="input-padaria"
                maxLength={15}
              />
            </div>
            
            {/* CPF/CNPJ com Switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  {formTipoPessoa === 'CPF' ? 'CPF' : 'CNPJ'}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">CPF</span>
                  <Switch
                    checked={formTipoPessoa === 'CNPJ'}
                    onCheckedChange={handleTrocarTipoPessoa}
                  />
                  <span className="text-xs text-muted-foreground">CNPJ</span>
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
                className="input-padaria"
                maxLength={formTipoPessoa === 'CPF' ? 14 : 18}
              />
            </div>
            
            {/* Endereço e Bairro */}
            <div className="space-y-1.5">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formEndereco}
                onChange={(e) => setFormEndereco(e.target.value)}
                placeholder="Rua, número, complemento"
                className="input-padaria"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formBairro}
                onChange={(e) => setFormBairro(e.target.value)}
                placeholder="Nome do bairro"
                className="input-padaria"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setModalAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 btn-padaria"
              onClick={clienteEditando ? handleSalvar : handleCriarNovo}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={dialogExcluirOpen} onOpenChange={setDialogExcluirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{clienteParaExcluir?.nome}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirCliente}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog do Histórico do Cliente */}
      <Dialog open={dialogHistoricoOpen} onOpenChange={setDialogHistoricoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Pedidos
            </DialogTitle>
            <DialogDescription>
              {clienteHistorico?.nome} - {clienteHistorico?.telefone}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {loadingHistorico ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : pedidosHistorico.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="space-y-3 pr-2">

                  {pedidosHistorico.map((pedido) => (
                    <Card key={pedido.id} className="card-padaria">

                      <CardContent className="p-3">

                        {/* Header do Pedido */}

                        <div className="flex items-center justify-between mb-2">

                          <div className="flex items-center gap-2">

                            <span className="font-bold text-primary">

                              #{formatarNumeroPedido(pedido.numero)}

                            </span>

                            <Badge variant="secondary" className="text-xs">

                              {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}

                            </Badge>

                            {pedido.status && (

                              <Badge 

                                variant={pedido.status === 'ENTREGUE' ? 'default' : 'secondary'}

                                className={pedido.status === 'ENTREGUE' ? 'bg-green-600' : ''}

                              >

                                {pedido.status}

                              </Badge>

                            )}

                          </div>

                          <Button

                            variant="ghost"

                            size="sm"

                            className="h-8 w-8 p-0"

                            onClick={() => handleReimprimirCupom(pedido)}

                            title="Reimprimir cupom"

                          >

                            <Printer className="w-4 h-4" />

                          </Button>

                        </div>

                        {/* Tipo de Entrega */}
                        <div className="text-xs text-muted-foreground mb-2">
                          {pedido.tipoEntrega === 'TELE_ENTREGA' ? 'Tele Entrega' : 'Cliente Retira'}
                          {pedido.dataEntrega && ` - ${new Date(pedido.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                        </div>

                        {/* Itens */}
                        <div className="space-y-1">
                          {(pedido.itens || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {formatarQuantidade(item.quantidade, item.produto?.tipoVenda || 'UNIDADE')} {item.produto?.nome || 'Produto'}
                              </span>
                              <span>{formatarMoeda(item.subtotal)}</span>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-2" />

                        {/* Total */}
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-primary">{formatarMoeda(pedido.total)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
