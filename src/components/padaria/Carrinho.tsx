'use client';

// Carrinho - Padaria Paula
// Resumo do pedido atual - Responsivo para mobile

import { ShoppingCart, Trash2, Plus, Minus, ChevronUp, ChevronDown, ArrowRight, Edit2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { usePedidoStore, formatarMoeda, formatarQuantidade, calcularSubtotal } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';
import { ordenarItensPorCategoria } from '@/lib/escpos';
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

interface Props {
  isMobile?: boolean;
}

export default function Carrinho({ isMobile = false }: Props) {
  const { itens, total, removerItem, atualizarItem, cliente } = usePedidoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();
  const [expandido, setExpandido] = useState(false);
  
  // Estados para edição de item
  const [editandoItem, setEditandoItem] = useState<number | null>(null);
  const [novoTamanho, setNovoTamanho] = useState<string>('');
  const [novaObservacao, setNovaObservacao] = useState<string>('');
  
  // Produtos para obter preços de tamanhos
  const [produtos, setProdutos] = useState<Produto[]>([]);
  
  // Carregar produtos para obter preços de tamanhos
  useEffect(() => {
    fetch('/api/produtos?ativo=true')
      .then(res => res.json())
      .then(data => setProdutos(data))
      .catch(err => console.error('Erro ao carregar produtos:', err));
  }, []);

  // Função para obter preços de tamanho do produto
  const obterPrecosTamanhos = useCallback((produtoId: string): Record<string, number> | null => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.precosTamanhos || null;
  }, [produtos]);

  // Função para iniciar edição de item (para TODOS os produtos)
  const handleEditarItem = useCallback((index: number) => {
    const item = itens[index];
    if (item) {
      setEditandoItem(index);
      setNovoTamanho(item.tamanho || '');
      setNovaObservacao(item.observacao || '');
    }
  }, [itens]);

  // Função para salvar edição do item (para TODOS os produtos)
  const handleSalvarEdicao = useCallback((index: number) => {
    const item = itens[index];
    if (!item) return;

    const precos = obterPrecosTamanhos(item.produtoId);
    let novoValorUnit = item.valorUnit;
    let novoSubtotal = item.subtotal;
    let novoNome = item.nome;

    // Se o produto tem tamanhos e o tamanho foi alterado, atualizar preço
    if (precos && novoTamanho && novoTamanho !== item.tamanho) {
      const novoPreco = precos[novoTamanho];
      if (novoPreco !== undefined && novoPreco !== null && !isNaN(novoPreco) && novoPreco > 0) {
        novoValorUnit = novoPreco;
        novoSubtotal = novoPreco; // Para tortas, quantidade é sempre 1
      }
      // Atualizar nome com novo tamanho
      novoNome = item.nome.replace(/\([A-Z]+\)$/, `(${novoTamanho})`);
    }

    // Atualizar item com observação (para todos os produtos)
    atualizarItem(index, {
      nome: novoNome,
      tamanho: novoTamanho || undefined,
      observacao: novaObservacao || undefined,
      valorUnit: novoValorUnit,
      subtotal: novoSubtotal,
    });

    setEditandoItem(null);
    setNovoTamanho('');
    setNovaObservacao('');

    toast({ title: 'Item atualizado!' });
  }, [itens, novoTamanho, novaObservacao, obterPrecosTamanhos, atualizarItem, toast]);

  // Função para cancelar edição
  const handleCancelarEdicao = useCallback(() => {
    setEditandoItem(null);
    setNovoTamanho('');
    setNovaObservacao('');
  }, []);

  const handleAtualizarQuantidade = (index: number, novaQtd: number) => {
    if (novaQtd <= 0) {
      removerItem(index);
      return;
    }
    
    const item = itens[index];
    const novoSubtotal = calcularSubtotal(novaQtd, item.valorUnit, item.tipoVenda);
    atualizarItem(index, { 
      quantidadePedida: novaQtd, 
      quantidade: novaQtd, 
      subtotalPedida: novoSubtotal,
      subtotal: novoSubtotal 
    });
  };

  // Versão Mobile - Barra fixa inferior compacta
  if (isMobile) {
    return (
      <div className="bg-card border-t border-border safe-area-bottom">
        {/* Header expansível */}
        <button
          onClick={() => setExpandido(!expandido)}
          className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="font-semibold text-sm sm:text-base">Carrinho</span>
            <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs h-5 sm:h-6">
              {itens.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-bold text-base sm:text-lg text-primary">
              {formatarMoeda(total)}
            </span>
            {expandido ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Lista expandida */}
        {expandido && (
          <div className="border-t border-border max-h-48 sm:max-h-60 overflow-y-auto">
            <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
              {ordenarItensPorCategoria(itens).map((item, index) => {
                const precos = obterPrecosTamanhos(item.produtoId);
                const tamanhosDisponiveis = precos 
                  ? ['PP', 'P', 'M', 'G'].filter(tam => {
                      const preco = precos[tam];
                      return preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                    })
                  : [];
                
                return (
                <div
                  key={index}
                  className="bg-muted/30 rounded-lg p-2 sm:p-2.5"
                >
                  {editandoItem === index ? (
                    /* Modo edição */
                    <div className="space-y-1.5">
                      {/* Tamanho - apenas para produtos com tamanhos */}
                      {tamanhosDisponiveis.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-muted-foreground mr-1">Tam:</span>
                          {tamanhosDisponiveis.map(tam => (
                            <Button
                              key={tam}
                              type="button"
                              variant={novoTamanho === tam ? 'default' : 'outline'}
                              size="sm"
                              className={`h-5 w-5 p-0 text-[9px] font-bold ${novoTamanho === tam ? 'btn-padaria' : ''}`}
                              onClick={() => setNovoTamanho(tam)}
                            >
                              {tam}
                            </Button>
                          ))}
                        </div>
                      )}
                      {/* Observação - para TODOS os produtos */}
                      <Input
                        placeholder="Observação..."
                        className="h-6 text-[10px]"
                        value={novaObservacao}
                        onChange={(e) => setNovaObservacao(e.target.value)}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 text-[10px] btn-padaria flex-1" onClick={() => handleSalvarEdicao(index)}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={handleCancelarEdicao}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo visualização */
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-medium text-xs sm:text-sm truncate">{item.nome}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatarMoeda(item.subtotal)}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                            onClick={() => handleAtualizarQuantidade(index, item.quantidade - (item.tipoVenda === 'UNIDADE' ? 1 : 0.5))}
                          >
                            <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </Button>
                          <span className="w-8 sm:w-10 text-center text-xs sm:text-sm font-medium">
                            {item.tipoVenda === 'UNIDADE' 
                              ? item.quantidade 
                              : item.quantidade.toFixed(3).replace(/\.?0+$/, '')}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                            onClick={() => handleAtualizarQuantidade(index, item.quantidade + (item.tipoVenda === 'UNIDADE' ? 1 : 0.5))}
                          >
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </Button>
                          {/* Botão de editar - para TODOS os produtos */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-primary ml-0.5 sm:ml-1"
                            onClick={() => handleEditarItem(index)}
                            title="Editar observação/tamanho"
                          >
                            <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-destructive ml-0.5 sm:ml-1"
                            onClick={() => removerItem(index)}
                          >
                            <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </Button>
                        </div>
                      </div>
                      {/* Observação do item */}
                      {item.observacao && (
                        <p className="text-[9px] text-orange-600 mt-1 italic truncate">{item.observacao}</p>
                      )}
                    </>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="p-2 sm:p-3 border-t border-border bg-muted/30">
          <Button
            onClick={() => setTela('resumo')}
            className="w-full btn-padaria h-10 sm:h-12"
            size="lg"
            disabled={itens.length === 0}
          >
            Ver Pedido
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Versão Desktop - Card lateral
  if (itens.length === 0) {
    return (
      <Card className="card-padaria h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrinho
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum item no carrinho</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione produtos para continuar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-padaria h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrinho
          </span>
          <Badge variant="secondary">{itens.length} itens</Badge>
        </CardTitle>
        
        {/* Info do cliente */}
        {cliente && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 mt-2">
            <span className="font-medium text-foreground">{cliente.nome}</span>
            <span className="mx-2">•</span>
            <span>{cliente.telefone}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[calc(100vh-450px)] px-6">
          <div className="space-y-3 py-2">
            {ordenarItensPorCategoria(itens).map((item, index) => {
              const precos = obterPrecosTamanhos(item.produtoId);
              const tamanhosDisponiveis = precos 
                ? ['PP', 'P', 'M', 'G'].filter(tam => {
                    const preco = precos[tam];
                    return preco !== undefined && preco !== null && !isNaN(preco) && preco > 0;
                  })
                : [];
              
              return (
              <div
                key={index}
                className="bg-muted/30 rounded-lg p-3 border border-border/50"
              >
                {editandoItem === index ? (
                  /* Modo edição */
                  <div className="space-y-2">
                    {/* Tamanho - apenas para produtos com tamanhos */}
                    {tamanhosDisponiveis.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs text-muted-foreground mr-1">Tamanho:</span>
                        {tamanhosDisponiveis.map(tam => (
                          <Button
                            key={tam}
                            type="button"
                            variant={novoTamanho === tam ? 'default' : 'outline'}
                            size="sm"
                            className={`h-7 w-7 p-0 text-xs font-bold ${novoTamanho === tam ? 'btn-padaria' : ''}`}
                            onClick={() => setNovoTamanho(tam)}
                          >
                            {tam}
                          </Button>
                        ))}
                      </div>
                    )}
                    {/* Observação - para TODOS os produtos */}
                    <Input
                      placeholder="Observação..."
                      className="h-8 text-sm"
                      value={novaObservacao}
                      onChange={(e) => setNovaObservacao(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 text-xs btn-padaria flex-1" onClick={() => handleSalvarEdicao(index)}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleCancelarEdicao}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Modo visualização */
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.nome}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatarMoeda(item.valorUnit)} / {item.tipoVenda.toLowerCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Botão de editar - para TODOS os produtos */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => handleEditarItem(index)}
                          title="Editar observação/tamanho"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removerItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleAtualizarQuantidade(index, item.quantidade - (item.tipoVenda === 'UNIDADE' ? 1 : 0.5))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-16 text-center text-sm font-medium">
                          {formatarQuantidade(item.quantidade, item.tipoVenda)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleAtualizarQuantidade(index, item.quantidade + (item.tipoVenda === 'UNIDADE' ? 1 : 0.5))}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <span className="font-bold text-primary">
                        {formatarMoeda(item.subtotal)}
                      </span>
                    </div>
                    
                    {/* Observação do item */}
                    {item.observacao && (
                      <p className="text-[10px] text-orange-600 mt-2 italic truncate">{item.observacao}</p>
                    )}
                  </>
                )}
              </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4 border-t border-border">
        {/* Total */}
        <div className="w-full">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span className="text-primary text-xl">{formatarMoeda(total)}</span>
          </div>
        </div>

        {/* Botão */}
        <Button 
          onClick={() => setTela('resumo')} 
          className="w-full btn-padaria"
        >
          Ver Pedido
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}
