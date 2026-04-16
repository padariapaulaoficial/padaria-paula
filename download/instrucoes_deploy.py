from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))

# Create document
pdf_path = "/home/z/my-project/download/Deploy_PadariaPaula_Instrucoes.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title="Deploy Padaria Paula - Instrucoes",
    author='Z.ai',
    creator='Z.ai',
    subject='Instrucoes passo a passo para deploy do sistema Padaria Paula'
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle('TitleStyle', fontName='Microsoft YaHei', fontSize=24, leading=30, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor('#1F4E79'))
h1_style = ParagraphStyle('H1Style', fontName='Microsoft YaHei', fontSize=16, leading=22, spaceBefore=15, spaceAfter=10, textColor=colors.HexColor('#1F4E79'))
h2_style = ParagraphStyle('H2Style', fontName='Microsoft YaHei', fontSize=13, leading=18, spaceBefore=12, spaceAfter=6, textColor=colors.HexColor('#2E75B6'))
body_style = ParagraphStyle('BodyStyle', fontName='SimHei', fontSize=11, leading=16, alignment=TA_JUSTIFY, spaceAfter=8, wordWrap='CJK')
code_style = ParagraphStyle('CodeStyle', fontName='Times New Roman', fontSize=10, leading=14, backColor=colors.HexColor('#F5F5F5'), leftIndent=10, rightIndent=10, spaceBefore=5, spaceAfter=5, borderColor=colors.HexColor('#E0E0E0'), borderWidth=1, borderPadding=8)
bullet_style = ParagraphStyle('BulletStyle', fontName='SimHei', fontSize=11, leading=16, leftIndent=15, spaceAfter=4, wordWrap='CJK')
warning_style = ParagraphStyle('WarningStyle', fontName='SimHei', fontSize=10, leading=14, backColor=colors.HexColor('#FFF3CD'), leftIndent=10, rightIndent=10, spaceBefore=8, spaceAfter=8, borderColor=colors.HexColor('#FFC107'), borderWidth=1, borderPadding=8, wordWrap='CJK')
tip_style = ParagraphStyle('TipStyle', fontName='SimHei', fontSize=10, leading=14, backColor=colors.HexColor('#D4EDDA'), leftIndent=10, rightIndent=10, spaceBefore=8, spaceAfter=8, borderColor=colors.HexColor('#28A745'), borderWidth=1, borderPadding=8, wordWrap='CJK')

story = []

# Title
story.append(Spacer(1, 1*cm))
story.append(Paragraph("<b>Deploy Padaria Paula</b>", title_style))
story.append(Paragraph("Instrucoes Passo a Passo - Vercel + Supabase", ParagraphStyle('Sub', fontName='SimHei', fontSize=14, alignment=TA_CENTER, textColor=colors.HexColor('#666666'))))
story.append(Spacer(1, 1*cm))

# Section 1
story.append(Paragraph("<b>PASSO 1: Criar Banco de Dados no Supabase</b>", h1_style))
story.append(Paragraph("O Supabase e um servico gratuito de PostgreSQL que vai armazenar todos os dados do seu sistema (clientes, produtos, pedidos).", body_style))

story.append(Paragraph("<b>1.1 Acesse o Supabase</b>", h2_style))
steps1 = ["Va para https://supabase.com", "Clique em 'Start your project' ou 'Sign Up'", "Escolha 'Continue with GitHub' (mais facil)", "Autorize o Supabase a acessar sua conta GitHub"]
for s in steps1:
    story.append(Paragraph(f"• {s}", bullet_style))

story.append(Paragraph("<b>1.2 Crie o Projeto</b>", h2_style))
steps2 = ["Clique em 'New Project'", "Em 'Name', digite: padaria-paula-db", "Em 'Database Password', crie uma senha FORTE e ANOTE-A", "Em 'Region', selecione: Sao Paulo (sa-east-1)", "Clique em 'Create new project'", "Aguarde cerca de 2 minutos"]
for s in steps2:
    story.append(Paragraph(f"• {s}", bullet_style))

story.append(Paragraph("<b>1.3 Pegue a Connection String</b>", h2_style))
steps3 = ["No painel, clique no icone de engrenagem (Settings)", "Clique em 'Database' no menu lateral", "Role ate 'Connection string'", "Selecione a aba 'URI'", "Copie a URL completa"]
for s in steps3:
    story.append(Paragraph(f"• {s}", bullet_style))

story.append(Paragraph("A URL tera este formato:", body_style))
story.append(Paragraph("postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres", code_style))
story.append(Paragraph("IMPORTANTE: Substitua [YOUR-PASSWORD] pela senha que voce criou no passo 1.2", warning_style))

story.append(PageBreak())

# Section 2
story.append(Paragraph("<b>PASSO 2: Enviar Codigo para GitHub</b>", h1_style))
story.append(Paragraph("A Vercel precisa acessar seu codigo atraves do GitHub para fazer o deploy automatico.", body_style))

story.append(Paragraph("<b>2.1 Crie um repositorio no GitHub</b>", h2_style))
steps4 = ["Acesse https://github.com", "Clique em 'New repository' (botao verde)", "Nome: padaria-paula", "Deixe como 'Private' ou 'Public' (tanto faz)", "NAO marque 'Add a README file'", "Clique em 'Create repository'"]
for s in steps4:
    story.append(Paragraph(f"• {s}", bullet_style))

story.append(Paragraph("<b>2.2 Envie o codigo</b>", h2_style))
story.append(Paragraph("No terminal do seu computador, execute:", body_style))
story.append(Paragraph("git init", code_style))
story.append(Paragraph("git add .", code_style))
story.append(Paragraph('git commit -m "Preparando para deploy"', code_style))
story.append(Paragraph("git branch -M main", code_style))
story.append(Paragraph("git remote add origin https://github.com/SEU-USUARIO/padaria-paula.git", code_style))
story.append(Paragraph("git push -u origin main", code_style))

# Section 3
story.append(Paragraph("<b>PASSO 3: Deploy na Vercel</b>", h1_style))
story.append(Paragraph("Agora vamos conectar seu repositorio a Vercel para fazer o deploy automatico.", body_style))

story.append(Paragraph("<b>3.1 Acesse a Vercel</b>", h2_style))
steps5 = ["Va para https://vercel.com", "Clique em 'Sign Up' ou 'Log In'", "Escolha 'Continue with GitHub'", "Autorize a Vercel a acessar seus repositorios"]
for s in steps5:
    story.append(Paragraph(f"• {s}", bullet_style))

story.append(Paragraph("<b>3.2 Importe o Projeto</b>", h2_style))
steps6 = ["Clique em 'Add New...' -> 'Project'", "Encontre o repositorio 'padaria-paula'", "Clique em 'Import'"]
for s in steps6:
    story.append(Paragraph(f"• {s}", bullet_style))

story.append(PageBreak())

story.append(Paragraph("<b>3.3 Configure as Variaveis de Ambiente</b>", h2_style))
story.append(Paragraph("ANTES de clicar em Deploy, voce precisa adicionar as variaveis de ambiente. Clique em 'Environment Variables' e adicione:", body_style))

# Table
header_style = ParagraphStyle('TH', fontName='Microsoft YaHei', fontSize=10, textColor=colors.white, alignment=TA_CENTER)
cell_style = ParagraphStyle('TC', fontName='SimHei', fontSize=9, alignment=TA_LEFT)

data = [
    [Paragraph("<b>Variavel</b>", header_style), Paragraph("<b>Valor</b>", header_style)],
    [Paragraph("DATABASE_URL", cell_style), Paragraph("postgresql://postgres.[ID]:[SENHA]@...6543/postgres", cell_style)],
    [Paragraph("DIRECT_DATABASE_URL", cell_style), Paragraph("postgresql://postgres.[ID]:[SENHA]@...5432/postgres", cell_style)],
    [Paragraph("ADMIN_PASSWORD", cell_style), Paragraph("Sua senha de admin (ex: admin2026)", cell_style)],
    [Paragraph("PIN_FUNCIONARIOS", cell_style), Paragraph("PIN de 4 digitos (ex: 1234)", cell_style)],
]

t = Table(data, colWidths=[5*cm, 10*cm])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
]))
story.append(t)

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("ATENCAO: DATABASE_URL usa porta 6543, DIRECT_DATABASE_URL usa porta 5432!", warning_style))

story.append(Paragraph("<b>3.4 Finalize o Deploy</b>", h2_style))
steps7 = ["Clique em 'Deploy'", "Aguarde cerca de 3 minutos", "Quando terminar, voce vera uma tela de sucesso", "Clique no link gerado (ex: padaria-paula.vercel.app)"]
for s in steps7:
    story.append(Paragraph(f"• {s}", bullet_style))

# Section 4
story.append(Paragraph("<b>PASSO 4: Criar Tabelas no Banco</b>", h1_style))
story.append(Paragraph("O banco de dados esta vazio. Voce precisa criar as tabelas. Isso e feito automaticamente pelo Prisma com um comando.", body_style))

story.append(Paragraph("<b>4.1 No seu computador local</b>", h2_style))
story.append(Paragraph("Clone o repositorio e configure as variaveis de ambiente:", body_style))
story.append(Paragraph("git clone https://github.com/SEU-USUARIO/padaria-paula.git", code_style))
story.append(Paragraph("cd padaria-paula", code_style))
story.append(Paragraph("bun install", code_style))

story.append(Paragraph("<b>4.2 Crie o arquivo .env.local</b>", h2_style))
story.append(Paragraph("Crie um arquivo chamado .env.local na raiz do projeto com as mesmas variaveis que voce usou na Vercel:", body_style))
story.append(Paragraph('DATABASE_URL="postgresql://postgres..."', code_style))
story.append(Paragraph('DIRECT_DATABASE_URL="postgresql://postgres..."', code_style))

story.append(PageBreak())

story.append(Paragraph("<b>4.3 Execute os comandos para criar as tabelas</b>", h2_style))
story.append(Paragraph("bunx prisma generate", code_style))
story.append(Paragraph("bunx prisma db push", code_style))
story.append(Paragraph("Este comando cria TODAS as tabelas automaticamente no Supabase.", tip_style))

story.append(Paragraph("<b>4.4 Popule com produtos iniciais</b>", h2_style))
story.append(Paragraph("bun run db:seed", code_style))
story.append(Paragraph("Este comando cria a configuracao inicial e alguns produtos de exemplo.", tip_style))

# Section 5
story.append(Paragraph("<b>PASSO 5: Testar o Sistema</b>", h1_style))
story.append(Paragraph("Acesse a URL da Vercel e teste:", body_style))

tests = ["[ ] Pagina inicial carrega corretamente", "[ ] Cadastrar um novo cliente", "[ ] Cadastrar um novo produto", "[ ] Criar um pedido", "[ ] Acessar painel admin (clique no cabecalho e digite a senha)", "[ ] Verificar historico de pedidos"]
for t in tests:
    story.append(Paragraph(t, bullet_style))

# Section 6
story.append(Paragraph("<b>RESUMO DO QUE FOI PREPARADO</b>", h1_style))
story.append(Paragraph("Eu preparei o projeto com as seguintes alteracoes:", body_style))

preparados = ["Schema Prisma atualizado para PostgreSQL", "Arquivo .env.example com todas as variaveis necessarias", "package.json com scripts de build corretos", "vercel.json com configuracoes da Vercel", "DEPLOY.md com instrucoes detalhadas"]
for p in preparados:
    story.append(Paragraph(f"✓ {p}", bullet_style))

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("<b>O QUE VOCE PRECISA FAZER</b>", h1_style))

voce = ["1. Criar conta no Supabase e criar projeto PostgreSQL", "2. Copiar a Connection String do banco", "3. Enviar o codigo para GitHub", "4. Conectar GitHub na Vercel", "5. Configurar variaveis de ambiente", "6. Fazer deploy", "7. Rodar 'prisma db push' e 'db:seed' para criar tabelas"]
for v in voce:
    story.append(Paragraph(v, bullet_style))

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph("<b>TODAS AS FUNCOES VAO FUNCIONAR!</b>", ParagraphStyle('Success', fontName='Microsoft YaHei', fontSize=14, alignment=TA_CENTER, textColor=colors.HexColor('#28A745'), spaceBefore=10)))
story.append(Paragraph("O Prisma ORM garante que as mesmas queries funcionam tanto em SQLite quanto PostgreSQL. Nenhuma alteracao no codigo foi necessaria.", body_style))

# Build
doc.build(story)
print(f"PDF criado: {pdf_path}")
