'use client';

// NovoPedido - Padaria Paula
// Seleção de cliente + dados de entrega (tipo, data e horário)

import { useState, useEffect } from 'react';
import { Search, User, Phone, Calendar, Truck, Store, MapPin, Plus, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePedidoStore } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  cpfCnpj: string | null;
  tipoPessoa: string;
  endereco?: string | null;
  bairro?: string | null;
}

// Horários comerciais disponíveis
const HORARIOS_COMERCIAIS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
];

// Função para verificar se horário já passou
const horarioJaPassou = (horario: string, dataEntrega: string): boolean => {
  if (!dataEntrega) return false;
  
  const hoje = new Date();
  const dataEntregaDate = new Date(dataEntrega + 'T00:00:00');
  
  // Se a data de entrega é hoje, verificar horário
  if (dataEntregaDate.toDateString() === hoje.toDateString()) {
    const [hora, minuto] = horario.split(':').map(Number);
    const agora = hoje.getHours() * 60 + hoje.getMinutes();
    const horarioMinutos = hora * 60 + minuto;
    
    return horarioMinutos <= agora;
  }
  
  // Se a data de entrega é anterior a hoje, todos os horários já passaram
  if (dataEntregaDate < hoje) {
    return true;
  }
  
  return false;
};

export default function NovoPedido() {
  const { cliente, setCliente, entrega, setEntrega, clearCliente } = usePedidoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();
  
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [clienteSelecionadoLocal, setClienteSelecionadoLocal] = useState<Cliente | null>(null);
  
  // Dados de entrega
  const [tipoEntrega, setTipoEntrega] = useState<'RETIRA' | 'TELE_ENTREGA'>(entrega.tipoEntrega || 'RETIRA');
  const [dataEntrega, setDataEntrega] = useState(entrega.dataEntrega || '');
  const [horarioEntrega, setHorarioEntrega] = useState(entrega.horarioEntrega || '');
  const [enderecoEntrega, setEnderecoEntrega] = useState(entrega.enderecoEntrega || '');
  const [bairroEntrega, setBairroEntrega] = useState(entrega.bairroEntrega || '');

  // Se já tem cliente na store (vindo de ClientesLista), usar ele
  useEffect(() => {
    if (cliente && !clienteSelecionadoLocal) {
      setClienteSelecionadoLocal({
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        cpfCnpj: cliente.cpfCnpj,
        tipoPessoa: cliente.tipoPessoa,
        endereco: cliente.endereco,
        bairro: cliente.bairro,
      });
      
      // Pré-preencher endereço de entrega se cliente tiver cadastro
      if (cliente.endereco) {
        setEnderecoEntrega(cliente.endereco);
      }
      if (cliente.bairro) {
        setBairroEntrega(cliente.bairro);
      }
    }
  }, [cliente]);

  // Carregar clientes
  useEffect(() => {
    const buscarClientes = async () => {
      if (busca.length >= 2) {
        setLoading(true);
        try {
          const res = await fetch(`/api/clientes?busca=${encodeURIComponent(busca)}`);
          const data = await res.json();
          setClientes(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Erro ao buscar clientes:', error);
          setClientes([]);
        } finally {
          setLoading(false);
        }
      } else {
        setClientes([]);
      }
    };
    
    const timeout = setTimeout(buscarClientes, 300);
    return () => clearTimeout(timeout);
  }, [busca]);

  // Selecionar cliente
  const handleSelecionarCliente = (c: Cliente) => {
    setClienteSelecionadoLocal(c);
    setBusca('');
    setClientes([]);
    
    // Pré-preencher endereço de entrega se cliente tiver cadastro
    if (c.endereco) {
      setEnderecoEntrega(c.endereco);
    }
    if (c.bairro) {
      setBairroEntrega(c.bairro);
    }
  };

  // Trocar cliente
  const handleTrocarCliente = () => {
    setClienteSelecionadoLocal(null);
    clearCliente();
  };

  // Formatar telefone
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  // Continuar para produtos
  const handleContinuar = () => {
    if (!clienteSelecionadoLocal) {
      toast({
        title: 'Selecione um cliente',
        description: 'Você precisa selecionar um cliente para continuar.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!dataEntrega) {
      toast({
        title: 'Data obrigatória',
        description: 'Selecione a data de entrega/retirada.',
        variant: 'destructive',
      });
      return;
    }

    if (!horarioEntrega) {
      toast({
        title: 'Horário obrigatório',
        description: 'Selecione o horário de entrega/retirada.',
        variant: 'destructive',
      });
      return;
    }
    
    if (tipoEntrega === 'TELE_ENTREGA' && (!enderecoEntrega || !bairroEntrega)) {
      toast({
        title: 'Endereço obrigatório',
        description: 'Para tele entrega, preencha o endereço e bairro.',
        variant: 'destructive',
      });
      return;
    }
    
    // Salvar cliente na store
    setCliente({
      id: clienteSelecionadoLocal.id,
      nome: clienteSelecionadoLocal.nome,
      telefone: clienteSelecionadoLocal.telefone,
      cpfCnpj: clienteSelecionadoLocal.cpfCnpj || '',
      tipoPessoa: clienteSelecionadoLocal.tipoPessoa as 'CPF' | 'CNPJ',
      endereco: clienteSelecionadoLocal.endereco,
      bairro: clienteSelecionadoLocal.bairro,
    });
    
    // Salvar dados de entrega na store
    setEntrega({
      tipoEntrega,
      dataEntrega,
      horarioEntrega,
      enderecoEntrega,
      bairroEntrega,
    });
    
    toast({
      title: 'Pedido iniciado!',
      description: `Cliente: ${clienteSelecionadoLocal.nome}`,
    });
    
    setTela('produtos');
  };

  // Data mínima (hoje)
  const dataMinima = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-4">
      {/* Seleção de Cliente */}
      <Card className="card-padaria">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Selecionar Cliente
          </CardTitle>
          <CardDescription>
            Busque por nome ou telefone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Cliente selecionado */}
          {clienteSelecionadoLocal ? (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 rounded-full p-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{clienteSelecionadoLocal.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 inline mr-1" />
                        {formatarTelefone(clienteSelecionadoLocal.telefone)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTrocarCliente}
                  >
                    Trocar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Digite nome ou telefone..."
                  className="input-padaria pl-10 h-11"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              
              {/* Lista de clientes */}
              {clientes.length > 0 && (
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {clientes.map((c) => (
                      <button
                        key={c.id}
                        className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors flex items-center justify-between"
                        onClick={() => handleSelecionarCliente(c)}
                      >
                        <div>
                          <p className="font-medium">{c.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatarTelefone(c.telefone)}
                            {c.cpfCnpj && ` • ${c.cpfCnpj}`}
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
              
              {/* Loading */}
              {loading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Buscando...
                </p>
              )}
              
              {/* Botão para cadastrar novo cliente */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setTela('clientes')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Novo Cliente
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dados de Entrega */}
      <Card className="card-padaria">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dados da Entrega
          </CardTitle>
          <CardDescription>
            Informações sobre a entrega do pedido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de Entrega */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipo de Entrega *</Label>
            <RadioGroup
              value={tipoEntrega}
              onValueChange={(value) => setTipoEntrega(value as 'RETIRA' | 'TELE_ENTREGA')}
              className="grid grid-cols-2 gap-3"
            >
              <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                tipoEntrega === 'RETIRA' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}>
                <RadioGroupItem value="RETIRA" id="retira" />
                <Label htmlFor="retira" className="cursor-pointer flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span className="text-sm font-medium">Cliente Retira</span>
                </Label>
              </div>
              <div className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                tipoEntrega === 'TELE_ENTREGA' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}>
                <RadioGroupItem value="TELE_ENTREGA" id="tele-entrega" />
                <Label htmlFor="tele-entrega" className="cursor-pointer flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span className="text-sm font-medium">Tele Entrega</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data e Horário de Entrega */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataEntrega" className="flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5" />
                Data *
              </Label>
              <Input
                id="dataEntrega"
                type="date"
                min={dataMinima}
                className="input-padaria h-10"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horarioEntrega" className="flex items-center gap-2 text-sm">
                <Clock className="w-3.5 h-3.5" />
                Horário *
              </Label>
              <Select value={horarioEntrega} onValueChange={setHorarioEntrega}>
                <SelectTrigger className="input-padaria h-10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {HORARIOS_COMERCIAIS.map((h) => (
                    <SelectItem 
                      key={h} 
                      value={h}
                      disabled={horarioJaPassou(h, dataEntrega)}
                      className={horarioJaPassou(h, dataEntrega) ? 'opacity-40' : ''}
                    >
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Endereço de Entrega - apenas para TELE_ENTREGA */}
          {tipoEntrega === 'TELE_ENTREGA' && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border-2 border-primary/30">
              <p className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço de Entrega
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="endereco" className="text-sm">Endereço *</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, complemento"
                    className="input-padaria h-11 text-base"
                    value={enderecoEntrega}
                    onChange={(e) => setEnderecoEntrega(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bairro" className="text-sm">Bairro *</Label>
                  <Input
                    id="bairro"
                    placeholder="Nome do bairro"
                    className="input-padaria h-11 text-base"
                    value={bairroEntrega}
                    onChange={(e) => setBairroEntrega(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão Continuar */}
      <Button
        size="lg"
        className="w-full btn-padaria h-12 text-base"
        onClick={handleContinuar}
        disabled={!clienteSelecionadoLocal || !dataEntrega || !horarioEntrega}
      >
        Continuar para Produtos
      </Button>
    </div>
  );
}
