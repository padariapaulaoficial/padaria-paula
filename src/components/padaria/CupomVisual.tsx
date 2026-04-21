'use client';

// CupomVisual - Padaria Paula
// Visualização de cupom estilo papel térmico realista
// Comanda da Cozinha: Cabeçalho 18px negrito, Cliente 18px negrito, Itens 22px negrito, Obs 16px itálico

interface CupomVisualProps {
  conteudo: string;
  titulo?: string;
  fonteGrande?: boolean;
}

export default function CupomVisual({ conteudo, titulo, fonteGrande = false }: CupomVisualProps) {
  // Função para criar borda serrilhada (simulando papel térmico cortado)
  const serrilhadoSVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='6' viewBox='0 0 12 6'%3E%3Cpath d='M0,6 L6,0 L12,6' fill='white' stroke='%23d1d5db' stroke-width='0.5'/%3E%3C/svg%3E")`;

  // Processar conteúdo para comanda da cozinha com estilos diferentes por seção
  const processarConteudoCozinha = (texto: string) => {
    const linhas = texto.split('\n');
    const linhasProcessadas: Array<{ texto: string; estilo: React.CSSProperties }> = [];
    
    // Estado para controlar qual seção estamos
    let secaoAtual: 'header' | 'client' | 'items' | 'end' = 'header';
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const linhaUpper = linha.toUpperCase().trim();
      
      // Detectar mudança de seção baseado em marcadores específicos
      // Linha com "CLIENTE:" marca início da seção de dados do cliente
      if (linhaUpper.startsWith('CLIENTE:') || linhaUpper.startsWith('TELEFONE:')) {
        secaoAtual = 'client';
      }
      // Linha "ITENS:" marca início da seção de itens
      else if (linhaUpper === 'ITENS:') {
        secaoAtual = 'items';
      }
      // Linha "OBS:" ou "->" marca observações (sempre itálico)
      else if (linhaUpper.startsWith('OBS:') || linhaUpper.includes('->')) {
        secaoAtual = 'items'; // Mantém em items mas será itálico
      }
      // Linhas de separador NÃO mudam o estado (continua na mesma seção)
      // Linha final com "====" marca o fim
      else if (linha.match(/^={10,}$/) && i > 5) {
        // Verificar se é o último separador (fim do documento)
        const linhasRestantes = linhas.slice(i + 1).filter(l => l.trim());
        if (linhasRestantes.length === 0 || linhasRestantes.every(l => l.match(/^={10,}$/))) {
          secaoAtual = 'end';
        }
      }
      
      // Determinar estilo baseado no conteúdo da linha E na seção atual
      let estilo: React.CSSProperties = {
        fontFamily: "'Courier New', 'Lucida Console', 'Consolas', monospace",
        color: '#1a1a1a',
        letterSpacing: '0.03em',
      };
      
      // Linha de observação (contém "->" ou começa com "OBS:")
      if (linha.includes('->') || linhaUpper.startsWith('OBS:')) {
        estilo = {
          ...estilo,
          fontSize: 16,
          lineHeight: 1.5,
          fontStyle: 'italic',
          fontWeight: 400,
        };
      }
      // Linha de item (começa com "  >" e está na seção de itens)
      else if ((linha.trim().startsWith('>') || linha.match(/^\s*>\s/)) && secaoAtual === 'items') {
        estilo = {
          ...estilo,
          fontSize: 22,
          lineHeight: 1.6,
          fontWeight: 700,
        };
      }
      // Linha "ITENS:"
      else if (linhaUpper === 'ITENS:') {
        estilo = {
          ...estilo,
          fontSize: 18,
          lineHeight: 1.5,
          fontWeight: 700,
        };
      }
      // Seção de cabeçalho ou cliente
      else if (secaoAtual === 'header' || secaoAtual === 'client') {
        // Linhas de separador
        if (linha.match(/^-{5,}$/) || linha.match(/^={5,}$/)) {
          estilo = {
            ...estilo,
            fontSize: 12,
            lineHeight: 1.2,
            fontWeight: 400,
          };
        }
        // Linha de pedido (ex: "PEDIDO Nº 00001")
        else if (linhaUpper.includes('PEDIDO Nº')) {
          estilo = {
            ...estilo,
            fontSize: 18,
            lineHeight: 1.5,
            fontWeight: 700,
          };
        }
        // Linha "ENTREGA:"
        else if (linhaUpper.startsWith('ENTREGA:')) {
          estilo = {
            ...estilo,
            fontSize: 18,
            lineHeight: 1.5,
            fontWeight: 700,
          };
        }
        // Linha de data/horário
        else if (linha.match(/^\w+\s+\d{2}\/\d{2}\/\d{4}/)) {
          estilo = {
            ...estilo,
            fontSize: 18,
            lineHeight: 1.5,
            fontWeight: 700,
          };
        }
        // Demais linhas do cabeçalho/cliente
        else {
          estilo = {
            ...estilo,
            fontSize: 18,
            lineHeight: 1.5,
            fontWeight: 700,
          };
        }
      }
      // Seção de itens
      else if (secaoAtual === 'items') {
        // Linhas de separador
        if (linha.match(/^-{5,}$/) || linha.match(/^={5,}$/)) {
          estilo = {
            ...estilo,
            fontSize: 12,
            lineHeight: 1.2,
            fontWeight: 400,
          };
        }
        // Linha "ITENS:" já tratada acima
        else if (linhaUpper === 'ITENS:') {
          estilo = {
            ...estilo,
            fontSize: 18,
            lineHeight: 1.5,
            fontWeight: 700,
          };
        }
        // Itens (qualquer linha com conteúdo na seção de itens)
        else if (linha.trim()) {
          estilo = {
            ...estilo,
            fontSize: 22,
            lineHeight: 1.6,
            fontWeight: 700,
          };
        }
        else {
          estilo = {
            ...estilo,
            fontSize: 12,
            lineHeight: 1.2,
            fontWeight: 400,
          };
        }
      }
      // Fim do documento
      else {
        estilo = {
          ...estilo,
          fontSize: 12,
          lineHeight: 1.4,
          fontWeight: 400,
        };
      }
      
      linhasProcessadas.push({ texto: linha, estilo });
    }
    
    return linhasProcessadas;
  };

  // Para cupom normal (não cozinha), usar estilo simples
  const processarConteudoNormal = (texto: string) => {
    return texto.split('\n').map(linha => ({
      texto: linha,
      estilo: {
        fontFamily: "'Courier New', 'Lucida Console', 'Consolas', monospace",
        fontSize: 11,
        lineHeight: 1.4,
        fontWeight: 400,
        color: '#1a1a1a',
        letterSpacing: '0.03em',
      } as React.CSSProperties,
    }));
  };

  const linhasEstilizadas = fonteGrande 
    ? processarConteudoCozinha(conteudo) 
    : processarConteudoNormal(conteudo);

  return (
    <div className="flex justify-center py-4 px-2">
      <div 
        className="relative"
        style={{ 
          width: 320,
          minWidth: 320,
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
              padding: fonteGrande ? '16px 18px' : '12px 14px',
              backgroundColor: '#fefefe',
            }}
          >
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {linhasEstilizadas.map((linha, index) => (
                <div key={index} style={linha.estilo}>
                  {linha.texto || '\u00A0'}
                </div>
              ))}
            </div>
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
