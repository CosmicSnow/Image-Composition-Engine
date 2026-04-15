# Migration to SQLite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o projeto de MySQL para SQLite local, atualizar para Node LTS 20.x, e reorganizar diretórios de saída para ./dist/

**Architecture:** Substituir configuração Sequelize de MySQL para SQLite, atualizar caminhos de arquivos nos serviços, mantendo comportamento intacto

**Tech Stack:** Moleculer, Sequelize, SQLite3

---

### Task 1: Atualizar package.json para Node LTS 20.x

**Files:**
- Modify: `package.json:49-51`

- [ ] **Step 1: Atualizar engines**

```json
"engines": {
  "node": ">= 20.x"
}
```

- [ ] **Step 2: Remover dependência mysql2 (não mais necessária)**

Execute: Remover `"mysql2": "^2.2.5"` das dependencies no package.json

---

### Task 2: Atualizar db.mixin.js para SQLite

**Files:**
- Modify: `mixins/db.mixin.js:18-28`

- [ ] **Step 1: Atualizar configuração do Sequelize para SQLite**

```javascript
settings: {
  force: true,
  sequelize: new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "../dist/data/chimera.db"),
    storageOptions: {
      mode: SQLite3.OPEN_READWRITE | SQLite3.OPEN_CREATE
    },
    logging: false
  })
},
```

- [ ] **Step 2: Adicionar require do path**

Adicionar no topo do arquivo:
```javascript
const path = require("path");
const SQLite3 = require("sqlite3");
```

- [ ] **Step 3: Remover dialect: mysql e configurações de pool**

Remover `host`, `dialect: "mysql"`, e `pool` - SQLite não usa essas configurações

---

### Task 3: Criar diretórios dist/

**Files:**
- Create: `dist/data/`
- Create: `dist/numbers/`
- Create: `dist/output/`

- [ ] **Step 1: Criar estrutura de diretórios**

```bash
mkdir -p dist/data dist/numbers dist/output
```

---

### Task 4: Atualizar imagery.service.js para novos caminhos

**Files:**
- Modify: `services/imagery.service.js:12-16`

- [ ] **Step 1: Atualizar constantes de diretório**

```javascript
const dir = "./assets/";
const fontsDir = "./fonts/";
const distNumbers = "./dist/numbers/";
const distOutput = "./dist/output/";
```

- [ ] **Step 2: Atualizar referência allNumbersDir**

Trocar `const allNumbersDir = "../allNumbers";` para `const allNumbersDir = distNumbers;`

- [ ] **Step 3: Atualizar caminhos nos actions**

No action `createNumberImage` (linha ~249):
- Trocar `${allNumbersDir}/${dbNumber.number}.png` por `${distNumbers}${dbNumber.number}.png`

No action `createImage` (linha ~316-320):
- Atualizar para usar `distNumbers` e `distOutput`

No action `createImage` (linha ~324):
- Trocar `${dist}/Connected Star - ${imageName}.png` por `${distOutput}Connected Star - ${imageName}.png`

No action `createTextDetails` (linha ~462):
- Atualizar caminho de saída para `./dist/output/`

---

### Task 5: Verificar funcionamento

**Files:**
- Test: `package.json:6-7`

- [ ] **Step 1: Testar desenvolvimento**

```bash
npm run dev
```

- [ ] **Step 2: Verificar logs de inicialização**

Esperado: "Database opened successfully" ou similar do SQLite

- [ ] **Step 3: Testar criação de números**

Executar no REPL: `ctx.call("numberTable.insertNumbers", {first: 1, last: 10})`

---

### Task 6: Commit das mudanças

**Files:**
- Commit: todas as mudanças

- [ ] **Step 1: Adicionar e commitar**

```bash
git add package.json mixins/db.mixin.js services/imagery.service.js
git commit -m "refactor: migrate from MySQL to SQLite, update to Node 20.x"
```
