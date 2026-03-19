'use client';

// ProdutosPorCategoria - Padaria Paula
// Lista de produtos dentro de uma categoria específica

import { useState } from 'react';
import { Plus, Scale, Hash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePedidoStore, calcularSubtotal, formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
import { useToast } from '@/hooks/use-toast';

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
}

interface ProdutosPorCategoriaProps {
  produtos: Produto[];
  categoria: string;
  onProdutoAdicionado?: () => void;
}

// Opções de KG: 500g até 10kg (de 500g em 500g)
const OPCOES_KG = [
  { valor: 0, label: 'Selecione' },
  { valor: 0.5, label: '500g' },
  { valor: 1.0, label: '1 kg' },
  { valor: 1.5, label: '1,5 kg' },
  { valor: 2.0, label: '2 kg' },
  { valor: 2.5, label: '2,5 kg' },
  { valor: 3.0, label: '3 kg' },
  { valor: 3.5, label: '3,5 kg' },
  { valor: 4.0, label: '4 kg' },
  { valor: 4.5, label: '4,5 kg' },
  { valor: 5.0, label: '5 kg' },
  { valor: 5.5, label: '5,5 kg' },
  { valor: 6.0, label: '6 kg' },
  { valor: 6.5, label: '6,5 kg' },
  { valor: 7.0, label: '7 kg' },
  { valor: 7.5, label: '7,5 kg' },
  { valor: 8.0, label: '8 kg' },
  { valor: 8.5, label: '8,5 kg' },
  { valor: 9.0, label: '9 kg' },
  { valor: 9.5, label: '9,5 kg' },
  { valor: 10.0, label: '10 kg' },
];

export default function ProdutosPorCategoria({ produtos, categoria, onProdutoAdicionado }: ProdutosPorCategoriaProps) {
  const { adicionarItem, itens } = usePedidoStore();
  const { toast } = useToast();

  const [quantidadesKG, setQuantidadesKG] = useState<Record<string, number>>({});
  const [quantidadesUnidade, setQuantidadesUnidade] = useState<Record<string, string>>({});
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [produtosAdicionados, setProdutosAdicionados] = useState<Set<string>>(new Set());

  // Ícone por tipo de venda
  const getIconeTipoVenda = (tipo: string) => {
    switch (tipo) {
      case 'KG': return <Scale className="w-4 h-4" />;
      case 'UNIDADE':
      default: return <Hash className="w-4 h-4" />;
    }
  };

  // Contar itens no carrinho por produto
  const contarItensNoCarrinho = (produtoId: string) => {
    return itens.filter(item => item.produtoId === produtoId).length;
  };

  // Adicionar ao carrinho
  const handleAdicionar = (produto: Produto) => {
    // Produto especial (Torta) - precisa de tamanho selecionado
    if (produto.tipoProduto === 'ESPECIAL') {
      const tamanho = tamanhosSelecionados[produto.id];
      if (!tamanho) {
        toast({
          title: 'Selecione o tamanho',
          description: 'Escolha um tamanho para a torta.',
          variant: 'destructive',
        });
        return;
      }

      const preco = produto.precosTamanhos?.[tamanho] || produto.valorUnit;
      const observacao = observacoes[produto.id] || '';

      adicionarItem({
        produtoId: produto.id,
        nome: `${produto.nome} (${tamanho})`,
        quantidadePedida: 1,
        quantidade: 1,
        valorUnit: preco,
        tipoVenda: 'UNIDADE',
        subtotalPedida: preco,
        subtotal: preco,
        observacao: observacao || undefined,
        tamanho: tamanho,
      });

      // Limpar seleção
      setTamanhosSelecionados(prev => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });
      setObservacoes(prev => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });

      // Marcar como adicionado
      setProdutosAdicionados(prev => new Set(prev).add(produto.id));

      toast({
        title: 'Produto adicionado!',
        description: `${produto.nome} (${tamanho}) - ${formatarMoeda(preco)}`,
      });

      onProdutoAdicionado?.();
      return;
    }

    // Produto normal
    let quantidade = 0;

    if (produto.tipoVenda === 'KG') {
      quantidade = quantidadesKG[produto.id] || 0;
    } else {
      const valor = quantidadesUnidade[produto.id];
      quantidade = valor ? parseFloat(valor) : 0;
    }

    if (!quantidade || quantidade <= 0) {
      toast({
        title: 'Selecione a quantidade',
        description: 'Escolha uma quantidade para adicionar ao pedido.',
        variant: 'destructive',
      });
      return;
    }

    const subtotal = calcularSubtotal(quantidade, produto.valorUnit, produto.tipoVenda);

    adicionarItem({
      produtoId: produto.id,
      nome: produto.nome,
      quantidadePedida: quantidade,
      quantidade: quantidade,
      valorUnit: produto.valorUnit,
      tipoVenda: produto.tipoVenda,
      subtotalPedida: subtotal,
      subtotal: subtotal,
    });

    // Limpar seleção
    if (produto.tipoVenda === 'KG') {
      setQuantidadesKG(prev => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });
    } else {
      setQuantidadesUnidade(prev => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });
    }

    // Marcar como adicionado
    setProdutosAdicionados(prev => new Set(prev).add(produto.id));

    toast({
      title: 'Produto adicionado!',
      description: `${produto.nome} - ${formatarQuantidade(quantidade, produto.tipoVenda)}`,
    });

    onProdutoAdicionado?.();
  };

  // Verificar se produto tem quantidade válida
  const temQuantidadeValida = (produto: Produto): boolean => {
    if (produto.tipoProduto === 'ESPECIAL') {
      return !!tamanhosSelecionados[produto.id];
    }
    if (produto.tipoVenda === 'KG') {
      const qtd = quantidadesKG[produto.id];
      return qtd !== undefined && qtd > 0;
    } else {
      const valor = quantidadesUnidade[produto.id];
      return valor !== undefined && parseFloat(valor) > 0;
    }
  };

  // Obter subtotal do produto selecionado
  const obterSubtotal = (produto: Produto) => {
    if (produto.tipoProduto === 'ESPECIAL') {
      const tamanho = tamanhosSelecionados[produto.id];
      if (tamanho && produto.precosTamanhos) {
        return produto.precosTamanhos[tamanho];
      }
      return null;
    }
    let quantidade = 0;
    if (produto.tipoVenda === 'KG') {
      quantidade = quantidadesKG[produto.id] || 0;
    } else {
      const valor = quantidadesUnidade[produto.id];
      quantidade = valor ? parseFloat(valor) : 0;
    }
    if (quantidade > 0) {
      return calcularSubtotal(quantidade, produto.valorUnit, produto.tipoVenda);
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {produtos.map(produto => {
        const qtdNoCarrinho = contarItensNoCarrinho(produto.id);
        const ordemTamanhos = ['P', 'M', 'G', 'GG'];
        const tamanhosOrdenados = produto.tamanhos
          ? [...produto.tamanhos].sort((a, b) => ordemTamanhos.indexOf(a) - ordemTamanhos.indexOf(b))
          : [];

        return (
          <Card
            key={produto.id}
            className={`card-padaria hover:shadow-md transition-all ${
              produto.tipoProduto === 'ESPECIAL' ? 'ring-2 ring-amber-300' : ''
            } ${qtdNoCarrinho > 0 ? 'border-green-500 border-2' : ''}`}
          >
            <CardContent className="p-3">
              {/* Header do produto */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground truncate flex items-center gap-2">
                    {produto.nome}
                    {qtdNoCarrinho > 0 && (
                      <Badge className="bg-green-500 text-white text-[10px] px-1.5">
                        <Check className="w-3 h-3 mr-0.5" />
                        {qtdNoCarrinho}
                      </Badge>
                    )}
                  </h4>
                  {produto.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{produto.descricao}</p>
                  )}
                </div>
                {produto.tipoProduto === 'ESPECIAL' ? (
                  <Badge className="ml-2 shrink-0 text-[10px] px-1.5 py-0.5 bg-amber-600 text-white">
                    Torta
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2 flex items-center gap-1 shrink-0 text-[10px] px-1.5 py-0.5">
                    {getIconeTipoVenda(produto.tipoVenda)}
                    {produto.tipoVenda === 'KG' ? 'Kg' : 'Un'}
                  </Badge>
                )}
              </div>

              {/* Preço */}
              {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
                <div className="mb-3 text-xs text-muted-foreground">
                  {tamanhosOrdenados.map(tam => (
                    <span key={tam} className="mr-2">
                      <strong className="text-amber-700">{tam}</strong>: {formatarMoeda(produto.precosTamanhos![tam])}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-lg font-bold text-primary">
                    {formatarMoeda(produto.valorUnit)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    /{produto.tipoVenda === 'KG' ? 'kg' : 'un'}
                  </span>
                </div>
              )}

              {/* Seletor de quantidade / tamanho */}
              <div className="space-y-2">
                {produto.tipoProduto === 'ESPECIAL' ? (
                  <>
                    {/* Seleção de tamanho para torta */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tamanho:</Label>
                      <div className="flex gap-1">
                        {tamanhosOrdenados.map(tam => (
                          <Button
                            key={tam}
                            type="button"
                            variant={tamanhosSelecionados[produto.id] === tam ? 'default' : 'outline'}
                            size="sm"
                            className={`flex-1 h-8 text-xs ${tamanhosSelecionados[produto.id] === tam ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                            onClick={() => setTamanhosSelecionados(prev => ({ ...prev, [produto.id]: tam }))}
                          >
                            {tam}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {/* Campo de observação */}
                    <Input
                      placeholder="Observação (opcional)"
                      className="h-9 text-sm"
                      value={observacoes[produto.id] || ''}
                      onChange={(e) => setObservacoes(prev => ({ ...prev, [produto.id]: e.target.value }))}
                    />
                  </>
                ) : produto.tipoVenda === 'KG' ? (
                  // Select para KG
                  <Select
                    value={quantidadesKG[produto.id]?.toString() || '0'}
                    onValueChange={(value) => setQuantidadesKG(prev => ({ ...prev, [produto.id]: parseFloat(value) }))}
                  >
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Quantidade" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {OPCOES_KG.map((opcao) => (
                        <SelectItem
                          key={opcao.valor}
                          value={opcao.valor.toString()}
                          className="text-sm"
                        >
                          {opcao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  // Input livre para Unidades
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Digite a quantidade"
                    className="h-10 text-sm"
                    value={quantidadesUnidade[produto.id] || ''}
                    onChange={(e) => setQuantidadesUnidade(prev => ({ ...prev, [produto.id]: e.target.value }))}
                  />
                )}
              </div>

              {/* Botão adicionar */}
              <Button
                onClick={() => handleAdicionar(produto)}
                className="w-full mt-2 h-10 bg-primary hover:bg-primary/90 text-white"
                disabled={!temQuantidadeValida(produto)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
                {obterSubtotal(produto) && (
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-[10px]">
                    {formatarMoeda(obterSubtotal(produto)!)}
                  </Badge>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {produtos.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <p>Nenhum produto nesta categoria</p>
        </div>
      )}
    </div>
  );
}
