'use client';

// AlertaLembretes - Padaria Paula
// Mostra alertas de pedidos com entrega próxima

import { useState, useEffect } from 'react';
import { Bell, Clock, Package, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { formatarMoeda } from '@/store/usePedidoStore';

interface Lembrete {
  pedido: {
    id: string;
    numero: number;
    total: number;
    dataEntrega: string;
    horarioEntrega?: string | null;
    tipoEntrega: string;
    cliente: {
      nome: string;
      telefone: string;
    };
    itens: Array<{
      produto: { nome: string };
      quantidade: number;
    }>;
  };
  diasParaEntrega: number;
  urgente: boolean;
}

interface LembretesResponse {
  lembretes: Lembrete[];
  diasConfigurados: number[];
  lembretesAtivos: boolean;
}

export default function AlertaLembretes() {
  const { setTela } = useAppStore();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [expandido, setExpandido] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarLembretes();
    // Atualizar a cada 5 minutos
    const interval = setInterval(carregarLembretes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const carregarLembretes = async () => {
    try {
      const res = await fetch('/api/lembretes');
      const data: LembretesResponse = await res.json();
      setLembretes(data.lembretes || []);
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  const getTextoDias = (dias: number) => {
    if (dias < 0) return `${Math.abs(dias)} dia(s) atrasado`;
    if (dias === 0) return 'Entrega hoje!';
    if (dias === 1) return 'Entrega amanha';
    return `Entrega em ${dias} dias`;
  };

  if (loading || lembretes.length === 0) return null;

  const urgentes = lembretes.filter(l => l.urgente);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const normais = lembretes.filter(l => !l.urgente);

  return (
    <Card className={`border-2 mb-3 ${urgentes.length > 0 ? 'border-red-400 bg-red-50' : 'border-yellow-400 bg-yellow-50'}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className={`w-5 h-5 ${urgentes.length > 0 ? 'text-red-600 animate-pulse' : 'text-yellow-600'}`} />
            <span className={`font-semibold ${urgentes.length > 0 ? 'text-red-700' : 'text-yellow-700'}`}>
              {lembretes.length} pedido(s) com entrega proxima
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpandido(!expandido)}
          >
            {expandido ? <X className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </Button>
        </div>

        {expandido && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {lembretes.map((lembrete) => (
              <div
                key={lembrete.pedido.id}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  lembrete.urgente 
                    ? 'bg-red-100 hover:bg-red-200 border border-red-300' 
                    : 'bg-yellow-100 hover:bg-yellow-200 border border-yellow-300'
                }`}
                onClick={() => setTela('historico')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      #{lembrete.pedido.numero.toString().padStart(5, '0')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {lembrete.pedido.cliente.nome}
                    </span>
                  </div>
                  <Badge className={lembrete.urgente ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}>
                    {getTextoDias(lembrete.diasParaEntrega)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatarData(lembrete.pedido.dataEntrega)}</span>
                    {lembrete.pedido.horarioEntrega && (
                      <span>- {lembrete.pedido.horarioEntrega}</span>
                    )}
                  </div>
                  <span className="font-semibold text-primary">
                    {formatarMoeda(lembrete.pedido.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="link"
          className="w-full mt-2 text-sm"
          onClick={() => setTela('historico')}
        >
          Ver todos os pedidos
        </Button>
      </CardContent>
    </Card>
  );
}
