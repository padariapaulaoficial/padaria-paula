'use client';

// Catálogo Público - Padaria Paula
// Página de cardápio online para clientes

import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ShoppingCart, Check, Calendar, Clock, MapPin } from 'lucide-react';

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

interface Configuracao {
  nomeLoja: string;
  telefone: string;
  endereco: string;
}

// Categorias do catálogo
const CATEGORIAS_CATALOGO = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'Tortas', label: 'Tortas' },
  { id: 'Docinhos', label: 'Docinhos' },
  { id: 'Salgadinhos', label: 'Salgadinhos' },
  { id: 'Outros', label: 'Outros' },
];

// Horários disponíveis
const HORARIOS_DISPONIVEIS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00'
];

// Formatar moeda
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
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

export default function PaginaCatalogo() {
  // Estados
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [mostrarCarrinhoMobile, setMostrarCarrinhoMobile] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pedidoSucesso, setPedidoSucesso] = useState<string | null>(null);

  // Dados do cliente
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [enderecoCliente, setEnderecoCliente] = useState('');
  
  // Dados de entrega
  const [tipoEntrega, setTipoEntrega] = useState<'RETIRA' | 'TELE_ENTREGA'>('RETIRA');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horarioEntrega, setHorarioEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');

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

  // Carregar produtos e configurações
  useEffect(() => {
    async function carregarDados() {
      try {
        const res = await fetch('/api/catalogo');
        const data = await res.json();
        setProdutos(data.produtos || []);
        setConfiguracao(data.configuracao);
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
    if (categoriaAtiva === 'TODOS') return produtos;
    return produtos.filter(p => p.categoria === categoriaAtiva);
  }, [produtos, categoriaAtiva]);

  // Total de itens no carrinho
  const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);

  // Total do carrinho
  const totalCarrinho = carrinho.reduce((sum, item) => sum + item.subtotal, 0);

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

  // Finalizar pedido
  async function finalizarPedido() {
    if (!nomeCliente || !telefoneCliente) {
      alert('Por favor, preencha seu nome e telefone.');
      return;
    }

    if (!dataEntrega) {
      alert('Por favor, selecione a data de entrega.');
      return;
    }

    if (!horarioEntrega) {
      alert('Por favor, selecione o horário de entrega.');
      return;
    }

    if (carrinho.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch('/api/catalogo/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCliente,
          telefoneCliente,
          enderecoCliente: tipoEntrega === 'TELE_ENTREGA' ? enderecoCliente : null,
          tipoEntrega,
          dataEntrega,
          horarioEntrega,
          observacoes,
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f5eb' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#2d1f14' }}>
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-serif text-2xl mb-4" style={{ color: '#2d1f14' }}>Pedido Confirmado!</h2>
          <p className="text-gray-600 mb-6">{pedidoSucesso}</p>
          <p className="text-sm text-gray-500 mb-6">
            Entraremos em contato pelo WhatsApp para confirmar seu pedido.
          </p>
          <button
            onClick={() => setPedidoSucesso(null)}
            className="w-full py-3 rounded-xl font-medium text-white"
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex flex-col lg:flex-row gap-8 items-start relative">
        {/* Left Section: Products Grid */}
        <div className="w-full lg:w-2/3 flex-1 pb-24 lg:pb-0">
          {/* Category Filters */}
          <nav className="flex flex-wrap gap-2 sm:gap-3 mb-8 justify-center lg:justify-start">
            {CATEGORIAS_CATALOGO.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`px-4 sm:px-5 py-2 rounded-full font-medium text-sm sm:text-base transition-colors ${
                  categoriaAtiva === cat.id
                    ? 'bg-[#e8dbbf] text-[#2d1f14]'
                    : 'hover:bg-[#e8dbbf] text-[#3b2f2f]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#d4af37] border-t-transparent"></div>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">Nenhum produto encontrado nesta categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {produtosFiltrados.map(produto => {
                const isQtd25 = isCategoriaQuantidade25(produto.categoria);
                const qtdAtual = obterQuantidade(produto.id);
                
                return (
                  <article
                    key={produto.id}
                    className="rounded-2xl p-3 sm:p-4 shadow-sm border flex flex-col"
                    style={{ backgroundColor: '#f0e6d2', borderColor: '#e2d5bd' }}
                  >
                    {/* Imagem do produto */}
                    <div className="overflow-hidden aspect-square rounded-2xl mb-2">
                      {produto.imagemUrl ? (
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
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
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
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
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
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
                                className="w-full text-sm rounded-lg px-3 py-2 border bg-white"
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
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-white"
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

        {/* Right Sidebar / Cart (Desktop) */}
        <aside className="w-full lg:w-1/3 rounded-[2rem] shadow-xl border sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto z-10 hidden lg:block"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.3)'
          }}
        >
          <div className="p-6 sm:p-8">
            <h2 className="font-serif text-2xl sm:text-3xl mb-6 tracking-wide" style={{ color: '#2d1f14' }}>
              Seu Pedido
            </h2>

            {/* Cart Items */}
            {carrinho.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Seu carrinho está vazio</p>
            ) : (
              <div className="space-y-4 mb-6 border-b pb-6" style={{ borderColor: '#e2d5bd' }}>
                {carrinho.map((item) => (
                  <div key={`${item.produto.id}-${item.tamanho || 'default'}`} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-serif text-base uppercase tracking-wider" style={{ color: '#2d1f14' }}>
                        {item.produto.nome}
                        {item.tamanho && <span className="text-sm font-normal"> ({item.tamanho})</span>}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{item.quantidade}x {formatarMoeda(item.preco)}</span>
                        <span className="font-medium" style={{ color: '#2d1f14' }}>= {formatarMoeda(item.subtotal)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removerDoCarrinho(item.produto.id, item.tamanho, item.quantidade)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Order Details Form */}
            <h3 className="font-serif text-lg mb-3" style={{ color: '#2d1f14' }}>Seus Dados</h3>
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Nome Completo *"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37] placeholder-gray-400 text-sm"
                style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
              />
              <input
                type="tel"
                placeholder="Telefone/WhatsApp *"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(e.target.value)}
                className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37] placeholder-gray-400 text-sm"
                style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
              />
            </div>

            {/* Entrega */}
            <h3 className="font-serif text-lg mb-3" style={{ color: '#2d1f14' }}>Entrega</h3>
            
            {/* Tipo de entrega */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setTipoEntrega('RETIRA')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tipoEntrega === 'RETIRA' ? 'text-white' : 'bg-[#e8dbbf] text-[#2d1f14]'
                }`}
                style={tipoEntrega === 'RETIRA' ? { backgroundColor: '#2d1f14' } : {}}
              >
                Retirar na Loja
              </button>
              <button
                onClick={() => setTipoEntrega('TELE_ENTREGA')}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tipoEntrega === 'TELE_ENTREGA' ? 'text-white' : 'bg-[#e8dbbf] text-[#2d1f14]'
                }`}
                style={tipoEntrega === 'TELE_ENTREGA' ? { backgroundColor: '#2d1f14' } : {}}
              >
                Tele-entrega
              </button>
            </div>

            {/* Endereço se tele-entrega */}
            {tipoEntrega === 'TELE_ENTREGA' && (
              <input
                type="text"
                placeholder="Endereço de Entrega *"
                value={enderecoCliente}
                onChange={(e) => setEnderecoCliente(e.target.value)}
                className="w-full bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37] placeholder-gray-400 text-sm mb-3"
                style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
              />
            )}

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data</label>
                <input
                  type="date"
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                  min={getDataMinima()}
                  max={getDataMaxima()}
                  className="w-full bg-white border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                  style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Horário</label>
                <select
                  value={horarioEntrega}
                  onChange={(e) => setHorarioEntrega(e.target.value)}
                  className="w-full bg-white border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-sm"
                  style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
                >
                  <option value="">Selecionar</option>
                  {HORARIOS_DISPONIVEIS.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observações */}
            <textarea
              placeholder="Observações (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full bg-white border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#d4af37] placeholder-gray-400 text-sm resize-none mb-4"
              style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
            />

            {/* Total e Botão */}
            <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: '#2d1f14' }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm">Total:</span>
                <span className="text-xl font-serif">{formatarMoeda(totalCarrinho)}</span>
              </div>
              <button
                onClick={finalizarPedido}
                disabled={carrinho.length === 0 || enviando}
                className="w-full font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Cart FAB */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <button
          onClick={() => setMostrarCarrinhoMobile(true)}
          className="p-4 rounded-full shadow-lg flex items-center justify-center"
          style={{ backgroundColor: '#2d1f14', color: 'white' }}
        >
          <ShoppingCart className="w-6 h-6" />
          {totalItens > 0 && (
            <span className="absolute -top-2 -right-2 text-xs font-bold px-2 py-1 rounded-full"
              style={{ backgroundColor: '#d4af37', color: 'white' }}>
              {totalItens}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Cart Modal */}
      {mostrarCarrinhoMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMostrarCarrinhoMobile(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl"
            style={{ backgroundColor: '#f8f5eb' }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl" style={{ color: '#2d1f14' }}>Seu Pedido</h2>
                <button onClick={() => setMostrarCarrinhoMobile(false)} className="text-2xl">&times;</button>
              </div>

              {/* Cart Items Mobile */}
              {carrinho.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Seu carrinho está vazio</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {carrinho.map((item) => (
                      <div key={`${item.produto.id}-${item.tamanho || 'default'}`} className="flex justify-between items-center p-3 rounded-xl"
                        style={{ backgroundColor: '#f0e6d2' }}>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm" style={{ color: '#2d1f14' }}>
                            {item.produto.nome}
                            {item.tamanho && <span className="text-xs"> ({item.tamanho})</span>}
                          </h4>
                          <span className="text-xs text-gray-600">{item.quantidade}x {formatarMoeda(item.preco)} = {formatarMoeda(item.subtotal)}</span>
                        </div>
                        <button
                          onClick={() => removerDoCarrinho(item.produto.id, item.tamanho, item.quantidade)}
                          className="text-red-500 text-xs"
                        >
                          remover
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Form Mobile */}
                  <div className="space-y-3 mb-4">
                    <input
                      type="text"
                      placeholder="Nome *"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-sm"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)', backgroundColor: 'white' }}
                    />
                    <input
                      type="tel"
                      placeholder="Telefone *"
                      value={telefoneCliente}
                      onChange={(e) => setTelefoneCliente(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-sm"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)', backgroundColor: 'white' }}
                    />
                  </div>

                  {/* Tipo entrega mobile */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setTipoEntrega('RETIRA')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                        tipoEntrega === 'RETIRA' ? 'text-white' : 'bg-[#e8dbbf] text-[#2d1f14]'
                      }`}
                      style={tipoEntrega === 'RETIRA' ? { backgroundColor: '#2d1f14' } : {}}
                    >
                      Retirar
                    </button>
                    <button
                      onClick={() => setTipoEntrega('TELE_ENTREGA')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                        tipoEntrega === 'TELE_ENTREGA' ? 'text-white' : 'bg-[#e8dbbf] text-[#2d1f14]'
                      }`}
                      style={tipoEntrega === 'TELE_ENTREGA' ? { backgroundColor: '#2d1f14' } : {}}
                    >
                      Entrega
                    </button>
                  </div>

                  {tipoEntrega === 'TELE_ENTREGA' && (
                    <input
                      type="text"
                      placeholder="Endereço *"
                      value={enderecoCliente}
                      onChange={(e) => setEnderecoCliente(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3 text-sm mb-3"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)', backgroundColor: 'white' }}
                    />
                  )}

                  {/* Data/Hora mobile */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <input
                      type="date"
                      value={dataEntrega}
                      onChange={(e) => setDataEntrega(e.target.value)}
                      min={getDataMinima()}
                      max={getDataMaxima()}
                      className="w-full border rounded-xl px-3 py-2 text-sm"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)', backgroundColor: 'white' }}
                    />
                    <select
                      value={horarioEntrega}
                      onChange={(e) => setHorarioEntrega(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-sm"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)', backgroundColor: 'white' }}
                    >
                      <option value="">Horário</option>
                      {HORARIOS_DISPONIVEIS.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Total e Botão Mobile */}
                  <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: '#2d1f14' }}>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm">Total:</span>
                      <span className="text-xl font-serif">{formatarMoeda(totalCarrinho)}</span>
                    </div>
                    <button
                      onClick={finalizarPedido}
                      disabled={carrinho.length === 0 || enviando}
                      className="w-full font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(to right, #d4a373, #faedcd)',
                        color: '#2d1f14'
                      }}
                    >
                      {enviando ? 'Enviando...' : 'Confirmar Pedido'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
