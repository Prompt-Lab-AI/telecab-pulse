
# Nova Aba: Acompanhamento Entrega Vendedores

## O que sera criado

Uma nova aba no dashboard chamada **"Vendedores"** que mostra, para cada vendedor (PAP), o resumo do mes: vendas realizadas, cancelamentos e performance individual.

## Estrutura da tela

### 1) KPIs no topo (4 cards)
- **Total de Vendedores** ativos no periodo
- **Total Vendas Validas** no mes
- **Total Cancelamentos** no mes
- **Taxa de Cancelamento Geral** (%)

### 2) Grafico de barras comparativo
- Barras agrupadas por vendedor mostrando: Vendas Validas vs Cancelamentos
- Permite comparar visualmente a performance de cada PAP

### 3) Cards individuais por vendedor
Cada vendedor tera um card contendo:
- Nome do PAP
- Vendas validas no mes (com icone verde)
- Cancelamentos no mes (com icone vermelho)
- Ticket medio individual
- MRR individual
- Indicador visual de performance (bom/atencao/critico)

### 4) Tabela detalhada
Tabela com todas as vendas do periodo, agrupavel por vendedor, com colunas:
- PAP, Cliente, Produto, Cidade, Data Venda, Status, Valor Mensal

## Detalhes tecnicos

### Arquivo novo
- `src/components/dashboard/VendedoresPanel.tsx` — componente completo da aba

### Arquivo modificado
- `src/pages/Index.tsx` — adicionar nova aba "Vendedores" no TabsList e TabsContent, importar o componente, passar `filteredBase` como prop

### Dados utilizados
- Fonte: `filteredBase` (BASE_UNICA ja filtrada pelos filtros globais de mes/cidade/produto/status)
- Vendas validas: `isVendaValida()` do analytics.ts
- Cancelamentos: `isCancelamento90d()` do analytics.ts
- Contratos ativos: `isContratoAtivo()` do analytics.ts
- Valores: `parseCurrency()` do sheets.ts

### Filtros
- Responde aos filtros globais ja existentes (mes, PAP, cidade, produto, status)
- Filtro local de busca por nome do vendedor dentro da aba

### Bibliotecas
- Recharts (ja instalado) para graficos
- Lucide icons (ja instalado) para icones
- Componentes UI existentes (Card, Badge, Table)
