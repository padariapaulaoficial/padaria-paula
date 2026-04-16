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
  }[];
};

// Largura do papel 80mm em caracteres (fonte normal)
const LARGURA_PAPEL = 48;

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

// Truncar texto se maior que tamanho
function truncar(texto: string, tamanho: number): string {
  if (texto.length <= tamanho) return texto;
  return texto.substring(0, tamanho - 2) + '..';
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
    linhas.push(`DATA: ${formatarDataEntrega(pedido.dataEntrega)}`);
  }
  linhas.push(linhaDivisoria('-'));
  
  // === DADOS DO CLIENTE ===
  linhas.push(`CLIENTE: ${truncar(pedido.cliente.nome, LARGURA_PAPEL - 9)}`);
  linhas.push(`Fone: ${formatarTelefone(pedido.cliente.telefone)}`);
  
  // Endereço do cliente (do cadastro do cliente)
  if (pedido.cliente.endereco) {
    const enderecoCliente = pedido.cliente.bairro 
      ? `${pedido.cliente.endereco} - ${pedido.cliente.bairro}`
      : pedido.cliente.endereco;
    linhas.push(truncar(`End: ${enderecoCliente}`, LARGURA_PAPEL));
  }
  
  // Endereço de entrega (do pedido, se diferente ou tele-entrega)
  if (tipoEntrega === 'TELE_ENTREGA' && pedido.enderecoEntrega) {
    const enderecoCompleto = pedido.bairroEntrega 
      ? `${pedido.enderecoEntrega} - ${pedido.bairroEntrega}`
      : pedido.enderecoEntrega;
    // Só mostra se for diferente do endereço do cliente
    const enderecoClienteCompleto = pedido.cliente.endereco 
      ? `${pedido.cliente.endereco}${pedido.cliente.bairro ? ` - ${pedido.cliente.bairro}` : ''}`
      : '';
    if (enderecoCompleto !== enderecoClienteCompleto) {
      linhas.push(truncar(`Entregar: ${enderecoCompleto}`, LARGURA_PAPEL));
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
  
  // === ITENS DO PEDIDO ===
  const headerProd = 'PRODUTO'.padEnd(22);
  const headerQtd = 'QTD'.padStart(5).padEnd(7);
  const headerUnit = 'UNIT'.padStart(8);
  const headerTotal = 'TOTAL'.padStart(8);
  linhas.push(`${headerProd} ${headerQtd} ${headerUnit} ${headerTotal}`);
  linhas.push(linhaDivisoria('-'));
  
  for (const item of pedido.itens) {
    const nome = truncar(item.produto.nome, 22).padEnd(22);
    const qtd = formatarQuantidadeProduto(item.quantidade, item.produto.tipoVenda).padStart(5).padEnd(7);
    const unit = formatarValorSemCifrao(item.valorUnit).padStart(8);
    const sub = formatarValorSemCifrao(item.subtotal).padStart(8);
    
    linhas.push(`${nome} ${qtd} ${unit} ${sub}`);
    
    if (item.observacao) {
      linhas.push(`  >> ${truncar(item.observacao, LARGURA_PAPEL - 4)}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  // TOTAL com R$
  const totalStr = formatarMoeda(pedido.total);
  const espacosTotal = LARGURA_PAPEL - 7 - totalStr.length;
  linhas.push(`TOTAL:${' '.repeat(Math.max(0, espacosTotal))}${totalStr}`);
  
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('Obrigado pela preferencia!'));
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
  linhas.push(centralizar('*** PRODUCAO ***'));
  linhas.push(centralizar(`PEDIDO Nº ${formatarNumeroPedido(pedido.numero)}`));
  linhas.push(linhaDivisoria('='));
  
  // Tipo de entrega com data e horário
  const tipoEntrega = pedido.tipoEntrega || 'RETIRA';
  linhas.push(`ENTREGA: ${tipoEntrega === 'RETIRA' ? 'CLIENTE RETIRA' : 'TELE ENTREGA'}`);
  if (pedido.dataEntrega) {
    const dataEntrega = formatarDataEntrega(pedido.dataEntrega);
    const horario = pedido.horarioEntrega || '';
    linhas.push(`DATA: ${dataEntrega}${horario ? ` - HORARIO: ${horario}` : ''}`);
  }
  linhas.push(linhaDivisoria('-'));
  
  // Dados do cliente
  linhas.push(`Cliente: ${pedido.cliente.nome.toUpperCase()}`);
  linhas.push(`Fone: ${formatarTelefone(pedido.cliente.telefone)}`);
  linhas.push(linhaDivisoria('-'));
  
  // Cabeçalho
  linhas.push('PRODUTO                                      QTD');
  linhas.push(linhaDivisoria('-'));
  
  // Itens
  for (const item of pedido.itens) {
    const nome = truncar(item.produto.nome.toUpperCase(), 36).padEnd(36);
    const qtdProd = item.quantidadePedida || item.quantidade;
    const qtd = formatarQuantidadeProduto(qtdProd, item.produto.tipoVenda).toUpperCase().padStart(12);
    
    linhas.push(`${nome}${qtd}`);
    
    if (item.observacao) {
      linhas.push(`  >> ${truncar(item.observacao.toUpperCase(), LARGURA_PAPEL - 4)}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  if (pedido.observacoes) {
    linhas.push('OBSERVACOES:');
    linhas.push(truncar(pedido.observacoes.toUpperCase(), LARGURA_PAPEL));
    linhas.push(linhaDivisoria('-'));
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}

/**
 * Gera cupom da COZINHA SEM VALORES (versão simplificada)
 * Mostra apenas: número do pedido, cliente, data/hora, itens com quantidade e observações
 * Ideal para atender pedidos sem expor valores financeiros
 */
export function gerarCupomCozinhaSemValores(
  pedido: PedidoCompleto
): string {
  const linhas: string[] = [];
  
  // Data e hora
  const dataHora = new Date(pedido.createdAt);
  const dataFormatada = dataHora.toLocaleDateString('pt-BR');
  const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // === CABEÇALHO ===
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('*** COMANDA COZINHA ***'));
  linhas.push(centralizar(`PEDIDO Nº ${formatarNumeroPedido(pedido.numero)}`));
  linhas.push(centralizar(`${dataFormatada} - ${horaFormatada}`));
  linhas.push(linhaDivisoria('='));
  
  // === TIPO DE ENTREGA ===
  const tipoEntrega = pedido.tipoEntrega || 'RETIRA';
  linhas.push(`ENTREGA: ${tipoEntrega === 'RETIRA' ? 'CLIENTE RETIRA' : 'TELE ENTREGA'}`);
  if (pedido.dataEntrega) {
    const dataEntrega = formatarDataEntrega(pedido.dataEntrega);
    const horario = pedido.horarioEntrega || '';
    linhas.push(`DATA: ${dataEntrega}${horario ? ` - HORARIO: ${horario}` : ''}`);
  }
  linhas.push(linhaDivisoria('-'));
  
  // === DADOS DO CLIENTE ===
  linhas.push(`CLIENTE: ${pedido.cliente.nome.toUpperCase()}`);
  linhas.push(`FONE: ${formatarTelefone(pedido.cliente.telefone)}`);
  linhas.push(linhaDivisoria('-'));
  
  // === ITENS DO PEDIDO (SEM VALORES) ===
  linhas.push('PRODUTO                                      QTD');
  linhas.push(linhaDivisoria('-'));
  
  for (const item of pedido.itens) {
    const nome = truncar(item.produto.nome.toUpperCase(), 36).padEnd(36);
    const qtd = formatarQuantidadeProduto(item.quantidade, item.produto.tipoVenda).toUpperCase().padStart(12);
    
    linhas.push(`${nome}${qtd}`);
    
    if (item.observacao) {
      linhas.push(`  >> ${truncar(item.observacao.toUpperCase(), LARGURA_PAPEL - 4)}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  // === OBSERVAÇÕES GERAIS ===
  if (pedido.observacoes) {
    linhas.push('OBSERVACOES:');
    linhas.push(truncar(pedido.observacoes.toUpperCase(), LARGURA_PAPEL));
    linhas.push(linhaDivisoria('-'));
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('PRODUCAO'));
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}

/**
 * Gera versão com "fonte grande" para comanda de cozinha
 * Formato simples: QTD x PRODUTO
 */
export function gerarCupomCozinhaGrande(
  pedido: PedidoCompleto,
  config: ConfiguracaoCupom
): string {
  const linhas: string[] = [];
  
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar(`PEDIDO Nº ${formatarNumeroPedido(pedido.numero)}`));
  linhas.push(linhaDivisoria('='));
  
  // Tipo de entrega com data e horário
  const tipoEntrega = pedido.tipoEntrega || 'RETIRA';
  const entregaStr = tipoEntrega === 'RETIRA' ? 'CLIENTE RETIRA' : 'TELE ENTREGA';
  const dataEntrega = pedido.dataEntrega ? formatarDataEntrega(pedido.dataEntrega) : '';
  const horario = pedido.horarioEntrega || '';
  
  linhas.push(`ENTREGA: ${entregaStr}`);
  if (dataEntrega) {
    linhas.push(`DATA: ${dataEntrega}${horario ? ` - HORARIO: ${horario}` : ''}`);
  }
  linhas.push(linhaDivisoria('-'));
  
  // Cliente e telefone
  linhas.push(`CLIENTE: ${pedido.cliente.nome.toUpperCase()}`);
  linhas.push(`FONE: ${formatarTelefone(pedido.cliente.telefone)}`);
  linhas.push(linhaDivisoria('-'));
  
  // Itens
  for (const item of pedido.itens) {
    const qtdProd = item.quantidadePedida || item.quantidade;
    
    let qtdStr: string;
    if (item.produto.tipoVenda.toUpperCase() === 'KG') {
      const kg = qtdProd;
      const kgStr = kg % 1 === 0 
        ? kg.toString() 
        : kg.toFixed(3).replace(/\.?0+$/, '').replace('.', ',');
      qtdStr = `${kgStr}kg`;
    } else {
      qtdStr = `${Math.round(qtdProd)}x`;
    }
    
    const produto = item.produto.nome.toUpperCase();
    linhas.push(`${qtdStr.padEnd(8)}${produto}`);
    
    if (item.observacao) {
      linhas.push(`   OBS: ${truncar(item.observacao.toUpperCase(), LARGURA_PAPEL - 8)}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  if (pedido.observacoes) {
    linhas.push(`OBS: ${truncar(pedido.observacoes.toUpperCase(), LARGURA_PAPEL - 5)}`);
    linhas.push(linhaDivisoria('-'));
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}

/**
 * Abre diálogo de impressão do navegador
 */
export function imprimirViaDialogo(conteudo: string, titulo: string = 'Cupom'): void {
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
              font-size: 12px;
              line-height: 1.4;
              margin: 0;
              padding: 5px;
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
  }[];
  observacoes?: string | null;
  total: number;
  tipoEntrega: string;
  dataEntrega: string;
  horarioEntrega?: string | null;
  enderecoEntrega?: string | null;
  bairroEntrega?: string | null;
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
  linhas.push(centralizar('*** ORCAMENTO ***'));
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
    const dataEntrega = formatarDataEntrega(orcamento.dataEntrega);
    const horario = orcamento.horarioEntrega || '';
    linhas.push(`DATA: ${dataEntrega}${horario ? ` - HORARIO: ${horario}` : ''}`);
  }
  linhas.push(linhaDivisoria('-'));
  
  // === DADOS DO CLIENTE ===
  linhas.push(`CLIENTE: ${truncar(orcamento.cliente.nome, LARGURA_PAPEL - 9)}`);
  linhas.push(`Fone: ${formatarTelefone(orcamento.cliente.telefone)}`);
  
  // Endereço de entrega para tele-entrega
  if (tipoEntrega === 'TELE_ENTREGA' && orcamento.enderecoEntrega) {
    const enderecoCompleto = orcamento.bairroEntrega 
      ? `${orcamento.enderecoEntrega} - ${orcamento.bairroEntrega}`
      : orcamento.enderecoEntrega;
    linhas.push(truncar(`Entregar: ${enderecoCompleto}`, LARGURA_PAPEL));
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
  
  // === ITENS DO ORÇAMENTO ===
  const headerProd = 'PRODUTO'.padEnd(22);
  const headerQtd = 'QTD'.padStart(5).padEnd(7);
  const headerUnit = 'UNIT'.padStart(8);
  const headerTotal = 'TOTAL'.padStart(8);
  linhas.push(`${headerProd} ${headerQtd} ${headerUnit} ${headerTotal}`);
  linhas.push(linhaDivisoria('-'));
  
  for (const item of orcamento.itens) {
    const nome = truncar(item.produto.nome, 22).padEnd(22);
    const qtd = formatarQuantidadeProduto(item.quantidade, item.produto.tipoVenda).padStart(5).padEnd(7);
    const unit = formatarValorSemCifrao(item.valorUnit).padStart(8);
    const sub = formatarValorSemCifrao(item.subtotal).padStart(8);
    
    linhas.push(`${nome} ${qtd} ${unit} ${sub}`);
    
    if (item.observacao) {
      linhas.push(`  >> ${truncar(item.observacao, LARGURA_PAPEL - 4)}`);
    }
  }
  
  linhas.push(linhaDivisoria('-'));
  
  // TOTAL com R$
  const totalStr = formatarMoeda(orcamento.total);
  const espacosTotal = LARGURA_PAPEL - 7 - totalStr.length;
  linhas.push(`TOTAL:${' '.repeat(Math.max(0, espacosTotal))}${totalStr}`);
  
  // Observações
  if (orcamento.observacoes) {
    linhas.push(linhaDivisoria('-'));
    linhas.push('OBSERVACOES:');
    linhas.push(truncar(orcamento.observacoes, LARGURA_PAPEL));
  }
  
  linhas.push(linhaDivisoria('='));
  linhas.push(centralizar('*** ORCAMENTO ***'));
  linhas.push(centralizar('Aguardando aprovacao'));
  linhas.push(linhaDivisoria('='));
  linhas.push('');
  
  return linhas.join('\n');
}
