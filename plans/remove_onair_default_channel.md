# Plano: Remover "ON AIR" do Default Channel no Menu Multi-Canal

## Problema Reportado
No menu multi-canal, o default channel (canal principal) está a mostrar os indicadores "LIVE" e "ON AIR" como um artifact, quando deveria ser controlado apenas pelo Dashboard principal.

## Análise Técnica

### Localização do Código
O código está em [`frontend/src/components/MultiChannelPanel.jsx`](frontend/src/components/MultiChannelPanel.jsx):

1. **Badge "LIVE"** (linhas 419-438):
   ```jsx
   {isLive && (
       <Box sx={{ ... }}>
           <RecordIcon />
           <Typography>LIVE</Typography>
       </Box>
   )}
   ```

2. **Chip "ON AIR"** (linhas 470-477):
   ```jsx
   <Chip
       icon={chipCfg.icon}
       label={chipCfg.label}  // "ON AIR" for playing
       color={chipCfg.color}
   />
   ```

3. **Default Channel ID**: `00000000-0000-0000-0000-000000000001`

### Causa
O código mostra o status de playout para todos os canais, incluindo o default. O default channel é o canal principal que já tem o seu próprio Dashboard e não deveria mostrar status de "ON AIR" no menu multi-canal.

## Solução Proposta

Modificar o código para ocultar os indicadores "LIVE" e "ON AIR" para o default channel, pois ele é controlado separadamente.

### Alterações no [`frontend/src/components/MultiChannelPanel.jsx`](frontend/src/components/MultiChannelPanel.jsx)

1. Adicionar verificação se é o default channel
2. Ocultar o badge "LIVE" para o default channel
3. Ocultar o chip "ON AIR" para o default channel (ou mostrar como "MANAGED")

## Plano de Execução

### Passo 1: Modificar o código
- Adicionar constante para o ID do default channel
- Adicionar verificação `isDefaultChannel`
- Condicionar a exibição do badge "LIVE"
- Condicionar a exibição do chip de status

### Passo 2: Testar
- Verificar se o default channel não mostra mais "ON AIR" no menu multi-canal
- Verificar se os outros canais continuam a mostrar o status corretamente

## Ficheiros a Modificar
- `frontend/src/components/MultiChannelPanel.jsx`
