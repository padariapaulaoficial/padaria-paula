# 🥖 Padaria Paula - Sistema de Gestão

Sistema completo para gerenciamento de pedidos, clientes, produtos e orçamentos para padarias.

---

## 📋 Requisitos

Antes de instalar, você precisa ter instalado:

1. **Node.js** (versão 18 ou superior)
   - Download: https://nodejs.org/
   - Escolha a versão LTS (recomendada)

2. **Bun** (gerenciador de pacotes rápido)
   - Após instalar o Node.js, abra o terminal e execute:
   ```bash
   npm install -g bun
   ```

---

## 🚀 Instalação Rápida

### Windows

1. **Extraia** o arquivo ZIP em uma pasta de sua preferência
2. **Clique duas vezes** no arquivo `iniciar-windows.bat`
3. **Aguarde** a instalação automática
4. **Acesse** http://localhost:3000 no navegador

### Linux / Mac

1. **Extraia** o arquivo ZIP
2. **Abra o terminal** na pasta extraída
3. **Execute**:
   ```bash
   chmod +x iniciar-linux.sh
   ./iniciar-linux.sh
   ```
4. **Acesse** http://localhost:3000 no navegador

---

## 🔐 Credenciais de Acesso

| Função | Senha |
|--------|-------|
| PIN dos Funcionários | `2026` |
| Senha do Administrador | `admin2026` |

⚠️ **Importante:** Altere essas senhas após o primeiro acesso nas configurações do sistema!

---

## 📱 Funcionalidades

### Para Funcionários
- ✅ Cadastrar clientes
- ✅ Criar novos pedidos
- ✅ Criar orçamentos
- ✅ Visualizar produtos
- ✅ Imprimir cupons térmicos

### Para Administradores
- ✅ Dashboard com estatísticas
- ✅ Gerenciar produtos
- ✅ Histórico de pedidos
- ✅ Histórico de orçamentos
- ✅ Relatório de entregas
- ✅ Backup e exportação Excel
- ✅ Configurações do sistema

---

## 🖨️ Impressão Térmica

O sistema suporta impressoras térmicas de cupom (80mm):
- Imprime cupom do cliente (com valores)
- Imprime cupom da cozinha (sem valores)

Para configurar:
1. Instale a impressora no computador
2. Configure como impressora padrão do navegador
3. O sistema detectará automaticamente

---

## 💾 Backup

O banco de dados fica armazenado em:
```
prisma/padaria.db
```

Para fazer backup:
1. Copie o arquivo `prisma/padaria.db`
2. Salve em local seguro (pen drive, nuvem, etc.)

---

## ❓ Problemas Comuns

### "Node.js não encontrado"
- Instale o Node.js: https://nodejs.org/

### "Bun não encontrado"
- Execute: `npm install -g bun`

### "Porta 3000 em uso"
- Feche outros programas que possam estar usando a porta
- Ou altere a porta no arquivo `package.json`

### "Erro no banco de dados"
- Execute novamente o script de inicialização
- Isso recriará o banco de dados

---

## 📞 Suporte

Este sistema foi desenvolvido especificamente para a Padaria e Confeitaria Paula.

---

## 📁 Estrutura de Arquivos

```
padaria-paula/
├── iniciar-windows.bat    ← Clique para iniciar (Windows)
├── iniciar-linux.sh       ← Execute para iniciar (Linux/Mac)
├── prisma/
│   └── padaria.db         ← Banco de dados (SQLite)
├── src/                   ← Código fonte
├── public/                ← Imagens e arquivos estáticos
└── package.json           ← Configurações do projeto
```

---

## ⚡ Atalhos do Sistema

| Tecla | Função |
|-------|--------|
| `ESC` | Voltar/Voltar ao menu |
| `Enter` | Confirmar ação |

---

**Desenvolvido com ❤️ para Padaria e Confeitaria Paula**
