'use client';

// Catálogo Público - Padaria Paula
// Página de cardápio online para clientes

import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ShoppingCart, MessageCircle } from 'lucide-react';

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
}

// Categorias do catálogo
const CATEGORIAS_CATALOGO = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'Tortas', label: 'Tortas' },
  { id: 'Docinhos', label: 'Docinhos' },
  { id: 'Salgadinhos', label: 'Salgadinhos' },
  { id: 'Outros', label: 'Outros' },
];

// Formatar moeda
function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Formatar telefone para WhatsApp
function formatarTelefoneWhatsApp(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  return `55${numeros}`;
}

interface Configuracao {
  nomeLoja: string;
  telefone: string;
  endereco: string;
}

export default function PaginaCatalogo() {
  // Estados
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [mostrarCarrinhoMobile, setMostrarCarrinhoMobile] = useState(false);

  // Dados do cliente
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [enderecoCliente, setEnderecoCliente] = useState('');
  const [cupomDesconto, setCupomDesconto] = useState('');

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
  const totalCarrinho = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);

  // Adicionar ao carrinho
  function adicionarAoCarrinho(produto: Produto, tamanho?: string) {
    const preco = tamanho && produto.precosTamanhos
      ? produto.precosTamanhos[tamanho] || produto.valorUnit
      : produto.valorUnit;

    const chaveItem = `${produto.id}-${tamanho || 'default'}`;

    setCarrinho(prev => {
      const existente = prev.find(item =>
        item.produto.id === produto.id && item.tamanho === tamanho
      );

      if (existente) {
        return prev.map(item =>
          item.produto.id === produto.id && item.tamanho === tamanho
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      return [...prev, { produto, quantidade: 1, tamanho, preco }];
    });
  }

  // Remover do carrinho
  function removerDoCarrinho(produtoId: string, tamanho?: string) {
    setCarrinho(prev => {
      const existente = prev.find(item =>
        item.produto.id === produtoId && item.tamanho === tamanho
      );

      if (existente && existente.quantidade > 1) {
        return prev.map(item =>
          item.produto.id === produtoId && item.tamanho === tamanho
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        );
      }

      return prev.filter(item =>
        !(item.produto.id === produtoId && item.tamanho === tamanho)
      );
    });
  }

  // Obter quantidade no carrinho
  function obterQuantidade(produtoId: string, tamanho?: string): number {
    const item = carrinho.find(i =>
      i.produto.id === produtoId && i.tamanho === tamanho
    );
    return item?.quantidade || 0;
  }

  // Finalizar pedido via WhatsApp
  function finalizarPedido() {
    if (!nomeCliente || !telefoneCliente) {
      alert('Por favor, preencha seu nome e telefone.');
      return;
    }

    // Montar mensagem
    let mensagem = `*Pedido - ${configuracao?.nomeLoja || 'Padaria Paula'}*\n\n`;
    mensagem += `*Cliente:* ${nomeCliente}\n`;
    mensagem += `*Telefone:* ${telefoneCliente}\n`;
    if (enderecoCliente) {
      mensagem += `*Endereço:* ${enderecoCliente}\n`;
    }
    mensagem += `\n*Itens:*\n`;

    carrinho.forEach(item => {
      const tamanhoStr = item.tamanho ? ` (${item.tamanho})` : '';
      mensagem += `- ${item.produto.nome}${tamanhoStr} x${item.quantidade} = ${formatarMoeda(item.preco * item.quantidade)}\n`;
    });

    mensagem += `\n*Total: ${formatarMoeda(totalCarrinho)}*`;

    if (cupomDesconto) {
      mensagem += `\n*Cupom:* ${cupomDesconto}`;
    }

    // Número da padaria (da configuração ou padrão)
    const telefonePadaria = configuracao?.telefone || '(11) 99999-9999';
    const numeroWhatsApp = formatarTelefoneWhatsApp(telefonePadaria);
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#f8f5eb', color: '#3b2f2f' }}>
      {/* Header */}
      <header className="py-4 px-8 sticky top-0 z-20 shadow-md" style={{ backgroundColor: '#2d1f14', color: 'white' }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-3xl font-medium tracking-wide">{configuracao?.nomeLoja || 'Padaria Paula'}</h1>
          <p className="text-sm mt-1" style={{ color: '#d1d5db' }}>Cardápio Online</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex flex-col lg:flex-row gap-8 items-start relative">
        {/* Left Section: Products Grid */}
        <div className="w-full lg:w-2/3 flex-1 pb-24 lg:pb-0">
          {/* Category Filters */}
          <nav className="flex flex-wrap gap-3 mb-8 justify-center lg:justify-start">
            {CATEGORIAS_CATALOGO.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`px-5 py-2 rounded-full font-medium transition-colors ${
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {produtosFiltrados.map(produto => (
                <article
                  key={produto.id}
                  className="rounded-2xl p-4 shadow-sm border flex flex-col"
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
                        <span className="text-white text-4xl font-serif">P</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <h3 className="font-serif text-lg font-medium uppercase tracking-wide mb-1" style={{ color: '#2d1f14' }}>
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
                            <div className="flex items-center gap-2">
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
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-medium" style={{ color: '#2d1f14' }}>
                          {formatarMoeda(produto.valorUnit)}
                          <span className="text-xs text-gray-600 font-normal">
                            {produto.tipoVenda === 'KG' ? ' /kg' : ' /un'}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          {obterQuantidade(produto.id) > 0 && (
                            <>
                              <button
                                onClick={() => removerDoCarrinho(produto.id)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: '#2d1f14' }}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">
                                {obterQuantidade(produto.id)}
                              </span>
                            </>
                          )}
                          <button
                            onClick={() => adicionarAoCarrinho(produto)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[#d4af37] transition-colors"
                            style={{ backgroundColor: '#2d1f14' }}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
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
          <div className="p-8">
            <h2 className="font-serif text-3xl mb-8 tracking-wide" style={{ color: '#2d1f14' }}>
              Sua Doce Seleção
            </h2>

            {/* Cart Items */}
            {carrinho.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Seu carrinho está vazio</p>
            ) : (
              <div className="space-y-6 mb-8 border-b pb-6" style={{ borderColor: '#e2d5bd' }}>
                {carrinho.map((item, index) => (
                  <div key={`${item.produto.id}-${item.tamanho || 'default'}`} className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif text-lg uppercase tracking-wider" style={{ color: '#2d1f14' }}>
                        {item.produto.nome}
                        {item.tamanho && <span className="text-sm"> ({item.tamanho})</span>}
                      </h4>
                      <div className="flex items-center gap-3 rounded-full px-2 py-1" style={{ backgroundColor: '#e8dbbf' }}>
                        <button
                          onClick={() => removerDoCarrinho(item.produto.id, item.tamanho)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: '#2d1f14' }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">{item.quantidade}</span>
                        <button
                          onClick={() => adicionarAoCarrinho(item.produto, item.tamanho)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: '#2d1f14' }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-base" style={{ color: '#2d1f14' }}>
                        {formatarMoeda(item.preco * item.quantidade)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order Details Form */}
            <h3 className="font-serif text-xl mb-4" style={{ color: '#2d1f14' }}>Dados do Pedido</h3>
            <form className="space-y-4 mb-8">
              <input
                type="text"
                placeholder="Nome Completo"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent placeholder-gray-500"
                style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
              />
              <input
                type="tel"
                placeholder="Telefone/WhatsApp"
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(e.target.value)}
                className="w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent placeholder-gray-500"
                style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
              />
              <input
                type="text"
                placeholder="Endereço de Entrega ou Retirada"
                value={enderecoCliente}
                onChange={(e) => setEnderecoCliente(e.target.value)}
                className="w-full bg-transparent border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent placeholder-gray-500"
                style={{ borderColor: 'rgba(45, 31, 20, 0.3)' }}
              />
            </form>

            {/* Finalize Section */}
            <h3 className="font-serif text-xl mb-4" style={{ color: '#2d1f14' }}>Complemente seu pedido</h3>
            <div className="rounded-2xl p-6 text-white shadow-lg" style={{ backgroundColor: '#2d1f14' }}>
              <div className="text-center mb-6">
                <span className="text-xl font-serif">Total: {formatarMoeda(totalCarrinho)}</span>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Cupom de Desconto"
                  value={cupomDesconto}
                  onChange={(e) => setCupomDesconto(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                />
              </div>
              <button
                onClick={finalizarPedido}
                disabled={carrinho.length === 0}
                className="w-full font-medium py-4 rounded-xl shadow-[0_4px_15px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to right, #d4a373, #faedcd)',
                  color: '#2d1f14'
                }}
              >
                <MessageCircle className="w-6 h-6" />
                Finalizar Pedido via WhatsApp
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Cart FAB */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <button
          onClick={() => setMostrarCarrinhoMobile(true)}
          className="p-4 rounded-full shadow-lg flex items-center justify-center gap-2"
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
                <h2 className="font-serif text-2xl" style={{ color: '#2d1f14' }}>Seu Carrinho</h2>
                <button onClick={() => setMostrarCarrinhoMobile(false)} className="text-2xl">&times;</button>
              </div>

              {/* Cart Items Mobile */}
              {carrinho.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Seu carrinho está vazio</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {carrinho.map((item) => (
                      <div key={`${item.produto.id}-${item.tamanho || 'default'}`} className="flex justify-between items-center p-3 rounded-xl"
                        style={{ backgroundColor: '#f0e6d2' }}>
                        <div>
                          <h4 className="font-medium" style={{ color: '#2d1f14' }}>
                            {item.produto.nome}
                            {item.tamanho && <span className="text-sm"> ({item.tamanho})</span>}
                          </h4>
                          <span className="text-sm text-gray-600">{formatarMoeda(item.preco)} x {item.quantidade}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removerDoCarrinho(item.produto.id, item.tamanho)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: '#2d1f14' }}>
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-medium">{item.quantidade}</span>
                          <button
                            onClick={() => adicionarAoCarrinho(item.produto, item.tamanho)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: '#2d1f14' }}>
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Form Mobile */}
                  <div className="space-y-3 mb-6">
                    <input
                      type="text"
                      placeholder="Nome Completo"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)', backgroundColor: 'white' }}
                    />
                    <input
                      type="tel"
                      placeholder="Telefone/WhatsApp"
                      value={telefoneCliente}
                      onChange={(e) => setTelefoneCliente(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)', backgroundColor: 'white' }}
                    />
                    <input
                      type="text"
                      placeholder="Endereço"
                      value={enderecoCliente}
                      onChange={(e) => setEnderecoCliente(e.target.value)}
                      className="w-full border rounded-xl px-4 py-3"
                      style={{ borderColor: 'rgba(45, 31, 20, 0.3)', backgroundColor: 'white' }}
                    />
                  </div>

                  {/* Total e Botão Mobile */}
                  <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: '#2d1f14' }}>
                    <div className="text-center mb-4">
                      <span className="text-xl font-serif">Total: {formatarMoeda(totalCarrinho)}</span>
                    </div>
                    <button
                      onClick={finalizarPedido}
                      disabled={carrinho.length === 0}
                      className="w-full font-medium py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(to right, #d4a373, #faedcd)',
                        color: '#2d1f14'
                      }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Finalizar via WhatsApp
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
