from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))

pdf_path = "/home/z/my-project/download/Relatorio_Analise_Codigo_PadariaPaula.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
    title="Relatorio de Analise de Codigo - Padaria Paula", author='Z.ai', creator='Z.ai', subject='Analise completa do codigo do sistema Padaria Paula')

styles = getSampleStyleSheet()
title_style = ParagraphStyle('TitleStyle', fontName='Microsoft YaHei', fontSize=22, leading=28, alignment=TA_CENTER, spaceAfter=15, textColor=colors.HexColor('#1F4E79'))
h1_style = ParagraphStyle('H1Style', fontName='Microsoft YaHei', fontSize=14, leading=20, spaceBefore=12, spaceAfter=8, textColor=colors.HexColor('#1F4E79'))
h2_style = ParagraphStyle('H2Style', fontName='Microsoft YaHei', fontSize=12, leading=16, spaceBefore=10, spaceAfter=6, textColor=colors.HexColor('#2E75B6'))
body_style = ParagraphStyle('BodyStyle', fontName='SimHei', fontSize=10, leading=14, alignment=TA_JUSTIFY, spaceAfter=6, wordWrap='CJK')
bullet_style = ParagraphStyle('BulletStyle', fontName='SimHei', fontSize=10, leading=14, leftIndent=15, spaceAfter=3, wordWrap='CJK')
code_style = ParagraphStyle('CodeStyle', fontName='Times New Roman', fontSize=9, leading=12, backColor=colors.HexColor('#F5F5F5'), leftIndent=10, rightIndent=10, spaceBefore=4, spaceAfter=4)
success_style = ParagraphStyle('SuccessStyle', fontName='SimHei', fontSize=10, leading=14, backColor=colors.HexColor('#D4EDDA'), leftIndent=10, rightIndent=10, spaceBefore=6, spaceAfter=6, borderPadding=8, wordWrap='CJK')
warning_style = ParagraphStyle('WarningStyle', fontName='SimHei', fontSize=10, leading=14, backColor=colors.HexColor('#FFF3CD'), leftIndent=10, rightIndent=10, spaceBefore=6, spaceAfter=6, borderPadding=8, wordWrap='CJK')
error_style = ParagraphStyle('ErrorStyle', fontName='SimHei', fontSize=10, leading=14, backColor=colors.HexColor('#F8D7DA'), leftIndent=10, rightIndent=10, spaceBefore=6, spaceAfter=6, borderPadding=8, wordWrap='CJK')

story = []

# Title
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("<b>Relatorio de Analise de Codigo</b>", title_style))
story.append(Paragraph("Sistema Padaria Paula - Versao Local", ParagraphStyle('Sub', fontName='SimHei', fontSize=12, alignment=TA_CENTER, textColor=colors.HexColor('#666666'))))
story.append(Spacer(1, 0.5*cm))

# Section 1 - Resumo
story.append(Paragraph("<b>1. RESUMO EXECUTIVO</b>", h1_style))
story.append(Paragraph("O sistema Padaria Paula foi analisado completamente para avaliar seu estado atual, boas praticas, potenciais bugs e melhorias. O projeto esta bem estruturado e utiliza tecnologias modernas como Next.js 16, React 19, TypeScript, Prisma ORM e Zustand para gerenciamento de estado.", body_style))
story.append(Paragraph("<b>Status Geral: APROVADO para uso local</b>", success_style))

# Section 2 - Arquitetura
story.append(Paragraph("<b>2. ARQUITETURA DO PROJETO</b>", h1_style))
story.append(Paragraph("<b>Tecnologias Utilizadas:</b>", h2_style))
techs = ["Next.js 16 com App Router", "React 19 + TypeScript", "Prisma ORM + SQLite (local)", "Zustand (estado global)", "shadcn/ui + Tailwind CSS", "ESC/POS para impressao termica"]
for t in techs:
    story.append(Paragraph(f"• {t}", bullet_style))

story.append(Paragraph("<b>Estrutura de Pastas:</b>", h2_style))
story.append(Paragraph("src/app/ - Paginas e API Routes (Next.js App Router)", body_style))
story.append(Paragraph("src/components/padaria/ - Componentes especificos do dominio", body_style))
story.append(Paragraph("src/store/ - Stores Zustand para estado global", body_style))
story.append(Paragraph("src/lib/ - Utilitarios (escpos.ts, db.ts)", body_style))
story.append(Paragraph("prisma/ - Schema e seed do banco de dados", body_style))

# Section 3 - Analise de Codigo
story.append(Paragraph("<b>3. ANALISE DE CODIGO</b>", h1_style))

story.append(Paragraph("<b>3.1 Boas Praticas Identificadas</b>", h2_style))
good = ["Uso de TypeScript com tipagem forte em todo o projeto", "Componentes bem organizados com responsabilidade unica", "Stores Zustand com persistencia para autenticacao", "API Routes com validacao de dados e tratamento de erros", "Codigo limpo com comentarios explicativos", "Lint passa sem erros ou warnings", "Uso de async/await consistente", "Separacao clara entre frontend e backend"]
for g in good:
    story.append(Paragraph(f"✓ {g}", bullet_style))

story.append(Paragraph("<b>3.2 Pontos de Atencao Identificados</b>", h2_style))
issues = [
    ("MEDIO", "No schema.prisma, falta tratamento para conexao PostgreSQL em producao (ja corrigido para versao local)"),
    ("BAIXO", "Algumas funcoes de formatacao (CPF, CNPJ, telefone) estao duplicadas em multiplos componentes"),
    ("BAIXO", "Nao ha loading states em algumas operacoes de exclusao"),
]
for prio, issue in issues:
    color = '#FFF3CD' if prio == 'MEDIO' else '#D4EDDA'
    story.append(Paragraph(f"[{prio}] {issue}", ParagraphStyle('Issue', fontName='SimHei', fontSize=9, leading=13, backColor=colors.HexColor(color), leftIndent=10, rightIndent=10, spaceBefore=3, spaceAfter=3, borderPadding=6, wordWrap='CJK')))

# Section 4 - Impressao
story.append(Paragraph("<b>4. SISTEMA DE IMPRESSAO</b>", h1_style))
story.append(Paragraph("O sistema de impressao termica ESC/POS esta bem implementado com suporte a cupons de 80mm:", body_style))
story.append(Paragraph("• gerarCupomCliente() - Cupom com valores para o cliente", bullet_style))
story.append(Paragraph("• gerarCupomCozinhaGrande() - Comanda sem valores para producao", bullet_style))
story.append(Paragraph("• gerarCupomOrcamento() - Cupom de orcamento com indicativo visual", bullet_style))
story.append(Paragraph("• imprimirViaDialogo() - Abre dialogo de impressao do navegador", bullet_style))
story.append(Spacer(1, 0.2*cm))
story.append(Paragraph("<b>Funcionamento:</b> O sistema gera texto formatado em largura fixa (48 caracteres) e abre uma nova janela do navegador com CSS otimizado para impressoras termicas. O usuario deve ter uma impressora termica configurada como impressora padrao do sistema.", body_style))

# Section 5 - Fluxo de Orçamentos
story.append(Paragraph("<b>5. FLUXO DE ORCAMENTOS</b>", h1_style))
story.append(Paragraph("O fluxo de orcamentos esta completo e funcional:", body_style))
story.append(Paragraph("1. Cliente seleciona botao 'Orcamento' no card do cliente", bullet_style))
story.append(Paragraph("2. Sistema abre tela de novo orcamento com cliente pre-preenchido", bullet_style))
story.append(Paragraph("3. Usuario adiciona produtos e define dados de entrega", bullet_style))
story.append(Paragraph("4. Orcamento e salvo com status PENDENTE", bullet_style))
story.append(Paragraph("5. Na lista de orcamentos, pode APROVAR ou REJEITAR", bullet_style))
story.append(Paragraph("6. Ao aprovar, cria automaticamente um PEDIDO", bullet_style))
story.append(Paragraph("7. Impressao de cupom de orcamento disponivel", bullet_style))

# Section 6 - Componentes
story.append(Paragraph("<b>6. COMPONENTES PRINCIPAIS</b>", h1_style))

header_style = ParagraphStyle('TH', fontName='Microsoft YaHei', fontSize=9, textColor=colors.white, alignment=TA_CENTER)
cell_style = ParagraphStyle('TC', fontName='SimHei', fontSize=8, alignment=TA_LEFT)

data = [
    [Paragraph("<b>Componente</b>", header_style), Paragraph("<b>Funcao</b>", header_style), Paragraph("<b>Status</b>", header_style)],
    [Paragraph("ClientesLista", cell_style), Paragraph("Lista e gerencia clientes", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("ProdutosLista", cell_style), Paragraph("Lista e seleciona produtos", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("NovoPedido", cell_style), Paragraph("Cria novos pedidos", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("Carrinho", cell_style), Paragraph("Gerencia carrinho de compras", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("ResumoPedido", cell_style), Paragraph("Revisao antes de finalizar", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("ImpressaoManager", cell_style), Paragraph("Gerencia impressao de cupons", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("HistoricoPedidos", cell_style), Paragraph("Historico de pedidos", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("EntregasLista", cell_style), Paragraph("Pedidos TELE_ENTREGA", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("OrcamentosLista", cell_style), Paragraph("Lista de orcamentos", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("NovoOrcamento", cell_style), Paragraph("Criar novos orcamentos", cell_style), Paragraph("✓ OK", cell_style)],
    [Paragraph("AdminPanel", cell_style), Paragraph("Painel administrativo", cell_style), Paragraph("✓ OK", cell_style)],
]

t = Table(data, colWidths=[3.5*cm, 7*cm, 2.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(t)

# Section 7 - Stores
story.append(PageBreak())
story.append(Paragraph("<b>7. STORES (ZUSTAND)</b>", h1_style))
story.append(Paragraph("Os stores estao bem organizados e seguem padroes consistentes:", body_style))
story.append(Paragraph("• useAppStore - Navegacao e estado geral da aplicacao", bullet_style))
story.append(Paragraph("• usePedidoStore - Cliente, carrinho, entrega e calculos de pedido", bullet_style))
story.append(Paragraph("• useOrcamentoStore - Fluxo de orcamentos", bullet_style))
story.append(Paragraph("• useAuthStore - Autenticacao de funcionarios (PIN)", bullet_style))
story.append(Paragraph("• useAdminStore - Autenticacao administrativa (senha separada)", bullet_style))

# Section 8 - APIs
story.append(Paragraph("<b>8. API ROUTES</b>", h1_style))
apis = ["/api/clientes - CRUD de clientes", "/api/produtos - CRUD de produtos", "/api/pedidos - CRUD de pedidos", "/api/orcamentos - CRUD de orcamentos com conversao para pedido", "/api/configuracao - Configuracoes da loja", "/api/auth - Autenticacao (PIN e Admin)"]
for a in apis:
    story.append(Paragraph(f"• {a}", bullet_style))

# Section 9 - Versao Local
story.append(Paragraph("<b>9. PREPARACAO PARA VERSAO LOCAL</b>", h1_style))
story.append(Paragraph("O projeto ja esta preparado para rodar localmente. Nenhuma alteracao critica e necessaria:", body_style))
story.append(Paragraph("<b>Requisitos para rodar local:</b>", h2_style))
story.append(Paragraph("1. Node.js 18+ ou Bun instalado", bullet_style))
story.append(Paragraph("2. Executar: bun install", bullet_style))
story.append(Paragraph("3. Executar: bunx prisma generate", bullet_style))
story.append(Paragraph("4. Executar: bunx prisma db push", bullet_style))
story.append(Paragraph("5. Executar: bun run db:seed", bullet_style))
story.append(Paragraph("6. Executar: bun run dev", bullet_style))

# Section 10 - Conclusao
story.append(Paragraph("<b>10. CONCLUSAO</b>", h1_style))
story.append(Paragraph("O sistema Padaria Paula esta em excelente estado para uso local. O codigo segue boas praticas, nao possui bugs criticos identificados, e todas as funcionalidades principais estao operacionais:", body_style))
story.append(Paragraph("✓ Cadastro e gerenciamento de clientes", bullet_style))
story.append(Paragraph("✓ Cadastro e gerenciamento de produtos", bullet_style))
story.append(Paragraph("✓ Criacao de pedidos com tipos NORMAL e ESPECIAL", bullet_style))
story.append(Paragraph("✓ Sistema de orcamentos completo", bullet_style))
story.append(Paragraph("✓ Impressao de cupons termicos", bullet_style))
story.append(Paragraph("✓ Painel administrativo com seguranca", bullet_style))
story.append(Paragraph("✓ Historico e entregas", bullet_style))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph("<b>O projeto esta APROVADO para entrega ao cliente.</b>", success_style))

# Build
doc.build(story)
print(f"PDF criado: {pdf_path}")
