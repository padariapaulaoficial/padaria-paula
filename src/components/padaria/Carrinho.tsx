'use client';

// Carrinho - Padaria Paula
// Resumo do pedido atual - Responsivo para mobile

import { ShoppingCart, Trash2, Plus, Minus, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePedidoStore, formatarMoeda, formatarQuantidade, calcularSubtotal } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';
import { ordenarItensPorCategoria } from '@/lib/escpos';

interface Props {
  isMobile?: boolean;
}

export default function Carrinho({ isMobile = false }: Props) {
  const { itens, total, removerItem, atualizarItem, cliente } = usePedidoStore();
  const { setTela } = useAppStore();
  const [expandido, setExpandido] = useState(false);

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
              {ordenarItensPorCategoria(itens).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted/30 rounded-lg p-2 sm:p-2.5"
                >
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
              ))}
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
            {ordenarItensPorCategoria(itens).map((item, index) => (
              <div
                key={index}
                className="bg-muted/30 rounded-lg p-3 border border-border/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.nome}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatarMoeda(item.valorUnit)} / {item.tipoVenda.toLowerCase()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removerItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
              </div>
            ))}
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
