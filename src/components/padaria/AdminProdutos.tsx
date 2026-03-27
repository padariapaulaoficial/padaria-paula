'use client';

// AdminProdutos - Padaria Paula
// Sistema de gestão de produtos com modais e grid otimizado

import { useState, useEffect, useMemo } from 'react';
import {
  Package, Plus, Grid3X3, List, Search, Edit, Trash2, ToggleLeft, ToggleRight,
  Cake, X, Check, RefreshCw, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useLoadingFetch } from '@/hooks/useLoadingFetch';
import { formatarMoeda } from '@/store/usePedidoStore';

// Tamanhos fixos para produtos especiais
const TAMANHOS_FIXOS = ['P', 'M', 'G', 'GG'];

// Categorias disponíveis
const CATEGORIAS = ['Tortas', 'Docinhos', 'Salgadinhos', 'Salgados Unitários', 'Pães', 'Bolos', 'Bebidas', 'Outros'];

// Tipos de venda
const TIPOS_VENDA = [
  { value: 'KG', label: 'Quilograma (kg)' },
  { value: 'UNIDADE', label: 'Unidade' },
];

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

export default function AdminProdutos() {
  const { toast } = useToast();
  const { showLoading, hideLoading } = useLoadingFetch();

  // Estados de produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de modais
  const [modalCadastroComum, setModalCadastroComum] = useState(false);
  const [modalCadastroEspecial, setModalCadastroEspecial] = useState(false);
  const [modalProdutos, setModalProdutos] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  // Estados de exclusão
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);

  // Estados de visualização
  const [visaoGrid, setVisaoGrid] = useState(false); // Lista como padrão
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

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

  // Carregar produtos
  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Produtos filtrados
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase());
      const matchCategoria = filtroCategoria === 'TODOS' || p.categoria === filtroCategoria;
      const matchStatus = filtroStatus === 'TODOS' || 
        (filtroStatus === 'ATIVO' && p.ativo) || 
        (filtroStatus === 'INATIVO' && !p.ativo);
      return matchBusca && matchCategoria && matchStatus;
    });
  }, [produtos, busca, filtroCategoria, filtroStatus]);

  // Contagem por categoria
  const contagemPorCategoria = useMemo(() => {
    const contagem: Record<string, number> = { TODOS: produtos.length };
    produtos.forEach(p => {
      const cat = p.categoria || 'Outros';
      contagem[cat] = (contagem[cat] || 0) + 1;
    });
    return contagem;
  }, [produtos]);

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

    showLoading('Cadastrando produto...');

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
        throw new Error(produto.error || 'Erro ao criar');
      }

      setProdutos([produto, ...produtos]);
      setProdutoComum({ nome: '', tipoVenda: 'UNIDADE', categoria: 'Outros', valorUnit: '' });
      setModalCadastroComum(false);

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
    } finally {
      hideLoading();
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

    showLoading('Cadastrando torta...');

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
        throw new Error(produto.error || 'Erro ao criar');
      }

      setProdutos([produto, ...produtos]);
      setProdutoEspecial({ nome: '', categoria: 'Tortas', precos: { P: '', M: '', G: '', GG: '' } });
      setModalCadastroEspecial(false);

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
    } finally {
      hideLoading();
    }
  };

  // Atualizar produto
  const handleAtualizarProduto = async (produto: Produto) => {
    showLoading('Atualizando produto...');

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
        throw new Error(atualizado.error || 'Erro ao atualizar');
      }

      setProdutos(produtos.map(p => p.id === atualizado.id ? atualizado : p));
      setProdutoEditando(null);
      setModalEdicao(false);

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
    } finally {
      hideLoading();
    }
  };

  // Excluir produto
  const handleExcluirProduto = async () => {
    if (!produtoParaExcluir) return;

    showLoading('Excluindo produto...');

    try {
      const res = await fetch(`/api/produtos?id=${produtoParaExcluir.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir');
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
    } finally {
      hideLoading();
    }
  };

  // Alternar status do produto
  const handleToggleAtivo = async (produto: Produto) => {
    await handleAtualizarProduto({ ...produto, ativo: !produto.ativo });
  };

  // Abrir edição
  const handleEditar = (produto: Produto) => {
    setProdutoEditando({ ...produto });
    setModalEdicao(true);
    setModalProdutos(false);
  };

  // Abrir exclusão
  const handleConfirmarExclusao = (produto: Produto) => {
    setProdutoParaExcluir(produto);
    setDialogExcluirOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header com ações principais */}
      <Card className="card-padaria">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Info */}
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Produtos
              </h3>
              <p className="text-sm text-muted-foreground">
                {produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Ações */}
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                onClick={() => setModalProdutos(true)}
                variant="outline"
                className="gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Ver Produtos
              </Button>
              <Button
                onClick={() => setModalCadastroComum(true)}
                variant="outline"
                className="gap-2 border-primary text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4" />
                Produto Comum
              </Button>
              <Button
                onClick={() => setModalCadastroEspecial(true)}
                className="gap-2 btn-padaria"
              >
                <Cake className="w-4 h-4" />
                Produto Especial
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por categoria */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CATEGORIAS.slice(0, 4).map(cat => (
          <Card 
            key={cat} 
            className="card-padaria cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => { setFiltroCategoria(cat); setModalProdutos(true); }}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{contagemPorCategoria[cat] || 0}</p>
              <p className="text-xs text-muted-foreground">{cat}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Produtos Cadastrados */}
      <Dialog open={modalProdutos} onOpenChange={setModalProdutos}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="w-5 h-5" />
              Produtos Cadastrados
            </DialogTitle>
            <DialogDescription>
              {produtosFiltrados.length} de {produtos.length} produtos
            </DialogDescription>
          </DialogHeader>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                className="pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas categorias</SelectItem>
                {CATEGORIAS.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ATIVO">Ativos</SelectItem>
                <SelectItem value="INATIVO">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={visaoGrid ? 'default' : 'outline'}
                size="icon"
                onClick={() => setVisaoGrid(true)}
                className={visaoGrid ? 'btn-padaria' : ''}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={!visaoGrid ? 'default' : 'outline'}
                size="icon"
                onClick={() => setVisaoGrid(false)}
                className={!visaoGrid ? 'btn-padaria' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lista/Grid de Produtos com scroll */}
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Package className="w-12 h-12 mb-2 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </div>
            ) : visaoGrid ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    className={`relative group rounded-lg border-2 p-3 transition-all hover:shadow-md cursor-pointer ${
                      produto.tipoProduto === 'ESPECIAL'
                        ? 'bg-primary/5 border-primary/30 hover:border-primary'
                        : 'bg-card border-border hover:border-primary/50'
                    } ${!produto.ativo ? 'opacity-50' : ''}`}
                  >
                    {/* Badge de tipo */}
                    {produto.tipoProduto === 'ESPECIAL' && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="text-[10px] bg-primary text-primary-foreground">
                          <Cake className="w-3 h-3 mr-1" />
                          Torta
                        </Badge>
                      </div>
                    )}

                    {/* Status */}
                    {!produto.ativo && (
                      <Badge variant="outline" className="absolute top-1 left-1 text-[10px]">
                        Inativo
                      </Badge>
                    )}

                    {/* Conteúdo */}
                    <div className="mt-2" onClick={() => handleEditar(produto)}>
                      <p className="font-semibold text-sm truncate">{produto.nome}</p>
                      <p className="text-xs text-muted-foreground mb-2">{produto.categoria}</p>
                      
                      {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
                        <div className="space-y-0.5">
                          {Object.entries(produto.precosTamanhos)
                            .filter(([, preco]) => preco !== undefined && preco !== null && !isNaN(preco))
                            .slice(0, 3)
                            .map(([tam, preco]) => (
                              <div key={tam} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{tam}:</span>
                                <span className="font-medium text-primary">{formatarMoeda(preco)}</span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary" className="text-[10px]">
                            {produto.tipoVenda === 'KG' ? 'Kg' : 'Un'}
                          </Badge>
                          <span className="font-bold text-primary text-sm">{formatarMoeda(produto.valorUnit)}</span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleToggleAtivo(produto); }}
                        className="h-7 w-7 p-0"
                        title={produto.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {produto.ativo ? (
                          <ToggleRight className="w-4 h-4 text-primary" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleConfirmarExclusao(produto); }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      produto.tipoProduto === 'ESPECIAL'
                        ? 'bg-primary/5 border-primary/30 hover:bg-primary/10'
                        : 'bg-card border-border hover:bg-muted/50'
                    } ${!produto.ativo ? 'opacity-50' : ''}`}
                    onClick={() => handleEditar(produto)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        produto.tipoProduto === 'ESPECIAL' ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        {produto.tipoProduto === 'ESPECIAL' ? (
                          <Cake className="w-5 h-5 text-primary" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{produto.nome}</span>
                          {!produto.ativo && (
                            <Badge variant="outline" className="text-[10px]">Inativo</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{produto.categoria}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {produto.tipoVenda === 'KG' ? 'Kg' : 'Un'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
                          <span className="text-xs text-muted-foreground">
                            {Object.keys(produto.precosTamanhos).length} tamanhos
                          </span>
                        ) : (
                          <span className="font-bold text-primary">{formatarMoeda(produto.valorUnit)}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleToggleAtivo(produto); }}
                          className="h-8 w-8 p-0"
                        >
                          {produto.ativo ? (
                            <ToggleRight className="w-4 h-4 text-primary" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleConfirmarExclusao(produto); }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro de Produto Comum */}
      <Dialog open={modalCadastroComum} onOpenChange={setModalCadastroComum}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Novo Produto Comum
            </DialogTitle>
            <DialogDescription>
              Produto vendido por KG ou Unidade com preço fixo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Produto *</Label>
              <Input
                placeholder="Ex: Pão Francês, Bolo de Chocolate..."
                value={produtoComum.nome}
                onChange={(e) => setProdutoComum({ ...produtoComum, nome: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Venda *</Label>
                <Select
                  value={produtoComum.tipoVenda}
                  onValueChange={(value) => setProdutoComum({ ...produtoComum, tipoVenda: value })}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Valor *
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={produtoComum.valorUnit}
                onChange={(e) => setProdutoComum({ ...produtoComum, valorUnit: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setModalCadastroComum(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarProdutoComum} className="btn-padaria">
                <Check className="w-4 h-4 mr-2" />
                Cadastrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro de Produto Especial */}
      <Dialog open={modalCadastroEspecial} onOpenChange={setModalCadastroEspecial}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Cake className="w-5 h-5" />
              Nova Torta (Produto Especial)
            </DialogTitle>
            <DialogDescription>
              Tortas com tamanhos e preços diferenciados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Torta *</Label>
                <Input
                  placeholder="Ex: Torta de Frango"
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Preços por Tamanho</Label>
              <div className="grid grid-cols-2 gap-3">
                {TAMANHOS_FIXOS.map(tam => (
                  <div key={tam} className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Tamanho {tam}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        className="pl-10"
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
                Preencha pelo menos um tamanho
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setModalCadastroEspecial(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCriarProdutoEspecial} className="btn-padaria">
                <Check className="w-4 h-4 mr-2" />
                Cadastrar Torta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={modalEdicao} onOpenChange={setModalEdicao}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Produto
            </DialogTitle>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Venda</Label>
                  <Select
                    value={produtoEditando.tipoVenda}
                    onValueChange={(value) => setProdutoEditando({ ...produtoEditando, tipoVenda: value })}
                  >
                    <SelectTrigger>
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
                    value={produtoEditando.categoria || 'Outros'}
                    onValueChange={(value) => setProdutoEditando({ ...produtoEditando, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {produtoEditando.tipoProduto === 'ESPECIAL' ? (
                <div className="space-y-3">
                  <Label className="font-semibold">Preços por Tamanho</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {TAMANHOS_FIXOS.map(tam => (
                      <div key={tam} className="space-y-1">
                        <Label className="text-sm text-muted-foreground">{tam}</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="pl-10"
                            value={produtoEditando.precosTamanhos?.[tam] || ''}
                            onChange={(e) => setProdutoEditando({
                              ...produtoEditando,
                              precosTamanhos: {
                                ...(produtoEditando.precosTamanhos || {}),
                                [tam]: parseFloat(e.target.value) || 0
                              }
                            })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={produtoEditando.valorUnit}
                    onChange={(e) => setProdutoEditando({ ...produtoEditando, valorUnit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label>Produto ativo</Label>
                <Button
                  variant={produtoEditando.ativo ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProdutoEditando({ ...produtoEditando, ativo: !produtoEditando.ativo })}
                  className={produtoEditando.ativo ? 'btn-padaria' : ''}
                >
                  {produtoEditando.ativo ? 'Ativo' : 'Inativo'}
                </Button>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setModalEdicao(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleAtualizarProduto(produtoEditando)} className="btn-padaria">
                  <Check className="w-4 h-4 mr-2" />
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
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{produtoParaExcluir?.nome}</strong>?
              <br />
              Se o produto já foi usado em pedidos, ele será desativado.
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
