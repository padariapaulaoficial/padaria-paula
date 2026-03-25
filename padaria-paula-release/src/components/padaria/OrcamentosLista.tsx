'use client';

// OrcamentosLista - Padaria Paula
// Lista de orçamentos com ações de aprovar/rejeitar e compartilhar

import { useState, useEffect, useRef } from 'react';
import { 
  Search, RefreshCw, Eye, Check, X, FileText, Calendar, Trash2,
  MapPin, Truck, Store, Clock, Package, ShoppingCart, Printer, Share2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
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
  const [compartilhando, setCompartilhando] = useState(false);
  const orcamentoRef = useRef<HTMLDivElement>(null);

  // Carregar configurações
  useEffect(() => {
    fetch('/api/configuracao')
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

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
    setDialogOpen(true);
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

  // Compartilhar orçamento via WhatsApp
  const handleCompartilharWhatsApp = async (orcamento: Orcamento) => {
    setCompartilhando(true);
    try {
      // Criar elemento temporário para gerar imagem
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 400px;
        padding: 20px;
        background: white;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      
      // Formatar data
      const dataFormatada = new Date(orcamento.createdAt).toLocaleDateString('pt-BR');
      const dataEntrega = orcamento.dataEntrega 
        ? new Date(orcamento.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR') 
        : '';
      
      // Gerar HTML do orçamento
      tempDiv.innerHTML = `
        <div style="font-family: system-ui, -apple-system, sans-serif;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 20px; font-weight: bold; margin: 0; color: #8B4513;">
              ${config?.nomeLoja || 'Padaria Paula'}
            </h1>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">
              ORÇAMENTO #${orcamento.numero.toString().padStart(4, '0')}
            </p>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">
              ${dataFormatada}
            </p>
          </div>
          
          <div style="border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 10px 0; margin-bottom: 15px;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Cliente:</strong> ${orcamento.cliente.nome}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Telefone:</strong> ${orcamento.cliente.telefone}</p>
            <p style="margin: 5px 0; font-size: 14px;">
              <strong>Entrega:</strong> 
              ${orcamento.tipoEntrega === 'RETIRA' ? 'Cliente Retira' : 'Tele Entrega'}
              ${dataEntrega ? ` - ${dataEntrega}` : ''}
              ${orcamento.horarioEntrega ? ` às ${orcamento.horarioEntrega}` : ''}
            </p>
          </div>
          
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333;">ITENS</h3>
            ${orcamento.itens.map(item => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                <div>
                  <p style="margin: 0; font-size: 14px; font-weight: 500;">${item.produto.nome}</p>
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    ${formatarQuantidade(item.quantidade, item.produto.tipoVenda)} × ${formatarMoeda(item.valorUnit)}
                    ${item.observacao ? `<br/><em>(${item.observacao})</em>` : ''}
                  </p>
                </div>
                <p style="margin: 0; font-size: 14px; font-weight: 500;">${formatarMoeda(item.subtotal)}</p>
              </div>
            `).join('')}
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: right;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #8B4513;">
              TOTAL: ${formatarMoeda(orcamento.total)}
            </p>
          </div>
          
          ${orcamento.observacoes ? `
            <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px;">
              <p style="margin: 0; font-size: 12px; color: #856404;">
                <strong>Obs:</strong> ${orcamento.observacoes}
              </p>
            </div>
          ` : ''}
          
          <div style="margin-top: 15px; text-align: center;">
            <p style="font-size: 12px; color: #8B4513; margin: 0;">
              ✨ Aguardando aprovação ✨
            </p>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Gerar imagem com html2canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      
      // Remover elemento temporário
      document.body.removeChild(tempDiv);
      
      // Converter para blob e fazer download
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        try {
          // Compartilhar via Web Share API (funciona no mobile)
          if (navigator.share && navigator.canShare) {
            const file = new File([blob], `orcamento-${orcamento.numero}.png`, { type: 'image/png' });
            await navigator.share({
              title: `Orçamento #${orcamento.numero.toString().padStart(4, '0')}`,
              text: `Orçamento para ${orcamento.cliente.nome} - ${formatarMoeda(orcamento.total)}`,
              files: [file],
            });
            toast({
              title: 'Compartilhado!',
              description: 'Orçamento compartilhado com sucesso.',
            });
          } else {
            // Fallback: abrir WhatsApp com texto
            const telefone = orcamento.cliente.telefone.replace(/\D/g, '');
            const telefoneCompleto = telefone.length === 11 ? `55${telefone}` : telefone;
            const mensagem = encodeURIComponent(
              `*Orçamento #${orcamento.numero.toString().padStart(4, '0')}*\n\n` +
              `Cliente: ${orcamento.cliente.nome}\n` +
              `Valor: ${formatarMoeda(orcamento.total)}\n\n` +
              `Itens:\n${orcamento.itens.map(i => `- ${i.produto.nome} (${formatarQuantidade(i.quantidade, i.produto.tipoVenda)})`).join('\n')}\n\n` +
              `Aguardando aprovação!`
            );
            window.open(`https://wa.me/${telefoneCompleto}?text=${mensagem}`, '_blank');
            toast({
              title: 'WhatsApp aberto!',
              description: 'Envie a mensagem com os detalhes do orçamento.',
            });
          }
        } catch (shareError) {
          console.log('Share cancelled or failed:', shareError);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast({
        title: 'Erro ao compartilhar',
        description: 'Não foi possível compartilhar o orçamento.',
        variant: 'destructive',
      });
    } finally {
      setCompartilhando(false);
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompartilharWhatsApp(orcamento)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Compartilhar WhatsApp"
                            disabled={compartilhando}
                          >
                            <Share2 className="w-4 h-4" />
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

      {/* Dialog de detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Orçamento #{orcamentoSelecionado?.numero.toString().padStart(4, '0')}
            </DialogTitle>
            <DialogDescription>
              {orcamentoSelecionado && formatarData(orcamentoSelecionado.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {orcamentoSelecionado && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Status */}
                <div className="flex items-center gap-2 mb-4">
                  {getStatusBadge(orcamentoSelecionado.status)}
                </div>

                {/* Dados do cliente */}
                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-sm mb-2">Cliente</h4>
                  <p className="text-sm"><strong>Nome:</strong> {orcamentoSelecionado.cliente.nome}</p>
                  <p className="text-sm"><strong>Telefone:</strong> {orcamentoSelecionado.cliente.telefone}</p>
                  
                  {/* Dados de Entrega */}
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      {orcamentoSelecionado.tipoEntrega === 'RETIRA' ? (
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
                    {orcamentoSelecionado.dataEntrega && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatarDataEntrega(orcamentoSelecionado.dataEntrega)}</span>
                        </div>
                        {orcamentoSelecionado.horarioEntrega && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{orcamentoSelecionado.horarioEntrega}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {orcamentoSelecionado.tipoEntrega === 'TELE_ENTREGA' && orcamentoSelecionado.enderecoEntrega && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {orcamentoSelecionado.enderecoEntrega}
                        {orcamentoSelecionado.bairroEntrega && ` - ${orcamentoSelecionado.bairroEntrega}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Itens */}
                <div className="flex-1 overflow-y-auto">
                  <h4 className="font-semibold text-sm mb-2">Itens</h4>
                  <div className="space-y-2">
                    {orcamentoSelecionado.itens.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-border/50">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.produto.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatarQuantidade(item.quantidade, item.produto.tipoVenda as 'KG' | 'UNIDADE')} × {formatarMoeda(item.valorUnit)}
                            {item.observacao && <span className="ml-2 text-primary">({item.observacao})</span>}
                          </p>
                        </div>
                        <p className="font-semibold text-sm">{formatarMoeda(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                {orcamentoSelecionado.observacoes && (
                  <div className="mt-3 p-2 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Obs:</strong> {orcamentoSelecionado.observacoes}
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-border mt-2">
                  <span>Total:</span>
                  <span className="text-primary">{formatarMoeda(orcamentoSelecionado.total)}</span>
                </div>

                {/* Botão de impressão */}
                <div className="mt-4 pt-3 border-t border-border">
                  <Button
                    onClick={() => handleImprimirOrcamento(orcamentoSelecionado)}
                    variant="outline"
                    className="w-full"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir Orçamento
                  </Button>
                </div>

                {/* Botões de ação */}
                {orcamentoSelecionado.status === 'PENDENTE' && (
                  <DialogFooter className="mt-4 pt-3 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={() => handleRejeitar(orcamentoSelecionado)}
                      disabled={processando}
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      onClick={() => handleAprovar(orcamentoSelecionado)}
                      disabled={processando}
                      className="btn-padaria"
                    >
                      {processando ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-4 h-4 mr-2" />
                      )}
                      Aprovar e Criar Pedido
                    </Button>
                  </DialogFooter>
                )}
              </div>
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
    </div>
  );
}
