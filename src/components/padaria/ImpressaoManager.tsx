'use client';

// ImpressaoManager - Padaria Paula
// Gerenciador de impressão de cupons com preview visual

import { useState, useEffect } from 'react';
import { Printer, FileText, Check, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { usePedidoStore } from '@/store/usePedidoStore';
import { useToast } from '@/hooks/use-toast';
import {
  gerarCupomCliente,
  gerarCupomCozinhaGrande,
  imprimirViaDialogo,
  formatarNumeroPedido,
} from '@/lib/escpos';
import CupomVisual from './CupomVisual';


interface ItemPedido {
  id: string;
  produto: { nome: string; tipoVenda: string };
  quantidade: number;
  quantidadePedida: number;
  valorUnit: number;
  subtotal: number;
  observacao?: string;
  tamanho?: string;
}

interface Pedido {
  id: string;
  numero: number;
  cliente: { nome: string; telefone: string; endereco?: string; bairro?: string; cpfCnpj?: string; tipoPessoa?: string };
  itens: ItemPedido[];
  observacoes?: string;
  total: number;
  totalPedida: number;
  tipoEntrega: string;
  dataEntrega: string | null;
  horarioEntrega?: string | null;
  enderecoEntrega?: string;
  bairroEntrega?: string;
  valorTeleEntrega?: number | null;
  createdAt: string;
  updatedAt?: Date;
  clienteId?: string;
  status?: string;
  impresso?: boolean;
}

interface Configuracao {
  id?: string;
  nomeLoja: string;
  endereco: string;
  telefone: string;
  cnpj: string;
  logoUrl?: string | null;
  senha?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function ImpressaoManager() {
  const { pedidoParaImpressao, setTela } = useAppStore();
  const { resetPedido } = usePedidoStore();
  const { toast } = useToast();
  
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [config, setConfig] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [imprimindo, setImprimindo] = useState(false);
  const [statusAtualizado, setStatusAtualizado] = useState(false);

  // Carregar pedido e configurações
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar configurações
        const configRes = await fetch('/api/configuracao');
        const configData = await configRes.json();
        setConfig(configData);

        // Carregar pedido
        if (pedidoParaImpressao) {
          const pedidoRes = await fetch(`/api/pedidos?id=${pedidoParaImpressao}`);
          const pedidoData = await pedidoRes.json();
          setPedido(pedidoData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do pedido.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [pedidoParaImpressao, toast]);

  // Gerar cupons
  const cupomCliente = pedido && config ? gerarCupomCliente(pedido as Parameters<typeof gerarCupomCliente>[0], config as Parameters<typeof gerarCupomCliente>[1]) : '';
  const cupomCozinha = pedido && config ? gerarCupomCozinhaGrande(pedido as Parameters<typeof gerarCupomCozinhaGrande>[0], config as Parameters<typeof gerarCupomCozinhaGrande>[1]) : '';

  // Atualizar status do pedido para PRODUCAO
  const atualizarStatusProducao = async () => {
    if (!pedido || statusAtualizado) return;
    
    try {
      await fetch('/api/pedidos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pedido.id,
          status: 'PRODUCAO',
        }),
      });
      setStatusAtualizado(true);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Imprimir cupom do cliente
  const handleImprimirCliente = async () => {
    if (!cupomCliente) return;
    
    setImprimindo(true);
    
    try {
      imprimirViaDialogo(cupomCliente, `Cupom Cliente #${pedido ? formatarNumeroPedido(pedido.numero) : ''}`);
      
      // Atualizar status após impressão
      await atualizarStatusProducao();
      
      toast({
        title: 'Impressão iniciada!',
        description: 'Verifique a janela de impressão.',
      });
    } catch (error) {
      console.error('Erro na impressão:', error);
      toast({
        title: 'Erro na impressão',
        description: 'Não foi possível imprimir o cupom.',
        variant: 'destructive',
      });
    } finally {
      setImprimindo(false);
    }
  };

  // Imprimir cupom da cozinha
  const handleImprimirCozinha = async () => {
    if (!cupomCozinha) return;
    
    setImprimindo(true);
    
    try {
      imprimirViaDialogo(cupomCozinha, `Comanda Cozinha #${pedido ? formatarNumeroPedido(pedido.numero) : ''}`);
      
      // Atualizar status após impressão
      await atualizarStatusProducao();
      
      toast({
        title: 'Impressão iniciada!',
        description: 'Verifique a janela de impressão.',
      });
    } catch (error) {
      console.error('Erro na impressão:', error);
      toast({
        title: 'Erro na impressão',
        description: 'Não foi possível imprimir a comanda.',
        variant: 'destructive',
      });
    } finally {
      setImprimindo(false);
    }
  };

  // Novo pedido - limpar e voltar
  const handleNovoPedido = () => {
    resetPedido();
    setTela('novo-pedido');
  };

  // Ir para histórico
  const handleHistorico = () => {
    resetPedido();
    setTela('historico');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <Card className="max-w-md mx-auto card-padaria">
        <CardContent className="pt-6 text-center">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum pedido para impressão</p>
          <Button onClick={handleNovoPedido} className="btn-padaria">
            <Home className="w-4 h-4 mr-2" />
            Novo Pedido
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-4">
      {/* Cabeçalho de sucesso */}
      <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-2">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-green-800 dark:text-green-400">
                Pedido Salvo!
              </h2>
              <p className="text-sm text-green-700 dark:text-green-500">
                #{formatarNumeroPedido(pedido.numero)} - {pedido.cliente.nome}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNovoPedido}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Home className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de cupons */}
      <Tabs defaultValue="cozinha" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
          <TabsTrigger value="cliente" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Cliente
          </TabsTrigger>
          <TabsTrigger value="cozinha" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Cozinha
          </TabsTrigger>
        </TabsList>

        {/* Cupom do Cliente */}
        <TabsContent value="cliente" className="space-y-3">
          <Card className="card-padaria overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" />
                Cupom do Cliente
                <Badge variant="secondary" className="text-xs">Com valores</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-gray-100 dark:bg-gray-800">
                <CupomVisual conteudo={cupomCliente} titulo="Cupom Cliente" />
              </div>
            </CardContent>
            <div className="p-3 border-t border-border">
              <Button
                onClick={handleImprimirCliente}
                className="w-full btn-padaria"
                disabled={imprimindo}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Comanda da Cozinha */}
        <TabsContent value="cozinha" className="space-y-3">
          <Card className="card-padaria overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Printer className="w-4 h-4" />
                Comanda de Produção
                <Badge variant="secondary" className="text-xs">Sem valores</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-gray-100 dark:bg-gray-800">
                <CupomVisual conteudo={cupomCozinha} titulo="Comanda Cozinha" fonteGrande />
              </div>
            </CardContent>
            <div className="p-3 border-t border-border">
              <Button
                onClick={handleImprimirCozinha}
                className="w-full btn-padaria"
                disabled={imprimindo}
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
