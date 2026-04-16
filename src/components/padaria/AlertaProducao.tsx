'use client';

// AlertaProducao - Padaria Paula
// Sistema de alerta para pedidos programados

import { useState, useEffect } from 'react';
import { Bell, AlertCircle, X, Calendar, Clock, Package, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda } from '@/store/usePedidoStore';
import { formatarNumeroPedido } from '@/lib/escpos';

interface ItemPedido {
  id: string;
  produto: { nome: string };
  quantidade: number;
}

interface Pedido {
  id: string;
  numero: number;
  cliente: { nome: string; telefone: string };
  itens: ItemPedido[];
  total: number;
  dataEntrega?: string;
  horarioEntrega?: string;
  status: string;
}

export default function AlertaProducao() {
  const { toast } = useToast();
  const [pedidosAlerta, setPedidosAlerta] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState(true);

  // Carregar pedidos que precisam de alerta
  const carregarAlertas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pedidos?alertaProducao=true');
      const data = await res.json();
      setPedidosAlerta(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAlertas();
    // Verificar a cada 5 minutos
    const interval = setInterval(carregarAlertas, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Marcar alerta como visualizado
  const handleMarcarVisualizado = async (pedidoId: string) => {
    try {
      await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedidoId,
          alertaProducaoEnviado: true,
        }),
      });
      setPedidosAlerta(prev => prev.filter(p => p.id !== pedidoId));
      toast({
        title: 'Alerta marcado como visualizado',
        description: 'O pedido foi removido da lista de alertas.',
      });
    } catch (error) {
      console.error('Erro ao marcar alerta:', error);
    }
  };

  // Formatar data de entrega
  const formatarDataEntrega = (data?: string) => {
    if (!data) return '';
    return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  // Não mostrar nada se não houver alertas
  if (pedidosAlerta.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg animate-pulse-slow">
      <CardContent className="p-3">
        {/* Header */}
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpandido(!expandido)}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold">
                {pedidosAlerta.length}
              </span>
            </div>
            <span className="font-bold">Pedidos para Produzir em 3 Dias</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setExpandido(!expandido);
            }}
          >
            {expandido ? <X className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </Button>
        </div>

        {/* Lista de pedidos */}
        {expandido && (
          <ScrollArea className="mt-2 max-h-48">
            <div className="space-y-2">
              {pedidosAlerta.map((pedido) => (
                <div
                  key={pedido.id}
                  className="bg-white/20 rounded-lg p-2 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">#{formatarNumeroPedido(pedido.numero)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {pedido.itens.length} itens
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{pedido.cliente.nome}</p>
                      <div className="flex items-center gap-3 text-xs opacity-90 mt-1">
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
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pedido.itens.slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] border-white/50">
                            {item.produto.nome} ({item.quantidade})
                          </Badge>
                        ))}
                        {pedido.itens.length > 3 && (
                          <Badge variant="outline" className="text-[10px] border-white/50">
                            +{pedido.itens.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatarMoeda(pedido.total)}</p>
                      <Button
                        size="sm"
                        className="mt-1 h-7 bg-white text-orange-600 hover:bg-white/90"
                        onClick={() => handleMarcarVisualizado(pedido.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        OK
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
