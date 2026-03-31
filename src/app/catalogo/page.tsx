'use client';

// Catálogo Público - Padaria Paula
// Fluxo: Produtos → Entrega/Retirada → Dados do Cliente

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Minus, ShoppingCart, Check, Clock, MapPin, Search, 
  MessageCircle, ChevronRight, ChevronLeft, Package, Truck, User,
  X, AlertCircle, Phone
} from 'lucide-react';

// Tipos
interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  tipoVenda: string;
  valorUnit: number;
  categoria: string | null;
  ativo: boolean;
  tipoProduto: string;
  tamanhos: string[] | null;
  precosTamanhos: Record<string, number> | null;
  imagemUrl?: string | null;
}

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  tamanho?: string;
  preco: number;
  subtotal: number;
}

interface Bairro {
  id: string;
  nome: string;
  taxaEntrega: number;
}

interface Configuracao {
  nomeLoja: string;
  telefone: string;
  endereco: string;
}

interface ConfiguracaoCatalogo {
  pedidoMinimo: number;
  mensagemBoasVindas: string;
  mensagemDadosCliente: string;
  exibirBusca: boolean;
  exibirWhatsapp: boolean;
  horarioAbertura: string | null;
  horarioFechamento: string | null;
}

// Categorias do catálogo
const CATEGORIAS_CATALOGO = [
  { id: 'TODOS', label: 'Todos', emoji: '🍽️' },
  { id: 'Tortas', label: 'Tortas', emoji: '🥧' },
  { id: 'Docinhos', label: 'Docinhos', emoji: '🍬' },
  { id: 'Salgadinhos', label: 'Salgadinhos', emoji: '🥟' },
  { id: 'Outros', label: 'Outros', emoji: '📦' },
];

// Formatar moeda
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Máscara de telefone
function mascaraTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
}

// Obter data mínima (amanhã)
function getDataMinima(): string {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  return amanha.toISOString().split('T')[0];
}

// Obter data máxima (3 meses)
function getDataMaxima(): string {
  const maxima = new Date();
  maxima.setMonth(maxima.getMonth() + 3);
  return maxima.toISOString().split('T')[0];
}

// Verifica se é categoria de docinhos ou salgadinhos
function isCategoriaQuantidade25(categoria: string | null): boolean {
  if (!categoria) return false;
  const cat = categoria.toLowerCase();
  return cat.includes('docinho') || cat.includes('doces') || cat.includes('salgadinho') || cat.includes('salgados');
}

// Gerar opções de quantidade (25 em 25)
function getOpcoesQuantidade25(max: number = 500): number[] {
  const opcoes = [];
  for (let i = 25; i <= max; i += 25) {
    opcoes.push(i);
  }
  return opcoes;
}

// Gerar horários disponíveis baseado na configuração
function gerarHorariosDisponiveis(abertura: string | null, fechamento: string | null): string[] {
  const horarios: string[] = [];
  const horaInicio = abertura ? parseInt(abertura.split(':')[0]) : 8;
  const horaFim = fechamento ? parseInt(fechamento.split(':')[0]) : 20;
  
  for (let h = horaInicio; h <= horaFim; h++) {
    horarios.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < horaFim) {
      horarios.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  return horarios;
}

// Componente de Toast
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-[#2d1f14] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
        <Check className="w-5 h-5 text-green-400" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export default function PaginaCatalogo() {
  // Estados
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [configCatalogo, setConfigCatalogo] = useState<ConfiguracaoCatalogo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Etapa atual do fluxo
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  
  // Filtros e busca
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');
  const [busca, setBusca] = useState('');
  
  // Carrinho
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  
  // Entrega
  const [tipoEntrega, setTipoEntrega] = useState<'RETIRA' | 'TELE_ENTREGA'>('RETIRA');
  const [bairroSelecionado, setBairroSelecionado] = useState<string>('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Dados do cliente
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [enderecoCliente, setEnderecoCliente] = useState('');
  
  // Estados de envio
  const [enviando, setEnviando] = useState(false);
  const [pedidoSucesso, setPedidoSucesso] = useState<string | null>(null);

  // Carregar carrinho do localStorage
  useEffect(() => {
    const carrinhoSalvo = localStorage.getItem('catalogo-carrinho');
    if (carrinhoSalvo) {
      try {
        setCarrinho(JSON.parse(carrinhoSalvo));
      } catch (e) {
        console.error('Erro ao carregar carrinho:', e);
      }
    }
  }, []);

  // Salvar carrinho no localStorage
  useEffect(() => {
    localStorage.setItem('catalogo-carrinho', JSON.stringify(carrinho));
  }, [carrinho]);

  // Carregar dados iniciais
  useEffect(() => {
    async function carregarDados() {
      try {
        const res = await fetch('/api/catalogo');
        const data = await res.json();
        setProdutos(data.produtos || []);
        setConfiguracao(data.configuracao);
        setBairros(data.bairros || []);
        setConfigCatalogo(data.configCatalogo || {
          pedidoMinimo: 0,
          mensagemBoasVindas: 'Bem-vindo ao nosso catálogo!',
          mensagemDadosCliente: 'Falta pouco! Preciso dos seus dados para finalizar seu pedido.',
          exibirBusca: true,
          exibirWhatsapp: true,
          horarioAbertura: '08:00',
          horarioFechamento: '20:00',
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // Produtos filtrados
  const produtosFiltrados = useMemo(() => {
    let lista = produtos;
    
    if (categoriaAtiva !== 'TODOS') {
      lista = lista.filter(p => p.categoria === categoriaAtiva);
    }
    
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      lista = lista.filter(p => 
        p.nome.toLowerCase().includes(termo) ||
        p.descricao?.toLowerCase().includes(termo)
      );
    }
    
    return lista;
  }, [produtos, categoriaAtiva, busca]);

  // Total de itens no carrinho
  const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

  // Total do carrinho
  const totalCarrinho = carrinho.reduce((sum, item) => sum + item.subtotal, 0);

  // Taxa de entrega
  const taxaEntrega = useMemo(() => {
    if (tipoEntrega !== 'TELE_ENTREGA' || !bairroSelecionado) return 0;
    const bairro = bairros.find(b => b.id === bairroSelecionado);
    return bairro?.taxaEntrega || 0;
  }, [tipoEntrega, bairroSelecionado, bairros]);

  // Total com taxa
  const totalComTaxa = totalCarrinho + taxaEntrega;

  // Pedido mínimo atingido
  const pedidoMinimoAtingido = totalCarrinho >= (configCatalogo?.pedidoMinimo || 0);
  const faltaParaMinimo = Math.max(0, (configCatalogo?.pedidoMinimo || 0) - totalCarrinho);

  // Horários disponíveis
  const horariosDisponiveis = useMemo(() => {
    return gerarHorariosDisponiveis(
      configCatalogo?.horarioAbertura || null,
      configCatalogo?.horarioFechamento || null
    );
  }, [configCatalogo]);

  // Mostrar toast
  const mostrarToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  // Adicionar ao carrinho
  function adicionarAoCarrinho(produto: Produto, tamanho?: string, quantidadeCustom?: number) {
    const preco = tamanho && produto.precosTamanhos
      ? produto.precosTamanhos[tamanho] || produto.valorUnit
      : produto.valorUnit;
    
    const quantidade = quantidadeCustom || 1;
    const subtotal = preco * quantidade;

    setCarrinho(prev => {
      const existente = prev.find(item =>
        item.produto.id === produto.id && item.tamanho === tamanho
      );

      if (existente) {
        return prev.map(item =>
          item.produto.id === produto.id && item.tamanho === tamanho
            ? { ...item, quantidade: item.quantidade + quantidade, subtotal: item.subtotal + subtotal }
            : item
        );
      }

      return [...prev, { produto, quantidade, tamanho, preco, subtotal }];
    });

    mostrarToast(`${produto.nome} adicionado!`);
  }

  // Remover do carrinho
  function removerDoCarrinho(produtoId: string, tamanho?: string, quantidadeRemover?: number) {
    setCarrinho(prev => {
      const existente = prev.find(item =>
        item.produto.id === produtoId && item.tamanho === tamanho
      );

      if (!existente) return prev;

      const qtdRemover = quantidadeRemover || 1;
      
      if (existente.quantidade > qtdRemover) {
        const novaQtd = existente.quantidade - qtdRemover;
        const novoSubtotal = novaQtd * existente.preco;
        return prev.map(item =>
          item.produto.id === produtoId && item.tamanho === tamanho
            ? { ...item, quantidade: novaQtd, subtotal: novoSubtotal }
            : item
        );
      }

      return prev.filter(item =>
        !(item.produto.id === produtoId && item.tamanho === tamanho)
      );
    });
  }

  // Definir quantidade específica
  function setQuantidadeCarrinho(produtoId: string, tamanho: string | undefined, novaQuantidade: number, produto: Produto) {
    const preco = tamanho && produto.precosTamanhos
      ? produto.precosTamanhos[tamanho] || produto.valorUnit
      : produto.valorUnit;

    setCarrinho(prev => {
      if (novaQuantidade <= 0) {
        return prev.filter(item =>
          !(item.produto.id === produtoId && item.tamanho === tamanho)
        );
      }

      const existente = prev.find(item =>
        item.produto.id === produtoId && item.tamanho === tamanho
      );

      if (existente) {
        return prev.map(item =>
          item.produto.id === produtoId && item.tamanho === tamanho
            ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * preco }
            : item
        );
      }

      return [...prev, { produto, quantidade: novaQuantidade, tamanho, preco, subtotal: novaQuantidade * preco }];
    });
  }

  // Obter quantidade no carrinho
  function obterQuantidade(produtoId: string, tamanho?: string): number {
    const item = carrinho.find(i =>
      i.produto.id === produtoId && i.tamanho === tamanho
    );
    return item?.quantidade || 0;
  }

  // Avançar etapa
  function avancarEtapa() {
    if (etapa === 1 && carrinho.length > 0) {
      setEtapa(2);
    } else if (etapa === 2 && dataEntrega && horarioEntrega) {
      if (tipoEntrega === 'TELE_ENTREGA' && !bairroSelecionado) {
        alert('Por favor, selecione o bairro de entrega.');
        return;
      }
      setEtapa(3);
    }
  }

  // Voltar etapa
  function voltarEtapa() {
    if (etapa > 1) {
      setEtapa((etapa - 1) as 1 | 2 | 3);
    }
  }

  // Finalizar pedido
  async function finalizarPedido() {
    if (!nomeCliente || !telefoneCliente) {
      alert('Por favor, preencha seu nome e telefone.');
      return;
    }

    // Validar telefone (mínimo 10 dígitos)
    const telefoneNumeros = telefoneCliente.replace(/\D/g, '');
    if (telefoneNumeros.length < 10) {
      alert('Por favor, insira um telefone válido com DDD.');
      return;
    }

    if (tipoEntrega === 'TELE_ENTREGA' && !enderecoCliente) {
      alert('Por favor, preencha o endereço de entrega.');
      return;
    }

    setEnviando(true);

    try {
      const bairro = bairros.find(b => b.id === bairroSelecionado);
      
      const response = await fetch('/api/catalogo/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCliente,
          telefoneCliente,
          enderecoCliente: tipoEntrega === 'TELE_ENTREGA' ? enderecoCliente : null,
          bairroEntrega: bairro?.nome || null,
          tipoEntrega,
          dataEntrega,
          horarioEntrega,
          observacoes,
          taxaEntrega,
          itens: carrinho.map(item => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
            preco: item.preco,
            subtotal: item.subtotal,
            tamanho: item.tamanho,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pedido');
      }

      // Sucesso
      setPedidoSucesso(data.message);
      setCarrinho([]);
      localStorage.removeItem('catalogo-carrinho');
      
      // Limpar formulário
      setNomeCliente('');
      setTelefoneCliente('');
      setEnderecoCliente('');
      setDataEntrega('');
      setHorarioEntrega('');
      setObservacoes('');
      setEtapa(1);

    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert(error instanceof Error ? error.message : 'Erro ao criar pedido');
    } finally {
      setEnviando(false);
    }
  }

  // Modal de sucesso
  if (pedidoSucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8f5eb' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-green-500">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-serif text-2xl mb-4" style={{ color: '#2d1f14' }}>Pedido Confirmado!</h2>
          <p className="text-gray-600 mb-6">{pedidoSucesso}</p>
          <p className="text-sm text-gray-500 mb-6">
            Entraremos em contato pelo WhatsApp para confirmar seu pedido.
          </p>
          <button
            onClick={() => setPedidoSucesso(null)}
            className="w-full py-3 rounded-xl font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2d1f14' }}
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#f8f5eb', color: '#3b2f2f' }}>
      {/* Header */}
      <header className="py-4 px-4 sm:px-8 sticky top-0 z-20 shadow-md" style={{ backgroundColor: '#2d1f14', color: 'white' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide">{configuracao?.nomeLoja || 'Padaria Paula'}</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: '#d1d5db' }}>Cardápio Online</p>
        </div>
      </header>

      {/* Stepper */}
      <div className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Produtos', icon: Package },
              { num: 2, label: 'Entrega', icon: Truck },
              { num: 3, label: 'Seus Dados', icon: User },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      etapa >= step.num 
                        ? 'bg-[#2d1f14] text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {etapa > step.num ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`hidden sm:block text-sm font-medium ${
                    etapa >= step.num ? 'text-[#2d1f14]' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${
                    etapa > step.num ? 'bg-[#2d1f14]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 pb-32">
        
        {/* ETAPA 1: Produtos */}
        {etapa === 1 && (
          <div className="animate-fade-in">
            {/* Busca */}
            {configCatalogo?.exibirBusca && (
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-white border rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37] placeholder-gray-400"
                  style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                />
              </div>
            )}

            {/* Category Filters */}
            <nav className="flex flex-wrap gap-2 sm:gap-3 mb-8 justify-center">
              {CATEGORIAS_CATALOGO.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full font-medium text-sm sm:text-base transition-all ${
                    categoriaAtiva === cat.id
                      ? 'bg-[#2d1f14] text-white shadow-md'
                      : 'bg-white hover:bg-[#e8dbbf] text-[#3b2f2f] border border-[#e2d5bd]'
                  }`}
                >
                  <span className="mr-1">{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </nav>

            {/* Pedido mínimo alert */}
            {configCatalogo && configCatalogo.pedidoMinimo > 0 && carrinho.length > 0 && !pedidoMinimoAtingido && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Quase lá!</strong> Faltam <strong>{formatarMoeda(faltaParaMinimo)}</strong> para atingir o pedido mínimo de <strong>{formatarMoeda(configCatalogo.pedidoMinimo)}</strong>.
                </p>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#d4af37] border-t-transparent"></div>
              </div>
            ) : produtosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-500">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {produtosFiltrados.map(produto => {
                  const isQtd25 = isCategoriaQuantidade25(produto.categoria);
                  const qtdAtual = obterQuantidade(produto.id);
                  
                  return (
                    <article
                      key={produto.id}
                      className="rounded-2xl p-3 sm:p-4 shadow-sm border flex flex-col bg-white hover:shadow-md transition-shadow"
                      style={{ borderColor: '#e2d5bd' }}
                    >
                      {/* Imagem do produto */}
                      <div className="overflow-hidden aspect-square rounded-2xl mb-3">
                        {produto.imagemUrl ? (
                          <img
                            src={produto.imagemUrl}
                            alt={produto.nome}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#3e2a21' }}>
                            <span className="text-white text-4xl font-serif">
                              {produto.nome.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <h3 className="font-serif text-base sm:text-lg font-medium uppercase tracking-wide mb-1" style={{ color: '#2d1f14' }}>
                          {produto.nome}
                        </h3>

                        {/* Preços para tortas especiais */}
                        {produto.tipoProduto === 'ESPECIAL' && produto.precosTamanhos ? (
                          <div className="space-y-2 mb-2">
                            {Object.entries(produto.precosTamanhos).map(([tam, preco]) => (
                              <div key={tam} className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: '#3b2f2f' }}>
                                  {tam}: {formatarMoeda(preco)}
                                </span>
                                <div className="flex items-center gap-1">
                                  {obterQuantidade(produto.id, tam) > 0 && (
                                    <>
                                      <button
                                        onClick={() => removerDoCarrinho(produto.id, tam)}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm hover:opacity-80"
                                        style={{ backgroundColor: '#2d1f14' }}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-medium">
                                        {obterQuantidade(produto.id, tam)}
                                      </span>
                                    </>
                                  )}
                                  <button
                                    onClick={() => adicionarAoCarrinho(produto, tam)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white hover:opacity-80"
                                    style={{ backgroundColor: '#2d1f14' }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            {/* Preço normal */}
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm sm:text-base" style={{ color: '#2d1f14' }}>
                                {formatarMoeda(produto.valorUnit)}
                                <span className="text-xs text-gray-600 font-normal">
                                  {produto.tipoVenda === 'KG' ? ' /kg' : ' /un'}
                                </span>
                              </span>
                            </div>

                            {/* Seletor de quantidade */}
                            {isQtd25 ? (
                              <div className="mt-2">
                                <select
                                  value={qtdAtual}
                                  onChange={(e) => setQuantidadeCarrinho(produto.id, undefined, parseInt(e.target.value) || 0, produto)}
                                  className="w-full text-sm rounded-lg px-3 py-2 border bg-white focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                                  style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                                >
                                  <option value={0}>Selecionar quantidade</option>
                                  {getOpcoesQuantidade25().map(qtd => (
                                    <option key={qtd} value={qtd}>{qtd} unidades</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">Quantidade</span>
                                <div className="flex items-center gap-2">
                                  {qtdAtual > 0 && (
                                    <>
                                      <button
                                        onClick={() => removerDoCarrinho(produto.id)}
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:opacity-80"
                                        style={{ backgroundColor: '#2d1f14' }}
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="w-6 text-center font-medium">{qtdAtual}</span>
                                    </>
                                  )}
                                  <button
                                    onClick={() => adicionarAoCarrinho(produto)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-80"
                                    style={{ backgroundColor: '#2d1f14' }}
                                  >
                                    <Plus className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ETAPA 2: Entrega */}
        {etapa === 2 && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
              {/* Resumo do carrinho */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-serif text-xl mb-4" style={{ color: '#2d1f14' }}>Resumo do Pedido</h3>
                <div className="space-y-2">
                  {carrinho.map((item) => (
                    <div key={`${item.produto.id}-${item.tamanho || 'default'}`} className="flex justify-between text-sm">
                      <span>{item.quantidade}x {item.produto.nome} {item.tamanho ? `(${item.tamanho})` : ''}</span>
                      <span className="font-medium">{formatarMoeda(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t border-dashed border-gray-200">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-bold" style={{ color: '#2d1f14' }}>{formatarMoeda(totalCarrinho)}</span>
                </div>
              </div>

              {/* Tipo de entrega */}
              <h3 className="font-serif text-xl mb-4" style={{ color: '#2d1f14' }}>Como deseja receber?</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => { setTipoEntrega('RETIRA'); setBairroSelecionado(''); }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    tipoEntrega === 'RETIRA' 
                      ? 'border-[#2d1f14] bg-[#f8f5eb]' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Package className={`w-8 h-8 mx-auto mb-2 ${tipoEntrega === 'RETIRA' ? 'text-[#2d1f14]' : 'text-gray-400'}`} />
                  <span className={`font-medium ${tipoEntrega === 'RETIRA' ? 'text-[#2d1f14]' : 'text-gray-600'}`}>
                    Retirar na Loja
                  </span>
                </button>
                <button
                  onClick={() => setTipoEntrega('TELE_ENTREGA')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    tipoEntrega === 'TELE_ENTREGA' 
                      ? 'border-[#2d1f14] bg-[#f8f5eb]' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Truck className={`w-8 h-8 mx-auto mb-2 ${tipoEntrega === 'TELE_ENTREGA' ? 'text-[#2d1f14]' : 'text-gray-400'}`} />
                  <span className={`font-medium ${tipoEntrega === 'TELE_ENTREGA' ? 'text-[#2d1f14]' : 'text-gray-600'}`}>
                    Tele-entrega
                  </span>
                </button>
              </div>

              {/* Endereço da loja se for retirar */}
              {tipoEntrega === 'RETIRA' && configuracao?.endereco && (
                <div className="mb-6 p-4 rounded-xl bg-[#f8f5eb] flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#2d1f14] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#2d1f14' }}>Local de retirada:</p>
                    <p className="text-sm text-gray-600">{configuracao.endereco}</p>
                  </div>
                </div>
              )}

              {/* Seleção de bairro se tele-entrega */}
              {tipoEntrega === 'TELE_ENTREGA' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d1f14' }}>
                    Selecione seu bairro:
                  </label>
                  {bairros.length > 0 ? (
                    <select
                      value={bairroSelecionado}
                      onChange={(e) => setBairroSelecionado(e.target.value)}
                      className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                    >
                      <option value="">Escolha o bairro</option>
                      {bairros.filter(b => b.ativo).map(b => (
                        <option key={b.id} value={b.id}>
                          {b.nome} {b.taxaEntrega > 0 ? `(+${formatarMoeda(b.taxaEntrega)})` : '(Grátis)'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-amber-600">
                      Entre em contato pelo WhatsApp para verificar se entregamos na sua região.
                    </p>
                  )}
                </div>
              )}

              {/* Data e Horário */}
              <h3 className="font-serif text-xl mb-4" style={{ color: '#2d1f14' }}>Quando deseja receber?</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d1f14' }}>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data
                  </label>
                  <input
                    type="date"
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    min={getDataMinima()}
                    max={getDataMaxima()}
                    className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d1f14' }}>
                    <Clock className="w-4 h-4 inline mr-1" />
                    Horário
                  </label>
                  <select
                    value={horarioEntrega}
                    onChange={(e) => setHorarioEntrega(e.target.value)}
                    className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                  >
                    <option value="">Selecionar</option>
                    {horariosDisponiveis.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total com taxa */}
              {taxaEntrega > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatarMoeda(totalCarrinho)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Taxa de entrega</span>
                    <span>{formatarMoeda(taxaEntrega)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-amber-200">
                    <span style={{ color: '#2d1f14' }}>Total</span>
                    <span style={{ color: '#2d1f14' }}>{formatarMoeda(totalComTaxa)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ETAPA 3: Dados do Cliente */}
        {etapa === 3 && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
              {/* Mensagem amigável */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#f8f5eb' }}>
                  <User className="w-10 h-10" style={{ color: '#2d1f14' }} />
                </div>
                <h2 className="font-serif text-2xl mb-2" style={{ color: '#2d1f14' }}>Quase lá!</h2>
                <p className="text-gray-600">
                  {configCatalogo?.mensagemDadosCliente || 'Preciso dos seus dados para finalizar seu pedido e garantir que tudo fique perfeito!'}
                </p>
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d1f14' }}>
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Como podemos te chamar?"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d1f14' }}>
                    <Phone className="w-4 h-4 inline mr-1" />
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={telefoneCliente}
                    onChange={(e) => setTelefoneCliente(mascaraTelefone(e.target.value))}
                    maxLength={15}
                    className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                    style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Vamos te contatar por este número</p>
                </div>

                {tipoEntrega === 'TELE_ENTREGA' && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#2d1f14' }}>
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Endereço de entrega *
                    </label>
                    <input
                      type="text"
                      placeholder="Rua, número, complemento"
                      value={enderecoCliente}
                      onChange={(e) => setEnderecoCliente(e.target.value)}
                      className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#2d1f14' }}>
                    Observações (opcional)
                  </label>
                  <textarea
                    placeholder="Alguma observação sobre seu pedido?"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37] resize-none"
                    style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                  />
                </div>
              </div>

              {/* Resumo final */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium mb-3" style={{ color: '#2d1f14' }}>Resumo do pedido:</h4>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p><strong>Data:</strong> {new Date(dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  <p><strong>Horário:</strong> {horarioEntrega}</p>
                  <p><strong>Entrega:</strong> {tipoEntrega === 'RETIRA' ? 'Retirar na loja' : 'Tele-entrega'}</p>
                  {tipoEntrega === 'TELE_ENTREGA' && bairroSelecionado && (
                    <p><strong>Bairro:</strong> {bairros.find(b => b.id === bairroSelecionado)?.nome}</p>
                  )}
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#2d1f14' }}>
                  <div className="flex justify-between text-white mb-2">
                    <span className="text-sm">Subtotal:</span>
                    <span>{formatarMoeda(totalCarrinho)}</span>
                  </div>
                  {taxaEntrega > 0 && (
                    <div className="flex justify-between text-white mb-2">
                      <span className="text-sm">Taxa de entrega:</span>
                      <span>{formatarMoeda(taxaEntrega)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-white pt-2 border-t border-white/20">
                    <span className="font-medium">Total:</span>
                    <span className="text-xl font-serif">{formatarMoeda(totalComTaxa)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30" style={{ borderColor: '#e2d5bd' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {etapa > 1 ? (
            <button
              onClick={voltarEtapa}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShoppingCart className="w-5 h-5" />
              <span>{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
              <span className="font-medium" style={{ color: '#2d1f14' }}>{formatarMoeda(totalCarrinho)}</span>
            </div>
          )}

          {etapa < 3 ? (
            <button
              onClick={avancarEtapa}
              disabled={etapa === 1 && (carrinho.length === 0 || !pedidoMinimoAtingido)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#2d1f14' }}
            >
              <span>Continuar</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={finalizarPedido}
              disabled={enviando || !nomeCliente || telefoneCliente.replace(/\D/g, '').length < 10}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: 'linear-gradient(to right, #d4a373, #faedcd)',
                color: '#2d1f14'
              }}
            >
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#2d1f14] border-t-transparent"></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Confirmar Pedido</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* WhatsApp Floating Button */}
      {configCatalogo?.exibirWhatsapp && configuracao?.telefone && (
        <a
          href={`https://wa.me/55${configuracao.telefone.replace(/\D/g, '')}?text=Olá! Vim pelo catálogo online.`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-4 z-40 p-4 rounded-full shadow-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} />
      )}

      {/* CSS para animações */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
