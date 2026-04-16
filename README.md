# Image Composition Engine

> Compositor de imagens baseado em Node.js + Moleculer + Sharp

## O que faz

Este software combina múltiplas camadas de imagens (como camadas do Photoshop) para criar composições únicas. Cada camada é sobreposta uma sobre a outra, criando imagens finais com transparência.

## Exemplos de Resultado

Aqui estão alguns exemplos de imagens geradas pelo sistema:

![Connected Star - 0001](./demo-material/Connected%20Star%20-%200001.png)

![Connected Star - 0195](./demo-material/Connected%20Star%20-%200195.png)

![Connected Star - 0362](./demo-material/Connected%20Star%20-%200362.png)

## Como funciona

### 1. Camadas de Imagens (Assets)

As imagens são organizadas em pastas numeradas (`assets/0/`, `assets/1/`, `assets/2/`, etc.). Cada pasta representa uma camada:

- `assets/0/` - Background (imagem base)
- `assets/1/` - Primeira camada sobreposta
- `assets/2/` - Segunda camada sobreposta
- E assim por diante...

**Importante:** Todas as imagens devem ter **transparência (PNG)** para que a sobreposição funcione corretamente. O software combina qualquer imagem com transparência, permitindo infinitas possibilidades de criação.

### 2. Sistema de Combinações

O `readAssets` varre todas as pastas e cria todas as combinações possíveis no banco de dados. Cada combinação é única e não se repete.

### 3. Números

Os números são gerados automaticamente a partir de fontes PNG (na pasta `fonts/`). Cada dígito (0-9) é uma imagem separada, e o software compõe os números automaticamente.

Você pode usar suas próprias fontes basta colocar imagens PNG de 0-9 na pasta `fonts/`.

### 4. Resolução

- **Imagens atuais:** 10000 x 10000 px (10K)
- **Alta resolução:** O software consegue lidar com imagens de grande resolução
- **Nota:** Com resoluções menores, o tempo de processamento é significativamente menor

### 5. Formato das Imagens

As imagens não precisam ser quadradas, mas **recomenda-se que todas as camadas tenham a mesma resolução**. Caso contrário, a imagem final pode ter comportamentos inesperados (imagens fora de posição, cortadas, etc.).

##安装

```bash
npm install
```

## Modo REPL (terminal interativo)

```bash
npm run dev
```

## Comandos Rápidos

```bash
# Popular banco com combinações
mol $ call imagery.readAssets

# Criar imagens sem números
mol $ call imagery.createImage '{"count": 1}'

# Criar imagens com números
mol $ call imagery.createImageWithNumbers '{"count": 1}'

# Redimensionar imagens (ex: 50% do tamanho)
mol $ call imagery.rescale '{"sourceDir": "./assets/", "outputDir": "./dist/output-scale/", "percentage": 50}'
```

## Estrutura

```
image-composition-engine/
├── assets/           # Imagens originais (layers)
│   ├── 0/           # Backgrounds
│   ├── 1/           # Letras
│   ├── 2/           # Formas
│   ├── 3/           # Efeitos
│   ├── 4/           # Magias
│   └── 5/           # Brilho
├── fonts/            # Números (0-9) - você pode trocar pelas suas fontes
├── demo-material/    # Exemplos de imagens geradas
├── dist/
│   ├── data/        # Banco SQLite
│   ├── numbers/     # Números gerados
│   └── output/      # Imagens finais
```

## Customização

Para criar suas próprias composições:

1. Coloque suas imagens PNG com transparência nas pastas `assets/0/`, `assets/1/`, etc.
2. Execute `readAssets` para gerar as combinações
3. Use `createImageWithNumbers` para gerar suas imagens

## Testes

```bash
node test/engine.test.js
```