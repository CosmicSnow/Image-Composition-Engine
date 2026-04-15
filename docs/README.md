# Image Composition Engine

Documentação completa do projeto Image Composition Engine - um sistema de geração de imagens baseado em composição de camadas, construído com framework Moleculer (microservices).

---

## 1. Visão Geral do Projeto

O **Chimera** é um motor de composição de imagens que gera imagens únicas através da combinação de múltiplas camadas de assets (fundos, elementos, olhos, bocas, etc.). O sistema:

- Lê assets de camadas do diretório `./assets/`
- Gera combinações únicas de imagens
- Cria conexões entre imagens (cada imagem tem até 4 conexões)
- Compõe imagens finais usando a biblioteca `sharp`
- Gera imagens de números para identificação
- Armazena metadados em banco de dados MySQL via Sequelize

---

## 2. Arquitetura

### 2.1 Stack Tecnológico

| Componente | Tecnologia |
|------------|------------|
| Framework | Moleculer (microservices) |
| Banco de Dados | MySQL com Sequelize ORM |
| Processamento de Imagens | Sharp + Jimp |
| Linguagem | Node.js |

### 2.2 Estrutura de Diretórios

```
/image-composition-engine
├── assets/              # Assets de imagens por camada
│   ├── 0/              # Backgrounds (bg0.png - bg9.png)
│   ├── 1/              # Primeiro elemento (a0.png, a1.png)
│   ├── 2/              # Estrelas (s0.png - s9.png)
│   ├── 3/              # Olhos (e0.png - e9.png)
│   ├── 4/              # Boca (m0.png, m1.png)
│   └── 5/              # Outro elemento (b0.png)
├── fonts/              # Imagens de dígitos (0.png - 9.png)
├── services/            # Serviços Moleculer
│   ├── imagery.service.js
│   └── numberTable.service.js
├── mixins/              # Mixins compartilhados
│   └── db.mixin.js
├── libs/               # Bibliotecas auxiliares
├── moleculer.config.js # Configuração do broker
├── env.config.js       # Variáveis de ambiente
└── package.json
```

---

## 3. Estrutura de Assets

O sistema utiliza 5 camadas de assets na pasta `assets/`:

| Camada | Pasta | Arquivos | Descrição |
|--------|-------|----------|-----------|
| 0 | `assets/0/` | bg0.png - bg9.png | Fundos coloridos |
| 1 | `assets/1/` | a0.png, a1.png | Elemento binário |
| 2 | `assets/2/` | s0.png - s9.png | Estrelas coloridas |
| 3 | `assets/3/` | e0.png - e9.png | Olhos diversos |
| 4 | `assets/4/` | m0.png, m1.png | Boca binária |
| 5 | `assets/5/` | b0.png | Outro elemento |

**Cálculo de combinações:** Se cada camada tem N arquivos, o número total de combinações únicas é:
```
Total = N1 × N2 × N3 × N4 × N5 × N6
```

---

## 4. Modelo de Dados

### 4.1 Tabela `imagery`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER (PK) | ID único da imagem |
| combination | STRING (PK) | String com nomes dos arquivos separados por vírgula |
| con1 | INTEGER | ID da 1ª conexão |
| con2 | INTEGER | ID da 2ª conexão |
| con3 | INTEGER | ID da 3ª conexão |
| con4 | INTEGER | ID da 4ª conexão |
| processed | INTEGER | Status: 0=pendente, 1=processando, 2=concluído |

### 4.2 Tabela `numberTable`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER (PK) | Auto-incremento |
| number | INTEGER (PK) | Número a ser renderizado |
| processed | INTEGER | Status: 0=pendente, 1=processando, 2=concluído |

---

## 5. Serviços Moleculer

### 5.1 Imagery Service

Serviço principal que gerencia a composição de imagens.

#### Actions:

**`imagery.readAssets`**
- Escaneia a pasta `./assets/` e gera todas as combinações possíveis
- Cria conexões aleatórias entre imagens (cada imagem conecta com até 4 outras)
- Insere os dados no banco de dados

**`imagery.orderNumber`**
- Action recursivo que processa números sequencialmente
- Chama `createNumberImage` para cada número

**`imagery.createNumberImage`**
- Renderiza um número em imagem PNG usando fonts digitais
- Salva em `../allNumbers/{numero}.png`

**`imagery.orderCreateImages`**
- Processa imagens sequencialmente chamando `createImage`

**`imagery.createImage`**
- Compõe a imagem final usando Sharp
- Posiciona a imagem principal e as imagens de conexão
- Salva em `../dist/Connected Star - {numero}.png`

**`imagery.createTextDetails`**
- Gera arquivos .txt com metadados das imagens
- Traduz nomes de arquivos em descrições textuais

**`imagery.mixCombinations`**
- Embaralha as combinações existentes no banco de dados

#### Methods:

| Método | Descrição |
|--------|-----------|
| `product(elements)` | Gera produto cartesiano de arrays |
| `getRandomInt(min, max)` | Gera inteiro aleatório |
| `getNullCon(target)` | Encontra primeiro campo de conexão vazio |
| `removeSpecificNumberFromArray` | Remove elemento do array |
| `makeFourDigits(number)` | Formata número com 4 dígitos (ex: 1 → "0001") |
| `countSpacingX(number)` | Calcula espaçamento entre dígitos |
| `sleep(ms)` | Promessa de delay |

### 5.2 Number Table Service

Serviço auxiliar para gerenciar números.

#### Actions:

**`numberTable.insertNumbers`**
- Insere números no banco de dados
- Params: `first`, `last` (número inicial e final)

**`numberTable.findOneByProcessed`**
- Encontra primeiro registro não processado

---

## 6. Fluxo de Execução

### 6.1 Inicialização do Banco

```javascript
// 1. Ler assets e gerar combinações
await ctx.call("imagery.readAssets");

// 2. Inserir números (ex: 1 a 4000)
await ctx.call("numberTable.insertNumbers", { first: 1, last: 4000 });
```

### 6.2 Geração de Imagens de Números

```javascript
// Processa todos os números
await ctx.call("imagery.orderNumber", { initialNumber: 1 });
```

### 6.3 Geração de Imagens Finais

```javascript
// Processa todas as combinações
await ctx.call("imagery.orderCreateImages", { initialNumber: 1 });
```

### 6.4 Geração de Metadados

```javascript
// Gera arquivos de texto com descrições
await ctx.call("imagery.createTextDetails");
```

---

## 7. Configuração

### 7.1 Variáveis de Ambiente

Arquivo `env.config.js`:

```javascript
module.exports = {
    nats: process.env["NATS"] || "nats://localhost:4222",
    database: {
        database: process.env["DB"],
        url: process.env["DB_URL"],
        user: process.env["DB_USER"],
        password: process.env["DB_PASSWORD"]
    },
    jwt: {
        pass: "Im4Fp@sswordFishBY!23#x"
    }
};
```

### 7.2 Moleculer Config

Arquivo `moleculer.config.js`:
- Namespace: `chimera`
- NodeID: `chimera`
- Cacher: Memory
- Serializer: JSON
- Bulkhead: enabled (concurrency: 10, maxQueueSize: 100)

---

## 8. Comandos npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia em modo desenvolvimento com hot-reload |
| `npm run start` | Inicia produção |
| `npm run cli` | Conecta ao CLI do Moleculer |
| `npm run test` | Executa testes com Jest |
| `npm run lint` | Executa ESLint |
| `npm run dc:up` | Sobe containers Docker |
| `npm run dc:down` | Para containers Docker |

---

## 9. Detalhes de Processamento

### 9.1 Composição de Imagem

O sistema compõe a imagem final posicionando:
- Imagem principal na posição base
- Número principal em `(550, 100)`
- Conexão 1 em `(7850, 5500)`
- Conexão 2 em `(7850, 6700)`
- Conexão 3 em `(7850, 7900)`
- Conexão 4 em `(7850, 9100)`

### 9.2 Mapeamento de Atributos

O `createTextDetails` traduz nomes de arquivos em descrições:

| Arquivo | Descrição |
|---------|-----------|
| bg0.png | black |
| bg1.png | orange |
| a0.png | no (shooting star) |
| s0.png | yellow (star) |
| e0.png | line black (eyes) |
| m0.png | no (mouth) |

---

## 10. Instalação e Execução

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev

# No CLI do Moleculer:
call imagery.readAssets
call numberTable.insertNumbers --first 1 --last 4000
call imagery.orderNumber --initialNumber 1
call imagery.orderCreateImages --initialNumber 1
call imagery.createTextDetails
```

---

## 11. Dependências Principais

| Pacote | Versão | Uso |
|--------|--------|-----|
| moleculer | 0.14.13 | Framework microservices |
| moleculer-sequelize | 0.6.5 | Adapter Sequelize |
| sharp | 0.29.0 | Processamento de imagens |
| jimp | 0.16.1 | Processamento de imagens (fonts) |
| sequelize | 6.3.5 | ORM banco de dados |
| mysql2 | 2.2.5 | Driver MySQL |

---

## 12. Considerações Finais

- O sistema utiliza bulkhead para limitar concorrência (max 10 execuções simultâneas)
- Números e imagens são processados recursivamente com delays aleatórios
- O campo `processed` controla o estado: 0=pendente, 1=processando, 2=concluído
- Conexões entre imagens são criadas aleatoriamente na fase de inicialização
- Imagens finais são salvas em formato PNG na pasta `../dist/`
