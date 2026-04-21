'use client';

// EditItemModal - Padaria Paula
// Modal para edição de itens no carrinho/orçamento
// Permite alterar tamanho e adicionar observações

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  } | null;
  tamanhosDisponiveis: string[];
  precosTamanhos: Record<string, number> | null;
  novoTamanho: string;
  setNovoTamanho: (tamanho: string) => void;
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
  novaObservacao,
  setNovaObservacao,
  onSave,
  onCancel,
}: EditItemModalProps) {
  if (!item) return null;

  // Calcular preço se tamanho for alterado
  const precoAtual = novoTamanho && precosTamanhos?.[novoTamanho]
    ? precosTamanhos[novoTamanho]
    : item.valorUnit;

  // Limpar nome do produto (remover tamanho entre parênteses)
  const nomeLimpo = item.nome.replace(/\s*\([A-Z]+\)$/, '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="truncate">Editar Item</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome do Produto */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-medium text-sm">{nomeLimpo}</p>
            {item.tamanho && (
              <Badge variant="outline" className="mt-1 text-xs">
                Tamanho atual: {item.tamanho}
              </Badge>
            )}
          </div>

          {/* Seletor de Tamanho - apenas para produtos com tamanhos */}
          {tamanhosDisponiveis.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Tamanho
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {tamanhosDisponiveis.map(tam => {
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

          {/* Campo de Observação - para TODOS os produtos */}
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
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
