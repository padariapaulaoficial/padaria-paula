'use client';

// ResumoPedido - Padaria Paula
// Confirmação e finalização do pedido

import { useState, useEffect } from 'react';
import { Check, Loader2, ShoppingBag, Scale, Edit2, Truck, Store, Calendar, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { usePedidoStore, formatarMoeda, formatarQuantidade } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';

export default function ResumoPedido() {
  const { cliente, entrega, itens, total, totalPedida, observacoes, setObservacoes, atualizarPesoFinal, atualizarItem, resetPedido } = usePedidoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const [editandoPeso, setEditandoPeso] = useState<number | null>(null);
  const [novoPeso, setNovoPeso] = useState('');
  const [dialogFinalizarOpen, setDialogFinalizarOpen] = useState(false);
  
  // Estado para edição de tamanho/observação de torta especial
  const [editandoTamanho, setEditandoTamanho] = useState<number | null>(null);
  const [novoTamanho, setNovoTamanho] = useState<string>('');
  const [novaObservacao, setNovaObservacao] = useState<string>('');
  
  // Dados dos produtos para obter preços de tamanhos
  const [produtos, setProdutos] = useState<{id: string; precosTamanhos: Record<string, number> | null}[]>([]);
  
  // Carregar produtos para obter preços de tamanhos
  useEffect(() => {
    fetch('/api/produtos?ativo=true')
      .then(res => res.json())
      .then(data => {
        setProdutos(data.map((p: {id: string; precosTamanhos: Record<string, number> | null}) => ({
          id: p.id,
          precosTamanhos: p.precosTamanhos
        })));
      })
      .catch(err => console.error('Erro ao carregar produtos:', err));
  }, []);

  // Calcular diferença de total
  const diferencaTotal = total - totalPedida;

  // Formatar data de entrega
  const formatarDataEntrega = (data: string) => {
    if (!data) return '';
    return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
  };

  const handleFinalizarPedido = async () => {
    // Prevenir duplo clique
    if (salvando) return;
    
    if (!cliente) {
      toast({
        title: 'Erro',
        description: 'Dados do cliente não encontrados.',
        variant: 'destructive',
      });
      return;
    }

    if (itens.length === 0) {
      toast({
        title: 'Erro',
        description: 'Nenhum item no pedido.',
        variant: 'destructive',
      });
      return;
    }

    if (!entrega.dataEntrega) {
      toast({
        title: 'Erro',
        description: 'Data de entrega é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    if (!entrega.horarioEntrega) {
      toast({
        title: 'Erro',
        description: 'Horário de entrega é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        clienteId: cliente.id,
        cliente: {
          nome: cliente.nome,
          telefone: cliente.telefone,
          cpfCnpj: cliente.cpfCnpj || '',
          tipoPessoa: cliente.tipoPessoa || 'CPF',
        },
        itens: itens.map(item => ({
          produtoId: item.produtoId,
          quantidadePedida: item.quantidadePedida,
          quantidade: item.quantidade,
          valorUnit: item.valorUnit,
          subtotalPedida: item.subtotalPedida,
          subtotal: item.subtotal,
          observacao: item.observacao,
          tamanho: item.tamanho,
        })),
        tipoEntrega: entrega.tipoEntrega,
        dataEntrega: entrega.dataEntrega,
        horarioEntrega: entrega.horarioEntrega,
        enderecoEntrega: entrega.tipoEntrega === 'TELE_ENTREGA' ? entrega.enderecoEntrega : null,
        bairroEntrega: entrega.tipoEntrega === 'TELE_ENTREGA' ? entrega.bairroEntrega : null,
        valorTeleEntrega: entrega.valorTeleEntrega || 0,
        observacoes,
        total,
        totalPedida,
      };
      
      console.log('Enviando pedido:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let pedido;
      try {
        pedido = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Erro ao parsear resposta:', parseError, 'Response:', responseText);
        toast({
          title: 'Erro de comunicação',
          description: `Resposta inválida do servidor: ${responseText.substring(0, 100)}`,
          variant: 'destructive',
        });
        setSalvando(false);
        return;
      }

      if (!response.ok) {
        console.error('Erro da API:', pedido);
        toast({
          title: 'Erro ao salvar',
          description: pedido.error || `Erro ${response.status}: ${response.statusText}`,
          variant: 'destructive',
        });
        setSalvando(false);
        return;
      }
      
      // Limpar pedido atual
      resetPedido();
      
      toast({
        title: 'Pedido salvo!',
        description: `Pedido #${pedido.numero.toString().padStart(5, '0')} criado com sucesso.`,
      });

      // Ir para tela de histórico
      setTela('historico');
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o pedido. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
      setDialogFinalizarOpen(false);
    }
  };

  // Abrir edição de peso
  const handleEditarPeso = (index: number, pesoAtual: number) => {
    setEditandoPeso(index);
    setNovoPeso(pesoAtual.toString().replace('.', ','));
  };

  // Salvar novo peso
  const handleSalvarPeso = (index: number) => {
    const peso = parseFloat(novoPeso.replace(',', '.'));
    if (isNaN(peso) || peso <= 0) {
      toast({
        title: 'Peso inválido',
        description: 'Digite um peso válido.',
        variant: 'destructive',
      });
      return;
    }
    
    atualizarPesoFinal(index, peso);
    setEditandoPeso(null);
    setNovoPeso('');
    
    toast({
      title: 'Peso atualizado!',
      description: 'O peso foi ajustado e o total recalculado.',
    });
  };

  // Obter preços de tamanhos do produto
  const obterPrecosTamanhos = (produtoId: string): Record<string, number> | null => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.precosTamanhos || null;
  };

  // Abrir edição de tamanho/observação
  const handleEditarTamanho = (index: number) => {
    const item = itens[index];
    if (item && item.tamanho) {
      setEditandoTamanho(index);
      setNovoTamanho(item.tamanho);
      setNovaObservacao(item.observacao || '');
    }
  };

  // Salvar edição de tamanho/observação
  const handleSalvarTamanho = (index: number) => {
    const item = itens[index];
    if (!item) return;

    const precos = obterPrecosTamanhos(item.produtoId);
    let novoValorUnit = item.valorUnit;
    let novoSubtotal = item.subtotal;
    let novoSubtotalPedida = item.subtotalPedida;

    // Se mudou o tamanho, atualizar preço
    if (novoTamanho && novoTamanho !== item.tamanho && precos) {
      const novoPreco = precos[novoTamanho];
      if (novoPreco !== undefined && novoPreco !== null && !isNaN(novoPreco) && novoPreco > 0) {
        novoValorUnit = novoPreco;
        novoSubtotal = novoPreco;
        novoSubtotalPedida = novoPreco;
      }
    }

    // Atualizar nome se tamanho mudou
    const novoNome = novoTamanho !== item.tamanho 
      ? item.nome.replace(/\([A-Z]+\)$/, `(${novoTamanho})`)
      : item.nome;

    atualizarItem(index, {
      nome: novoNome,
      tamanho: novoTamanho,
      observacao: novaObservacao || undefined,
      valorUnit: novoValorUnit,
      subtotal: novoSubtotal,
      subtotalPedida: novoSubtotalPedida,
    });

    setEditandoTamanho(null);
    setNovoTamanho('');
    setNovaObservacao('');

    toast({
      title: 'Item atualizado!',
      description: 'Tamanho e/ou observação alterados.',
    });
  };

  // Cancelar edição de tamanho
  const handleCancelarEdicaoTamanho = () => {
    setEditandoTamanho(null);
    setNovoTamanho('');
    setNovaObservacao('');
  };

  // Se não tem cliente, voltar para cadastro
  if (!cliente) {
    return (
      <Card className="max-w-md mx-auto card-padaria mt-8">
        <CardContent className="pt-6 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Por favor, selecione um cliente primeiro.
          </p>
          <Button onClick={() => setTela('novo-pedido')} className="btn-padaria">
            Selecionar Cliente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Card className="card-padaria">
        <CardHeader className="text-center border-b border-border/50">
          <CardTitle className="text-2xl font-display">Resumo do Pedido</CardTitle>
          <CardDescription>Confira os dados antes de finalizar</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Dados do Cliente */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nome: </span>
                <strong className="text-foreground">{cliente.nome}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Telefone: </span>
                <span className="text-foreground">{cliente.telefone}</span>
              </div>
              {cliente.cpfCnpj && (
                <div>
                  <span className="text-muted-foreground">{cliente.tipoPessoa || 'CPF'}: </span>
                  <span className="text-foreground">{cliente.cpfCnpj}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Entrega */}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
              {entrega.tipoEntrega === 'RETIRA' ? (
                <Store className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
              {entrega.tipoEntrega === 'RETIRA' ? 'Cliente Retira' : 'Tele Entrega'}
            </h3>
            {entrega.dataEntrega && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatarDataEntrega(entrega.dataEntrega)}</span>
                </div>
                {entrega.horarioEntrega && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{entrega.horarioEntrega}</span>
                  </div>
                )}
              </div>
            )}
            {entrega.tipoEntrega === 'TELE_ENTREGA' && entrega.enderecoEntrega && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="w-4 h-4" />
                <span>{entrega.enderecoEntrega}{entrega.bairroEntrega ? ` - ${entrega.bairroEntrega}` : ''}</span>
              </div>
            )}
          </div>

          {/* Itens do Pedido */}
          <div>
            <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5" />
              Itens do Pedido
              <Badge variant="secondary" className="ml-auto">{itens.length}</Badge>
            </h3>
            
            <div className="space-y-2">
              {itens.map((item, index) => {
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
                  className={`py-3 px-4 rounded-lg border ${
                    item.quantidade !== item.quantidadePedida 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' 
                      : 'bg-muted/20 border-border/30'
                  }`}
                >
                  {editandoTamanho === index ? (
                    /* Modo edição de tamanho/observação */
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.nome}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-sm text-muted-foreground mr-2">Tamanho:</span>
                        {tamanhosDisponiveis.map(tam => (
                          <Button
                            key={tam}
                            type="button"
                            variant={novoTamanho === tam ? 'default' : 'outline'}
                            size="sm"
                            className={`h-8 w-8 p-0 text-sm font-bold ${novoTamanho === tam ? 'btn-padaria' : ''}`}
                            onClick={() => setNovoTamanho(tam)}
                          >
                            {tam}
                          </Button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Obs:</span>
                        <Input
                          value={novaObservacao}
                          onChange={(e) => setNovaObservacao(e.target.value)}
                          className="flex-1 h-8 text-sm"
                          placeholder="Observação..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSalvarTamanho(index)}
                          className="btn-padaria"
                        >
                          Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={handleCancelarEdicaoTamanho}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo visualização normal */
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.nome}</span>
                          {item.tamanho && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditarTamanho(index)}
                              title="Editar tamanho/observação"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Produto KG - permite edição de peso */}
                        {item.tipoVenda === 'KG' ? (
                          <div className="flex items-center gap-2 mt-1">
                            {editandoPeso === index ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  value={novoPeso}
                                  onChange={(e) => setNovoPeso(e.target.value)}
                                  className="w-24 h-8 text-sm"
                                  placeholder="0,000"
                                />
                                <span className="text-sm text-muted-foreground">kg</span>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSalvarPeso(index)}
                                  className="h-8"
                                >
                                  ✓
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => setEditandoPeso(null)}
                                  className="h-8"
                                >
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">
                                  {formatarQuantidade(item.quantidade, item.tipoVenda)}
                                </span>
                                {item.quantidade !== item.quantidadePedida && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    (pedido: {formatarQuantidade(item.quantidadePedida, item.tipoVenda)})
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditarPeso(index, item.quantidade)}
                                  title="Ajustar peso final"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm ml-2">
                            {formatarQuantidade(item.quantidade, item.tipoVenda)}
                          </span>
                        )}
                        
                        {item.observacao && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Obs: {item.observacao}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {formatarMoeda(item.valorUnit)}/{item.tipoVenda === 'KG' ? 'kg' : 'un'}
                        </div>
                        <span className="font-bold text-primary">{formatarMoeda(item.subtotal)}</span>
                        {item.subtotal !== item.subtotalPedida && (
                          <div className="text-xs text-green-600">
                            era {formatarMoeda(item.subtotalPedida)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="obs" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Observações Gerais
            </Label>
            <Textarea
              id="obs"
              placeholder="Observações sobre o pedido..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="input-padaria"
            />
          </div>

          <Separator />

          {/* Totais */}
          <div className="space-y-2">
            {/* Subtotal dos itens */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal dos itens:</span>
              <span>{formatarMoeda(total)}</span>
            </div>
            
            {/* Taxa de entrega */}
            {entrega.tipoEntrega === 'TELE_ENTREGA' && entrega.valorTeleEntrega > 0 && (
              <div className="flex justify-between items-center text-sm text-primary">
                <span>Taxa de entrega:</span>
                <span>{formatarMoeda(entrega.valorTeleEntrega)}</span>
              </div>
            )}
            
            {diferencaTotal !== 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total pedido:</span>
                <span className="text-muted-foreground line-through">{formatarMoeda(totalPedida)}</span>
              </div>
            )}
            {diferencaTotal !== 0 && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>Diferença (peso ajustado):</span>
                <span>{diferencaTotal > 0 ? '+' : ''}{formatarMoeda(diferencaTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold pt-2 border-t border-border/50">
              <span>Total do Pedido:</span>
              <span className="text-primary text-2xl">
                {formatarMoeda(total + (entrega.tipoEntrega === 'TELE_ENTREGA' ? (entrega.valorTeleEntrega || 0) : 0))}
              </span>
            </div>
          </div>

        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setTela('produtos')}
            className="w-full sm:w-auto"
            disabled={salvando}
          >
            Adicionar Mais Itens
          </Button>
          
          <Button
            onClick={() => setDialogFinalizarOpen(true)}
            className="w-full sm:flex-1 btn-padaria py-6 text-lg"
            disabled={salvando}
          >
            {salvando ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Finalizar Pedido
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog de confirmação de finalização */}
      <AlertDialog open={dialogFinalizarOpen} onOpenChange={setDialogFinalizarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Confirmar Finalização
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar o pedido?
              <br />
              <strong>Total: {formatarMoeda(total)}</strong>
              <br />
              <span className="text-xs text-muted-foreground">
                Após finalizar, você será redirecionado para o histórico.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalizarPedido}
              className="btn-padaria"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Finalizar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
