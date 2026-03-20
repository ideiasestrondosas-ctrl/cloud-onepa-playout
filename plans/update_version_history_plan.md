# Plano de Atualização do Histórico de Versões

## Objetivo
Atualizar o histórico de versões da aplicação ALPHA com a nova versão **v2.6.0-ALPHA.51-PRO**.

## Alterações a Documentar
- Documentação: Adicionada documentação do menu Multi-Canal (PT/EN/FR/ES)
- Documentação: Adicionada documentação do menu Entradas ao Vivo (PT/EN/FR/ES)
- Documentação: Adicionada documentação do menu Saúde do Sistema (PT/EN/FR/ES)
- Correção: Componentes HelpSystem (HelpTemplates, HelpLiveInputs, HelpHealth, HelpMultiChannel)
- i18n: Sincronização dos 4 ficheiros de tradução (PT, EN, FR, ES)

## Ficheiros a Modificar

### 1. Translation Files (frontend/public/locales/{pt|en|fr|es}/translation.json)
Local: `settings.about.history.releases`
Ação: Adicionar nova entrada no início do array

### 2. RELEASE_HISTORY.json (backend/data/RELEASE_HISTORY.json)
Ação: Adicionar nova entrada no início do array

## Procedimento

### Passo 1: Criar Backup
- Criar backup dos ficheiros de tradução
- Criar backup do RELEASE_HISTORY.json

### Passo 2: Atualizar PT translation.json
- Adicionar entrada v2.6.0-ALPHA.51-PRO em settings.about.history.releases

### Passo 3: Atualizar EN translation.json
- Adicionar entrada v2.6.0-ALPHA.51-PRO em settings.about.history.releases

### Passo 4: Atualizar FR translation.json
- Adicionar entrada v2.6.0-ALPHA.51-PRO em settings.about.history.releases

### Passo 5: Atualizar ES translation.json
- Adicionar entrada v2.6.0-ALPHA.51-PRO em settings.about.history.releases

### Passo 6: Atualizar RELEASE_HISTORY.json
- Adicionar entrada v2.6.0-ALPHA.51-PRO no início do array

### Passo 7: Validar JSON
- Verificar que todos os ficheiros JSON são válidos

## Data Prevista
2026-03-20
