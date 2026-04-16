'use client';

// AlertaLembretes - Padaria Paula
// Indicador discreto de pedidos com entrega próxima

import { useState, useEffect } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface Lembrete {
  pedido: {
    id: string;
    numero: number;
    total: number;
    dataEntrega: string;
    horarioEntrega?: string | null;
    cliente: {
      nome: string;
      telefone: string;
    };
  };
  diasParaEntrega: number;
  urgente: boolean;
}

interface LembretesResponse {
  lembretes: Lembrete[];
}

export default function AlertaLembretes() {
  const { setTela } = useAppStore();
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarLembretes();
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

  if (loading || lembretes.length === 0) return null;

  const urgentes = lembretes.filter(l => l.urgente).length;

  return (
    <button
      onClick={() => setTela('historico')}
      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Bell className="w-3.5 h-3.5 text-gray-400" />
        <span>
          {lembretes.length} pedido{lembretes.length > 1 ? 's' : ''} pendente{lembretes.length > 1 ? 's' : ''}
          {urgentes > 0 && (
            <span className="text-gray-400 ml-1">
              ({urgentes} {urgentes === 1 ? 'urgente' : 'urgentes'})
            </span>
          )}
        </span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300" />
    </button>
  );
}
