import React, { useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { Close as CloseIcon, Help as HelpIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useHelp } from '../context/HelpContext';
import ReactMarkdown from 'react-markdown';

// Hardcoded content for now - ideally fetched from backend serving .md files
const TESTING_GUIDE = `
# Guia de Testes

1. **Dashboard**: Verifique se o relógio está sincronizado.
2. **Playout**: Use o botão "Start" para iniciar a emissão.
3. **Library**: Carregue vídeos e verifique os thumbnails.
`;

const OPS_MANUAL = `
# Manual de Operações

**Arrancar Emissão:**
Certifique-se que tem uma playlist agendada para a hora atual.
Clique em START no Dashboard.

**Emergências:**
Se o vídeo parar, clique em STOP e depois START novamente.
`;

const HOW_TO_BROADCAST = `
# Como colocar o canal a correr passo a passo

1. **Media Library**: Faça upload dos seus vídeos.
2. **Playlists**: Crie uma playlist e adicione os vídeos carregados.
3. **Calendário**: Agende a sua playlist para o dia e hora desejados (ou defina como 'Daily' para repetir todos os dias).
4. **Dashboard**: Clique no botão **START**. 
   * A cor do indicador deve mudar para **ON AIR**.
   * O **Live Preview** começará a mostrar a emissão em alguns segundos.
5. **VLC**: Para ver externamente, use o endereço RTMP configurado (ex: \`rtmp://localhost:1935/stream\`).
`;

export default function HelpSystem() {
  const { helpMode, helpContent, closeHelp, showHelp } = useHelp();
  const [tabIndex, setTabIndex] = React.useState(0);

  // Global click listener for Help Mode - DISABLED per user request
  /*
  useEffect(() => {
    if (!helpMode) return;
    // ...
  }, [helpMode]);
  */

  // Cursor style - DISABLED
  /*
  useEffect(() => {
    if (helpMode) {
      document.body.style.cursor = 'help';
    } else {
      document.body.style.cursor = 'default';
    }
  }, [helpMode]);
  */

  return (
    <>
      {/* Help Mode Banner - DISABLED */}
      {/* helpMode && ( ... ) */}

      {/* Help Content Modal */}
      <Dialog open={!!helpContent} onClose={closeHelp} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {helpContent?.title || "Central de Ajuda"}
          <IconButton onClick={closeHelp}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            {helpContent?.content ? (
                 <Typography>{helpContent.content}</Typography>
            ) : (
                <Box>
                    <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
                        <Tab label="Como Emitir" />
                        <Tab label="Manual de Operações" />
                        <Tab label="Guia de Testes" />
                    </Tabs>
                    <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: '#1a1a1a', 
                        color: '#ffffff',
                        borderRadius: 1, 
                        minHeight: '300px',
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        <ReactMarkdown>
                            {tabIndex === 0 ? HOW_TO_BROADCAST : (tabIndex === 1 ? OPS_MANUAL : TESTING_GUIDE)}
                        </ReactMarkdown>
                    </Box>
                </Box>
            )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
            {helpMode && (
                <Button 
                    variant="outlined" 
                    color="warning" 
                    onClick={() => {
                        toggleHelpMode();
                        closeHelp();
                    }}
                >
                    Desativar Modo de Ajuda
                </Button>
            )}
            <Button onClick={closeHelp} variant="contained">Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
