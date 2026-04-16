'use client';

// AdminPanel - Padaria Paula
// Painel administrativo para gerenciamento com Dashboard

import { useState, useEffect } from 'react';
import {
  Settings, Package, Store, Plus, Edit, Trash2, Save,
  RefreshCw, ToggleLeft, ToggleRight, AlertTriangle, Lock, Cake, MessageCircle,
  BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Clock,
  Trophy, ArrowUpRight, ArrowDownRight, Download, Upload, FileSpreadsheet, Database, HardDrive
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { formatarMoeda } from '@/store/usePedidoStore';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

// === INTERFACES DO DASHBOARD ===
interface Estatisticas {
  vendasDia: {
    total: number;
    pedidos: number;
    comparativo: {
      ontem: number;
      variacao: number;
    };
  };
  graficoVendas: Array<{
    data: string;
    total: number;
    pedidos: number;
  }>;
  topProdutos: Array<{
    posicao: number;
    nome: string;
    quantidade: number;
    total: number;
  }>;
  tempoMedio: {
    minutos: number;
    formato: string;
  };
  resumo: {
    totalClientes: number;
    totalProdutos: number;
    pedidosPendentes: number;
    pedidosHoje: number;
  };
}

// Tamanhos fixos para produtos especiais
const TAMANHOS_FIXOS = ['P', 'M', 'G', 'GG'];

// Interface do produto
interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  tipoVenda: 'KG' | 'UNIDADE';
  valorUnit: number;
  categoria: string | null;
  ativo: boolean;
  tipoProduto: 'NORMAL' | 'ESPECIAL';
  tamanhos: string[] | null;
  precosTamanhos: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
}

interface Configuracao {
  id: string;
  nomeLoja: string;
  endereco: string;
  telefone: string;
  cnpj: string;
  logoUrl: string | null;
  mensagemWhatsApp?: string | null;
}

const CATEGORIAS = ['Tortas', 'Docinhos', 'Salgadinhos', 'Salgados Unitários', 'Pães', 'Bolos', 'Bebidas', 'Outros'];
const TIPOS_VENDA = [
  { value: 'KG', label: 'Quilograma (kg)' },
  { value: 'UNIDADE', label: 'Unidade' },
];

export default function AdminPanel() {
  const { toast } = useToast();

  // Estados de produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);

  // Estados do Dashboard
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Estado para controlar qual tipo de produto está sendo cadastrado
  const [modoCadastro, setModoCadastro] = useState<'COMUM' | 'ESPECIAL' | null>(null);

  // Estado para produto comum
  const [produtoComum, setProdutoComum] = useState({
    nome: '',
    tipoVenda: 'UNIDADE' as 'KG' | 'UNIDADE',
    categoria: 'Outros',
    valorUnit: '',
  });

  // Estado para produto especial (torta)
  const [produtoEspecial, setProdutoEspecial] = useState({
    nome: '',
    categoria: 'Tortas',
    precos: { P: '', M: '', G: '', GG: '' } as Record<string, string>,
  });

  // Estados de configuração
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configEditada, setConfigEditada] = useState({
    nomeLoja: '',
    endereco: '',
    telefone: '',
    cnpj: '',
    mensagemWhatsApp: '',
  });

  // Estados de senha do app
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Estados de senha admin
  const [senhaAdminAtual, setSenhaAdminAtual] = useState('');
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState('');
  const [confirmarSenhaAdmin, setConfirmarSenhaAdmin] = useState('');
  const [salvandoSenhaAdmin, setSalvandoSenhaAdmin] = useState(false);

  // Estados de backup
  const [restaurando, setRestaurando] = useState(false);
  const [backupAutomatico, setBackupAutomatico] = useState(true);
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);

  // Carregar produtos
  const carregarProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingProdutos(false);
    }
  };

  // Carregar configuração
  const carregarConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/configuracao');
      const data = await res.json();
      setConfig(data);
      setConfigEditada({
        nomeLoja: data.nomeLoja || '',
        endereco: data.endereco || '',
        telefone: data.telefone || '',
        cnpj: data.cnpj || '',
        mensagemWhatsApp: data.mensagemWhatsApp || '',
      });
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
    carregarConfig();
    carregarEstatisticas();
  }, []);

  // Carregar estatísticas do dashboard
  const carregarEstatisticas = async () => {
    setLoadingDashboard(true);
    try {
      const res = await fetch('/api/estatisticas');
      const data = await res.json();
      setEstatisticas(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Salvar configuração
  const handleSalvarConfig = async () => {
    if (!config) return;

    try {
      const res = await fetch('/api/configuracao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: config.id,
          ...configEditada,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Erro ao salvar',
          description: data.error || `Erro ${res.status}`,
          variant: 'destructive',
        });
        return;
      }

      setConfig(data);
      toast({
        title: 'Configurações salvas!',
        description: 'Os dados da loja foram atualizados.',
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    }
  };

  // Criar produto comum
  const handleCriarProdutoComum = async () => {
    if (!produtoComum.nome || !produtoComum.valorUnit) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e valor do produto.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: produtoComum.nome,
          tipoVenda: produtoComum.tipoVenda,
          valorUnit: parseFloat(produtoComum.valorUnit),
          categoria: produtoComum.categoria,
          tipoProduto: 'NORMAL',
          ativo: true,
        }),
      });

      const produto = await res.json();

      if (!res.ok) {
        toast({
          title: 'Erro ao criar',
          description: produto.error || `Erro ${res.status}`,
          variant: 'destructive',
        });
        return;
      }

      setProdutos([produto, ...produtos]);
      setProdutoComum({ nome: '', tipoVenda: 'UNIDADE', categoria: 'Outros', valorUnit: '' });
      setModoCadastro(null);

      toast({
        title: 'Produto criado!',
        description: `${produto.nome} foi adicionado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar o produto.',
        variant: 'destructive',
      });
    }
  };

  // Criar produto especial (torta)
  const handleCriarProdutoEspecial = async () => {
    if (!produtoEspecial.nome) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da torta.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se pelo menos um preço foi preenchido
    const precosPreenchidos = Object.entries(produtoEspecial.precos).filter(([, v]) => v);
    if (precosPreenchidos.length === 0) {
      toast({
        title: 'Preços obrigatórios',
        description: 'Preencha pelo menos um preço para a torta.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tamanhos = precosPreenchidos.map(([tam]) => tam);
      const precosTamanhos: Record<string, number> = {};
      precosPreenchidos.forEach(([tam, preco]) => {
        precosTamanhos[tam] = parseFloat(preco);
      });

      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: produtoEspecial.nome,
          tipoVenda: 'UNIDADE',
          valorUnit: parseFloat(precosPreenchidos[0][1]), // Primeiro preço como base
          categoria: produtoEspecial.categoria,
          tipoProduto: 'ESPECIAL',
          tamanhos,
          precosTamanhos,
          ativo: true,
        }),
      });

      const produto = await res.json();

      if (!res.ok) {
        toast({
          title: 'Erro ao criar',
          description: produto.error || `Erro ${res.status}`,
          variant: 'destructive',
        });
        return;
      }

      setProdutos([produto, ...produtos]);
      setProdutoEspecial({ nome: '', categoria: 'Tortas', precos: { P: '', M: '', G: '', GG: '' } });
      setModoCadastro(null);

      toast({
        title: 'Torta cadastrada!',
        description: `${produto.nome} foi adicionada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar produto especial:', error);
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar a torta.',
        variant: 'destructive',
      });
    }
  };

  // Atualizar produto
  const handleAtualizarProduto = async (produto: Produto) => {
    try {
      const res = await fetch('/api/produtos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao,
          tipoVenda: produto.tipoVenda,
          valorUnit: produto.valorUnit,
          categoria: produto.categoria,
          ativo: produto.ativo,
          tipoProduto: produto.tipoProduto,
          tamanhos: produto.tamanhos,
          precosTamanhos: produto.precosTamanhos,
        }),
      });

      const atualizado = await res.json();

      if (!res.ok) {
        toast({
          title: 'Erro ao atualizar',
          description: atualizado.error || `Erro ${res.status}`,
          variant: 'destructive',
        });
        return;
      }

      setProdutos(produtos.map(p => p.id === atualizado.id ? atualizado : p));
      setProdutoEditando(null);
      setDialogProdutoOpen(false);

      toast({
        title: 'Produto atualizado!',
        description: `${atualizado.nome} foi atualizado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o produto.',
        variant: 'destructive',
      });
    }
  };

  // Excluir produto
  const handleExcluirProduto = async () => {
    if (!produtoParaExcluir) return;

    try {
      const res = await fetch(`/api/produtos?id=${produtoParaExcluir.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Não foi possível excluir',
          description: data.error || 'Erro ao excluir produto.',
          variant: 'destructive',
        });
        setDialogExcluirOpen(false);
        return;
      }

      if (data.message && data.message.includes('desativado')) {
        setProdutos(produtos.map(p => p.id === produtoParaExcluir?.id ? { ...p, ativo: false } : p));
        toast({
          title: 'Produto desativado',
          description: data.message,
        });
      } else {
        setProdutos(produtos.filter(p => p.id !== produtoParaExcluir.id));
        toast({
          title: 'Produto excluído!',
          description: 'O produto foi removido com sucesso.',
        });
      }

      setProdutoParaExcluir(null);
      setDialogExcluirOpen(false);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o produto.',
        variant: 'destructive',
      });
    }
  };

  // Alternar status do produto
  const handleToggleAtivo = async (produto: Produto) => {
    await handleAtualizarProduto({ ...produto, ativo: !produto.ativo });
  };

  // Abrir diálogo de edição
  const handleEditar = (produto: Produto) => {
    setProdutoEditando({ ...produto });
    setDialogProdutoOpen(true);
  };

  // Abrir diálogo de exclusão
  const handleConfirmarExclusao = (produto: Produto) => {
    setProdutoParaExcluir(produto);
    setDialogExcluirOpen(true);
  };

  // Alterar senha
  const handleAlterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (senhaAtual.length !== 4 || novaSenha.length !== 4 || confirmarSenha.length !== 4) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter exatamente 4 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast({
        title: 'Senhas não conferem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive',
      });
      return;
    }

    setSalvandoSenha(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: 'Erro',
          description: data.error || 'Não foi possível alterar a senha.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Senha alterada!',
        description: 'A senha de acesso foi atualizada com sucesso.',
      });

      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a senha.',
        variant: 'destructive',
      });
    } finally {
      setSalvandoSenha(false);
    }
  };

  // Alterar senha admin
  const handleAlterarSenhaAdmin = async () => {
    if (!senhaAdminAtual || !novaSenhaAdmin || !confirmarSenhaAdmin) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    if (senhaAdminAtual.length !== 4 || novaSenhaAdmin.length !== 4 || confirmarSenhaAdmin.length !== 4) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter exatamente 4 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    if (novaSenhaAdmin !== confirmarSenhaAdmin) {
      toast({
        title: 'Senhas não conferem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive',
      });
      return;
    }

    setSalvandoSenhaAdmin(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual: senhaAdminAtual, novaSenha: novaSenhaAdmin, tipo: 'admin' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: 'Erro',
          description: data.error || 'Não foi possível alterar a senha administrativa.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Senha administrativa alterada!',
        description: 'A senha de acesso à área administrativa foi atualizada com sucesso.',
      });

      setSenhaAdminAtual('');
      setNovaSenhaAdmin('');
      setConfirmarSenhaAdmin('');
    } catch (error) {
      console.error('Erro ao alterar senha admin:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a senha administrativa.',
        variant: 'destructive',
      });
    } finally {
      setSalvandoSenhaAdmin(false);
    }
  };

  // Funções de backup
  const handleFazerBackup = () => {
    window.open('/api/backup', '_blank');
    setUltimoBackup(new Date().toLocaleString('pt-BR'));
    localStorage.setItem('ultimoBackup', new Date().toISOString());
    toast({ title: 'Backup iniciado!', description: 'O download começará em instantes.' });
  };

  const handleRestaurarBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setRestaurando(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dados = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dados: dados.dados || dados, sobrescrever: true }),
        });
        const result = await res.json();
        if (result.success) {
          toast({ title: 'Backup restaurado!', description: `${result.resultados.clientes} clientes, ${result.resultados.produtos} produtos` });
        } else {
          throw new Error(result.error);
        }
      } catch {
        toast({ title: 'Erro ao restaurar', description: 'Arquivo de backup inválido', variant: 'destructive' });
      } finally {
        setRestaurando(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExportar = (tipo: string) => {
    window.open(`/api/export?tipo=${tipo}`, '_blank');
    toast({ title: 'Exportação iniciada!', description: 'O download começará em instantes.' });
  };

  // Carregar último backup do localStorage
  useEffect(() => {
    const savedBackup = localStorage.getItem('ultimoBackup');
    if (savedBackup) {
      setUltimoBackup(new Date(savedBackup).toLocaleString('pt-BR'));
    }
    const savedAutoBackup = localStorage.getItem('backupAutomatico');
    if (savedAutoBackup !== null) {
      setBackupAutomatico(savedAutoBackup === 'true');
    }
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Tab de Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          {loadingDashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="card-padaria">
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : estatisticas ? (
            <>
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vendas do Dia */}
                <Card className="card-padaria border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Vendas Hoje</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatarMoeda(estatisticas.vendasDia.total)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {estatisticas.vendasDia.pedidos} pedido{estatisticas.vendasDia.pedidos !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${
                        estatisticas.vendasDia.comparativo.variacao >= 0 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {estatisticas.vendasDia.comparativo.variacao >= 0 
                          ? <TrendingUp className="w-6 h-6" /> 
                          : <TrendingDown className="w-6 h-6" />
                        }
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      estatisticas.vendasDia.comparativo.variacao >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {estatisticas.vendasDia.comparativo.variacao >= 0 
                        ? <ArrowUpRight className="w-3 h-3" /> 
                        : <ArrowDownRight className="w-3 h-3" />
                      }
                      <span>{Math.abs(estatisticas.vendasDia.comparativo.variacao).toFixed(1)}%</span>
                      <span className="text-muted-foreground">vs ontem</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pedidos Hoje */}
                <Card className="card-padaria">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Pedidos Hoje</p>
                        <p className="text-2xl font-bold">{estatisticas.resumo.pedidosHoje}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {estatisticas.resumo.pedidosPendentes} pendente{estatisticas.resumo.pedidosPendentes !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Clientes */}
                <Card className="card-padaria">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Clientes</p>
                        <p className="text-2xl font-bold">{estatisticas.resumo.totalClientes}</p>
                        <p className="text-xs text-muted-foreground mt-1">cadastrados</p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <Users className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tempo Médio */}
                <Card className="card-padaria">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Tempo Médio</p>
                        <p className="text-2xl font-bold">{estatisticas.tempoMedio.formato}</p>
                        <p className="text-xs text-muted-foreground mt-1">produção</p>
                      </div>
                      <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico e Top Produtos */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Gráfico de Vendas */}
                <Card className="card-padaria lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Vendas Últimos 7 Dias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        total: { label: 'Total', color: 'hsl(var(--primary))' },
                        pedidos: { label: 'Pedidos', color: 'hsl(var(--chart-2))' },
                      }}
                      className="h-[200px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={estatisticas.graficoVendas}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="data" 
                            className="text-xs"
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis 
                            className="text-xs"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(value) => `R$${value}`}
                          />
                          <Tooltip 
                            formatter={(value: number) => formatarMoeda(value)}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar 
                            dataKey="total" 
                            fill="hsl(var(--primary))" 
                            radius={[4, 4, 0, 0]}
                            name="Vendas"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Top 5 Produtos */}
                <Card className="card-padaria">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Top 5 Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {estatisticas.topProdutos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Sem dados suficientes
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {estatisticas.topProdutos.map((produto, index) => (
                          <div key={produto.posicao} className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-amber-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-amber-700 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {produto.posicao}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{produto.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {produto.quantidade.toFixed(1)} vendidos
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-primary">
                              {formatarMoeda(produto.total)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Botão Atualizar */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={carregarEstatisticas}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar Dados
                </Button>
              </div>
            </>
          ) : (
            <Card className="card-padaria p-8 text-center">
              <p className="text-muted-foreground">Não foi possível carregar as estatísticas</p>
            </Card>
          )}
        </TabsContent>

        {/* Tab de Produtos */}
        <TabsContent value="produtos" className="space-y-4">
          {/* Seletor de tipo de produto */}
          {!modoCadastro && (
            <Card className="card-padaria">
              <CardHeader>
                <CardTitle className="text-lg">Novo Produto</CardTitle>
                <CardDescription>Selecione o tipo de produto que deseja cadastrar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => setModoCadastro('COMUM')}
                    className="h-24 flex-col gap-2 btn-padaria"
                  >
                    <Package className="w-8 h-8" />
                    <span className="font-semibold">Produto Comum</span>
                    <span className="text-xs opacity-80">KG ou Unidade</span>
                  </Button>
                  <Button
                    onClick={() => setModoCadastro('ESPECIAL')}
                    variant="outline"
                    className="h-24 flex-col gap-2 border-primary hover:bg-primary/10"
                  >
                    <Cake className="w-8 h-8 text-primary" />
                    <span className="font-semibold text-primary">Produto Especial</span>
                    <span className="text-xs opacity-70">Torta com tamanhos</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulário de Produto Comum */}
          {modoCadastro === 'COMUM' && (
            <Card className="card-padaria border-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Novo Produto Comum
                </CardTitle>
                <CardDescription>Produto vendido por KG ou Unidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Nome do produto"
                      className="input-padaria"
                      value={produtoComum.nome}
                      onChange={(e) => setProdutoComum({ ...produtoComum, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Venda *</Label>
                    <Select
                      value={produtoComum.tipoVenda}
                      onValueChange={(value) => setProdutoComum({ ...produtoComum, tipoVenda: value as 'KG' | 'UNIDADE' })}
                    >
                      <SelectTrigger className="input-padaria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_VENDA.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={produtoComum.categoria}
                      onValueChange={(value) => setProdutoComum({ ...produtoComum, categoria: value })}
                    >
                      <SelectTrigger className="input-padaria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="input-padaria"
                      value={produtoComum.valorUnit}
                      onChange={(e) => setProdutoComum({ ...produtoComum, valorUnit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setModoCadastro(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCriarProdutoComum} className="btn-padaria">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Produto
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulário de Produto Especial (Torta) */}
          {modoCadastro === 'ESPECIAL' && (
            <Card className="card-padaria border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Cake className="w-5 h-5" />
                  Nova Torta (Produto Especial)
                </CardTitle>
                <CardDescription>Torta com tamanhos P, M, G, GG e preços individuais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Torta *</Label>
                    <Input
                      placeholder="Ex: Torta de Frango"
                      className="input-padaria"
                      value={produtoEspecial.nome}
                      onChange={(e) => setProdutoEspecial({ ...produtoEspecial, nome: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={produtoEspecial.categoria}
                      onValueChange={(value) => setProdutoEspecial({ ...produtoEspecial, categoria: value })}
                    >
                      <SelectTrigger className="input-padaria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preços por tamanho */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Preços por Tamanho</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {TAMANHOS_FIXOS.map(tam => (
                      <div key={tam} className="space-y-1">
                        <Label className="text-muted-foreground">Tamanho {tam}</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="input-padaria pl-10"
                            value={produtoEspecial.precos[tam]}
                            onChange={(e) => setProdutoEspecial({
                              ...produtoEspecial,
                              precos: { ...produtoEspecial.precos, [tam]: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    * Preencha pelo menos um tamanho. Deixe em branco os tamanhos não disponíveis.
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setModoCadastro(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCriarProdutoEspecial} className="btn-padaria">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Torta
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de produtos */}
          <Card className="card-padaria">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Produtos Cadastrados</CardTitle>
              <Button variant="outline" size="sm" onClick={carregarProdutos}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingProdutos ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-2">
                    {produtos.map((produto) => (
                      <div
                        key={produto.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          produto.tipoProduto === 'ESPECIAL'
                            ? 'bg-primary/5 border-primary/30'
                            : 'bg-card border-border/50'
                        } ${!produto.ativo ? 'opacity-60' : ''}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{produto.nome}</span>
                            {produto.tipoProduto === 'ESPECIAL' ? (
                              <Badge className="text-xs bg-primary text-primary-foreground">
                                <Cake className="w-3 h-3 mr-1" />
                                Torta
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {produto.tipoVenda === 'KG' ? 'Kg' : 'Un'}
                              </Badge>
                            )}
                            {!produto.ativo && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
                              <span className="font-semibold text-primary">
                                {Object.entries(produto.precosTamanhos)
                                  .filter(([tam, preco]) => preco !== undefined && preco !== null && !isNaN(preco))
                                  .sort((a, b) => TAMANHOS_FIXOS.indexOf(a[0]) - TAMANHOS_FIXOS.indexOf(b[0]))
                                  .map(([tam, preco]) => `${tam}: ${formatarMoeda(preco)}`)
                                  .join(' | ')}
                              </span>
                            ) : (
                              <span className="font-semibold text-primary">
                                {formatarMoeda(produto.valorUnit)}
                              </span>
                            )}
                            <span>{produto.categoria}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAtivo(produto)}
                            className={produto.ativo ? 'text-primary' : 'text-muted-foreground'}
                            title={produto.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {produto.ativo ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditar(produto)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmarExclusao(produto)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Configurações */}
        <TabsContent value="configuracoes" className="space-y-4">
          <Card className="card-padaria max-w-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="w-5 h-5" />
                Dados da Loja
              </CardTitle>
              <CardDescription>
                Essas informações aparecem nos cupons de impressão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Loja</Label>
                <Input
                  className="input-padaria"
                  value={configEditada.nomeLoja}
                  onChange={(e) => setConfigEditada({ ...configEditada, nomeLoja: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  className="input-padaria"
                  value={configEditada.endereco}
                  onChange={(e) => setConfigEditada({ ...configEditada, endereco: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  className="input-padaria"
                  value={configEditada.telefone}
                  onChange={(e) => setConfigEditada({ ...configEditada, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  className="input-padaria"
                  value={configEditada.cnpj}
                  onChange={(e) => setConfigEditada({ ...configEditada, cnpj: e.target.value })}
                />
              </div>
              {/* Mensagem WhatsApp */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  Mensagem Padrão WhatsApp
                </Label>
                <Textarea
                  className="input-padaria min-h-[100px]"
                  value={configEditada.mensagemWhatsApp || ''}
                  onChange={(e) => setConfigEditada({ ...configEditada, mensagemWhatsApp: e.target.value })}
                  placeholder="Olá {nome}! Seu pedido está pronto..."
                />
                <p className="text-xs text-muted-foreground">
                  Use <strong>{'{nome}'}</strong> para inserir o nome do cliente na mensagem
                </p>
              </div>
              <Button onClick={handleSalvarConfig} className="btn-padaria">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Segurança */}
        <TabsContent value="seguranca" className="space-y-4">
          {/* Senha do App */}
          <Card className="card-padaria max-w-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Alterar Senha de Acesso do App
              </CardTitle>
              <CardDescription>
                Senha para acessar o aplicativo (página inicial)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className="input-padaria text-center text-2xl tracking-widest"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className="input-padaria text-center text-2xl tracking-widest"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className="input-padaria text-center text-2xl tracking-widest"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <Button
                onClick={handleAlterarSenha}
                className="btn-padaria w-full"
                disabled={salvandoSenha || !senhaAtual || !novaSenha || !confirmarSenha}
              >
                {salvandoSenha ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Alterar Senha do App
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Senha Admin */}
          <Card className="card-padaria max-w-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Alterar Senha Administrativa
              </CardTitle>
              <CardDescription>
                Senha para acessar a área administrativa (se não configurada, usa a senha do app)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className="input-padaria text-center text-2xl tracking-widest"
                  value={senhaAdminAtual}
                  onChange={(e) => setSenhaAdminAtual(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nova Senha Admin</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className="input-padaria text-center text-2xl tracking-widest"
                  value={novaSenhaAdmin}
                  onChange={(e) => setNovaSenhaAdmin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className="input-padaria text-center text-2xl tracking-widest"
                  value={confirmarSenhaAdmin}
                  onChange={(e) => setConfirmarSenhaAdmin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <Button
                onClick={handleAlterarSenhaAdmin}
                className="btn-padaria w-full"
                disabled={salvandoSenhaAdmin || !senhaAdminAtual || !novaSenhaAdmin || !confirmarSenhaAdmin}
              >
                {salvandoSenhaAdmin ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Alterar Senha Admin
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Backup e Exportação */}
        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fazer Backup */}
            <Card className="card-padaria border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <Download className="w-5 h-5" />
                  Fazer Backup
                </CardTitle>
                <CardDescription>
                  Exporta todos os dados do sistema em um arquivo JSON
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Clientes cadastrados</p>
                  <p>• Produtos e preços</p>
                  <p>• Histórico de pedidos</p>
                  <p>• Orçamentos</p>
                </div>
                <Button 
                  onClick={handleFazerBackup}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Backup Completo
                </Button>
                {ultimoBackup && (
                  <p className="text-xs text-center text-muted-foreground">
                    Último backup: {ultimoBackup}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Restaurar Backup */}
            <Card className="card-padaria border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
                  <Upload className="w-5 h-5" />
                  Restaurar Backup
                </CardTitle>
                <CardDescription>
                  Restaura os dados a partir de um arquivo de backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Selecione um arquivo de backup (.json)
                  </p>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleRestaurarBackup}
                    disabled={restaurando}
                    className="cursor-pointer"
                  />
                </div>
                {restaurando && (
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Restaurando backup...
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  ⚠️ Isso irá sobrescrever os dados atuais
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Exportação */}
          <Card className="card-padaria">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Exportar Dados
              </CardTitle>
              <CardDescription>
                Exporte relatórios em formato CSV (compatível com Excel)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleExportar('clientes')}
                >
                  <Users className="w-6 h-6 text-blue-500" />
                  <span className="text-sm">Clientes</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleExportar('produtos')}
                >
                  <Package className="w-6 h-6 text-amber-500" />
                  <span className="text-sm">Produtos</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleExportar('vendas')}
                >
                  <ShoppingCart className="w-6 h-6 text-green-500" />
                  <span className="text-sm">Vendas</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2 border-primary hover:bg-primary/10"
                  onClick={() => handleExportar('completo')}
                >
                  <HardDrive className="w-6 h-6 text-primary" />
                  <span className="text-sm">Tudo</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backup Automático */}
          <Card className="card-padaria">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="w-5 h-5" />
                Backup Automático
              </CardTitle>
              <CardDescription>
                Configurações de backup automático do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Backup ao Abrir o Sistema</p>
                  <p className="text-xs text-muted-foreground">
                    Faz backup automaticamente quando o sistema é aberto
                  </p>
                </div>
                <Button
                  variant={backupAutomatico ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const novoValor = !backupAutomatico;
                    setBackupAutomatico(novoValor);
                    localStorage.setItem('backupAutomatico', String(novoValor));
                    toast({
                      title: novoValor ? 'Backup automático ativado!' : 'Backup automático desativado',
                    });
                  }}
                  className={backupAutomatico ? 'btn-padaria' : ''}
                >
                  {backupAutomatico ? 'Ativo' : 'Inativo'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                O backup é salvo no navegador (localStorage) e não substitui o backup completo em arquivo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de edição de produto */}
      <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Altere os dados do produto
            </DialogDescription>
          </DialogHeader>

          {produtoEditando && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  className="input-padaria"
                  value={produtoEditando.nome}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                />
              </div>

              {produtoEditando.tipoProduto === 'NORMAL' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Venda</Label>
                      <Select
                        value={produtoEditando.tipoVenda}
                        onValueChange={(value) => setProdutoEditando({ ...produtoEditando, tipoVenda: value as 'KG' | 'UNIDADE' })}
                      >
                        <SelectTrigger className="input-padaria">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_VENDA.map(tipo => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="input-padaria"
                        value={produtoEditando.valorUnit}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, valorUnit: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={produtoEditando.categoria || 'Outros'}
                      onValueChange={(value) => setProdutoEditando({ ...produtoEditando, categoria: value })}
                    >
                      <SelectTrigger className="input-padaria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={produtoEditando.categoria || 'Tortas'}
                      onValueChange={(value) => setProdutoEditando({ ...produtoEditando, categoria: value })}
                    >
                      <SelectTrigger className="input-padaria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Preços por Tamanho</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {TAMANHOS_FIXOS.map(tam => (
                        <div key={tam} className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Tamanho {tam}</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                            <Input
                              type="number"
                              step="0.01"
                              className="input-padaria pl-10"
                              value={produtoEditando.precosTamanhos?.[tam] || ''}
                              onChange={(e) => {
                                const novosPrecos = {
                                  ...(produtoEditando.precosTamanhos || {}),
                                  [tam]: parseFloat(e.target.value) || 0
                                };
                                setProdutoEditando({ ...produtoEditando, precosTamanhos: novosPrecos });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogProdutoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => produtoEditando && handleAtualizarProduto(produtoEditando)}
              className="btn-padaria"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
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
              Tem certeza que deseja excluir o produto <strong>{produtoParaExcluir?.nome}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirProduto}
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
