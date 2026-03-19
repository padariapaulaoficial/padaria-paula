'use client';

// ClienteForm - Padaria Paula
// Formulário de cadastro de cliente com CPF/CNPJ, tipo de entrega e data

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, MapPin, FileText, Search, Calendar, Truck, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { usePedidoStore, DadosCliente } from '@/store/usePedidoStore';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

// Schema de validação
const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  telefone: z.string().min(10, 'Telefone inválido'),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  bairro: z.string().min(2, 'Bairro é obrigatório'), // Agora obrigatório
  cpfCnpj: z.string().optional(),
  tipoPessoa: z.enum(['CPF', 'CNPJ']),
  tipoEntrega: z.enum(['RETIRA', 'TELE_ENTREGA']),
  dataEntrega: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

export default function ClienteForm() {
  const { cliente, setCliente } = usePedidoStore();
  const { setTela } = useAppStore();
  const { toast } = useToast();
  const [buscando, setBuscando] = useState(false);
  const [sugestoes, setSugestoes] = useState<DadosCliente[]>([]);
  const [tipoPessoa, setTipoPessoa] = useState<'CPF' | 'CNPJ'>(cliente?.tipoPessoa || 'CPF');
  const [tipoEntrega, setTipoEntrega] = useState<'RETIRA' | 'TELE_ENTREGA'>(cliente?.tipoEntrega || 'RETIRA');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: cliente?.nome || '',
      telefone: cliente?.telefone || '',
      endereco: cliente?.endereco || '',
      bairro: cliente?.bairro || '',
      cpfCnpj: cliente?.cpfCnpj || '',
      tipoPessoa: cliente?.tipoPessoa || 'CPF',
      tipoEntrega: cliente?.tipoEntrega || 'RETIRA',
      dataEntrega: cliente?.dataEntrega || '',
    },
    mode: 'onChange',
  });

  const telefoneValue = watch('telefone');

  // Buscar cliente por telefone
  useEffect(() => {
    const buscarCliente = async () => {
      if (telefoneValue && telefoneValue.replace(/\D/g, '').length >= 10) {
        setBuscando(true);
        try {
          const res = await fetch(`/api/clientes?telefone=${encodeURIComponent(telefoneValue)}`);
          const clienteEncontrado = await res.json();
          
          if (clienteEncontrado) {
            setValue('nome', clienteEncontrado.nome);
            setValue('endereco', clienteEncontrado.endereco);
            setValue('bairro', clienteEncontrado.bairro || '');
            setValue('cpfCnpj', clienteEncontrado.cpfCnpj || '');
            if (clienteEncontrado.tipoPessoa) {
              setTipoPessoa(clienteEncontrado.tipoPessoa);
              setValue('tipoPessoa', clienteEncontrado.tipoPessoa);
            }
            toast({
              title: 'Cliente encontrado!',
              description: `Dados de ${clienteEncontrado.nome} preenchidos.`,
            });
          }
        } catch (error) {
          console.error('Erro ao buscar cliente:', error);
        } finally {
          setBuscando(false);
        }
      }
    };

    const timeout = setTimeout(buscarCliente, 500);
    return () => clearTimeout(timeout);
  }, [telefoneValue, setValue, toast]);

  // Buscar sugestões por nome
  const buscarSugestoes = async (termo: string) => {
    if (termo.length >= 2) {
      try {
        const res = await fetch(`/api/clientes?busca=${encodeURIComponent(termo)}`);
        const data = await res.json();
        // Garantir que é um array antes de fazer slice
        const clientes = Array.isArray(data) ? data : [];
        setSugestoes(clientes.slice(0, 5));
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        setSugestoes([]);
      }
    } else {
      setSugestoes([]);
    }
  };

  const selecionarSugestao = (sugestao: DadosCliente) => {
    setValue('nome', sugestao.nome);
    setValue('telefone', sugestao.telefone);
    setValue('endereco', sugestao.endereco);
    setValue('bairro', sugestao.bairro || '');
    setValue('cpfCnpj', sugestao.cpfCnpj || '');
    if (sugestao.tipoPessoa) {
      setTipoPessoa(sugestao.tipoPessoa);
      setValue('tipoPessoa', sugestao.tipoPessoa);
    }
    setSugestoes([]);
  };

  const onSubmit = (data: ClienteFormData) => {
    setCliente({
      nome: data.nome,
      telefone: data.telefone,
      endereco: data.endereco,
      bairro: data.bairro,
      cpfCnpj: data.cpfCnpj,
      tipoPessoa: data.tipoPessoa,
      tipoEntrega: data.tipoEntrega,
      dataEntrega: data.dataEntrega,
    });
    
    toast({
      title: 'Cliente cadastrado!',
      description: 'Agora você pode adicionar produtos ao pedido.',
    });
    
    // Navegar para produtos
    setTela('produtos');
  };

  // Aplicar máscara de telefone
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  // Aplicar máscara de CPF
  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
  };

  // Aplicar máscara de CNPJ
  const formatarCNPJ = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 5) return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
    if (numeros.length <= 8) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
    if (numeros.length <= 12) return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`;
  };

  // Handler para troca de tipo de pessoa
  const handleTrocarTipoPessoa = (isCNPJ: boolean) => {
    const novoTipo = isCNPJ ? 'CNPJ' : 'CPF';
    setTipoPessoa(novoTipo);
    setValue('tipoPessoa', novoTipo);
    setValue('cpfCnpj', ''); // Limpar ao trocar
  };

  // Data mínima para entrega (hoje)
  const dataMinima = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card className="card-padaria">
        <CardHeader className="text-center pb-3 border-b border-border/50">
          <CardTitle className="text-lg sm:text-xl font-display">Dados do Cliente</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Preencha os dados para iniciar o pedido
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome com sugestões */}
            <div className="space-y-1.5 relative">
              <Label htmlFor="nome" className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5" />
                Nome *
              </Label>
              <div className="relative">
                <Input
                  id="nome"
                  placeholder="Nome completo"
                  className="input-padaria pr-10 h-10"
                  {...register('nome')}
                  onChange={(e) => {
                    register('nome').onChange(e);
                    buscarSugestoes(e.target.value);
                  }}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              
              {/* Lista de sugestões */}
              {sugestoes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
                  {sugestoes.map((sugestao, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => selecionarSugestao(sugestao)}
                    >
                      <div className="font-medium text-sm">{sugestao.nome}</div>
                      <div className="text-xs text-muted-foreground">{sugestao.telefone}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5" />
                Telefone *
              </Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                className="input-padaria h-10"
                {...register('telefone')}
                onChange={(e) => {
                  const formatado = formatarTelefone(e.target.value);
                  setValue('telefone', formatado);
                }}
                value={watch('telefone')}
              />
              {buscando && (
                <p className="text-xs text-muted-foreground">Buscando cliente...</p>
              )}
              {errors.telefone && (
                <p className="text-xs text-destructive">{errors.telefone.message}</p>
              )}
            </div>

            {/* Endereço e Bairro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="endereco" className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  Endereço *
                </Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número"
                  className="input-padaria h-10"
                  {...register('endereco')}
                />
                {errors.endereco && (
                  <p className="text-xs text-destructive">{errors.endereco.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bairro" className="text-sm">
                  Bairro *
                </Label>
                <Input
                  id="bairro"
                  placeholder="Bairro"
                  className="input-padaria h-10"
                  {...register('bairro')}
                />
                {errors.bairro && (
                  <p className="text-xs text-destructive">{errors.bairro.message}</p>
                )}
              </div>
            </div>

            {/* CPF/CNPJ com Switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <FileText className="w-3.5 h-3.5" />
                  {tipoPessoa === 'CPF' ? 'CPF' : 'CNPJ'}
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">CPF</span>
                  <Switch
                    checked={tipoPessoa === 'CNPJ'}
                    onCheckedChange={handleTrocarTipoPessoa}
                  />
                  <span className="text-xs text-muted-foreground">CNPJ</span>
                </div>
              </div>
              <Input
                id="cpfCnpj"
                placeholder={tipoPessoa === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                className="input-padaria h-10"
                {...register('cpfCnpj')}
                onChange={(e) => {
                  const formatado = tipoPessoa === 'CPF' 
                    ? formatarCPF(e.target.value) 
                    : formatarCNPJ(e.target.value);
                  setValue('cpfCnpj', formatado);
                }}
                value={watch('cpfCnpj')}
                maxLength={tipoPessoa === 'CPF' ? 14 : 18}
              />
            </div>

            {/* Tipo de Entrega */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Entrega</Label>
              <RadioGroup
                value={tipoEntrega}
                onValueChange={(value) => {
                  setTipoEntrega(value as 'RETIRA' | 'TELE_ENTREGA');
                  setValue('tipoEntrega', value as 'RETIRA' | 'TELE_ENTREGA');
                }}
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

            {/* Data de Entrega */}
            <div className="space-y-1.5">
              <Label htmlFor="dataEntrega" className="flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5" />
                Data de Entrega
              </Label>
              <Input
                id="dataEntrega"
                type="date"
                min={dataMinima}
                className="input-padaria h-10"
                {...register('dataEntrega')}
              />
            </div>

            {/* Botão de Continuar */}
            <Button
              type="submit"
              size="lg"
              className="w-full btn-padaria h-11"
              disabled={!isValid}
            >
              Continuar para Produtos
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
