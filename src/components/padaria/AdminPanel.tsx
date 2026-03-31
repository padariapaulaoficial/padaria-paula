'use client';

// AdminPanel - Padaria Paula
// Painel administrativo simplificado para evitar erros

import { useState, useEffect } from 'react';
import {
  Settings, Package, Store, Plus, Edit, Trash2, Save,
  RefreshCw, ToggleLeft, ToggleRight, Lock, Cake, MessageCircle,
  BarChart3, Globe, MapPin, DollarSign, Clock, Search, X
} from 'lucide-react';
import dynamic from 'next/dynamic';
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

// Carregar Dashboard dinamicamente para evitar erros de SSR
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
  ssr: false,
});

// Importar AdminProdutos
import AdminProdutos from './AdminProdutos';

// Tamanhos fixos para produtos especiais
const TAMANHOS_FIXOS = ['P', 'M', 'G', 'GG'];

// Interface do produto
interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  tipoVenda: string;
  valorUnit: number;
  categoria: string | null;
  ativo: boolean;
  tipoProduto: string;
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
  mensagemOrcamento?: string | null;
  mensagemProntoRetirada?: string | null;
  mensagemProntoEntrega?: string | null;
  mensagemAprovacao?: string | null;
  mensagemRevisao?: string | null;
  diasAlertaProducao?: number | null;
}

interface ConfiguracaoCatalogo {
  id: string;
  pedidoMinimo: number;
  mensagemBoasVindas: string;
  mensagemDadosCliente: string;
  exibirBusca: boolean;
  exibirWhatsapp: boolean;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
  diasFuncionamento: string | null;
}

interface Bairro {
  id: string;
  nome: string;
  taxaEntrega: number;
  ativo: boolean;
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

  // Estado para controlar qual tipo de produto está sendo cadastrado
  const [modoCadastro, setModoCadastro] = useState<'COMUM' | 'ESPECIAL' | null>(null);

  // Estado para produto comum
  const [produtoComum, setProdutoComum] = useState({
    nome: '',
    tipoVenda: 'UNIDADE',
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
    mensagemOrcamento: '',
    mensagemProntoRetirada: '',
    mensagemProntoEntrega: '',
    mensagemAprovacao: '',
    mensagemRevisao: '',
    diasAlertaProducao: 3,
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

  // Estados do catálogo
  const [configCatalogo, setConfigCatalogo] = useState<ConfiguracaoCatalogo | null>(null);
  const [loadingConfigCatalogo, setLoadingConfigCatalogo] = useState(true);
  const [salvandoConfigCatalogo, setSalvandoConfigCatalogo] = useState(false);

  // Estados de bairros
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [loadingBairros, setLoadingBairros] = useState(true);
  const [novoBairro, setNovoBairro] = useState({ nome: '', taxaEntrega: '' });
  const [bairroEditando, setBairroEditando] = useState<Bairro | null>(null);
  const [salvandoBairro, setSalvandoBairro] = useState(false);

  // Carregar produtos
  const carregarProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
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
        mensagemOrcamento: data.mensagemOrcamento || '',
        mensagemProntoRetirada: data.mensagemProntoRetirada || '',
        mensagemProntoEntrega: data.mensagemProntoEntrega || '',
        mensagemAprovacao: data.mensagemAprovacao || '',
        mensagemRevisao: data.mensagemRevisao || '',
        diasAlertaProducao: data.diasAlertaProducao || 3,
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
    carregarConfigCatalogo();
    carregarBairros();
  }, []);

  // Carregar configurações do catálogo
  const carregarConfigCatalogo = async () => {
    setLoadingConfigCatalogo(true);
    try {
      const res = await fetch('/api/admin/catalogo-config');
      const data = await res.json();
      setConfigCatalogo(data);
    } catch (error) {
      console.error('Erro ao carregar config do catálogo:', error);
    } finally {
      setLoadingConfigCatalogo(false);
    }
  };

  // Carregar bairros
  const carregarBairros = async () => {
    setLoadingBairros(true);
    try {
      const res = await fetch('/api/admin/bairros');
      const data = await res.json();
      setBairros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar bairros:', error);
      setBairros([]);
    } finally {
      setLoadingBairros(false);
    }
  };

  // Salvar configurações do catálogo
  const handleSalvarConfigCatalogo = async () => {
    if (!configCatalogo) return;
    setSalvandoConfigCatalogo(true);
    try {
      const res = await fetch('/api/admin/catalogo-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configCatalogo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfigCatalogo(data);
      toast({
        title: 'Configurações salvas!',
        description: 'As configurações do catálogo foram atualizadas.',
      });
    } catch (error) {
      console.error('Erro ao salvar config do catálogo:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSalvandoConfigCatalogo(false);
    }
  };

  // Criar bairro
  const handleCriarBairro = async () => {
    if (!novoBairro.nome.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    setSalvandoBairro(true);
    try {
      const res = await fetch('/api/admin/bairros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoBairro.nome.trim(),
          taxaEntrega: parseFloat(novoBairro.taxaEntrega) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBairros([...bairros, data]);
      setNovoBairro({ nome: '', taxaEntrega: '' });
      toast({ title: 'Bairro adicionado!' });
    } catch (error) {
      console.error('Erro ao criar bairro:', error);
      toast({ title: 'Erro ao adicionar bairro', variant: 'destructive' });
    } finally {
      setSalvandoBairro(false);
    }
  };

  // Atualizar bairro
  const handleAtualizarBairro = async (bairro: Bairro) => {
    try {
      const res = await fetch('/api/admin/bairros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bairro),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBairros(bairros.map(b => b.id === data.id ? data : b));
      setBairroEditando(null);
      toast({ title: 'Bairro atualizado!' });
    } catch (error) {
      console.error('Erro ao atualizar bairro:', error);
      toast({ title: 'Erro ao atualizar bairro', variant: 'destructive' });
    }
  };

  // Excluir bairro
  const handleExcluirBairro = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/bairros?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setBairros(bairros.filter(b => b.id !== id));
      toast({ title: 'Bairro removido!' });
    } catch (error) {
      console.error('Erro ao excluir bairro:', error);
      toast({ title: 'Erro ao excluir bairro', variant: 'destructive' });
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
          valorUnit: parseFloat(precosPreenchidos[0][1]),
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

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50 h-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-2 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Dash</span>
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-2 text-xs sm:text-sm">
            <Package className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Produtos</span>
            <span className="sm:hidden">Prod.</span>
          </TabsTrigger>
          <TabsTrigger value="catalogo" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-2 text-xs sm:text-sm">
            <Globe className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Catálogo</span>
            <span className="sm:hidden">Cat.</span>
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-2 text-xs sm:text-sm">
            <Store className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Configurações</span>
            <span className="sm:hidden">Config.</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-2 text-xs sm:text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Segurança</span>
            <span className="sm:hidden">Seg.</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab de Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <AdminDashboard />
        </TabsContent>

        {/* Tab de Produtos */}
        <TabsContent value="produtos" className="space-y-4">
          <AdminProdutos />
        </TabsContent>

        {/* Tab de Catálogo */}
        <TabsContent value="catalogo" className="space-y-4">
          {/* Configurações do Catálogo */}
          <Card className="card-padaria">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Configurações do Catálogo Online
              </CardTitle>
              <CardDescription>
                Configure como seu catálogo público funciona para seus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingConfigCatalogo ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : configCatalogo && (
                <>
                  {/* Pedido Mínimo */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Pedido Mínimo
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="input-padaria"
                      value={configCatalogo.pedidoMinimo || 0}
                      onChange={(e) => setConfigCatalogo({
                        ...configCatalogo,
                        pedidoMinimo: parseFloat(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor mínimo para fazer pedido. Deixe 0 para sem mínimo.
                    </p>
                  </div>

                  {/* Horários */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Abertura
                      </Label>
                      <Input
                        type="time"
                        className="input-padaria"
                        value={configCatalogo.horarioAbertura || '08:00'}
                        onChange={(e) => setConfigCatalogo({
                          ...configCatalogo,
                          horarioAbertura: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Fechamento
                      </Label>
                      <Input
                        type="time"
                        className="input-padaria"
                        value={configCatalogo.horarioFechamento || '20:00'}
                        onChange={(e) => setConfigCatalogo({
                          ...configCatalogo,
                          horarioFechamento: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="space-y-2">
                    <Label>Mensagem para Dados do Cliente</Label>
                    <Textarea
                      className="input-padaria min-h-[80px]"
                      value={configCatalogo.mensagemDadosCliente || ''}
                      onChange={(e) => setConfigCatalogo({
                        ...configCatalogo,
                        mensagemDadosCliente: e.target.value
                      })}
                      placeholder="Falta pouco! Preciso dos seus dados para finalizar..."
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        <span className="text-sm">Exibir busca de produtos</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfigCatalogo({
                          ...configCatalogo,
                          exibirBusca: !configCatalogo.exibirBusca
                        })}
                      >
                        {configCatalogo.exibirBusca ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">Exibir botão do WhatsApp</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfigCatalogo({
                          ...configCatalogo,
                          exibirWhatsapp: !configCatalogo.exibirWhatsapp
                        })}
                      >
                        {configCatalogo.exibirWhatsapp ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleSalvarConfigCatalogo}
                    className="btn-padaria"
                    disabled={salvandoConfigCatalogo}
                  >
                    {salvandoConfigCatalogo ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bairros de Entrega */}
          <Card className="card-padaria">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Bairros de Entrega
              </CardTitle>
              <CardDescription>
                Configure os bairros e suas taxas de tele-entrega
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingBairros ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Adicionar novo bairro */}
                  <div className="flex gap-2">
                    <Input
                      className="input-padaria flex-1"
                      placeholder="Nome do bairro"
                      value={novoBairro.nome}
                      onChange={(e) => setNovoBairro({ ...novoBairro, nome: e.target.value })}
                    />
                    <Input
                      className="input-padaria w-28"
                      placeholder="Taxa R$"
                      type="number"
                      step="0.01"
                      value={novoBairro.taxaEntrega}
                      onChange={(e) => setNovoBairro({ ...novoBairro, taxaEntrega: e.target.value })}
                    />
                    <Button
                      onClick={handleCriarBairro}
                      className="btn-padaria"
                      disabled={salvandoBairro}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Lista de bairros */}
                  <div className="space-y-2">
                    {bairros.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum bairro cadastrado. Adicione bairros para oferecer tele-entrega.
                      </p>
                    ) : (
                      bairros.map((bairro) => (
                        <div
                          key={bairro.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          {bairroEditando?.id === bairro.id ? (
                            <>
                              <Input
                                className="input-padaria flex-1 mr-2"
                                value={bairroEditando.nome}
                                onChange={(e) => setBairroEditando({
                                  ...bairroEditando,
                                  nome: e.target.value
                                })}
                              />
                              <Input
                                className="input-padaria w-24 mr-2"
                                type="number"
                                step="0.01"
                                value={bairroEditando.taxaEntrega}
                                onChange={(e) => setBairroEditando({
                                  ...bairroEditando,
                                  taxaEntrega: parseFloat(e.target.value) || 0
                                })}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAtualizarBairro(bairroEditando)}
                                className="btn-padaria"
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setBairroEditando(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{bairro.nome}</span>
                                {bairro.taxaEntrega > 0 ? (
                                  <Badge variant="secondary">
                                    {formatarMoeda(bairro.taxaEntrega)}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-green-600">
                                    Grátis
                                  </Badge>
                                )}
                                {!bairro.ativo && (
                                  <Badge variant="destructive">Inativo</Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setBairroEditando(bairro)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleExcluirBairro(bairro.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Link do Catálogo */}
          <Card className="card-padaria bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <Globe className="w-10 h-10 mx-auto mb-3 text-amber-600" />
                <h3 className="font-semibold text-lg mb-2">Seu Catálogo Online</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Compartilhe este link com seus clientes
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                  <code className="text-sm flex-1 truncate text-amber-700 dark:text-amber-400">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/catalogo
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/catalogo`);
                      toast({ title: 'Link copiado!' });
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
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
              
              {/* Mensagens WhatsApp */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                  <MessageCircle className="w-4 h-4" />
                  Mensagens do WhatsApp
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-sm">Mensagem de Orçamento</Label>
                  <Textarea
                    className="input-padaria min-h-[60px]"
                    value={configEditada.mensagemOrcamento || ''}
                    onChange={(e) => setConfigEditada({ ...configEditada, mensagemOrcamento: e.target.value })}
                    placeholder="Olá {nome}! Segue seu orçamento..."
                  />
                  <p className="text-[10px] text-muted-foreground">Use {"{nome}"} para inserir o nome do cliente</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Mensagem de Aprovação</Label>
                  <Textarea
                    className="input-padaria min-h-[60px]"
                    value={configEditada.mensagemAprovacao || ''}
                    onChange={(e) => setConfigEditada({ ...configEditada, mensagemAprovacao: e.target.value })}
                    placeholder="Olá {nome}! Seu orçamento foi aprovado!"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Mensagem de Revisão</Label>
                  <Textarea
                    className="input-padaria min-h-[60px]"
                    value={configEditada.mensagemRevisao || ''}
                    onChange={(e) => setConfigEditada({ ...configEditada, mensagemRevisao: e.target.value })}
                    placeholder="Olá {nome}! Por favor, revise seu pedido..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Mensagem "Pronto" - Cliente Retira</Label>
                  <Textarea
                    className="input-padaria min-h-[60px]"
                    value={configEditada.mensagemProntoRetirada || ''}
                    onChange={(e) => setConfigEditada({ ...configEditada, mensagemProntoRetirada: e.target.value })}
                    placeholder="Olá {nome}! Seu pedido está PRONTO!"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Mensagem "Pronto" - Tele Entrega</Label>
                  <Textarea
                    className="input-padaria min-h-[60px]"
                    value={configEditada.mensagemProntoEntrega || ''}
                    onChange={(e) => setConfigEditada({ ...configEditada, mensagemProntoEntrega: e.target.value })}
                    placeholder="Olá {nome}! Seu pedido está a caminho!"
                  />
                </div>
              </div>
              
              {/* Alerta de Produção */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                  <Settings className="w-4 h-4" />
                  Alerta de Produção
                </h4>
                
                <div className="space-y-2">
                  <Label className="text-sm">Dias de antecedência para alerta</Label>
                  <Select
                    value={configEditada.diasAlertaProducao?.toString() || '3'}
                    onValueChange={(value) => setConfigEditada({ ...configEditada, diasAlertaProducao: parseInt(value) })}
                  >
                    <SelectTrigger className="input-padaria">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 dias antes</SelectItem>
                      <SelectItem value="5">5 dias antes</SelectItem>
                      <SelectItem value="7">7 dias antes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Quantos dias antes da entrega você deseja receber alerta para preparar o pedido
                  </p>
                </div>
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
                    Alterar Senha
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Senha Admin */}
          <Card className="card-padaria max-w-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Alterar Senha Administrativa
              </CardTitle>
              <CardDescription>
                Senha para acessar a área administrativa
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
                <Label>Nova Senha</Label>
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
      </Tabs>

      {/* Dialog de edição de produto */}
      <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {produtoEditando && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={produtoEditando.nome}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={produtoEditando.valorUnit}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, valorUnit: parseFloat(e.target.value) })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogProdutoOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={() => handleAtualizarProduto(produtoEditando)} className="btn-padaria flex-1">
                  Salvar
                </Button>
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
              Tem certeza que deseja excluir o produto "{produtoParaExcluir?.nome}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirProduto} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
