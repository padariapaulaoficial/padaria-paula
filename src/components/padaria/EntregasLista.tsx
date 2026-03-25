'use client';

// EntregasLista - Padaria Paula
// Lista de pedidos TELE ENTREGA pendentes

import { useState, useEffect } from 'react';
import { Truck, RefreshCw, Eye, Check, MapPin, Phone, Clock, Calendar, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
import { formatarNumeroPedido } from '@/lib/escpos';

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
  observacao?: string;
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
  status: string;
  tipoEntrega?: string;
  dataEntrega?: string;
  horarioEntrega?: string;
  enderecoEntrega?: string;
  bairroEntrega?: string;
  createdAt: string;
}

export default function EntregasLista() {
  const { toast } = useToast();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Carregar pedidos TELE_ENTREGA pendentes
  const carregarPedidos = async () => {
    setLoading(true);
    try {
      // Buscar pedidos pendentes de entrega (TELE_ENTREGA e não ENTREGUE)
      const res = await fetch('/api/pedidos?limite=100');
      const data = await res.json();

      // Filtrar apenas TELE_ENTREGA que não foram entregues
      const pedidosEntrega = data.filter((p: Pedido) =>
        p.tipoEntrega === 'TELE_ENTREGA' &&
        p.status !== 'ENTREGUE' &&
        p.status !== 'CANCELADO'
      );

      setPedidos(pedidosEntrega);
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
  }, []);

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
    };
    const cfg = statusConfig[status] || { variant: 'secondary', label: status };
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
  };

  // Visualizar pedido
  const handleVisualizar = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
    setDialogOpen(true);
  };

  // Marcar como entregue
  const handleMarcarEntregue = async (pedido: Pedido) => {
    try {
      const response = await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedido.id,
          status: 'ENTREGUE',
        }),
      });

      const pedidoAtualizado = await response.json();

      // Remover da lista de entregas
      setPedidos(prev => prev.filter(p => p.id !== pedido.id));

      toast({
        title: 'Pedido entregue!',
        description: `Pedido #${formatarNumeroPedido(pedido.numero)} marcado como entregue.`,
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  // Abrir no Google Maps
  const handleAbrirMapa = (pedido: Pedido) => {
    const endereco = pedido.enderecoEntrega 
      ? `${pedido.enderecoEntrega}${pedido.bairroEntrega ? ', ' + pedido.bairroEntrega : ''}`
      : pedido.cliente.endereco 
        ? `${pedido.cliente.endereco}${pedido.cliente.bairro ? ', ' + pedido.cliente.bairro : ''}`
        : '';
    
    if (!endereco) {
      toast({
        title: 'Endereço não disponível',
        description: 'Este pedido não possui endereço cadastrado.',
        variant: 'destructive',
      });
      return;
    }
    
    // Abrir Google Maps com o endereço
    const enderecoCodificado = encodeURIComponent(endereco);
    window.open(`https://www.google.com/maps/search/?api=1&query=${enderecoCodificado}`, '_blank');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <Card className="card-padaria">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Tele Entregas
              {pedidos.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pedidos.length} pendente{pedidos.length > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={carregarPedidos}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Entregas */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pedidos.length === 0 ? (
        <Card className="p-8 text-center card-padaria">
          <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma entrega pendente</p>
          <p className="text-xs text-muted-foreground mt-2">
            Pedidos entregues aparecem no Histórico
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2 pr-2">
            {pedidos.map((pedido) => (
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
                      </div>
                      <p className="font-medium text-sm">{pedido.cliente.nome}</p>

                      {/* Data de entrega */}
                      {pedido.dataEntrega && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatarDataEntrega(pedido.dataEntrega)}</span>
                          </div>
                          {pedido.horarioEntrega && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{pedido.horarioEntrega}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Endereço de entrega */}
                      {pedido.enderecoEntrega && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>
                            {pedido.enderecoEntrega}
                            {pedido.bairroEntrega && ` - ${pedido.bairroEntrega}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAbrirMapa(pedido)}
                        className="h-9 w-9 p-0 text-blue-600 border-blue-300 hover:bg-blue-50"
                        title="Ver no Mapa"
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVisualizar(pedido)}
                        className="h-9 w-9 p-0"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMarcarEntregue(pedido)}
                        className="h-9 btn-padaria"
                        title="Marcar como Entregue"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Entregue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialog de detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Pedido #{pedidoSelecionado && formatarNumeroPedido(pedidoSelecionado.numero)}
            </DialogTitle>
            <DialogDescription>
              {pedidoSelecionado?.cliente?.nome} - {pedidoSelecionado?.cliente?.telefone}
            </DialogDescription>
          </DialogHeader>

          {pedidoSelecionado && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                {getStatusBadge(pedidoSelecionado.status)}
                <span className="text-xs text-muted-foreground">
                  {formatarData(pedidoSelecionado.createdAt)}
                </span>
              </div>

              {/* Endereço de Entrega */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Endereço de Entrega
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAbrirMapa(pedidoSelecionado)}
                    className="h-7 text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Mapa
                  </Button>
                </div>
                <p className="text-sm">
                  {pedidoSelecionado.enderecoEntrega}
                  {pedidoSelecionado.bairroEntrega && ` - ${pedidoSelecionado.bairroEntrega}`}
                </p>
                {pedidoSelecionado.dataEntrega && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
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
              </div>

              {/* Itens */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Itens</h4>
                <div className="space-y-2">
                  {pedidoSelecionado.itens.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b border-border/50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatarQuantidade(item.quantidade, item.produto.tipoVenda as 'KG' | 'UNIDADE')} × {formatarMoeda(item.valorUnit)}
                        </p>
                        {item.observacao && (
                          <p className="text-xs text-orange-600 mt-0.5">OBS: {item.observacao}</p>
                        )}
                      </div>
                      <p className="font-semibold text-sm">{formatarMoeda(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-border">
                <span>Total:</span>
                <span className="text-primary">{formatarMoeda(pedidoSelecionado.total)}</span>
              </div>

              {/* Observações */}
              {pedidoSelecionado.observacoes && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <h4 className="font-semibold text-sm mb-1">Observações</h4>
                  <p className="text-sm text-orange-700">{pedidoSelecionado.observacoes}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 btn-padaria"
                  onClick={() => handleMarcarEntregue(pedidoSelecionado)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Marcar Entregue
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
