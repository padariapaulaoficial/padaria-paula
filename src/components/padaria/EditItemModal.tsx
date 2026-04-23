'use client';

// EditItemModal - Padaria Paula
// Modal para edição de itens no carrinho/orçamento
// REGRAS DE EDIÇÃO:
// 1. ESPECIAL (tamanho): edita TAMANHO + OBSERVACAO
// 2. KG (peso): edita QUANTIDADE/PESO + OBSERVACAO  
// 3. UNIDADE: edita QUANTIDADE + OBSERVACAO

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatarMoeda } from '@/store/usePedidoStore';

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    produtoId: string;
    nome: string;
    tamanho?: string;
    observacao?: string;
    valorUnit: number;
    subtotal: number;
    quantidade: number;
    tipoVenda: 'KG' | 'UNIDADE';
    tipoProduto?: 'NORMAL' | 'ESPECIAL';
    precosTamanhos?: Record<string, number> | null;
  } | null;
  tamanhosDisponiveis: string[];
  precosTamanhos: Record<string, number> | null;
  novoTamanho: string;
  setNovoTamanho: (tamanho: string) => void;
  novaQuantidade: number;
  setNovaQuantidade: (quantidade: number) => void;
  novaObservacao: string;
  setNovaObservacao: (observacao: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditItemModal({
  open,
  onOpenChange,
  item,
  tamanhosDisponiveis,
  precosTamanhos,
  novoTamanho,
  setNovoTamanho,
  novaQuantidade,
  setNovaQuantidade,
  novaObservacao,
  setNovaObservacao,
  onSave,
  onCancel,
}: EditItemModalProps) {
  if (!item) return null;

  // Determinar tipo de edição baseado nas propriedades do item
  const isEspecial = item.tipoProduto === 'ESPECIAL' || (tamanhosDisponiveis.length > 0 && precosTamanhos);
  const isKG = item.tipoVenda === 'KG' && !isEspecial;
  const isUnidade = item.tipoVenda === 'UNIDADE' && !isEspecial;

  // Calcular preço atualizado
  const calcularPrecoAtualizado = (): { valorUnit: number; subtotal: number } => {
    if (isEspecial && novoTamanho && precosTamanhos?.[novoTamanho]) {
      // Produto ESPECIAL: preço baseado no tamanho
      return {
        valorUnit: precosTamanhos[novoTamanho],
        subtotal: precosTamanhos[novoTamanho], // Quantidade sempre 1 para especiais
      };
    } else if (isKG && novaQuantidade > 0) {
      // Produto KG: preço baseado na quantidade (peso)
      return {
        valorUnit: item.valorUnit,
        subtotal: novaQuantidade * item.valorUnit,
      };
    } else if (isUnidade && novaQuantidade > 0) {
      // Produto UNIDADE: preço baseado na quantidade
      return {
        valorUnit: item.valorUnit,
        subtotal: novaQuantidade * item.valorUnit,
      };
    }
    return {
      valorUnit: item.valorUnit,
      subtotal: item.subtotal,
    };
  };

  const { valorUnit: precoAtualizado, subtotal: subtotalAtualizado } = calcularPrecoAtualizado();

  // Limpar nome do produto (remover tamanho entre parênteses)
  const nomeLimpo = item.nome.replace(/\s*\([A-Z]+\)$/, '');

  // Detectar mudanças
  const houveMudanca = () => {
    if (isEspecial && novoTamanho !== item.tamanho) return true;
    if ((isKG || isUnidade) && novaQuantidade !== item.quantidade) return true;
    if (novaObservacao !== (item.observacao || '')) return true;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">Editar Item</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome do Produto e Tipo */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-medium text-sm">{nomeLimpo}</p>
            <div className="flex items-center gap-2 mt-1">
              {isEspecial && (
                <Badge variant="default" className="text-xs bg-primary text-primary-foreground">
                  Torta Especial
                </Badge>
              )}
              {isKG && (
                <Badge variant="secondary" className="text-xs">
                  Por Peso (KG)
                </Badge>
              )}
              {isUnidade && (
                <Badge variant="secondary" className="text-xs">
                  Por Unidade
                </Badge>
              )}
              {item.tamanho && (
                <Badge variant="outline" className="text-xs">
                  Tamanho: {item.tamanho}
                </Badge>
              )}
            </div>
          </div>

          {/* =====================================================
              EDIÇÃO PARA PRODUTOS ESPECIAIS (TORTAS)
              - Seletor de tamanho
              - Preço varia por tamanho
              - Quantidade sempre 1
              ===================================================== */}
          {isEspecial && tamanhosDisponiveis.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Tamanho
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['PP', 'P', 'M', 'G', 'GG'].map(tam => {
                  // Só mostrar tamanhos disponíveis
                  if (!tamanhosDisponiveis.includes(tam)) return null;
                  
                  const preco = precosTamanhos?.[tam];
                  const isSelected = novoTamanho === tam;
                  
                  return (
                    <Button
                      key={tam}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={`h-12 w-14 flex flex-col gap-0.5 ${isSelected ? 'btn-padaria' : ''}`}
                      onClick={() => setNovoTamanho(tam)}
                    >
                      <span className="font-bold">{tam}</span>
                      {preco !== undefined && preco !== null && !isNaN(preco) && preco > 0 && (
                        <span className="text-[9px] opacity-80">{formatarMoeda(preco)}</span>
                      )}
                    </Button>
                  );
                })}
              </div>
              
              {/* Mostrar preço do tamanho selecionado */}
              {novoTamanho && precosTamanhos?.[novoTamanho] && (
                <p className="text-sm text-primary font-medium">
                  Preço: {formatarMoeda(precosTamanhos[novoTamanho])}
                </p>
              )}
            </div>
          )}

          {/* =====================================================
              EDIÇÃO PARA PRODUTOS POR PESO (KG)
              - Input de peso livre (permite qualquer valor)
              - Preço = peso x valorUnit
              ===================================================== */}
          {isKG && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Quantidade (Peso em KG)
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => setNovaQuantidade(Math.max(0.1, parseFloat((novaQuantidade - 0.1).toFixed(2))))}
                  disabled={novaQuantidade <= 0.1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="0.1"
                  step="0.01"
                  className="h-10 w-24 text-center text-sm font-medium"
                  value={novaQuantidade || ''}
                  onChange={(e) => setNovaQuantidade(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => setNovaQuantidade(parseFloat((novaQuantidade + 0.1).toFixed(2)))}
                >
                  +
                </Button>
                <span className="text-sm text-muted-foreground font-medium">kg</span>
              </div>

              {/* Mostrar preço calculado */}
              {novaQuantidade > 0 && (
                <div className="bg-muted/30 rounded-lg p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peso:</span>
                    <span className="font-medium">{novaQuantidade.toFixed(2)}kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço/kg:</span>
                    <span className="font-medium">{formatarMoeda(item.valorUnit)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border mt-1 pt-1">
                    <span className="text-muted-foreground font-medium">Subtotal:</span>
                    <span className="font-bold text-primary">{formatarMoeda(subtotalAtualizado)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              EDIÇÃO PARA PRODUTOS POR UNIDADE
              - Input de quantidade
              - Preço = quantidade x valorUnit
              ===================================================== */}
          {isUnidade && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Quantidade
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => setNovaQuantidade(Math.max(1, novaQuantidade - 1))}
                  disabled={novaQuantidade <= 1}
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  className="h-10 w-20 text-center text-sm font-medium"
                  value={novaQuantidade || ''}
                  onChange={(e) => setNovaQuantidade(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => setNovaQuantidade(novaQuantidade + 1)}
                >
                  +
                </Button>
              </div>
              
              {/* Mostrar preço calculado */}
              {novaQuantidade > 0 && (
                <div className="bg-muted/30 rounded-lg p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className="font-medium">{novaQuantidade} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço/un:</span>
                    <span className="font-medium">{formatarMoeda(item.valorUnit)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border mt-1 pt-1">
                    <span className="text-muted-foreground font-medium">Subtotal:</span>
                    <span className="font-bold text-primary">{formatarMoeda(subtotalAtualizado)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =====================================================
              CAMPO DE OBSERVAÇÃO - PARA TODOS OS PRODUTOS
              ===================================================== */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Observação
            </label>
            <Textarea
              placeholder="Ex: sem cebola, mais queijo, borda recheada..."
              className="min-h-[80px] text-sm resize-none"
              value={novaObservacao}
              onChange={(e) => setNovaObservacao(e.target.value)}
            />
          </div>

          {/* Resumo das alterações */}
          {houveMudanca() && (
            <div className="bg-primary/5 rounded-lg p-2 border border-primary/20 text-xs">
              <p className="text-primary font-medium mb-1">Alterações:</p>
              <ul className="text-muted-foreground space-y-0.5">
                {isEspecial && novoTamanho !== item.tamanho && (
                  <li>• Tamanho: {item.tamanho || 'Nenhum'} → {novoTamanho}</li>
                )}
                {(isKG || isUnidade) && novaQuantidade !== item.quantidade && (
                  <li>• Quantidade: {item.quantidade} → {novaQuantidade}</li>
                )}
                {novaObservacao !== (item.observacao || '') && (
                  <li>• Observação atualizada</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onCancel();
              onOpenChange(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            className="btn-padaria"
            onClick={() => {
              onSave();
              onOpenChange(false);
            }}
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
