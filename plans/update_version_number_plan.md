# Plano de Atualização do Número de Versão

## Objetivo
Atualizar a versão de **v2.6.0-ALPHA.50-PRO** para **v2.6.0-ALPHA.51-PRO** em todos os locais da aplicação.

## Locais a Atualizar

### 1. Base de Dados (Nova Migração)
- Criar nova migração SQL para atualizar a versão na base de dados
- Ficheiro: `backend/migrations/087_update_version_to_alpha51_pro.sql`

### 2. Backend (Rust)
- `backend/src/api/settings.rs` (linhas 91-92)
- Atualizar: system_version = "v2.6.0-ALPHA.51-PRO"
- Atualizar: release_date = "2026-03-20"

### 3. Frontend - Constants
- `frontend/src/services/api.js` (linha 4)
- `frontend/src/constants/settingsConfig.js` (linhas 45-46)
- Atualizar: APP_VERSION_FALLBACK = 'v2.6.0-ALPHA.51-PRO'
- Atualizar: APP_RELEASE_DATE_FALLBACK = '2026-03-20'

### 4. Frontend - Código
- `frontend/src/main.jsx` (linha 100)
- Atualizar: console.log version string

## Procedimento

### Passo 1: Backup
- Criar backup dos ficheiros a modificar

### Passo 2: Criar Migração SQL
- Criar `backend/migrations/087_update_version_to_alpha51_pro.sql`

### Passo 3: Atualizar Backend
- Atualizar `backend/src/api/settings.rs`

### Passo 4: Atualizar Frontend Constants
- Atualizar `frontend/src/services/api.js`
- Atualizar `frontend/src/constants/settingsConfig.js`

### Passo 5: Atualizar Frontend Code
- Atualizar `frontend/src/main.jsx`

### Passo 6: Executar Migração na BD
- Executar a migração SQL no banco de dados

### Passo 7: Validar
- Verificar que a versão aparece corretamente na UI

## Data Prevista
2026-03-20
