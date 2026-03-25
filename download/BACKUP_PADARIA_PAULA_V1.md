# 🥖 PADARIA E CONFEITARIA PAULA - SISTEMA DE PEDIDOS
## 📦 BACKUP VERSÃO 1.0 - DOCUMENTAÇÃO COMPLETA

**Data do Backup:** Janeiro 2026  
**Versão:** 1.0  
**Nome do Backup:** `BACKUP_PADARIA_PAULA_V1`

---

## 🎯 VISÃO GERAL DO SISTEMA

Sistema completo de gestão de pedidos para padaria/confeitaria, desenvolvido como uma Single Page Application (SPA) com Next.js 16, focado em dispositivos móveis (mobile-first) e otimizado para impressão de cupons térmicos 80mm.

### Stack Tecnológica
- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Estilização:** Tailwind CSS v4 + shadcn/ui
- **Gerenciamento de Estado:** Zustand
- **Banco de Dados:** SQLite via Prisma ORM
- **Bundler:** Turbopack

---

## 📱 FLUXO DE NAVEGAÇÃO

```
┌─────────────┐
│   LOGIN     │ (senha: 2026)
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ NOVO PEDIDO │────▶│  PRODUTOS   │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │    ┌──────────────┘
       │    │
       ▼    ▼
┌─────────────┐     ┌─────────────┐
│   RESUMO    │────▶│  IMPRESSÃO  │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  HISTÓRICO  │     │    ADMIN    │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│  CLIENTES   │
└─────────────┘
```

---

## 🗄️ MODELAGEM DO BANCO DE DADOS

### Configuracao
```prisma
model Configuracao {
  id        String   @id @default(cuid())
  nomeLoja  String   @default("Padaria e Confeitaria Paula")
  endereco  String   @default("Rua das Flores, 123")
  telefone  String   @default("(11) 99999-9999")
  cnpj      String   @default("")
  logoUrl   String?
  senha     String   @default("2026")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Cliente
```prisma
model Cliente {
  id         String    @id @default(cuid())
  nome       String
  telefone   String    @unique    // Obrigatório e único
  cpfCnpj    String?   @unique    // Opcional, único quando informado
  tipoPessoa String    @default("CPF")  // CPF ou CNPJ
  endereco   String?   // Endereço completo
  bairro     String?   // Bairro
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  pedidos    Pedido[]
}
```

### Produto
```prisma
model Produto {
  id          String       @id @default(cuid())
  nome        String
  descricao   String?
  tipoVenda   String       // "KG" ou "UNIDADE"
  valorUnit   Float
  ativo       Boolean      @default(true)
  categoria   String?
  imagem      String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  itensPedido ItemPedido[]
}
```

### Pedido
```prisma
model Pedido {
  id              String       @id @default(cuid())
  numero          Int          // Sequencial automático
  clienteId       String
  observacoes     String?
  total           Float        // Total final (com ajuste de peso)
  totalPedida     Float        // Total original (antes de ajuste)
  status          String       @default("PENDENTE")
  impresso        Boolean      @default(false)
  // Dados de entrega (do pedido, não do cliente)
  tipoEntrega     String       @default("RETIRA")  // RETIRA ou TELE_ENTREGA
  dataEntrega     String       // OBRIGATÓRIO - Data de entrega (YYYY-MM-DD)
  enderecoEntrega String?      // Se TELE_ENTREGA
  bairroEntrega   String?      // Se TELE_ENTREGA
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  itens           ItemPedido[]
  cliente         Cliente      @relation(fields: [clienteId], references: [id])
}
```

### ItemPedido
```prisma
model ItemPedido {
  id              String  @id @default(cuid())
  pedidoId        String
  produtoId       String
  quantidadePedida Float  // Quantidade original pedida
  quantidade      Float   // Quantidade final (ajustada para KG)
  valorUnit       Float
  subtotalPedida  Float   // Subtotal original
  subtotal        Float   // Subtotal final
  observacao      String?
  produto         Produto @relation(fields: [produtoId], references: [id])
  pedido          Pedido  @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
}
```

---

## 🖥️ COMPONENTES PRINCIPAIS

### 1. LoginScreen.tsx
- Tela de autenticação com PIN de 4 dígitos
- Senha padrão: "2026"
- Usa `useAuthStore` para gerenciar estado de autenticação
- Persistência via Zustand persist middleware

### 2. Navigation.tsx
- Barra de navegação responsiva
- **Mobile:** Ícones grandes em grid horizontal rolável
- **Desktop:** Menu horizontal tradicional
- Badge com contador de itens no carrinho
- Produto só aparece se cliente selecionado

### 3. NovoPedido.tsx
- Seleção de cliente por busca (nome/telefone)
- Definição do tipo de entrega: RETIRA ou TELE_ENTREGA
- Data de entrega/retirada obrigatória
- Endereço de entrega (apenas para TELE_ENTREGA)
- Pré-preenchimento do endereço com dados do cliente

### 4. ClientesLista.tsx
- Lista completa de clientes cadastrados
- Busca por nome ou telefone
- CRUD completo de clientes
- Botão "Novo Pedido" para cada cliente
- Exibe: nome, telefone, CPF/CNPJ, endereço, bairro, quantidade de pedidos

### 5. ProdutosLista.tsx
- Lista de produtos ativos
- Filtro por categoria (tabs)
- Busca por nome/descrição
- **Seletor KG:** Select de 500g a 10kg (de 500g em 500g)
- **Seletor UNIDADE:** Input numérico livre
- Badge com subtotal antes de adicionar

### 6. Carrinho.tsx
- Resumo dos itens do pedido
- Ajuste de quantidade (+/-)
- Remoção de itens
- **Versão Desktop:** Card lateral fixo
- **Versão Mobile:** Barra inferior expansível

### 7. ResumoPedido.tsx
- Confirmação final do pedido
- Edição de peso final para produtos KG (input livre)
- Campo de observações gerais
- Preview dos cupons (Cliente e Cozinha)
- Cálculo de diferença de total quando peso ajustado

### 8. HistoricoPedidos.tsx
- Lista de pedidos com filtros (data, busca)
- Visualização completa do pedido
- Edição de pesos após pedido criado
- Atualização de status (PENDENTE → PRODUÇÃO → PRONTO → ENTREGUE)
- Reimpressão de cupom do cliente
- Exclusão de pedidos

### 9. AdminPanel.tsx
- **Aba Produtos:** CRUD de produtos, ativar/desativar
- **Aba Configurações:** Dados da loja (nome, endereço, telefone, CNPJ)
- **Aba Segurança:** Alteração de senha de acesso

### 10. ImpressaoManager.tsx
- Gerenciamento de impressão de cupons
- Preview visual antes de imprimir
- Impressão via diálogo do navegador

---

## 🖨️ SISTEMA DE CUPONS (ESC/POS)

### Formato
- Impressora térmica 80mm
- 48 caracteres por linha
- Fonte: Courier New monospace

### Tipos de Cupom

#### 1. Cupom do Cliente (`gerarCupomCliente`)
- Cabeçalho com dados da loja
- Número do pedido centralizado
- Tipo de entrega e data
- Dados do cliente
- Itens com: nome, quantidade, valor unitário, subtotal
- **Diferença de peso:** Mostra "(pedido: X,XXXkg)" se ajustado
- Total em destaque
- Mensagem de agradecimento

#### 2. Cupom Cozinha (`gerarCupomCozinhaGrande`)
- Formato simplificado para produção
- **QUANTIDADE PEDIDA** (original, não a ajustada)
- Sem valores monetários
- Fonte grande: "QTD x PRODUTO"
- Observações em destaque

### Funções Utilitárias (escpos.ts)
```typescript
- formatarNumeroPedido(numero: number): string
- formatarCPF(cpf: string): string
- formatarCNPJ(cnpj: string): string
- formatarTelefone(telefone: string): string
- formatarMoeda(valor: number): string
- gerarCupomCliente(pedido, config): string
- gerarCupomCozinha(pedido, config): string
- gerarCupomCozinhaGrande(pedido, config): string
- imprimirViaDialogo(conteudo: string, titulo: string): void
- baixarCupom(conteudo: string, nomeArquivo: string): void
```

---

## 🔌 APIs (ROTAS)

### /api/auth
- `POST`: Login com senha
- `GET`: Verificar autenticação
- `PUT`: Alterar senha

### /api/clientes
- `GET`: Listar clientes (parâmetro `busca` para filtro)
- `POST`: Criar novo cliente
- `PUT`: Atualizar cliente
- `DELETE`: Excluir cliente

### /api/produtos
- `GET`: Listar produtos (parâmetro `ativo=true` para filtros)
- `POST`: Criar produto
- `PUT`: Atualizar produto
- `DELETE`: Excluir/desativar produto

### /api/pedidos
- `GET`: Listar pedidos (filtros: `id`, `data`, `status`, `limite`)
- `POST`: Criar novo pedido
- `PUT`: Atualizar status ou itens do pedido
- `DELETE`: Excluir pedido

### /api/configuracao
- `GET`: Obter configurações da loja
- `PUT`: Atualizar configurações

---

## 📊 STORES (ZUSTAND)

### useAppStore
```typescript
interface AppState {
  telaAtual: Tela;  // 'novo-pedido' | 'produtos' | 'resumo' | 'impressao' | 'historico' | 'admin' | 'clientes'
  setTela: (tela: Tela) => void;
  pedidoParaImpressao: string | null;
  setPedidoParaImpressao: (id: string | null) => void;
}
```

### usePedidoStore
```typescript
interface PedidoState {
  cliente: ClienteSelecionado | null;
  entrega: DadosEntrega;
  itens: ItemCarrinho[];
  observacoes: string;
  total: number;
  totalPedida: number;
  
  // Actions
  setCliente: (cliente: ClienteSelecionado) => void;
  clearCliente: () => void;
  setEntrega: (entrega: Partial<DadosEntrega>) => void;
  adicionarItem: (item: ItemCarrinho) => void;
  removerItem: (index: number) => void;
  atualizarItem: (index: number, item: Partial<ItemCarrinho>) => void;
  atualizarPesoFinal: (index: number, pesoFinal: number) => void;
  clearCarrinho: () => void;
  setObservacoes: (obs: string) => void;
  resetPedido: () => void;
}
```

### useAuthStore
```typescript
interface AuthState {
  autenticado: boolean;
  login: (senha: string) => Promise<boolean>;
  logout: () => void;
  verificarAuth: () => Promise<boolean>;
}
```

---

## 🎨 ESTILOS E DESIGN

### Classes Personalizadas (tailwind.config.ts)
```css
.btn-padaria     /* Botão primário da padaria */
.card-padaria    /* Card com borda suave */
.input-padaria   /* Input estilizado */
```

### Cores (CSS Variables)
```css
--primary        /* Verde principal */
--secondary      /* Cinza secundário */
--accent         /* Destaque */
--background     /* Fundo claro */
--foreground     /* Texto escuro */
--muted          /* Texto secundário */
--destructive    /* Vermelho para ações destrutivas */
```

### Responsividade
- **Mobile First:** Design começa em mobile
- **Breakpoint LG:** 1024px para desktop
- **Safe Area:** `safe-area-bottom` para iOS

---

## 🔄 FLUXO DE PEDIDO COMPLETO

### 1. Login
- Usuário digita senha de 4 dígitos
- Sistema valida contra `Configuracao.senha`

### 2. Seleção de Cliente
- Busca por nome ou telefone
- Seleciona cliente existente OU cadastra novo
- Sistema carrega dados do cliente (endereço, bairro)

### 3. Definição de Entrega
- Escolhe: RETIRA ou TELE_ENTREGA
- Define data de entrega/retirada (obrigatório)
- Se TELE_ENTREGA: preenche endereço e bairro

### 4. Adição de Produtos
- Navega por categorias
- Seleciona quantidade (KG ou UNIDADE)
- Adiciona ao carrinho

### 5. Resumo e Finalização
- Visualiza itens no carrinho
- **Para KG:** Pode ajustar peso final
- Adiciona observações gerais
- Preview dos cupons
- Confirma e salva pedido

### 6. Pós-Pedido
- Pedido aparece no histórico
- Pode editar pesos posteriormente
- Pode reimprimir cupom
- Pode atualizar status

---

## ⚠️ REGRAS DE NEGÓCIO IMPORTANTES

### Tipos de Venda
- **KG:** Peso pode ser ajustado após pedido
  - Select: 500g a 10kg (intervalos de 500g)
  - Input livre para ajuste final
- **UNIDADE:** Quantidade fixa
  - Input numérico livre

### CPF/CNPJ
- Campo único que aceita ambos
- Switch para alternar entre CPF e CNPJ
- Formatação automática durante digitação
- Único quando informado, null permitido

### Telefone do Cliente
- **Obrigatório e único**
- Formatação automática: (00) 00000-0000

### Endereço de Entrega
- Armazenado no **PEDIDO**, não no cliente
- Cliente pode ter endereço cadastrado
- Endereço do pedido pode ser diferente

### Total do Pedido
- `totalPedida`: Original antes de ajuste
- `total`: Final após ajuste de peso
- Diferença mostrada em verde no resumo

---

## 📁 ESTRUTURA DE ARQUIVOS

```
/home/z/my-project/
├── prisma/
│   └── schema.prisma          # Schema do banco
├── src/
│   ├── app/
│   │   ├── page.tsx           # Página principal (SPA)
│   │   ├── layout.tsx         # Layout raiz
│   │   └── api/
│   │       ├── auth/route.ts
│   │       ├── clientes/route.ts
│   │       ├── configuracao/route.ts
│   │       ├── pedidos/route.ts
│   │       └── produtos/route.ts
│   ├── components/
│   │   ├── padaria/
│   │   │   ├── AdminPanel.tsx
│   │   │   ├── Carrinho.tsx
│   │   │   ├── ClientesLista.tsx
│   │   │   ├── CupomTermico.tsx
│   │   │   ├── CupomVisual.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── HistoricoPedidos.tsx
│   │   │   ├── ImpressaoManager.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── NovoPedido.tsx
│   │   │   ├── ProdutosLista.tsx
│   │   │   └── ResumoPedido.tsx
│   │   └── ui/                # Componentes shadcn/ui
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── db.ts              # Cliente Prisma
│   │   ├── escpos.ts          # Formatação de cupons
│   │   ├── icons.tsx
│   │   └── utils.ts
│   └── store/
│       ├── useAppStore.ts
│       ├── useAuthStore.ts
│       └── usePedidoStore.ts
├── download/                  # Arquivos gerados
├── upload/                    # Arquivos enviados pelo usuário
└── package.json
```

---

## 🔧 COMANDOS ÚTEIS

```bash
# Desenvolvimento
bun run dev              # Inicia servidor de desenvolvimento

# Banco de dados
bun run db:push          # Aplica schema ao banco
bun run db:generate      # Gera cliente Prisma
bun run db:seed          # Popula banco com dados iniciais

# Qualidade
bun run lint             # Verifica erros de código
```

---

## 📌 PARA RESTAURAR ESTA VERSÃO

Se precisar retornar a esta versão, utilize o seguinte prompt:

```
RESTAURAR BACKUP: BACKUP_PADARIA_PAULA_V1

Este é o sistema de pedidos da Padaria e Confeitaria Paula.
Leia o arquivo /home/z/my-project/download/BACKUP_PADARIA_PAULA_V1.md para 
obter toda a documentação e especificações técnicas.

Características principais:
- Sistema de pedidos com clientes, produtos e cupons térmicos
- Login com senha de 4 dígitos
- Tipos de venda: KG (peso ajustável) e UNIDADE
- Entrega: RETIRA ou TELE_ENTREGA
- Impressão de cupons 80mm
- Mobile-first responsivo
```

---

## ✅ CHECKLIST DE FUNCIONALIDADES

- [x] Login com senha de 4 dígitos
- [x] Cadastro e edição de clientes
- [x] Cadastro e edição de produtos
- [x] Criação de pedidos com cliente e entrega
- [x] Seleção de produtos (KG e UNIDADE)
- [x] Carrinho com ajuste de quantidades
- [x] Ajuste de peso final para produtos KG
- [x] Preview de cupons
- [x] Impressão de cupons (cliente e cozinha)
- [x] Histórico de pedidos
- [x] Edição de pesos pós-pedido
- [x] Atualização de status
- [x] Reimpressão de cupons
- [x] Painel administrativo
- [x] Alteração de senha
- [x] Design responsivo mobile-first
- [x] Banco de dados SQLite

---

**FIM DO DOCUMENTO DE BACKUP**
