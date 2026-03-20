# Plano de Atualização para v2.6.0-ALPHA.52-PRO

## Objetivo
Atualizar a versão de v2.6.0-ALPHA.51-PRO para v2.6.0-ALPHA.52-PRO em todos os locais da aplicação.

## Locais a Atualizar

### 1. Base de Dados
- Executar UPDATE para alterar version e release_date

### 2. Backend (Rust)
- backend/src/api/settings.rs

### 3. Frontend Constants
- frontend/src/services/api.js
- frontend/src/constants/settingsConfig.js

### 4. Frontend Code
- frontend/src/main.jsx

## Procedimento

### Passo 1: Atualizar Base de Dados
- UPDATE settings SET system_version = 'v2.6.0-ALPHA.52-PRO', release_date = '2026-03-20'

### Passo 2: Atualizar Backend
- settings.rs

### Passo 3: Atualizar Frontend
- api.js
- settingsConfig.js
- main.jsx

### Passo 4: Validar
- Verificar que a versão aparece corretamente
