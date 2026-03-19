'use client';

// ClientesLista - Padaria Paula
// Lista de clientes cadastrados com opção de criar orçamento

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, AlertTriangle, MapPin, MessageCircle, FileText, ChevronRight, Package } from 'lucide-react';
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
  status: string;
  dataEntrega: string;
  tipoEntrega: string;
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

  // Form state - dados do cliente
  const [formNome, setFormNome] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formCpfCnpj, setFormCpfCnpj] = useState('');
  const [formTipoPessoa, setFormTipoPessoa] = useState<'CPF' | 'CNPJ'>('CPF');
  const [formEndereco, setFormEndereco] = useState('');
  const [formBairro, setFormBairro] = useState('');

  // Carregar clientes
  useEffect(() => {
    carregarClientes();
  }, []);

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
                <button 
                  onClick={() => handleVerDetalhes(cliente)}
                  className="w-full text-left mb-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{cliente.nome}</h4>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  {cliente._count && cliente._count.pedidos > 0 && (
                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                      {cliente._count.pedidos} pedido{cliente._count.pedidos > 1 ? 's' : ''}
                    </Badge>
                  )}
                </button>
                
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
                  {/* Botão Orçamento */}
                  <Button
                    size="sm"
                    className="flex-1 btn-padaria h-9 text-xs"
                    onClick={() => handleNovoOrcamento(cliente)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Orçamento
                  </Button>
                  {/* Editar */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0"
                    onClick={() => handleEditar(cliente)}
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  {/* Excluir */}
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

      {/* Modal de detalhes do cliente */}
      <Dialog open={modalDetalhesOpen} onOpenChange={setModalDetalhesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{clienteDetalhes?.nome}</DialogTitle>
            <DialogDescription>
              Detalhes do cliente e histórico de pedidos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Dados do cliente */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span>{clienteDetalhes?.telefone}</span>
              </div>
              {clienteDetalhes?.cpfCnpj && (
                <div className="text-muted-foreground">
                  {clienteDetalhes.tipoPessoa || 'CPF'}: {clienteDetalhes.cpfCnpj}
                </div>
              )}
              {(clienteDetalhes?.endereco || clienteDetalhes?.bairro) && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Últimos Pedidos
              </h4>
              
              {loadingPedidos ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
              ) : pedidosCliente.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido encontrado</p>
              ) : (
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {pedidosCliente.map((pedido) => (
                      <div key={pedido.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm">
                        <div>
                          <div className="font-medium">#{pedido.numero.toString().padStart(4, '0')}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(pedido.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary">{formatarMoeda(pedido.total)}</div>
                          <Badge className={`text-[10px] ${corStatus(pedido.status)}`}>
                            {formatarStatus(pedido.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModalDetalhesOpen(false)}
              >
                Fechar
              </Button>
              <Button
                className="flex-1 btn-padaria"
                onClick={() => {
                  if (clienteDetalhes) {
                    handleNovoOrcamento(clienteDetalhes);
                    setModalDetalhesOpen(false);
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Novo Orçamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
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
                autoComplete="off"
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
    </div>
  );
}
