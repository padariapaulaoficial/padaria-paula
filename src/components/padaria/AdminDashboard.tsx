'use client';

// AdminDashboard - Padaria Paula
// Dashboard principal com estatísticas e gráficos

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package,
  Clock, Truck, Store, RefreshCw, Eye, ChevronRight
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
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

// Cores para gráficos
const COLORS = ['#8B4513', '#D2691E', '#DEB887', '#F5DEB3', '#FAEBD7', '#D2B48C'];
const STATUS_COLORS: Record<string, string> = {
  PENDENTE: '#f59e0b',
  PRODUCAO: '#3b82f6',
  PRONTO: '#10b981',
  ENTREGUE: '#059669',
  CANCELADO: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  PRODUCAO: 'Em Produção',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

// Função para formatar número do pedido
const formatarNumeroPedido = (numero: number) => {
  return numero.toString().padStart(4, '0');
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { setTela } = useAppStore();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?periodo=${periodo}`);
      const dados = await res.json();
      if (res.ok) {
        setData(dados);
      } else {
        throw new Error(dados.error);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  // Preparar dados para gráfico de status
  const statusChartData = data?.pedidosPorStatus
    ? Object.entries(data.pedidosPorStatus).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        color: STATUS_COLORS[status] || '#888',
      }))
    : [];

  // Formatar data para exibição
  const formatarData = (dataStr: string) => {
    return new Date(dataStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Badge de status
  const getStatusBadge = (status: string) => {
    const variant: 'default' | 'secondary' | 'destructive' | 'outline' = 
      status === 'CANCELADO' ? 'destructive' :
      status === 'ENTREGUE' ? 'default' :
      status === 'PRONTO' ? 'outline' : 'secondary';
    
    return (
      <Badge 
        variant={variant} 
        className={status === 'PRONTO' ? 'border-green-500 text-green-600' : 
                   status === 'ENTREGUE' ? 'bg-green-600' : 
                   status === 'PRODUCAO' ? 'bg-blue-500' : ''}
      >
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

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
        <Button onClick={carregarDados} className="mt-4">Tentar novamente</Button>
      </Card>
    );
  }

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
        {/* Vendas Hoje */}
        <Card className="card-padaria">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                <p className="text-2xl font-bold text-primary">
                  {formatarMoeda(data.vendasHoje.total)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {data.vendasHoje.variacao >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ${data.vendasHoje.variacao >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(data.vendasHoje.variacao).toFixed(1)}% vs ontem
                  </span>
                </div>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos do Período */}
        <Card className="card-padaria">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos ({periodo === 'hoje' ? 'Hoje' : periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mês' : 'Total'})</p>
                <p className="text-2xl font-bold text-primary">{data.vendasPeriodo.pedidos}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {formatarMoeda(data.vendasPeriodo.total)}
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clientes */}
        <Card className="card-padaria">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold text-primary">{data.resumo.totalClientes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.resumo.totalProdutos} produtos ativos
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Pendentes */}
        <Card className="card-padaria">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Pendentes</p>
                <p className="text-2xl font-bold text-primary">
                  {data.resumo.pedidosPendentes + data.resumo.pedidosEmProducao + data.resumo.pedidosProntos}
                </p>
                <div className="flex gap-2 mt-1">
                  {data.resumo.pedidosPendentes > 0 && (
                    <Badge variant="secondary" className="text-xs">{data.resumo.pedidosPendentes} nov</Badge>
                  )}
                  {data.resumo.pedidosEmProducao > 0 && (
                    <Badge className="text-xs bg-blue-500">{data.resumo.pedidosEmProducao} prod</Badge>
                  )}
                  {data.resumo.pedidosProntos > 0 && (
                    <Badge className="text-xs border-green-500 text-green-600" variant="outline">{data.resumo.pedidosProntos} ok</Badge>
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de vendas últimos 7 dias */}
        <Card className="card-padaria">
          <CardHeader>
            <CardTitle className="text-lg">Vendas Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.ultimos7Dias}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(value: number) => formatarMoeda(value)}
                    labelFormatter={(label) => `Dia: ${label}`}
                  />
                  <Bar dataKey="total" fill="#8B4513" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de status */}
        <Card className="card-padaria">
          <CardHeader>
            <CardTitle className="text-lg">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} pedidos`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">Sem dados</p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {statusChartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
                {data.produtosMaisVendidos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum produto vendido</p>
                ) : (
                  data.produtosMaisVendidos.map((produto, index) => (
                    <div
                      key={produto.produtoId}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {produto.quantidade.toFixed(1)} vendidos • {produto.pedidos} pedidos
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-primary">
                        {formatarMoeda(produto.total)}
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
                {data.ultimosPedidos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum pedido</p>
                ) : (
                  data.ultimosPedidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary">
                            #{formatarNumeroPedido(pedido.numero)}
                          </span>
                          {getStatusBadge(pedido.status)}
                        </div>
                        <p className="text-sm truncate">{pedido.cliente.nome}</p>
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
                        {formatarMoeda(pedido.total)}
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
                {data.clientesTop.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum cliente</p>
                ) : (
                  data.clientesTop.map((cliente, index) => (
                    <div
                      key={cliente.clienteId}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
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
                        {formatarMoeda(cliente.totalGasto)}
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
