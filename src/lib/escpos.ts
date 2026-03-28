// Utilitários ESC/POS para impressora térmica 80mm - Padaria Paula
// Formatação otimizada para cupons com 48 caracteres por linha

// Tipos flexíveis para configuração
export type ConfiguracaoCupom = {
  id?: string;
  nomeLoja: string;
  endereco: string;
  telefone: string;
  cnpj: string;
  logoUrl?: string | null;
  senha?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

// Tipos completos para o pedido com relações
export type PedidoCompleto = {
  id: string;
  numero: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  clienteId?: string;
  observacoes: string | null;
  total: number;
  totalPedida: number;
  status?: string;
  impresso?: boolean;
  tipoEntrega: string;
  dataEntrega: string;
  horarioEntrega?: string | null;
  enderecoEntrega: string | null;
  bairroEntrega: string | null;
  valorEntrada?: number;
  formaPagamentoEntrada?: string | null;
  dataEntrada?: string | Date | null;
  valorTeleEntrega?: number | null; // Valor da taxa de tele-entrega
  cliente: {
    nome: string;
    telefone: string;
    cpfCnpj?: string | null;
    tipoPessoa?: string;
    endereco?: string | null;
    bairro?: string | null;
  };
  itens: {
    produto: {
      nome: string;
      tipoVenda: string;
    };
    quantidade: number;
    quantidadePedida?: number;
    valorUnit: number;
    subtotal: number;
    subtotalPedida?: number;
    observacao?: string | null;
    tamanho?: string | null;
  }[];
};

// Largura do papel 80mm em caracteres (fonte normal)
const LARGURA_PAPEL = 48;

// Ordem de categorias para impressão (tortas primeiro, docinhos segundo, salgadinhos terceiro)
const ORDEM_CATEGORIAS: Record<string, number> = {
  'TORTAS': 1,
  'TORTA': 1,
  'DOCINHOS': 2,
  'DOCINHO': 2,
  'DOCES': 2,
  'DOCE': 2,
  'SALGADINHOS': 3,
  'SALGADINHO': 3,
  'SALGADOS': 3,
  'SALGADO': 3,
  'BOLOS': 4,
  'BOLO': 4,
  'PAES': 5,
  'PAO': 5,
  'BEBIDAS': 6,
  'BEBIDA': 6,
  'OUTROS': 99,
};

// Função para ordenar itens por categoria
function ordenarItensPorCategoria(itens: { produto: { nome: string; tipoVenda: string }; quantidade: number; valorUnit: number; subtotal: number; observacao?: string | null; tamanho?: string | null }[]): typeof itens {
  return [...itens].sort((a, b) => {
    // Detectar categoria pelo nome do produto
    const nomeA = a.produto.nome.toUpperCase();
    const nomeB = b.produto.nome.toUpperCase();
    
    // Detectar se é torta especial (tem tamanho)
    const isTortaA = a.tamanho ? true : false;
    const isTortaB = b.tamanho ? true : false;
    
    // Tortas especiais primeiro
    if (isTortaA && !isTortaB) return -1;
    if (!isTortaA && isTortaB) return 1;
    
    // Tentar detectar categoria pelo nome
    let ordemA = 99;
    let ordemB = 99;
    
    for (const [cat, ordem] of Object.entries(ORDEM_CATEGORIAS)) {
      if (nomeA.includes(cat)) {
        ordemA = Math.min(ordemA, ordem);
      }
      if (nomeB.includes(cat)) {
        ordemB = Math.min(ordemB, ordem);
      }
    }
    
    // Se mesma categoria, ordenar por nome
    if (ordemA === ordemB) {
      return nomeA.localeCompare(nomeB);
    }
    
    return ordemA - ordemB;
  });
}

// Formatar número do pedido com zeros
export function formatarNumeroPedido(numero: number): string {
  return numero.toString().padStart(5, '0');
}

// Centralizar texto
function centralizar(texto: string, largura: number = LARGURA_PAPEL): string {
  const espacos = Math.floor((largura - texto.length) / 2);
  return ' '.repeat(Math.max(0, espacos)) + texto;
}

// Linha divisória
function linhaDivisoria(char: string = '-'): string {
  return char.repeat(LARGURA_PAPEL);
}

// Truncar texto se maior que tamanho (NÃO usar para endereços)
function truncar(texto: string, tamanho: number): string {
  if (texto.length <= tamanho) return texto;
  return texto.substring(0, tamanho - 2) + '..';
}

// Quebrar texto em múltiplas linhas sem truncar (para endereços)
function quebrarLinha(texto: string, largura: number = LARGURA_PAPEL): string[] {
  if (texto.length <= largura) return [texto];
  const linhas: string[] = [];
  let restante = texto;
  while (restante.length > 0) {
    if (restante.length <= largura) {
      linhas.push(restante);
      break;
    }
    // Tentar quebrar no último espaço antes da largura
    let posicaoQuebra = restante.lastIndexOf(' ', largura);
    if (posicaoQuebra <= 0) posicaoQuebra = largura;
    linhas.push(restante.substring(0, posicaoQuebra).trim());
    restante = restante.substring(posicaoQuebra).trim();
  }
  return linhas;
}

// Formatar CPF
export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length === 11) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  }
  return cpf;
}

// Formatar CNPJ
export function formatarCNPJ(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length === 14) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`;
  }
  return cnpj;
}

// Formatar telefone
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return telefone;
}

// Formatar moeda
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Formatar valor sem R$
function formatarValorSemCifrao(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Formatar quantidade conforme tipo de venda
function formatarQuantidadeProduto(quantidade: number, tipoVenda: string): string {
  switch (tipoVenda.toUpperCase()) {
    case 'KG':
      // Formato com vírgula, sem zeros extras
      const kgStr = quantidade % 1 === 0 
        ? quantidade.toString() 
        : quantidade.toFixed(3).replace(/\.?0+$/, '');
      return `${kgStr.replace('.', ',')}kg`;
    case 'UNIDADE':
    default:
      return `${Math.round(quantidade)}un`;
  }
}

// Formatar data de entrega
function formatarDataEntrega(dataStr: string | null): string {
  if (!dataStr) return '';
  const data = new Date(dataStr + 'T12:00:00');
  return data.toLocaleDateString('pt-BR');
}

// Formatar data de entrega com dia da semana para cupom
function formatarDataEntregaCompleta(dataStr: string | null, horario?: string | null): string {
  if (!dataStr) return '';
  
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const data = new Date(dataStr + 'T12:00:00');
  const diaSemana = diasSemana[data.getDay()];
  const dataFormatada = data.toLocaleDateString('pt-BR');
  
  if (horario) {
    return `${diaSemana} ${dataFormatada} às ${horario}`;
  }
  return `${diaSemana} ${dataFormatada}`;
}

/**
 * Gera o conteúdo do cupom do CLIENTE (com valores)
 * Mostra peso final ajustado se houver diferença
 */
export function gerarCupomCliente(
  pedido: PedidoCompleto,
  config: ConfiguracaoCupom
): string {
  const linhas: string[] = [];
  
  // Data e hora
  const dataHora = new Date(pedido.createdAt);
  const dataFormatada = dataHora.toLocaleDateString('pt-BR');
  const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // === NÚMERO DO PEDIDO ===
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar(`PEDIDO Nº ${formatarNumeroPedido(pedido.numero)}`));
  linhas.push(centralizar(`${dataFormatada} - ${horaFormatada}`));
  linhas.push(linhaDivisoria('='));
  
  // === DADOS DA PADARIA ===
  linhas.push(centralizar(config.nomeLoja.toUpperCase()));
  linhas.push(centralizar(config.endereco));
  linhas.push(centralizar(config.telefone));
  if (config.cnpj) {
    linhas.push(centralizar(`CNPJ: ${config.cnpj}`));
  }
  linhas.push(linhaDivisoria('-'));
  
  // === TIPO DE ENTREGA (dados do pedido) ===
  const tipoEntrega = pedido.tipoEntrega || 'RETIRA';
  linhas.push(`ENTREGA: ${tipoEntrega === 'RETIRA' ? 'CLIENTE RETIRA' : 'TELE ENTREGA'}`);
  if (pedido.dataEntrega) {
    linhas.push(formatarDataEntregaCompleta(pedido.dataEntrega, pedido.horarioEntrega));
  }
  linhas.push(linhaDivisoria('-'));
  
  // === DADOS DO CLIENTE ===
  linhas.push(`CLIENTE: ${truncar(pedido.cliente.nome, LARGURA_PAPEL - 9)}`);
  linhas.push(`Fone: ${formatarTelefone(pedido.cliente.telefone)}`);
  
  // Endereço do cliente (do cadastro do cliente) - SEM TRUNCAR
  if (pedido.cliente.endereco) {
    const enderecoCliente = pedido.cliente.bairro 
      ? `${pedido.cliente.endereco} - ${pedido.cliente.bairro}`
      : pedido.cliente.endereco;
    const linhasEndereco = quebrarLinha(`End: ${enderecoCliente}`);
    linhas.push(...linhasEndereco);
  }
  
  // Endereço de entrega (do pedido, se diferente ou tele-entrega) - SEM TRUNCAR
  if (tipoEntrega === 'TELE_ENTREGA' && pedido.enderecoEntrega) {
    const enderecoCompleto = pedido.bairroEntrega 
      ? `${pedido.enderecoEntrega} - ${pedido.bairroEntrega}`
      : pedido.enderecoEntrega;
    // Só mostra se for diferente do endereço do cliente
    const enderecoClienteCompleto = pedido.cliente.endereco 
      ? `${pedido.cliente.endereco}${pedido.cliente.bairro ? ` - ${pedido.cliente.bairro}` : ''}`
      : '';
    if (enderecoCompleto !== enderecoClienteCompleto) {
      const linhasEntrega = quebrarLinha(`Entregar: ${enderecoCompleto}`);
      linhas.push(...linhasEntrega);
    }
  }
  
  // CPF ou CNPJ
  if (pedido.cliente.cpfCnpj) {
    const tipoPessoa = pedido.cliente.tipoPessoa || 'CPF';
    const doc = tipoPessoa === 'CNPJ' 
      ? formatarCNPJ(pedido.cliente.cpfCnpj) 
      : formatarCPF(pedido.cliente.cpfCnpj);
    linhas.push(`${tipoPessoa}: ${doc}`);
  }
  linhas.push(linhaDivisoria('-'));
  
  // === ITENS DO PEDIDO (ORDENADOS: TORTAS, DOCINHOS, SALGADINHOS) ===
  // Filtrar itens com quantidade 0
  const itensValidos = pedido.itens.filter(item => item.quantidade > 0);
  const headerProd = 'PRODUTO'.padEnd(22);
  const headerQtd = 'QTD'.padStart(5).padEnd(7);
  const headerUnit = 'UNIT'.padStart(8);
  const headerTotal = 'TOTAL'.padStart(8);
  linhas.push(`${headerProd} ${headerQtd} ${headerUnit} ${headerTotal}`);
  linhas.push(linhaDivisoria('-'));
  
  const itensOrdenados = ordenarItensPorCategoria(itensValidos);
  
  for (const item of itensOrdenados) {
    // Incluir tamanho no nome se existir (para tortas especiais)
    // Formato: "TORTA ESPECIAL P" (sem parênteses)
    const nomeCompleto = item.tamanho 
      ? `${item.produto.nome} ${item.tamanho}`
      : item.produto.nome;
    const nome = truncar(nomeCompleto, 22).padEnd(22);
    const qtd = formatarQuantidadeProduto(item.quantidade, item.produto.tipoVenda).padStart(5).padEnd(7);
    const unit = formatarValorSemCifrao(item.valorUnit).padStart(8);
    const sub = formatarValorSemCifrao(item.subtotal).padStart(8);
    
    linhas.push(`${nome} ${qtd} ${unit} ${sub}`);
    
    if (item.observacao) {
      linhas.push(`  >> ${truncar(item.observacao, LARGURA_PAPEL - 4)}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  // Observações gerais do pedido (acima do subtotal)
  if (pedido.observacoes) {
    linhas.push('OBSERVAÇÕES:');
    const linhasObs = quebrarLinha(pedido.observacoes.toUpperCase(), LARGURA_PAPEL);
    linhas.push(...linhasObs);
    linhas.push(linhaDivisoria('-'));
  }
  
  // Subtotal dos itens (usando itens filtrados)
  const subtotalItens = itensValidos.reduce((sum, item) => sum + item.subtotal, 0);
  const subtotalStr = formatarMoeda(subtotalItens);
  const espacosSubtotal = LARGURA_PAPEL - 10 - subtotalStr.length;
  linhas.push(`SUBTOTAL:${' '.repeat(Math.max(0, espacosSubtotal))}${subtotalStr}`);
  
  // TAXA DE ENTREGA (se houver)
  if (pedido.tipoEntrega === 'TELE_ENTREGA' && pedido.valorTeleEntrega && pedido.valorTeleEntrega > 0) {
    const taxaStr = formatarMoeda(pedido.valorTeleEntrega);
    const labelTaxa = 'TAXA DE ENTREGA:';
    const espacosTaxa = LARGURA_PAPEL - labelTaxa.length - taxaStr.length;
    linhas.push(`${labelTaxa}${' '.repeat(Math.max(0, espacosTaxa))}${taxaStr}`);
  }
  
  // TOTAL com R$
  const totalStr = formatarMoeda(pedido.total);
  const espacosTotal = LARGURA_PAPEL - 7 - totalStr.length;
  linhas.push(`TOTAL:${' '.repeat(Math.max(0, espacosTotal))}${totalStr}`);
  
  // ENTRADA / PAGAMENTO (se houver)
  if (pedido.valorEntrada && pedido.valorEntrada > 0) {
    const entradaStr = formatarMoeda(pedido.valorEntrada);
    const espacosEntrada = LARGURA_PAPEL - 9 - entradaStr.length;
    linhas.push(`ENTRADA:${' '.repeat(Math.max(0, espacosEntrada))}${entradaStr}`);
    
    // Forma de pagamento
    if (pedido.formaPagamentoEntrada) {
      const formaPagamento = pedido.formaPagamentoEntrada.toLowerCase();
      linhas.push(`Forma: ${formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1)}`);
    }
    
    // Valor restante
    const restante = pedido.total - pedido.valorEntrada;
    if (restante > 0) {
      const restanteStr = formatarMoeda(restante);
      const espacosRestante = LARGURA_PAPEL - 9 - restanteStr.length;
      linhas.push(`RESTANTE:${' '.repeat(Math.max(0, espacosRestante))}${restanteStr}`);
    } else {
      linhas.push(centralizar('*** PAGO ***'));
    }
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('Obrigado pela preferência!'));
  linhas.push(centralizar('Volte sempre!'));
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}

/**
 * Gera o conteúdo do cupom da COZINHA (sem valores)
 * Mostra QUANTIDADE PEDIDA (original) para produção
 */
export function gerarCupomCozinha(
  pedido: PedidoCompleto,
  config: ConfiguracaoCupom
): string {
  const linhas: string[] = [];
  
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('*** PRODUÇÃO ***'));
  linhas.push(centralizar(`PEDIDO Nº ${formatarNumeroPedido(pedido.numero)}`));
  linhas.push(linhaDivisoria('='));
  
  // Tipo de entrega com data e horário
  const tipoEntrega = pedido.tipoEntrega || 'RETIRA';
  linhas.push(`ENTREGA: ${tipoEntrega === 'RETIRA' ? 'CLIENTE RETIRA' : 'TELE ENTREGA'}`);
  if (pedido.dataEntrega) {
    linhas.push(formatarDataEntregaCompleta(pedido.dataEntrega, pedido.horarioEntrega));
  }
  linhas.push(linhaDivisoria('-'));
  
  // Dados do cliente
  linhas.push(`Cliente: ${pedido.cliente.nome.toUpperCase()}`);
  linhas.push(`Fone: ${formatarTelefone(pedido.cliente.telefone)}`);
  linhas.push(linhaDivisoria('-'));
  
  // Cabeçalho
  linhas.push('PRODUTO                                      QTD');
  linhas.push(linhaDivisoria('-'));
  
  // Itens (ORDENADOS: TORTAS, DOCINHOS, SALGADINHOS)
  // Filtrar itens com quantidade 0
  const itensValidosCozinha = pedido.itens.filter(item => {
    const qtdProd = item.quantidadePedida || item.quantidade;
    return qtdProd > 0;
  });
  const itensOrdenadosCozinha = ordenarItensPorCategoria(itensValidosCozinha);
  
  for (const item of itensOrdenadosCozinha) {
    // Incluir tamanho no nome se existir (para tortas especiais)
    // Formato: "TORTA ESPECIAL P" (sem parênteses)
    const nomeCompleto = item.tamanho 
      ? `${item.produto.nome} ${item.tamanho}`
      : item.produto.nome;
    const nome = truncar(nomeCompleto.toUpperCase(), 36).padEnd(36);
    const qtdProd = item.quantidadePedida || item.quantidade;
    const qtd = formatarQuantidadeProduto(qtdProd, item.produto.tipoVenda).toUpperCase().padStart(12);
    
    linhas.push(`${nome}${qtd}`);
    
    if (item.observacao) {
      linhas.push(`  >> ${truncar(item.observacao.toUpperCase(), LARGURA_PAPEL - 4)}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  if (pedido.observacoes) {
    linhas.push('OBSERVAÇÕES:');
    linhas.push(truncar(pedido.observacoes.toUpperCase(), LARGURA_PAPEL));
    linhas.push(linhaDivisoria('-'));
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}

/**
 * Gera comanda de cozinha - Layout para produção
 * Layout compacto sem linhas pontilhadas
 */
export function gerarCupomCozinhaGrande(
  pedido: PedidoCompleto,
  config: ConfiguracaoCupom
): string {
  const linhas: string[] = [];

  // Cabeçalho
  linhas.push('========================================');
  linhas.push(`        PEDIDO Nº ${formatarNumeroPedido(pedido.numero)}`);
  linhas.push('========================================');

  // Tipo de entrega com data e horário
  const tipoEntrega = pedido.tipoEntrega || 'RETIRA';
  linhas.push(`ENTREGA: ${tipoEntrega === 'RETIRA' ? 'CLIENTE RETIRA' : 'TELE ENTREGA'}`);
  if (pedido.dataEntrega) {
    linhas.push(formatarDataEntregaCompleta(pedido.dataEntrega, pedido.horarioEntrega));
  }

  // Nome do cliente em destaque
  linhas.push(`CLIENTE: ${pedido.cliente.nome.toUpperCase()}`);
  linhas.push(`TELEFONE: ${formatarTelefone(pedido.cliente.telefone)}`);
  
  // Lista de itens - formato simples e grande (ORDENADOS: TORTAS, DOCINHOS, SALGADINHOS)
  linhas.push('ITENS:');
  
  // Filtrar itens com quantidade 0
  const itensValidosGrande = pedido.itens.filter(item => {
    const qtdProd = item.quantidadePedida || item.quantidade;
    return qtdProd > 0;
  });
  const itensOrdenadosGrande = ordenarItensPorCategoria(itensValidosGrande);
  
  for (const item of itensOrdenadosGrande) {
    const qtdProd = item.quantidadePedida || item.quantidade;
    
    let qtdStr: string;
    if (item.produto.tipoVenda.toUpperCase() === 'KG') {
      const kg = qtdProd;
      const kgStr = kg % 1 === 0 
        ? kg.toString() 
        : kg.toFixed(3).replace(/\.?0+$/, '').replace('.', ',');
      qtdStr = `${kgStr} KG`;
    } else {
      qtdStr = `${Math.round(qtdProd)} UN`;
    }
    
    // Incluir tamanho no nome se existir (para tortas especiais)
    const nomeCompleto = item.tamanho 
      ? `${item.produto.nome} ${item.tamanho}`
      : item.produto.nome;
    const produto = nomeCompleto.toUpperCase();
    
    // Formato mais destacado para itens
    linhas.push(`  > ${qtdStr}  ${produto}`);
    
    if (item.observacao) {
      linhas.push(`       -> ${truncar(item.observacao.toUpperCase(), 32)}`);
    }
  }
  
  // Observações gerais
  if (pedido.observacoes) {
    linhas.push(`OBS: ${pedido.observacoes.toUpperCase()}`);
  }
  
  linhas.push('========================================');
  
  return linhas.join('\n');
}

/**
 * Abre diálogo de impressão do navegador
 * Usa fonte maior para comanda de cozinha
 */
export function imprimirViaDialogo(conteudo: string, titulo: string = 'Cupom'): void {
  // Verificar se é comanda de cozinha para usar fonte maior
  const isComandaCozinha = titulo.toLowerCase().includes('cozinha');
  const fontSize = isComandaCozinha ? '22px' : '12px';
  const printFontSize = isComandaCozinha ? '20px' : '11px';
  const lineHeight = isComandaCozinha ? '1.8' : '1.6';
  
  const janela = window.open('', '_blank', 'width=320,height=600');
  if (janela) {
    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titulo}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: ${fontSize};
              line-height: ${lineHeight};
              margin: 0;
              padding: 10px;
            }
            pre {
              white-space: pre-wrap;
              margin: 0;
            }
            @media print {
              body { padding: 0; font-size: ${printFontSize}; line-height: ${lineHeight}; }
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          <pre>${conteudo}</pre>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    janela.document.close();
  }
}

/**
 * Baixa cupom como arquivo de texto
 */
export function baixarCupom(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Tipo para orçamento
export type OrcamentoCompleto = {
  id: string;
  numero: number;
  createdAt: string | Date;
  cliente: {
    nome: string;
    telefone: string;
    cpfCnpj?: string | null;
    tipoPessoa?: string;
    endereco?: string | null;
    bairro?: string | null;
  };
  itens: {
    produto: {
      nome: string;
      tipoVenda: string;
    };
    quantidade: number;
    valorUnit: number;
    subtotal: number;
    observacao?: string | null;
    tamanho?: string | null;
  }[];
  observacoes?: string | null;
  total: number;
  tipoEntrega: string;
  dataEntrega: string;
  horarioEntrega?: string | null;
  enderecoEntrega?: string | null;
  bairroEntrega?: string | null;
  valorTeleEntrega?: number | null; // Valor da taxa de tele-entrega
};

/**
 * Gera o conteúdo do cupom de ORÇAMENTO (com valores e indicativo)
 */
export function gerarCupomOrcamento(
  orcamento: OrcamentoCompleto,
  config: ConfiguracaoCupom
): string {
  const linhas: string[] = [];
  
  // Data e hora
  const dataHora = new Date(orcamento.createdAt);
  const dataFormatada = dataHora.toLocaleDateString('pt-BR');
  const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // === CABEÇALHO DE ORÇAMENTO ===
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('*** ORÇAMENTO ***'));
  linhas.push(centralizar(`Nº ${formatarNumeroPedido(orcamento.numero)}`));
  linhas.push(centralizar(`${dataFormatada} - ${horaFormatada}`));
  linhas.push(linhaDivisoria('='));
  
  // === DADOS DA PADARIA ===
  linhas.push(centralizar(config.nomeLoja.toUpperCase()));
  linhas.push(centralizar(config.endereco));
  linhas.push(centralizar(config.telefone));
  if (config.cnpj) {
    linhas.push(centralizar(`CNPJ: ${config.cnpj}`));
  }
  linhas.push(linhaDivisoria('-'));
  
  // === TIPO DE ENTREGA ===
  const tipoEntrega = orcamento.tipoEntrega || 'RETIRA';
  linhas.push(`ENTREGA: ${tipoEntrega === 'RETIRA' ? 'CLIENTE RETIRA' : 'TELE ENTREGA'}`);
  if (orcamento.dataEntrega) {
    linhas.push(formatarDataEntregaCompleta(orcamento.dataEntrega, orcamento.horarioEntrega));
  }
  linhas.push(linhaDivisoria('-'));
  
  // === DADOS DO CLIENTE ===
  linhas.push(`CLIENTE: ${truncar(orcamento.cliente.nome, LARGURA_PAPEL - 9)}`);
  linhas.push(`Fone: ${formatarTelefone(orcamento.cliente.telefone)}`);
  
  // Endereço do cliente (do cadastro) - SEMPRE mostrar, SEM TRUNCAR
  if (orcamento.cliente.endereco) {
    const enderecoCliente = orcamento.cliente.bairro 
      ? `${orcamento.cliente.endereco} - ${orcamento.cliente.bairro}`
      : orcamento.cliente.endereco;
    const linhasEndereco = quebrarLinha(`End: ${enderecoCliente}`);
    linhas.push(...linhasEndereco);
  }
  
  // Endereço de entrega para tele-entrega (se diferente do endereço do cliente) - SEM TRUNCAR
  if (tipoEntrega === 'TELE_ENTREGA' && orcamento.enderecoEntrega) {
    const enderecoCompleto = orcamento.bairroEntrega 
      ? `${orcamento.enderecoEntrega} - ${orcamento.bairroEntrega}`
      : orcamento.enderecoEntrega;
    // Só mostra se for diferente do endereço do cliente
    const enderecoClienteCompleto = orcamento.cliente.endereco 
      ? `${orcamento.cliente.endereco}${orcamento.cliente.bairro ? ` - ${orcamento.cliente.bairro}` : ''}`
      : '';
    if (enderecoCompleto !== enderecoClienteCompleto) {
      const linhasEntrega = quebrarLinha(`Entregar: ${enderecoCompleto}`);
      linhas.push(...linhasEntrega);
    }
  }
  
  // CPF ou CNPJ
  if (orcamento.cliente.cpfCnpj) {
    const tipoPessoa = orcamento.cliente.tipoPessoa || 'CPF';
    const doc = tipoPessoa === 'CNPJ' 
      ? formatarCNPJ(orcamento.cliente.cpfCnpj) 
      : formatarCPF(orcamento.cliente.cpfCnpj);
    linhas.push(`${tipoPessoa}: ${doc}`);
  }
  linhas.push(linhaDivisoria('-'));
  
  // === ITENS DO ORÇAMENTO (ORDENADOS: TORTAS, DOCINHOS, SALGADINHOS) ===
  // Filtrar itens com quantidade 0
  const itensValidosOrcamento = orcamento.itens.filter(item => item.quantidade > 0);
  const headerProd = 'PRODUTO'.padEnd(22);
  const headerQtd = 'QTD'.padStart(5).padEnd(7);
  const headerUnit = 'UNIT'.padStart(8);
  const headerTotal = 'TOTAL'.padStart(8);
  linhas.push(`${headerProd} ${headerQtd} ${headerUnit} ${headerTotal}`);
  linhas.push(linhaDivisoria('-'));
  
  const itensOrdenadosOrcamento = ordenarItensPorCategoria(itensValidosOrcamento);
  
  for (const item of itensOrdenadosOrcamento) {
    // Incluir tamanho no nome se existir (para tortas especiais)
    // Formato: "TORTA ESPECIAL P" (sem parênteses)
    const nomeCompleto = item.tamanho 
      ? `${item.produto.nome} ${item.tamanho}`
      : item.produto.nome;
    const nome = truncar(nomeCompleto, 22).padEnd(22);
    const qtd = formatarQuantidadeProduto(item.quantidade, item.produto.tipoVenda).padStart(5).padEnd(7);
    const unit = formatarValorSemCifrao(item.valorUnit).padStart(8);
    const sub = formatarValorSemCifrao(item.subtotal).padStart(8);
    
    linhas.push(`${nome} ${qtd} ${unit} ${sub}`);
    
    if (item.observacao) {
      linhas.push(`  >> ${truncar(item.observacao, LARGURA_PAPEL - 4)}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  // Subtotal dos itens (usando itens filtrados)
  const subtotalItensOrcamento = itensValidosOrcamento.reduce((sum, item) => sum + item.subtotal, 0);
  const subtotalStr = formatarMoeda(subtotalItensOrcamento);
  const espacosSubtotal = LARGURA_PAPEL - 10 - subtotalStr.length;
  linhas.push(`SUBTOTAL:${' '.repeat(Math.max(0, espacosSubtotal))}${subtotalStr}`);
  
  // TAXA DE ENTREGA (se houver)
  if (orcamento.tipoEntrega === 'TELE_ENTREGA' && orcamento.valorTeleEntrega && orcamento.valorTeleEntrega > 0) {
    const taxaStr = formatarMoeda(orcamento.valorTeleEntrega);
    const labelTaxa = 'TAXA DE ENTREGA:';
    const espacosTaxa = LARGURA_PAPEL - labelTaxa.length - taxaStr.length;
    linhas.push(`${labelTaxa}${' '.repeat(Math.max(0, espacosTaxa))}${taxaStr}`);
  }
  
  // TOTAL com R$
  const totalStr = formatarMoeda(orcamento.total);
  const espacosTotal = LARGURA_PAPEL - 7 - totalStr.length;
  linhas.push(`TOTAL:${' '.repeat(Math.max(0, espacosTotal))}${totalStr}`);
  
  // Observações
  if (orcamento.observacoes) {
    linhas.push(linhaDivisoria('-'));
    linhas.push('OBSERVAÇÕES:');
    linhas.push(truncar(orcamento.observacoes, LARGURA_PAPEL));
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('*** ORÇAMENTO ***'));
  linhas.push(centralizar('Aguardando aprovação'));
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}
