'use client';

// AdminDashboard - Padaria Paula
// Dashboard simplificado para evitar erros de renderização

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package,
  Clock, Truck, Store, RefreshCw, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';

interface DashboardData {
  vendasHoje: {
    total: number;
    pedidos: number;
    variacao: number;
  };
  vendasPeriodo: {
    total: number;
    pedidos: number;
  };
  pedidosPorStatus: Record<string, number>;
  ultimos7Dias: Array<{
    data: string;
    dia: string;
    total: number;
    pedidos: number;
  }>;
  produtosMaisVendidos: Array<{
    produtoId: string;
    nome: string;
    categoria: string | null;
    quantidade: number;
    total: number;
    pedidos: number;
  }>;
  ultimosPedidos: Array<{
    id: string;
    numero: number;
    cliente: { nome: string; telefone: string };
    total: number;
    status: string;
    createdAt: string;
    tipoEntrega: string;
    itensCount: number;
  }>;
  clientesTop: Array<{
    clienteId: string;
    nome: string;
    telefone: string;
    totalGasto: number;
    pedidos: number;
  }>;
  resumo: {
    totalClientes: number;
    totalProdutos: number;
    pedidosPendentes: number;
    pedidosEmProducao: number;
    pedidosProntos: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  PRODUCAO: 'Em Produção',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const formatarNumeroPedido = (numero: number) => {
  return numero.toString().padStart(4, '0');
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { setTela } = useAppStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState('mes');

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?periodo=${periodo}`);
      const dados = await res.json();
      if (res.ok) {
        setData(dados);
      } else {
        setError(dados.error || 'Erro ao carregar dados');
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Não foi possível carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  const formatarData = (dataStr: string) => {
    try {
      return new Date(dataStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dataStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant: 'default' | 'secondary' | 'destructive' | 'outline' = 
      status === 'CANCELADO' ? 'destructive' :
      status === 'ENTREGUE' ? 'default' :
      status === 'PRONTO' ? 'outline' : 'secondary';
    
    return (
      <Badge variant={variant}>
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{error || 'Erro ao carregar dados'}</p>
        <Button onClick={carregarDados} className="mt-4 btn-padaria">Tentar novamente</Button>
      </Card>
    );
  }

  // Dados com valores padrão para evitar erros
  const safeData = {
    vendasHoje: data.vendasHoje || { total: 0, pedidos: 0, variacao: 0 },
    vendasPeriodo: data.vendasPeriodo || { total: 0, pedidos: 0 },
    resumo: data.resumo || { totalClientes: 0, totalProdutos: 0, pedidosPendentes: 0, pedidosEmProducao: 0, pedidosProntos: 0 },
    produtosMaisVendidos: data.produtosMaisVendidos || [],
    ultimosPedidos: data.ultimosPedidos || [],
    clientesTop: data.clientesTop || [],
    ultimos7Dias: data.ultimos7Dias || [],
    pedidosPorStatus: data.pedidosPorStatus || {},
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com período */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral do negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="todos">Todo Período</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={carregarDados}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-padaria">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                <p className="text-2xl font-bold text-primary">
                  {formatarMoeda(safeData.vendasHoje.total)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {safeData.vendasHoje.variacao >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ${safeData.vendasHoje.variacao >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(safeData.vendasHoje.variacao).toFixed(1)}% vs ontem
                  </span>
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-padaria">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-2xl font-bold text-primary">{safeData.vendasPeriodo.pedidos}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatarMoeda(safeData.vendasPeriodo.total)}
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-padaria">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold text-primary">{safeData.resumo.totalClientes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {safeData.resumo.totalProdutos} produtos ativos
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-padaria">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
                <p className="text-2xl font-bold text-primary">
                  {safeData.resumo.pedidosPendentes + safeData.resumo.pedidosEmProducao + safeData.resumo.pedidosProntos}
                </p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {safeData.resumo.pedidosPendentes > 0 && (
                    <Badge variant="secondary" className="text-xs">{safeData.resumo.pedidosPendentes} nov</Badge>
                  )}
                  {safeData.resumo.pedidosEmProducao > 0 && (
                    <Badge className="text-xs bg-blue-500">{safeData.resumo.pedidosEmProducao} prod</Badge>
                  )}
                  {safeData.resumo.pedidosProntos > 0 && (
                    <Badge className="text-xs border-green-500 text-green-600" variant="outline">{safeData.resumo.pedidosProntos} ok</Badge>
                  )}
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendas dos últimos 7 dias - Lista simples */}
      <Card className="card-padaria">
        <CardHeader>
          <CardTitle className="text-lg">Vendas Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {safeData.ultimos7Dias.map((dia, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div>
                    <span className="font-medium">{dia.dia}</span>
                    <span className="text-xs text-muted-foreground ml-2">{dia.data}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-primary">{formatarMoeda(dia.total)}</span>
                    <span className="text-xs text-muted-foreground ml-2">({dia.pedidos} pedidos)</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos mais vendidos */}
        <Card className="card-padaria">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {safeData.produtosMaisVendidos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum produto vendido</p>
                ) : (
                  safeData.produtosMaisVendidos.map((produto, index) => (
                    <div key={produto.produtoId || index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {produto.quantidade?.toFixed(1) || 0} vendidos
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-primary">
                        {formatarMoeda(produto.total || 0)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Últimos pedidos */}
        <Card className="card-padaria">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Últimos Pedidos
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTela('historico')}
                className="text-xs"
              >
                Ver todos <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {safeData.ultimosPedidos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum pedido</p>
                ) : (
                  safeData.ultimosPedidos.map((pedido) => (
                    <div key={pedido.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary">
                            #{formatarNumeroPedido(pedido.numero)}
                          </span>
                          {getStatusBadge(pedido.status)}
                        </div>
                        <p className="text-sm truncate">{pedido.cliente?.nome || 'Cliente'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {pedido.tipoEntrega === 'RETIRA' ? (
                            <><Store className="w-3 h-3" /> Retira</>
                          ) : (
                            <><Truck className="w-3 h-3" /> Entrega</>
                          )}
                          <span>{formatarData(pedido.createdAt)}</span>
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-primary">
                        {formatarMoeda(pedido.total || 0)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Clientes top */}
        <Card className="card-padaria">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clientes Destaque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {safeData.clientesTop.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum cliente</p>
                ) : (
                  safeData.clientesTop.map((cliente, index) => (
                    <div key={cliente.clienteId || index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cliente.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {cliente.telefone} • {cliente.pedidos} pedidos
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-primary">
                        {formatarMoeda(cliente.totalGasto || 0)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
