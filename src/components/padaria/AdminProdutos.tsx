'use client';

// AdminProdutos - Padaria Paula
// Gestão completa de produtos com CRUD - Interface otimizada com grid e modais

import { useState, useEffect, useMemo } from 'react';
import {
  Package, Plus, Edit, Trash2, Save, RefreshCw, ToggleLeft, ToggleRight,
  Cake, Search, Eye
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

const CATEGORIAS = ['Tortas', 'Docinhos', 'Salgadinhos', 'Salgados Unitários', 'Pães', 'Bolos', 'Bebidas', 'Outros'];
const TIPOS_VENDA = [
  { value: 'KG', label: 'Quilograma (kg)' },
  { value: 'UNIDADE', label: 'Unidade' },
];

export default function AdminProdutos() {
  const { toast } = useToast();

  // Estados de produtos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [dialogProdutoOpen, setDialogProdutoOpen] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Estado para novo produto
  const [modoCadastro, setModoCadastro] = useState<'COMUM' | 'ESPECIAL' | null>(null);
  const [dialogNovoOpen, setDialogNovoOpen] = useState(false);

  // Estado para produto comum
  const [produtoComum, setProdutoComum] = useState({
    nome: '',
    descricao: '',
    tipoVenda: 'UNIDADE' as 'KG' | 'UNIDADE',
    categoria: 'Outros',
    valorUnit: '',
  });

  // Estado para produto especial (torta)
  const [produtoEspecial, setProdutoEspecial] = useState({
    nome: '',
    descricao: '',
    categoria: 'Tortas',
    precos: { P: '', M: '', G: '', GG: '' } as Record<string, string>,
  });

  // Carregar produtos
  const carregarProdutos = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(produto => {
      const matchBusca = !busca || 
        produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (produto.descricao && produto.descricao.toLowerCase().includes(busca.toLowerCase()));
      const matchCategoria = filtroCategoria === 'todas' || produto.categoria === filtroCategoria;
      const matchStatus = filtroStatus === 'todos' || 
        (filtroStatus === 'ativo' && produto.ativo) ||
        (filtroStatus === 'inativo' && !produto.ativo);
      return matchBusca && matchCategoria && matchStatus;
    });
  }, [produtos, busca, filtroCategoria, filtroStatus]);

  // Agrupar produtos por categoria para melhor visualização
  const produtosPorCategoria = useMemo(() => {
    const grupos: Record<string, Produto[]> = {};
    produtosFiltrados.forEach(produto => {
      const cat = produto.categoria || 'Outros';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(produto);
    });
    return grupos;
  }, [produtosFiltrados]);

  // Abrir diálogo de novo produto
  const handleAbrirNovoProduto = (tipo: 'COMUM' | 'ESPECIAL') => {
    setModoCadastro(tipo);
    setDialogNovoOpen(true);
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
          descricao: produtoComum.descricao || null,
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
      setProdutoComum({ nome: '', descricao: '', tipoVenda: 'UNIDADE', categoria: 'Outros', valorUnit: '' });
      setDialogNovoOpen(false);
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
        description: 'Digite o nome do produto.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar se pelo menos um preço foi preenchido
    const precosPreenchidos = Object.entries(produtoEspecial.precos).filter(([, v]) => v);
    if (precosPreenchidos.length === 0) {
      toast({
        title: 'Preços obrigatórios',
        description: 'Preencha pelo menos um preço.',
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
          descricao: produtoEspecial.descricao || null,
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
      setProdutoEspecial({ nome: '', descricao: '', categoria: 'Tortas', precos: { P: '', M: '', G: '', GG: '' } });
      setDialogNovoOpen(false);
      setModoCadastro(null);

      toast({
        title: 'Produto criado!',
        description: `${produto.nome} foi adicionado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao criar produto especial:', error);
      toast({
        title: 'Erro ao criar',
        description: 'Não foi possível criar o produto.',
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

  // Card de produto compacto para grid
  const ProdutoCard = ({ produto }: { produto: Produto }) => (
    <div
      className={`relative p-3 rounded-lg border transition-all hover:shadow-md ${
        produto.tipoProduto === 'ESPECIAL'
          ? 'bg-primary/5 border-primary/30 hover:border-primary/50'
          : 'bg-card border-border/50 hover:border-border'
      } ${!produto.ativo ? 'opacity-50' : ''}`}
    >
      {/* Badge de tipo no topo */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {produto.tipoProduto === 'ESPECIAL' ? (
            <Badge className="text-[10px] h-5 bg-primary text-primary-foreground">
              <Cake className="w-3 h-3 mr-0.5" />
              Especial
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] h-5">
              {produto.tipoVenda === 'KG' ? 'Kg' : 'Un'}
            </Badge>
          )}
          {!produto.ativo && (
            <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">
              Inativo
            </Badge>
          )}
        </div>
        {/* Botões de ação */}
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleToggleAtivo(produto)}
            title={produto.ativo ? 'Desativar' : 'Ativar'}
          >
            {produto.ativo ? (
              <ToggleRight className="w-4 h-4 text-green-600" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleEditar(produto)}
            title="Editar"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => handleConfirmarExclusao(produto)}
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Nome do produto */}
      <h3 className="font-semibold text-sm truncate mb-1" title={produto.nome}>
        {produto.nome}
      </h3>

      {/* Preço(s) */}
      <div className="text-xs font-semibold text-primary mb-1">
        {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
          <div className="flex flex-wrap gap-1">
            {Object.entries(produto.precosTamanhos)
              .filter(([tam, preco]) => {
                return TAMANHOS_FIXOS.includes(tam) && preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
              })
              .sort((a, b) => TAMANHOS_FIXOS.indexOf(a[0]) - TAMANHOS_FIXOS.indexOf(b[0]))
              .slice(0, 3)
              .map(([tam, preco]) => (
                <span key={tam} className="bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">
                  {tam}: {formatarMoeda(preco)}
                </span>
              ))}
            {Object.keys(produto.precosTamanhos).length > 3 && (
              <span className="text-muted-foreground text-[10px]">+{Object.keys(produto.precosTamanhos).length - 3}</span>
            )}
          </div>
        ) : (
          formatarMoeda(produto.valorUnit)
        )}
      </div>

      {/* Categoria */}
      <div className="text-[10px] text-muted-foreground">
        {produto.categoria || 'Outros'}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header com botões de ação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-primary">Produtos</h2>
          <p className="text-sm text-muted-foreground">{produtos.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleAbrirNovoProduto('COMUM')} className="btn-padaria h-9">
            <Package className="w-4 h-4 mr-1.5" />
            Produto Comum
          </Button>
          <Button onClick={() => handleAbrirNovoProduto('ESPECIAL')} variant="outline" className="h-9 border-primary text-primary hover:bg-primary/10">
            <Cake className="w-4 h-4 mr-1.5" />
            Produto Especial
          </Button>
        </div>
      </div>

      {/* Filtros compactos */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-9 h-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-full sm:w-36 h-9">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {CATEGORIAS.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-28 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={carregarProdutos}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Grid de produtos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-240px)]">
          {produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mb-3 opacity-30" />
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="space-y-4 pr-2">
              {/* Renderizar por categoria */}
              {Object.entries(produtosPorCategoria).map(([categoria, prods]) => (
                <div key={categoria}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    {categoria}
                    <Badge variant="outline" className="text-[10px]">{prods.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                    {prods.map((produto) => (
                      <ProdutoCard key={produto.id} produto={produto} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Dialog de Novo Produto */}
      <Dialog open={dialogNovoOpen} onOpenChange={(open) => {
        setDialogNovoOpen(open);
        if (!open) {
          setModoCadastro(null);
          setProdutoComum({ nome: '', descricao: '', tipoVenda: 'UNIDADE', categoria: 'Outros', valorUnit: '' });
          setProdutoEspecial({ nome: '', descricao: '', categoria: 'Tortas', precos: { P: '', M: '', G: '', GG: '' } });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modoCadastro === 'ESPECIAL' ? <Cake className="w-5 h-5 text-primary" /> : <Package className="w-5 h-5" />}
              {modoCadastro === 'ESPECIAL' ? 'Novo Produto Especial' : 'Novo Produto Comum'}
            </DialogTitle>
            <DialogDescription>
              {modoCadastro === 'ESPECIAL' 
                ? 'Produtos especiais têm preços por tamanho (P, M, G, GG)'
                : 'Produtos comuns são vendidos por kg ou unidade'}
            </DialogDescription>
          </DialogHeader>

          {modoCadastro === 'COMUM' ? (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    placeholder="Nome do produto"
                    value={produtoComum.nome}
                    onChange={(e) => setProdutoComum({ ...produtoComum, nome: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tipo de Venda</Label>
                  <Select
                    value={produtoComum.tipoVenda}
                    onValueChange={(value) => setProdutoComum({ ...produtoComum, tipoVenda: value as 'KG' | 'UNIDADE' })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_VENDA.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select
                    value={produtoComum.categoria}
                    onValueChange={(value) => setProdutoComum({ ...produtoComum, categoria: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Valor *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="pl-10 h-9"
                      value={produtoComum.valorUnit}
                      onChange={(e) => setProdutoComum({ ...produtoComum, valorUnit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    placeholder="Descrição opcional"
                    value={produtoComum.descricao}
                    onChange={(e) => setProdutoComum({ ...produtoComum, descricao: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    placeholder="Nome do produto"
                    value={produtoEspecial.nome}
                    onChange={(e) => setProdutoEspecial({ ...produtoEspecial, nome: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Categoria</Label>
                  <Select
                    value={produtoEspecial.categoria}
                    onValueChange={(value) => setProdutoEspecial({ ...produtoEspecial, categoria: value })}
                  >
                    <SelectTrigger className="h-9">
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
              
              <div>
                <Label className="text-xs font-semibold">Preços por Tamanho</Label>
                <div className="grid grid-cols-4 gap-2 mt-1.5">
                  {TAMANHOS_FIXOS.map(tam => (
                    <div key={tam}>
                      <Label className="text-[10px] text-muted-foreground">{tam}</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          className="pl-6 h-8 text-sm"
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

              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  placeholder="Descrição opcional"
                  value={produtoEspecial.descricao}
                  onChange={(e) => setProdutoEspecial({ ...produtoEspecial, descricao: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNovoOpen(false)} className="h-9">
              Cancelar
            </Button>
            <Button 
              onClick={modoCadastro === 'COMUM' ? handleCriarProdutoComum : handleCriarProdutoEspecial} 
              className="btn-padaria h-9"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição */}
      <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Produto
            </DialogTitle>
            <DialogDescription>
              Altere os dados do produto abaixo.
            </DialogDescription>
          </DialogHeader>
          {produtoEditando && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input
                  value={produtoEditando.nome}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={produtoEditando.descricao || ''}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, descricao: e.target.value })}
                  className="h-9"
                />
              </div>
              {produtoEditando.tipoProduto === 'NORMAL' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tipo de Venda</Label>
                    <Select
                      value={produtoEditando.tipoVenda}
                      onValueChange={(value) => setProdutoEditando({ ...produtoEditando, tipoVenda: value as 'KG' | 'UNIDADE' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_VENDA.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Valor</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-10 h-9"
                        value={produtoEditando.valorUnit}
                        onChange={(e) => setProdutoEditando({ ...produtoEditando, valorUnit: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={produtoEditando.categoria || 'Outros'}
                  onValueChange={(value) => setProdutoEditando({ ...produtoEditando, categoria: value })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {produtoEditando.tipoProduto === 'ESPECIAL' && produtoEditando.precosTamanhos && (
                <div>
                  <Label className="text-xs font-semibold">Preços por Tamanho</Label>
                  <div className="grid grid-cols-4 gap-2 mt-1.5">
                    {TAMANHOS_FIXOS.map(tam => (
                      <div key={tam}>
                        <Label className="text-[10px] text-muted-foreground">{tam}</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="pl-6 h-8 text-sm"
                            value={produtoEditando.precosTamanhos?.[tam] || ''}
                            onChange={(e) => setProdutoEditando({
                              ...produtoEditando,
                              precosTamanhos: {
                                ...produtoEditando.precosTamanhos,
                                [tam]: parseFloat(e.target.value) || 0,
                              },
                            })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogProdutoOpen(false)} className="h-9">
              Cancelar
            </Button>
            <Button onClick={() => produtoEditando && handleAtualizarProduto(produtoEditando)} className="btn-padaria h-9">
              <Save className="w-4 h-4 mr-1.5" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de exclusão */}
      <AlertDialog open={dialogExcluirOpen} onOpenChange={setDialogExcluirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{produtoParaExcluir?.nome}</strong>?
              {produtoParaExcluir && (
                <span className="block mt-2 text-sm">
                  Se este produto já foi usado em pedidos, ele será desativado em vez de excluído.
                </span>
              )}
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
