# Plano de Integração - Opção C
## Graphics Editor > Templates Tab - Integração Completa

### Objetivo
Integrar todas as funcionalidades da página /templates dentro da tab do Graphics Editor.

### Análise da Página /templates (Funcionalidades a Integrar)

1. **Preset Templates**
   - Morning Show (6 horas)
   - Full Day (24 horas)
   - Loop Content (24 horas)

2. **CRUD de Templates**
   - Criar novo template
   - Editar template existente
   - Eliminar template

3. **Estrutura de Blocos**
   - Intro block
   - Content block
   - Commercial block
   - Outro block
   - Filler block

4. **Geração de Playlist**
   - Selecionar template
   - Definir nome da playlist
   - Definir data de emissão
   - Gerar playlist automaticamente

### Locais a Modificar

1. **frontend/src/pages/GraphicsEditor.jsx**
   - Templates tab (activeTab === 3)
   - Adicionar estado para managing templates
   - Adicionar diálogos de create/edit
   - Adicionar diálogo de generate playlist

2. **Traduções** (se necessário)
   - PT, EN, FR, ES

### Procedimento

#### Passo 1: Backup
- Backup GraphicsEditor.jsx
- Backup traduções (se necessário)

#### Passo 2: Análise Detalhada
- Ler o código completo de Templates.jsx
- Identificar componentes a reutilizar

#### Passo 3: Implementação
- Adicionar estados necessários
- Adicionar funções CRUD
- Adicionar diálogos
- Estilizar para caber no painel

#### Passo 4: Testes
- Verificar se compila
- Verificar se funciona

---

## Novo Histórico de Versões (v2.6.0-ALPHA.52-PRO)

Adicionar à versão:
- Graphics: Integração completa da página Templates na tab do Graphics Editor

---

**Complexidade:** Média-Alta
**Tempo estimado:** 2-3 horas
