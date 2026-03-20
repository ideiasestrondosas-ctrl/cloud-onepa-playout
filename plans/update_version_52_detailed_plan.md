# Plano Detalhado: Atualização para v2.6.0-ALPHA.52-PRO

## Objetivo
Atualizar a versão da aplicação de **v2.6.0-ALPHA.51-PRO** para **v2.6.0-ALPHA.52-PRO** com data de lançamento **2026-03-20** em todos os locais da aplicação.

---

## 📋 Locais que Necesitam Atualização

### 1. Base de Dados
- **Local:** PostgreSQL (tabela `settings`)
- **Atualização:** `UPDATE settings SET system_version = 'v2.6.0-ALPHA.52-PRO', release_date = '2026-03-20' WHERE id = TRUE;`

### 2. Backend (Rust)
- **Ficheiro:** `backend/src/api/settings.rs`
- **Linha:** 91
- **Atualização:** `system_version: Some("v2.6.0-ALPHA.52-PRO".to_string())`

### 3. Frontend - API Service
- **Ficheiro:** `frontend/src/services/api.js`
- **Linha:** 4
- **Atualização:** `export const APP_VERSION_FALLBACK = 'v2.6.0-ALPHA.52-PRO';`

### 4. Frontend - Constants
- **Ficheiro:** `frontend/src/constants/settingsConfig.js`
- **Linha:** 45
- **Atualização:** `export const APP_VERSION_FALLBACK = 'v2.6.0-ALPHA.52-PRO';`

### 5. Frontend - Main Entry
- **Ficheiro:** `frontend/src/main.jsx`
- **Linha:** 100
- **Atualização:** `'🚀 Cloud Onepa Playout — v2.6.0-ALPHA.52-PRO booting...'`

---

## 🔄 Passos de Execução

### Passo 1: Criar Backup
Antes de qualquer alteração, criar backup dos ficheiros:
```bash
cp backend/src/api/settings.rs backend/src/api/settings.rs.backup
cp frontend/src/services/api.js frontend/src/services/api.js.backup
cp frontend/src/constants/settingsConfig.js frontend/src/constants/settingsConfig.js.backup
cp frontend/src/main.jsx frontend/src/main.jsx.backup
```

### Passo 2: Atualizar Base de Dados
Executar comando SQL na base de dados PostgreSQL:
```sql
UPDATE settings SET system_version = 'v2.6.0-ALPHA.52-PRO', release_date = '2026-03-20' WHERE id = TRUE;
```

### Passo 3: Atualizar Ficheiros (4 ficheiros)
- `backend/src/api/settings.rs`
- `frontend/src/services/api.js`
- `frontend/src/constants/settingsConfig.js`
- `frontend/src/main.jsx`

### Passo 4: Validar
- Verificar que a versão aparece corretamente na interface
- Confirmar que não há erros de syntax

---

## ⏭️ Próximos Passos (após aprovação)
1. Criar backup dos ficheiros
2. Executar atualização na base de dados
3. Atualizar os 4 ficheiros
4. Validar as alterações
