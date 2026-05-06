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
      categoria?: string | null;
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

// ============================================
// ORDEM DE CATEGORIAS - REGRA OBRIGATÓRIA:
// 1. TORTAS (0)
// 2. DOCINHOS (1)
// 3. SALGADINHOS/SALGADOS (2)
// 4. PAES (3)
// 5. OUTROS (4)
// 6. BEBIDAS (5)
// ============================================
// Ordem oficial das categorias para impressão
// Tortas especiais (com tamanho) sempre primeiro = ordem 0
const ORDEM_CATEGORIAS: Record<string, number> = {
  // 1. TORTAS E TABUAS
  'TORTAS E TABUAS': 1,
  'TORTA E TABUA': 1,
  'TORTAS': 1,
  'TORTA': 1,
  'TABUAS': 1,
  'TABUA': 1,
  'TORTA ESPECIAL': 1,
  'TORTAS ESPECIAIS': 1,

  // 2. BOLOS E CUCA
  'BOLOS E CUCA': 2,
  'BOLO E CUCA': 2,
  'BOLOS': 2,
  'BOLO': 2,
  'CUCAS': 2,
  'CUCA': 2,

  // 3. SALGADOS FRITOS
  'SALGADOS FRITOS': 3,
  'SALGADO FRITO': 3,
  'FRITOS': 3,
  'FRITO': 3,

  // 4. SALGADOS ASSADOS
  'SALGADOS ASSADOS': 4,
  'SALGADO ASSADO': 4,
  'ASSADOS': 4,
  'ASSADO': 4,

  // 5. SALGADOS (geral)
  'SALGADOS': 5,
  'SALGADO': 5,
  'SALGADINHOS': 5,
  'SALGADINHO': 5,
  'SALGADOS UNITARIOS': 5,
  'SALGADO UNITARIO': 5,

  // 6. DOCES FOLHADOS
  'DOCES FOLHADOS': 6,
  'DOCE FOLHADO': 6,
  'FOLHADOS': 6,
  'FOLHADO': 6,

  // 7. DOCES
  'DOCES': 7,
  'DOCE': 7,
  'DOCINHOS': 7,
  'DOCINHO': 7,

  // 8. PAES
  'PÃES': 8,
  'PÃO': 8,
  'PAES': 8,
  'PAO': 8,

  // 9. BEBIDAS
  'BEBIDAS': 9,
  'BEBIDA': 9,

  // 10. DESCARTAVEIS
  'DESCARTÁVEIS': 10,
  'DESCARTAVEL': 10,
  'DESCARTAVEIS': 10,
  'DESCARTAVEL': 10,

  // 11. OUTROS
  'OUTROS': 11,
  'OUTRO': 11,
};

// Função para obter a ordem de um item baseado na categoria real do produto
function obterOrdemItem(categoria?: string | null, tamanho?: string | null, nomeProduto?: string): number {
  // Tortas especiais (com tamanho) sempre primeiro
  if (tamanho) {
    return 0;
  }
  
  // Se tem categoria definida, usar ela
  if (categoria) {
    const catUpper = categoria.toUpperCase();
    const ordem = ORDEM_CATEGORIAS[catUpper];
    if (ordem !== undefined) {
      return ordem;
    }
  }
  
  // Se não tem categoria, inferir pelo nome do produto
  if (nomeProduto) {
    const nomeUpper = nomeProduto.toUpperCase();
    
    // Tortas
    if (nomeUpper.includes('TORTA') || nomeUpper.includes('TABUA')) {
      return 1;
    }
    // Bolos e Cuca
    if (nomeUpper.includes('BOLO') || nomeUpper.includes('CUCA')) {
      return 2;
    }
    // Salgados FRITOS
    if (nomeUpper.includes('RISOLE') || nomeUpper.includes('RISOLÉ') ||
        nomeUpper.includes('BOLINHA') || nomeUpper.includes('CROQUETE') ||
        nomeUpper.includes('PASTEL') || nomeUpper.includes('ENROLADINHO') ||
        nomeUpper.includes('KIBE') || nomeUpper.includes('QUIBE')) {
      return 3;
    }
    // Salgados ASSADOS
    if (nomeUpper.includes('ESFIHA') || nomeUpper.includes('ESFIHA') ||
        nomeUpper.includes('EMPADA') || nomeUpper.includes('QUICHE') ||
        nomeUpper.includes('BARQUETE') || nomeUpper.includes('FOGAZZA')) {
      return 4;
    }
    // Salgados (geral - sem especificação)
    if (nomeUpper.includes('SALGADO') || nomeUpper.includes('SALGADINHO')) {
      return 5;
    }
    // Doces Folhados
    if (nomeUpper.includes('FOLHADO') || nomeUpper.includes('MIL FOLHAS')) {
      return 6;
    }
    // Doces
    if (nomeUpper.includes('DOCE') || nomeUpper.includes('DOCINHO') ||
        nomeUpper.includes('BRIGADEIRO') || nomeUpper.includes('BEIJINHO') ||
        nomeUpper.includes('BOMBOCAM')) {
      return 7;
    }
    // Pães
    if (nomeUpper.includes('PÃO') || nomeUpper.includes('PAO') || 
        nomeUpper.includes('BAGUETE') || nomeUpper.includes('CIABATTA')) {
      return 8;
    }
    // Bebidas
    if (nomeUpper.includes('REFRIGERANTE') || nomeUpper.includes('SUCO') ||
        nomeUpper.includes('AGUA') || nomeUpper.includes('ÁGUA') ||
        nomeUpper.includes('CAFE') || nomeUpper.includes('CAFÉ')) {
      return 9;
    }
  }
  
  // Default: OUTROS
  return 99;
}

// Tipo para itens com estrutura aninhada (do banco de dados)
type ItemAninhado = {
  produto: { nome: string; tipoVenda: string; categoria?: string | null };
  quantidade: number;
  valorUnit: number;
  subtotal: number;
  observacao?: string | null;
  tamanho?: string | null;
};

// Tipo para itens com estrutura plana (do store)
type ItemPlano = {
  nome: string;
  tipoVenda?: string;
  categoria?: string | null;
  quantidade?: number;
  valorUnit?: number;
  subtotal?: number;
  observacao?: string | null;
  tamanho?: string | null;
};

// Helper para detectar se o item tem estrutura aninhada
function temEstruturaAninhada(item: ItemAninhado | ItemPlano): item is ItemAninhado {
  return 'produto' in item && typeof item.produto === 'object' && item.produto !== null;
}

// Função genérica para ordenar itens por categoria - funciona com ambos os tipos
export function ordenarItensPorCategoria<T extends ItemAninhado | ItemPlano>(itens: T[]): T[] {
  return [...itens].sort((a, b) => {
    // Extrair categoria e nome baseado na estrutura
    const categoriaA = temEstruturaAninhada(a) ? a.produto.categoria : a.categoria;
    const categoriaB = temEstruturaAninhada(b) ? b.produto.categoria : b.categoria;
    const tamanhoA = a.tamanho;
    const tamanhoB = b.tamanho;
    const nomeA = temEstruturaAninhada(a) ? a.produto.nome : a.nome;
    const nomeB = temEstruturaAninhada(b) ? b.produto.nome : b.nome;
    
    // Obter ordem de cada item (incluindo nome para inferência)
    const ordemA = obterOrdemItem(categoriaA, tamanhoA, nomeA);
    const ordemB = obterOrdemItem(categoriaB, tamanhoB, nomeB);
    
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
// NUNCA corta palavras no meio - pula a palavra inteira para a próxima linha
function quebrarLinha(texto: string, largura: number = LARGURA_PAPEL): string[] {
  if (texto.length <= largura) return [texto];
  const linhas: string[] = [];
  const palavras = texto.split(' ');
  let linhaAtual = '';
  
  for (const palavra of palavras) {
    if (linhaAtual.length === 0) {
      // Linha vazia - colocar a palavra
      linhaAtual = palavra;
    } else if ((linhaAtual + ' ' + palavra).length <= largura) {
      // Palavra cabe na linha atual
      linhaAtual += ' ' + palavra;
    } else {
      // Palavra não cabe - finalizar linha atual e começar nova
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    }
  }
  
  // Adicionar última linha se não estiver vazia
  if (linhaAtual.length > 0) {
    linhas.push(linhaAtual);
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
  
  // === ITENS DO PEDIDO (ORDENADOS: TORTAS, SALGADINHOS, DOCINHOS) ===
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
    
    const qtd = formatarQuantidadeProduto(item.quantidade, item.produto.tipoVenda).padStart(5).padEnd(7);
    const unit = formatarValorSemCifrao(item.valorUnit).padStart(8);
    const sub = formatarValorSemCifrao(item.subtotal).padStart(8);
    
    // Espaço disponível para o nome na primeira linha: 48 - 7(qtd) - 8(unit) - 8(sub) - 3(espaços) = 22
    const espacoNome = 22;
    
    if (nomeCompleto.length <= espacoNome) {
      // Nome cabe na linha: formato normal
      const nome = nomeCompleto.padEnd(espacoNome);
      linhas.push(`${nome} ${qtd} ${unit} ${sub}`);
    } else {
      // Nome não cabe: mostrar qtd e valor na primeira linha com parte do nome
      // Formato: "NOME LONGO AQUI...    1un  129,00  129,00"
      //          "CONTINUACAO DO NOME"
      const nomeLinha1 = nomeCompleto.substring(0, espacoNome);
      const nomeLinha2 = nomeCompleto.substring(espacoNome);
      
      // Primeira linha com qtd e valor
      linhas.push(`${nomeLinha1} ${qtd} ${unit} ${sub}`);
      // Segunda linha com restante do nome (se não vazio)
      if (nomeLinha2.trim()) {
        linhas.push(nomeLinha2);
      }
    }
    
    if (item.observacao) {
      linhas.push(`  >> ${item.observacao}`);
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
 * IMPORTANTE: NUNCA truncar nomes de produtos - quebrar em múltiplas linhas se necessário
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
  
  // Cabeçalho - NÃO mostrar cabeçalho fixo para permitir nomes longos
  linhas.push('ITENS DO PEDIDO:');
  linhas.push(linhaDivisoria('-'));
  
  // Itens (ORDENADOS: TORTAS, SALGADINHOS, DOCINHOS)
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
    // Mostrar nome COMPLETO - NUNCA TRUNCAR
    const nome = nomeCompleto.toUpperCase();
    const qtdProd = item.quantidadePedida || item.quantidade;
    const qtdStr = formatarQuantidadeProduto(qtdProd, item.produto.tipoVenda).toUpperCase();
    
    // Formato: quantidade + nome completo (quebrar linha se necessário)
    // Largura disponível para nome: 48 - qtdStr.length - 3 (espaços)
    const larguraNome = LARGURA_PAPEL - qtdStr.length - 3;
    const nomeLinhas = quebrarLinha(nome, larguraNome);
    
    // Primeira linha: quantidade + primeira parte do nome
    linhas.push(`${qtdStr.padStart(8)}  ${nomeLinhas[0]}`);
    // Linhas seguintes: indentar para alinhar com o nome
    for (let i = 1; i < nomeLinhas.length; i++) {
      linhas.push(' '.repeat(10) + nomeLinhas[i]);
    }
    
    if (item.observacao) {
      linhas.push(`  >> ${item.observacao.toUpperCase()}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  if (pedido.observacoes) {
    linhas.push('OBSERVAÇÕES:');
    linhas.push(pedido.observacoes.toUpperCase());
    linhas.push(linhaDivisoria('-'));
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}

/**
 * Gera comanda de cozinha - Layout para produção
 * Layout com linhas pontilhadas para separação visual
 * IMPORTANTE: NUNCA truncar nomes de produtos - quebrar em múltiplas linhas se necessário
 */
export function gerarCupomCozinhaGrande(
  pedido: PedidoCompleto,
  config: ConfiguracaoCupom
): string {
  const linhas: string[] = [];

  // Cabeçalho - usar largura completa do papel (48 caracteres)
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar(`PEDIDO Nº ${formatarNumeroPedido(pedido.numero)}`));
  linhas.push(linhaDivisoria('='));

  // Tipo de entrega com data e horário
  const tipoEntrega = pedido.tipoEntrega || 'RETIRA';
  linhas.push(`ENTREGA: ${tipoEntrega === 'RETIRA' ? 'CLIENTE RETIRA' : 'TELE ENTREGA'}`);
  if (pedido.dataEntrega) {
    linhas.push(formatarDataEntregaCompleta(pedido.dataEntrega, pedido.horarioEntrega));
  }
  linhas.push(linhaDivisoria('-'));

  // Nome do cliente em destaque
  linhas.push(`CLIENTE: ${pedido.cliente.nome.toUpperCase()}`);
  linhas.push(`TELEFONE: ${formatarTelefone(pedido.cliente.telefone)}`);
  linhas.push(linhaDivisoria('-'));
  
  // Lista de itens - formato simples e grande (ORDENADOS: TORTAS, SALGADINHOS, DOCINHOS)
  linhas.push('ITENS:');
  
  // Filtrar itens com quantidade 0
  const itensValidosGrande = pedido.itens.filter(item => {
    const qtdProd = item.quantidadePedida || item.quantidade;
    return qtdProd > 0;
  });
  const itensOrdenadosGrande = ordenarItensPorCategoria(itensValidosGrande);
  
  // Agrupar itens por categoria e adicionar separadores
  let categoriaAtual: number | null = null;
  
  for (const item of itensOrdenadosGrande) {
    // Obter categoria do item (incluindo nome para inferência)
    const categoriaItem = obterOrdemItem(item.produto.categoria, item.tamanho, item.produto.nome);
    
    // Se mudou de categoria, adicionar linha pontilhada
    if (categoriaAtual !== null && categoriaItem !== categoriaAtual) {
      linhas.push(linhaDivisoria('.'));
    }
    categoriaAtual = categoriaItem;
    
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
    // Mostrar nome COMPLETO - NUNCA TRUNCAR
    const produto = nomeCompleto.toUpperCase();
    
    // Formato destacado para itens
    // Prefixo: "  > QTD  " onde QTD pode variar de 4 a 8+ caracteres
    const prefix = `  > ${qtdStr}  `;
    // Largura disponível para nome: LARGURA_PAPEL - prefix.length
    // Isso garante que o nome completo caiba, quebrando em linhas se necessário
    const larguraNome = LARGURA_PAPEL - prefix.length;
    const nomeLinhas = quebrarLinha(produto, larguraNome);
    
    // Primeira linha: prefixo + primeira parte do nome
    linhas.push(prefix + nomeLinhas[0]);
    // Linhas seguintes: indentar para alinhar com o nome
    for (let i = 1; i < nomeLinhas.length; i++) {
      linhas.push(' '.repeat(prefix.length) + nomeLinhas[i]);
    }
    
    if (item.observacao) {
      linhas.push(`       -> ${item.observacao.toUpperCase()}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  // Observações gerais
  if (pedido.observacoes) {
    linhas.push('');
    linhas.push(`OBS: ${pedido.observacoes.toUpperCase()}`);
    linhas.push('');
  }
  
  linhas.push(linhaDivisoria('='));
  
  return linhas.join('\n');
}

/**
 * Formata o conteúdo do cupom de cozinha
 * TUDO em 18px negrito para fácil leitura
 */
function formatarCupomCozinhaHTML(conteudo: string): string {
  const linhas = conteudo.split('\n');
  const linhasFormatadas = linhas.map(linha => `<div>${escapeHtml(linha)}</div>`);
  return linhasFormatadas.join('\n');
}

/**
 * Escapa caracteres HTML para evitar XSS
 */
function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Abre diálogo de impressão do navegador
 * Para comanda de cozinha: itens com fonte maior para idosos
 */
export function imprimirViaDialogo(conteudo: string, titulo: string = 'Cupom'): void {
  const isComandaCozinha = titulo.toLowerCase().includes('cozinha');

  const janela = window.open('', '_blank', 'width=320,height=600');
  if (janela) {
    if (isComandaCozinha) {
      // Para comanda de cozinha: fonte 14px negrito (cabe no papel 80mm)
      const htmlContent = formatarCupomCozinhaHTML(conteudo);
      janela.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${titulo}</title>
            <style>
              * {
                font-size: 14px !important;
                font-weight: bold !important;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 14px !important;
                font-weight: bold !important;
                line-height: 1.3;
                margin: 0;
                padding: 5px;
                max-width: 80mm;
              }
              div, p, span, pre {
                font-size: 14px !important;
                font-weight: bold !important;
                white-space: pre;
              }
              @media print {
                * {
                  font-size: 14px !important;
                  font-weight: bold !important;
                }
                body {
                  padding: 0;
                  font-size: 14px !important;
                  font-weight: bold !important;
                  max-width: 80mm;
                }
                div, p, span, pre {
                  font-size: 14px !important;
                  font-weight: bold !important;
                }
                @page { margin: 0; size: 80mm auto; }
              }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
    } else {
      // Para outros cupons: fonte normal
      janela.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${titulo}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.6;
                margin: 0;
                padding: 10px;
              }
              pre {
                white-space: pre-wrap;
                margin: 0;
              }
              @media print {
                body { padding: 0; font-size: 11px; }
                @page { margin: 0; size: 80mm auto; }
              }
            </style>
          </head>
          <body>
            <pre>${escapeHtml(conteudo)}</pre>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
    }
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
      categoria?: string | null;
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
  
  // === ITENS DO ORÇAMENTO (ORDENADOS: TORTAS, SALGADINHOS, DOCINHOS) ===
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
    
    const qtd = formatarQuantidadeProduto(item.quantidade, item.produto.tipoVenda).padStart(5).padEnd(7);
    const unit = formatarValorSemCifrao(item.valorUnit).padStart(8);
    const sub = formatarValorSemCifrao(item.subtotal).padStart(8);
    
    // Espaço disponível para o nome na primeira linha: 48 - 7(qtd) - 8(unit) - 8(sub) - 3(espaços) = 22
    const espacoNome = 22;
    
    if (nomeCompleto.length <= espacoNome) {
      // Nome cabe na linha: formato normal
      const nome = nomeCompleto.padEnd(espacoNome);
      linhas.push(`${nome} ${qtd} ${unit} ${sub}`);
    } else {
      // Nome não cabe: mostrar qtd e valor na primeira linha com parte do nome
      const nomeLinha1 = nomeCompleto.substring(0, espacoNome);
      const nomeLinha2 = nomeCompleto.substring(espacoNome);
      
      // Primeira linha com qtd e valor
      linhas.push(`${nomeLinha1} ${qtd} ${unit} ${sub}`);
      // Segunda linha com restante do nome (se não vazio)
      if (nomeLinha2.trim()) {
        linhas.push(nomeLinha2);
      }
    }
    
    if (item.observacao) {
      linhas.push(`  >> ${item.observacao}`);
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
    linhas.push(orcamento.observacoes);
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('*** ORÇAMENTO ***'));
  linhas.push(centralizar('Aguardando aprovação'));
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}
