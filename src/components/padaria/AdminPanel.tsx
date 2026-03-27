'use client';

// AdminPanel - Padaria Paula
// Painel administrativo simplificado para evitar erros

import { useState, useEffect } from 'react';
import {
  Settings, Package, Store, Plus, Edit, Trash2, Save,
  RefreshCw, ToggleLeft, ToggleRight, Lock, Cake, MessageCircle,
  BarChart3
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
  }, []);

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
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
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
        </TabsList>

        {/* Tab de Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <AdminDashboard />
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
                      onValueChange={(value) => setProdutoComum({ ...produtoComum, tipoVenda: value })}
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
                                  .filter(([, preco]) => preco !== undefined && preco !== null && !isNaN(preco))
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
