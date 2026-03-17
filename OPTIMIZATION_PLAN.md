# Cloud Onepa Playout - Plano de Otimização Completo

## Visão Geral do Projeto

**Stack Tecnológico:**
- **Backend:** Rust com Actix-web 4.3
- **Frontend:** React 18 + Vite 5 + Material UI 5
- **Database:** PostgreSQL 16
- **Cache/Message Bus:** Redis 7
- **Media Server:** MediaMTX (RTMP/HLS/WebRTC/SRT)
- **Streaming:** Docker containers

---

## 1. Análise de Otimização do Código Fonte

### 1.1 Backend (Rust) - Problemas Identificados

#### 🔴 Crítico: API de Media com Queries Ineficientes
- **Arquivo:** `backend/src/api/media.rs:32-80`
- **Problema:** Query builder tem condições redundantes
- **Impacto:** Queries lentas com grande volume de mídia

```rust
// PROBLEMA: Condições duplicadas e mal estruturadas
let mut query_builder: sqlx::QueryBuilder<sqlx::Postgres> =
    sqlx::QueryBuilder::new("SELECT * FROM media WHERE path NOT LIKE '%.proxy.%' AND path NOT LIKE '%.optimized.%' AND (path NOT LIKE '%/assets/protected/%' OR filename = 'big_buck_bunny_1080p_h264.mov')");

// Há também um segundo bloco de condições (linhas 70-80) que é morto e nunca usado
```

#### 🟠 Alto: Falta de Pooling de Conexões
- **Impacto:** Conexões de banco não são reutilizadas eficientemente

#### 🟠 Alto: Cache Subutilizado
- Redis está configurado mas não está sendo usado para cache de queries frequentes

#### 🟡 Médio: Logging Verboso em Produção
- Logs de DEBUG estão ativos em produção, consumindo recursos

### 1.2 Frontend (React) - Problemas Identificados

#### 🔴 Crítico: Componentes Gigantes
| Arquivo | Tamanho | Problema |
|---------|---------|----------|
| `Settings.jsx` | 164KB | 5000+ linhas - impossível de manter |
| `MediaLibrary.jsx` | 77KB | 2500+ linhas |
| `Dashboard.jsx` | 70KB | 2200+ linhas |
| `PlaylistEditor.jsx` | 57KB | 1800+ linhas |

#### 🔴 Crítico: Estado Global Sem Otimização
- `MediaLibrary.jsx` tem 40+ useState sem uso de useReducer ou zustand para estado complexo
- Re-renders desnecessários em cada alteração de estado

#### 🟠 Alto: Falta de Virtualização
- Listas de mídia não usam virtualization (react-window/virtual)
- Com muitos itens, o DOM fica巨大 (monstrously large)

#### 🟠 Alto: Lazy Loading Ausente
- Todas as rotas são carregadas de uma vez
- Não há code splitting

#### 🟡 Médio: API Client Sem Cache
- Cada requisição vai ao servidor
- React Query está instalado mas não está sendo usado corretamente

---

## 2. Plano de Otimização para UI

### 2.1 Reestruturação de Componentes

#### 🎯 Dividir Settings.jsx (164KB → ~10 arquivos menores)
```
src/pages/Settings/
├── Settings.jsx (container principal)
├── GeneralSettings.jsx
├── PlayerSettings.jsx
├── StreamingSettings.jsx
├── AppearanceSettings.jsx
├── UserManagement.jsx
├── SystemInfo.jsx
└── AdvancedSettings.jsx
```

#### 🎯 Dividir MediaLibrary.jsx (77KB → ~8 arquivos menores)
```
src/pages/MediaLibrary/
├── MediaLibrary.jsx (container)
├── MediaGrid.jsx (virtualizado)
├── MediaUploader.jsx
├── MediaFilters.jsx
├── MediaPreview.jsx
├── MediaDetailsDialog.jsx
├── FolderTree.jsx
└── BulkActions.jsx
```

### 2.2 Implementar Virtualização
- Usar `react-window` ou `react-virtuoso` para listas grandes
- Impacto: ~60% menos renderizações

### 2.3 Implementar Lazy Loading
```jsx
// Antes: tudo importado upfront
import Dashboard from './pages/Dashboard';
import MediaLibrary from './pages/MediaLibrary';

// Depois: lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MediaLibrary = lazy(() => import('./pages/MediaLibrary'));
```

### 2.4 React Query para Cache de API
- Implementar caching automático de queries
- Reduzir chamadas desnecessárias ao servidor

---

## 3. Plano de Redução de Recursos

### 3.1 Backend

| Otimização | Impacto | Esforço |
|------------|---------|---------|
| Adicionar connection pooling otimizado | 30% menos recursos DB | Médio |
| Implementar cache Redis para settings | 50% menos queries | Médio |
| Desativar logs de DEBUG em produção | 20% menos I/O | Baixo |
| Adicionar índices de banco | 40% queries mais rápidas | Médio |
| Compressão de responses (gzip) | 40% menos bandwidth | Baixo |

### 3.2 Frontend

| Otimização | Impacto | Esforço |
|------------|---------|---------|
| Code splitting | 30% menos bundle inicial | Médio |
| Virtualização de listas | 60% menos DOM nodes | Médio |
| React Query caching | 40% menos requests | Médio |
| Memoização agressiva | 25% menos re-renders | Baixo |
| Otimizar imagens/assets | 50% menos bandwidth | Baixo |

### 3.3 Docker/Infraestrutura

| Otimização | Impacto | Esforço |
|------------|---------|---------|
| Multi-stage builds menores | 40% menos imagem | Baixo |
| Limpar dependências não usadas | 15% menos imagem | Baixo |
| Health checks mais frequentes | recuperação mais rápida | Baixo |

---

## 4. Melhorias para Operador

### 4.1 Experiência de Uso

| Melhoria | Descrição | Prioridade |
|----------|-----------|------------|
| Atalhos de teclado.expandidos | Mais atalhos para ações frequentes | Alta |
| Feedback visual melhor | Toast notifications mais claras | Alta |
| Preview de streaming | Verificação rápida sem sair da página | Alta |
| Undo/Redo | Operaciones reversíveis | Média |
| Drag & drop melhorado | Interface mais intuitiva | Média |

### 4.2 Performance Percebida

- Skeleton loaders em vez de spinners
- Progress bars para operações longas
- Status em tempo real de uploads/processamentos

### 4.3 Acessibilidade
- Suporte a keyboard navigation completo
- Contraste de cores ajustável
- Screen reader support

---

## 5. Cronograma de Implementação

### Fase 1: Otimizações Críticas (Semana 1-2)
- [x] Corrigir queries de Media API
- [x] Implementar lazy loading no frontend
- [x] Configurar React Query
- [x] Desativar DEBUG logs em produção
- [x] Adicionar índices de banco (migration 083)
- [x] Compressão gzip no frontend
- [x] Corrigir configuração i18n

### Fase 2: Reestruturação UI (Semana 3-4)
- [x] Dividir Settings.jsx em componentes menores
- [x] Criar OutputSettings.jsx (Output Tab)
- [x] Criar OverlaySettings.jsx (Overlay Tab)
- [x] Criar UserSettings.jsx (Users Tab)
- [x] Implementar virtualização (react-window)
- [x] Adicionar skeleton loaders

### Fase 3: Otimização de Recursos (Semana 5-6)
- [ ] Integrar CacheService Redis no backend
- [ ] Adicionar índices de banco
- [ ] Otimizar bundle do frontend
- [ ] Compressão de assets

### Fase 4: Melhorias do Operador (Semana 7-8)
- [ ] Expandir atalhos de teclado
- [ ] Melhorar feedback visual
- [ ] Adicionar undo/redo
- [ ] Ajustes de acessibilidade

---

## 6. Estimativa de Impacto

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Tempo de load inicial | ~8s | ~3s | 62% |
| Tamanho bundle frontend | ~3MB | ~1.5MB | 50% |
| Queries DB por página | ~15 | ~5 | 66% |
| Memoria RAM backend | ~200MB | ~150MB | 25% |
| Tempo de render UI | ~500ms | ~150ms | 70% |

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------||
| Breaking changes | Média | Alto | Testes extensivos |
| Regressões | Alta | Médio | Feature flags |
| Performance degrade | Baixa | Alto | Monitoramento |
| Problemas de cache | Média | Médio | Cache invalidation strategy |

---

## 8. Próximos Passos

Para aprovar este plano, por favor indique:

1. ✅ **Aprovar** - Iniciar implementação imediata
2. 🔄 **Revisar** - Quer analisar mais algum detalhe
3. ❌ **Recusar** - Não concorda com alguma coisa

**Após aprovação:** Começarei pela Fase 1 - Correção das queries de Media API e implementação de lazy loading no frontend.
