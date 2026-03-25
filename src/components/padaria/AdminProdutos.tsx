'use client';

// AdminProdutos - Padaria Paula
// Gestão completa de produtos com CRUD

import { useState, useEffect } from 'react';
import {
  Package, Plus, Edit, Trash2, Save, RefreshCw, ToggleLeft, ToggleRight,
  Cake, Search, Filter, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = !busca || 
      produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (produto.descricao && produto.descricao.toLowerCase().includes(busca.toLowerCase()));
    const matchCategoria = filtroCategoria === 'todas' || produto.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'todos' || 
      (filtroStatus === 'ativo' && produto.ativo) ||
      (filtroStatus === 'inativo' && !produto.ativo);
    return matchBusca && matchCategoria && matchStatus;
  });

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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Produtos</h2>
          <p className="text-muted-foreground">Gerencie os produtos da padaria</p>
        </div>
        <Button onClick={() => setModoCadastro('COMUM')} className="btn-padaria">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <Card className="card-padaria">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                className="pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={carregarProdutos}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de cadastro */}
      {modoCadastro && (
        <Card className="card-padaria border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {modoCadastro === 'ESPECIAL' ? <Cake className="w-5 h-5 text-primary" /> : <Package className="w-5 h-5" />}
              {modoCadastro === 'ESPECIAL' ? 'Novo Produto Especial' : 'Novo Produto'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {modoCadastro === 'COMUM' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Nome do produto"
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_VENDA.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
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
                  <div className="space-y-2">
                    <Label>Valor *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={produtoComum.valorUnit}
                      onChange={(e) => setProdutoComum({ ...produtoComum, valorUnit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descrição opcional"
                    value={produtoComum.descricao}
                    onChange={(e) => setProdutoComum({ ...produtoComum, descricao: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Nome do produto"
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
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descrição opcional"
                    value={produtoEspecial.descricao}
                    onChange={(e) => setProdutoEspecial({ ...produtoEspecial, descricao: e.target.value })}
                  />
                </div>
              </>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setModoCadastro(null)}>
                Cancelar
              </Button>
              {modoCadastro === 'COMUM' ? (
                <Button onClick={handleCriarProdutoComum} className="btn-padaria">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar
                </Button>
              ) : (
                <Button onClick={handleCriarProdutoEspecial} className="btn-padaria">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de produtos */}
      <Card className="card-padaria">
        <CardHeader>
          <CardTitle className="text-lg">
            Produtos ({produtosFiltrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-2">
                {produtosFiltrados.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado</p>
                ) : (
                  produtosFiltrados.map((produto) => (
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
                              Especial
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
                                .filter(([tam, preco]) => {
                                  const tamanhosValidos = ['P', 'M', 'G', 'GG'];
                                  return tamanhosValidos.includes(tam) && preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                                })
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
                        {produto.descricao && (
                          <p className="text-xs text-muted-foreground mt-1">{produto.descricao}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAtivo(produto)}
                          className={produto.ativo ? 'text-primary' : 'text-muted-foreground'}
                          title={produto.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {produto.ativo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
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
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={dialogProdutoOpen} onOpenChange={setDialogProdutoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Altere os dados do produto abaixo.
            </DialogDescription>
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
                <Label>Descrição</Label>
                <Input
                  value={produtoEditando.descricao || ''}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, descricao: e.target.value })}
                />
              </div>
              {produtoEditando.tipoProduto === 'NORMAL' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Venda</Label>
                      <Select
                        value={produtoEditando.tipoVenda}
                        onValueChange={(value) => setProdutoEditando({ ...produtoEditando, tipoVenda: value as 'KG' | 'UNIDADE' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_VENDA.map(tipo => (
                            <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  </div>
                </>
              )}
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
              {produtoEditando.tipoProduto === 'ESPECIAL' && produtoEditando.precosTamanhos && (
                <div className="space-y-2">
                  <Label className="font-semibold">Preços por Tamanho</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TAMANHOS_FIXOS.map(tam => (
                      <div key={tam} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Tamanho {tam}</Label>
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
            <Button variant="outline" onClick={() => setDialogProdutoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => produtoEditando && handleAtualizarProduto(produtoEditando)} className="btn-padaria">
              <Save className="w-4 h-4 mr-2" />
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
              <AlertTriangle className="w-5 h-5 text-destructive" />
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
