# 🥖 PROMPT EXECUTÁVEL - SISTEMA PADARIA PAULA

## COPIE E COLE ESTE PROMPO PARA RECRiar O SISTEMA:

---

```
CRIE UM SISTEMA COMPLETO DE GESTÃO DE PEDIDOS PARA PADARIA/CONFEITARIA COM AS SEGUINTES ESPECIFICAÇÕES:

## TECNOLOGIAS
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Zustand para estado global
- Prisma ORM + SQLite
- Single Page Application (SPA)

## MODELOS DE DADOS (Prisma)

1. **Configuracao**: nomeLoja, endereco, telefone, cnpj, logoUrl, senha (padrão "2026")

2. **Cliente**: 
   - nome (obrigatório)
   - telefone (obrigatório, único)
   - cpfCnpj (opcional, único quando informado)
   - tipoPessoa (CPF ou CNPJ)
   - endereco (opcional)
   - bairro (opcional)

3. **Produto**:
   - nome, descricao, tipoVenda (KG ou UNIDADE), valorUnit, ativo, categoria

4. **Pedido**:
   - numero (sequencial)
   - clienteId, observacoes
   - total, totalPedida (original vs ajustado)
   - status (PENDENTE, PRODUCAO, PRONTO, ENTREGUE, CANCELADO)
   - tipoEntrega (RETIRA ou TELE_ENTREGA)
   - dataEntrega (OBRIGATÓRIO)
   - enderecoEntrega, bairroEntrega (se TELE_ENTREGA)

5. **ItemPedido**:
   - produtoId, quantidadePedida, quantidade, valorUnit, subtotalPedida, subtotal, observacao

## FLUXO DO SISTEMA

1. **LOGIN**: Tela com PIN de 4 dígitos (senha padrão: 2026)

2. **NOVO PEDIDO**:
   - Buscar cliente por nome/telefone
   - Definir tipo de entrega (RETIRA ou TELE_ENTREGA)
   - Data de entrega obrigatória
   - Endereço de entrega (se TELE_ENTREGA)
   - Pré-preencher endereço do cliente

3. **PRODUTOS**:
   - Lista com filtros por categoria
   - Seletor KG: Select de 500g a 10kg (intervalos 500g)
   - Seletor UNIDADE: Input numérico livre
   - Mostrar subtotal antes de adicionar

4. **CARRINHO**:
   - Lista de itens com +/- para ajuste
   - Versão mobile: barra inferior expansível
   - Versão desktop: card lateral

5. **RESUMO DO PEDIDO**:
   - Confirmação de dados
   - Edição de peso final para produtos KG (input livre)
   - Campo observações
   - Preview dos cupons
   - Diferença de total se peso ajustado

6. **HISTÓRICO**:
   - Lista de pedidos com filtros
   - Visualização completa
   - Edição de pesos pós-pedido
   - Atualização de status
   - Reimpressão de cupom

7. **ADMINISTRAÇÃO**:
   - CRUD de produtos
   - Configurações da loja
   - Alteração de senha

## SISTEMA DE CUPONS (ESC/POS 80mm, 48 caracteres)

1. **Cupom Cliente**: Com valores, mostra peso ajustado se diferente
2. **Cupom Cozinha**: Sem valores, quantidade PEDIDA (original), fonte grande

## COMPONENTES PRINCIPAIS

- LoginScreen.tsx - Autenticação
- Navigation.tsx - Navegação responsiva
- NovoPedido.tsx - Seleção cliente + entrega
- ClientesLista.tsx - CRUD clientes
- ProdutosLista.tsx - Lista produtos
- Carrinho.tsx - Carrinho
- ResumoPedido.tsx - Finalização
- HistoricoPedidos.tsx - Histórico
- AdminPanel.tsx - Administração

## STORES (Zustand)

- useAuthStore: autenticado, login, logout, verificarAuth
- useAppStore: telaAtual, setTela
- usePedidoStore: cliente, entrega, itens, total, observacoes, actions CRUD

## APIs

- /api/auth: POST login, GET verificar, PUT alterar senha
- /api/clientes: GET lista, POST criar, PUT atualizar, DELETE excluir
- /api/produtos: GET lista, POST criar, PUT atualizar, DELETE excluir
- /api/pedidos: GET lista, POST criar, PUT atualizar, DELETE excluir
- /api/configuracao: GET, PUT

## DESIGN

- Mobile-first responsivo
- Classes personalizadas: btn-padaria, card-padaria, input-padaria
- Tema verde como cor principal
- Footer discreto

## REGRAS IMPORTANTES

- Telefone é obrigatório e único para clientes
- CPF/CNPJ é opcional, mas único quando informado
- Endereço de entrega fica no PEDIDO, não no cliente
- Produtos KG podem ter peso ajustado após pedido
- Total do pedido mostra diferença quando ajustado

## ARQUIVOS DE REFERÊNCIA

- Backup completo: /home/z/my-project/download/BACKUP_PADARIA_PAULA_V1.md
```

---

## INFORMAÇÕES DO BACKUP

**Nome do Backup:** `BACKUP_PADARIA_PAULA_V1`  
**Localização:** `/home/z/my-project/download/BACKUP_PADARIA_PAULA_V1.md`  
**Prompt Executável:** `/home/z/my-project/download/PROMPT_PADARIA_PAULA.md`

Para restaurar esta versão, basta ler o arquivo de backup e seguir as especificações contidas nele.
