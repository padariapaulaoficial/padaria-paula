'use client';

// CupomVisual - Padaria Paula
// Visualização de cupom estilo papel térmico realista
// Comanda de Cozinha: fontes diferenciadas por seção

interface CupomVisualProps {
  conteudo: string;
  titulo?: string;
  fonteGrande?: boolean;
  isComandaCozinha?: boolean;
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
 * Formata o conteúdo do cupom de cozinha com fontes diferenciadas
 * - Header (Pedido Nº, Entrega): 18px bold
 * - Dados do cliente: 18px bold
 * - Itens: 22px bold
 * - Observações: 16px italic
 */
function formatarCupomCozinhaHTML(conteudo: string): string {
  const linhas = conteudo.split('\n');
  const linhasFormatadas: string[] = [];
  
  // Estado para detectar seções
  let inHeaderSection = true;  // Começa no cabeçalho (Pedido Nº, Entrega)
  let inClientSection = false; // Dados do cliente
  let inItemsSection = false;  // Itens do pedido
  let inObservacoes = false;   // Observações

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const linhaTrim = linha.trim();

    // Detectar linha de separação antes do cliente (transição header -> cliente)
    if (inHeaderSection && linha.match(/^-+$/)) {
      inClientSection = true;
      linhasFormatadas.push(`<div class="divisor">${escapeHtml(linha)}</div>`);
      continue;
    }

    // Detectar início da seção de itens (transição cliente -> itens)
    if (linhaTrim === 'ITENS:' || linhaTrim === 'ITENS DO PEDIDO:') {
      inHeaderSection = false;
      inClientSection = false;
      inItemsSection = true;
      inObservacoes = false;
      linhasFormatadas.push(`<div class="header-itens">${escapeHtml(linha)}</div>`);
      continue;
    }

    // Detectar início das observações (após itens)
    if (linhaTrim.startsWith('OBS:') || linhaTrim === 'OBSERVAÇÕES:') {
      inItemsSection = false;
      inObservacoes = true;
      linhasFormatadas.push(`<div class="observacoes-label">${escapeHtml(linha)}</div>`);
      continue;
    }

    // Detectar fim da seção de itens (linha divisória após os itens, antes de OBS ou fim)
    if (inItemsSection && linha.match(/^-+$/)) {
      // Verificar se a próxima linha é observação ou se acabou
      const proximaLinha = linhas[i + 1] || '';
      if (proximaLinha.trim().startsWith('OBS:') ||
          proximaLinha.trim().startsWith('OBSERVAÇÕES:') ||
          proximaLinha.match(/^=+$/)) {
        inItemsSection = false;
        linhasFormatadas.push(`<div class="divisor">${escapeHtml(linha)}</div>`);
        continue;
      }
    }

    // Detectar fim do cupom (linha dupla)
    if (linha.match(/^=+$/)) {
      inItemsSection = false;
      inObservacoes = false;
      inHeaderSection = false;
      inClientSection = false;
      linhasFormatadas.push(`<div class="divisor">${escapeHtml(linha)}</div>`);
      continue;
    }

    // Linha dentro da seção de itens - aplicar classe especial (22px bold)
    if (inItemsSection) {
      linhasFormatadas.push(`<div class="item">${escapeHtml(linha)}</div>`);
      continue;
    }

    // Linhas de observação (16px italic)
    if (inObservacoes) {
      linhasFormatadas.push(`<div class="observacoes">${escapeHtml(linha)}</div>`);
      continue;
    }

    // Linhas do cabeçalho (Pedido Nº, Entrega) - 18px bold
    if (inHeaderSection) {
      linhasFormatadas.push(`<div class="header-info">${escapeHtml(linha)}</div>`);
      continue;
    }

    // Linhas dos dados do cliente - 18px bold
    if (inClientSection) {
      linhasFormatadas.push(`<div class="client-data">${escapeHtml(linha)}</div>`);
      continue;
    }

    // Linhas normais (fallback)
    linhasFormatadas.push(`<div>${escapeHtml(linha)}</div>`);
  }

  return linhasFormatadas.join('\n');
}

export default function CupomVisual({ conteudo, titulo, fonteGrande = false, isComandaCozinha = false }: CupomVisualProps) {
  // Função para criar borda serrilhada (simulando papel térmico cortado)
  const serrilhadoSVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='6' viewBox='0 0 12 6'%3E%3Cpath d='M0,6 L6,0 L12,6' fill='white' stroke='%23d1d5db' stroke-width='0.5'/%3E%3C/svg%3E")`;

  // Detectar se é comanda de cozinha pelo título
  const isCozinha = isComandaCozinha || (titulo?.toLowerCase().includes('cozinha') || false);

  return (
    <div className="flex justify-center py-4 px-2">
      <div 
        className="relative" 
        style={{ 
          width: 280,
          minWidth: 280,
        }}
      >
        {/* Papel térmico realista */}
        <div 
          className="relative"
          style={{
            backgroundColor: '#fafafa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
          }}
        >
          {/* Faixa superior serrilhada */}
          <div 
            style={{
              height: 8,
              backgroundImage: serrilhadoSVG,
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'bottom',
              backgroundColor: '#f0f0f0',
            }}
          />

          {/* Título do cupom */}
          {titulo && (
            <div 
              className="text-center py-2"
              style={{
                borderBottom: '1px dashed #9ca3af',
                backgroundColor: '#f9f9f9',
              }}
            >
              <span 
                style={{
                  fontSize: 10,
                  color: '#6b7280',
                  fontWeight: 500,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {titulo}
              </span>
            </div>
          )}
          
          {/* Conteúdo do cupom */}
          <div 
            className="relative"
            style={{
              padding: '12px 14px',
              backgroundColor: '#fefefe',
            }}
          >
            {isCozinha ? (
              // Comanda de Cozinha: fontes diferenciadas por seção
              <div 
                style={{
                  fontFamily: "'Courier New', 'Lucida Console', 'Consolas', monospace",
                  lineHeight: 1.4,
                  color: '#1a1a1a',
                  letterSpacing: '0.03em',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <style>{`
                  .header-info {
                    font-size: 18px;
                    font-weight: bold;
                  }
                  .client-data {
                    font-size: 18px;
                    font-weight: bold;
                  }
                  .header-itens {
                    font-size: 22px;
                    font-weight: bold;
                  }
                  .item {
                    font-size: 22px;
                    font-weight: bold;
                    line-height: 1.6;
                  }
                  .observacoes-label {
                    font-size: 16px;
                    font-weight: bold;
                  }
                  .observacoes {
                    font-size: 16px;
                    font-style: italic;
                  }
                  .divisor {
                    font-size: 12px;
                  }
                `}</style>
                <div dangerouslySetInnerHTML={{ __html: formatarCupomCozinhaHTML(conteudo) }} />
              </div>
            ) : (
              // Outros cupons: fonte normal
              <pre 
                style={{
                  fontFamily: "'Courier New', 'Lucida Console', 'Consolas', monospace",
                  fontSize: fonteGrande ? 13 : 11,
                  lineHeight: fonteGrande ? 1.6 : 1.4,
                  fontWeight: fonteGrande ? 600 : 400,
                  color: '#1a1a1a',
                  letterSpacing: '0.03em',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {conteudo}
              </pre>
            )}
          </div>
          
          {/* Linha de corte final */}
          <div 
            style={{
              padding: '8px 14px 0',
              backgroundColor: '#fefefe',
            }}
          >
            <div 
              style={{
                borderTop: '2px dashed #9ca3af',
              }}
            />
          </div>

          {/* Faixa inferior serrilhada */}
          <div 
            style={{
              height: 10,
              backgroundImage: serrilhadoSVG,
              backgroundRepeat: 'repeat-x',
              backgroundPosition: 'top',
              backgroundColor: '#f0f0f0',
              transform: 'rotate(180deg)',
            }}
          />
        </div>
        
        {/* Sombra realista do papel */}
        <div 
          style={{
            position: 'absolute',
            left: 4,
            right: 4,
            bottom: -6,
            height: 12,
            backgroundColor: 'rgba(0,0,0,0.06)',
            filter: 'blur(4px)',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}
