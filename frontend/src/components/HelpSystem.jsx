import React from 'react';
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
  Tab,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
  Dashboard as DashboardIcon,
  LibraryMusic as LibraryIcon,
  QueueMusic as PlaylistIcon,
  CalendarMonth as CalendarIcon,
  Brush as GraphicsIcon,
  Settings as SettingsIcon,
  Tv as TvIcon,
  BugReport as BugIcon
} from '@mui/icons-material';
import { useHelp } from '../context/HelpContext';

const Section = ({ title, children, severity = null }) => (
  <Box sx={{ mb: 1.5 }}>
    {severity ? (
      <Alert severity={severity} sx={{ mb: 0.75, py: 0.3, '& .MuiAlert-message': { py: 0 } }}><strong>{title}</strong></Alert>
    ) : (
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5, borderBottom: '1px solid rgba(0,229,255,0.15)', pb: 0.3, fontSize: '0.8rem' }}>{title}</Typography>
    )}
    {children}
  </Box>
);

const Step = ({ n, text }) => (
  <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
    <Box sx={{ minWidth: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.6rem', flexShrink: 0 }}>{n}</Box>
    <Typography variant="caption" sx={{ pt: 0.2, lineHeight: 1.5 }}>{text}</Typography>
  </Box>
);

const Kv = ({ k, v }) => (
  <Box sx={{ display: 'flex', gap: 1, mb: 0.4 }}>
    <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', minWidth: 130, flexShrink: 0, fontSize: '0.65rem' }}>{k}</Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{v}</Typography>
  </Box>
);

// ─── TAB CONTENT ──────────────────────────────────────────────────────────────

const HelpDashboard = () => (
  <Box>
    <Section title="Dashboard — Centro de Comando">
      <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
        O Dashboard é a página principal de operação do playout. A partir daqui controla tudo o que acontece na emissão em tempo real.
      </Typography>
    </Section>

    <Section title="Indicador ON AIR / OFF AIR">
      <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
        No topo do Dashboard existe um indicador de estado da emissão:
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
        <Chip label="● ON AIR" sx={{ bgcolor: 'rgba(211,47,47,0.15)', color: '#f44336', fontWeight: 800, fontFamily: 'monospace' }} size="small" />
        <Typography variant="caption" sx={{ pt: 0.5, color: 'text.secondary' }}>Motor FFmpeg activo e a emitir</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
        <Chip label="◯ OFF AIR" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#555', fontWeight: 800, fontFamily: 'monospace' }} size="small" />
        <Typography variant="caption" sx={{ pt: 0.5, color: 'text.secondary' }}>Motor parado ou sem playlist</Typography>
      </Box>
    </Section>

    <Section title="Iniciar / Parar o Playout">
      <Step n="1" text="Verifique que tem uma playlist agendada para a hora actual no Calendário." />
      <Step n="2" text="Clique em INICIAR — o sistema valida automaticamente o agendamento antes de arrancar." />
      <Step n="3" text="Escolha os protocolos a activar (RTMP, SRT, UDP) e clique em 'Iniciar Engine'." />
      <Step n="4" text="O monitor de LIVE PREVIEW começa a mostrar a emissão após 6-10 segundos (tempo de HLS)." />
      <Step n="5" text="Para parar, clique em PARAR. Todos os protocolos são desligados automaticamente." />
      <Alert severity="warning" sx={{ mt: 0.75, py: 0.3, '& .MuiAlert-message': { py: 0 } }}>
        <Typography variant="caption">Se não houver playlist agendada, o playout não inicia. Configure o calendário primeiro.</Typography>
      </Alert>
    </Section>

    <Section title="Protocolos de Transmissão">
      <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
        Os protocolos aparecem como ícones compactos numa barra horizontal. Clicar num ícone liga ou desliga esse protocolo individualmente.
      </Typography>
      <Kv k="MASTER / HLS" v="Protocolo principal (só leitura). Activado automaticamente com o playout." />
      <Kv k="RTMP" v="Streaming para plataformas como YouTube, Facebook, Wowza. Porta 1935." />
      <Kv k="SRT" v="Protocolo de baixa latência para distribuição profissional. Porta 9000." />
      <Kv k="UDP" v="Transmissão multicast/unicast para redes locais e satélite." />
      <Kv k="DASH / MSS / RTSP / WebRTC" v="Protocolos adicionais — activar em Settings → Multi-streaming." />
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>🟢 Verde = Activo &nbsp;|&nbsp; ⚫ Cinza = Offline &nbsp;|&nbsp; 🟠 Laranja = Erro</Typography>
    </Section>

    <Section title="Monitor de Clips">
      <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
        Na zona central inferior estão o clip em reprodução e os próximos clips da lista.
      </Typography>
      <Kv k="CLIP EM REPRODUÇÃO" v="Nome do ficheiro, posição actual e duração com barra de progresso animada." />
      <Kv k="PRÓXIMOS NA LISTA" v="Os próximos clips com etiqueta SEGUE no primeiro da fila." />
      <Kv k="SKIP" v="Salta para o próximo clip imediatamente." />
    </Section>

    <Section title="Botão LOGS (Diagnóstico)">
      <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
        Abre um painel detalhado com o estado completo do sistema, actualizado automaticamente a cada 5 segundos:
      </Typography>
      <Kv k="Motor FFmpeg" v="Estado do processo (em execução / parado)" />
      <Kv k="Tempo de Emissão" v="Uptime do motor em HH:MM:SS" />
      <Kv k="Agendamento / Playlist" v="IDs e estado de validade" />
      <Kv k="Protocolos Activos" v="Lista compacta com chips coloridos" />
      <Kv k="Últimas Entradas de Log" v="Últimas 6 linhas do log do sistema" />
    </Section>
  </Box>
);

const HelpLibrary = () => (
  <Box>
    <Section title="Biblioteca de Media">
      <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
        Repositório central de todos os vídeos, áudios e outros conteúdos disponíveis para emissão.
      </Typography>
    </Section>

    <Section title="Carregar Vídeos">
      <Step n="1" text="Clique em UPLOAD ou arraste ficheiros para a área de drop." />
      <Step n="2" text="Formatos suportados: MP4, MOV, MKV, AVI, TS, MXF (H.264/H.265)." />
      <Step n="3" text="O sistema extrai automaticamente metadados (duração, resolução, codec)." />
      <Step n="4" text="Um thumbnail é gerado automaticamente a partir do frame central." />
      <Alert severity="info" sx={{ mt: 0.75, py: 0.3, '& .MuiAlert-message': { py: 0 } }}>
        <Typography variant="caption">Para volumes grandes, use o caminho NFS/NAS configurado em Settings → Caminhos. Os ficheiros não são copiados, apenas indexados.</Typography>
      </Alert>
    </Section>

    <Section title="Metadados & EPG">
      <Typography variant="caption" sx={{ mb: 0.75, color: 'text.secondary', display: 'block' }}>
        Cada clip pode ter metadados enriquecidos para o guia de programação (EPG):
      </Typography>
      <Kv k="Título" v="Nome do programa para o guia EPG" />
      <Kv k="Sinopse" v="Descrição curta do conteúdo" />
      <Kv k="Género" v="Categoria (Notícias, Entretenimento, Desporto, etc.)" />
      <Kv k="Classificação" v="Classificação etária do conteúdo" />
      <Kv k="Tipo de Media" v="Filler (preenchimento automático) ou conteúdo principal" />
    </Section>

    <Section title="Revisão Automática de Metadados">
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        O botão "REVER METADADOS" utiliza a API TVMaze para pesquisar automaticamente informação do programa com base no nome do ficheiro. Configure a chave API em Settings → Sistema → API Keys.
      </Typography>
    </Section>

    <Section title="Fillers (Preenchimento Automático)">
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        Marque um clip como "Filler" para que o motor o insira automaticamente quando houver lacunas na programação. Ideal para spots publicitários, jingles ou separadores.
      </Typography>
    </Section>
  </Box>
);

const HelpPlaylists = () => (
  <Box>
    <Section title="Editor de Playlists">
      <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
        As playlists são sequências de conteúdo que o motor de playout reproduz em ordem. São a base do agendamento.
      </Typography>
    </Section>

    <Section title="Criar uma Playlist">
      <Step n="1" text="Clique em NOVA PLAYLIST e dê um nome descritivo (ex: 'Segunda-feira Prime Time')." />
      <Step n="2" text="Use o painel da Biblioteca para arrastar clips para a playlist, ou clique em + para adicionar." />
      <Step n="3" text="Reordene os clips arrastando as linhas (handle ≡ no lado esquerdo)." />
      <Step n="4" text="A duração total é calculada automaticamente." />
      <Step n="5" text="Clique em GUARDAR. A playlist fica disponível para agendamento." />
    </Section>

    <Section title="Gestão da Playlist">
      <Kv k="Ordenação" v="Arraste e largue os clips para reordenar a sequência." />
      <Kv k="Remover Clip" v="Ícone de lixo ao lado de cada clip." />
      <Kv k="Duplicar Playlist" v="Botão de cópia para criar variantes rapidamente." />
      <Kv k="Duração Total" v="Mostrada no rodapé do editor. Útil para preencher slots de X horas." />
      <Kv k="Fillers" v="Clips marcados como filler são inseridos automaticamente para preencher a duração restante." />
    </Section>

    <Section title="Boas Práticas">
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
        • Crie playlists com duração próxima do slot agendado (ex: 4h para emissão de 4h).<br />
        • Adicione sempre alguns fillers no final para evitar emissão em negro.<br />
        • Nomeie as playlists com data e horário para facilitar a gestão (ex: "2026-02-18 Manhã").
      </Typography>
    </Section>
  </Box>
);

const HelpCalendar = () => (
  <Box>
    <Section title="Central de Agendamento (Calendário)">
      <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
        O calendário é onde se programa a emissão. Define quando cada playlist começa a ser transmitida.
      </Typography>
    </Section>

    <Section title="Agendar uma Playlist">
      <Step n="1" text="Clique num dia no calendário para abrir o diálogo de agendamento." />
      <Step n="2" text="Seleccione a playlist pretendida." />
      <Step n="3" text="Defina o horário de início (ex: 06:00)." />
      <Step n="4" text="Escolha o padrão de repetição: Nenhum, Diário, Semanal ou Mensal." />
      <Step n="5" text="Clique em GUARDAR. O evento aparece no calendário com a cor correspondente." />
    </Section>

    <Section title="Tipos de Agendamento">
      <Kv k="Agendamento Único (rosa)" v="Playlist emite apenas na data/hora especificada." />
      <Kv k="Série Diária (azul)" v="Playlist emite todos os dias a partir da data inicial." />
      <Kv k="Série Semanal (azul)" v="Emite uma vez por semana, no mesmo dia da semana." />
      <Kv k="Série Mensal (azul)" v="Emite uma vez por mês, no mesmo dia do mês." />
    </Section>

    <Section title="Gerir Ocorrências">
      <Kv k="EDITAR SÉRIE" v="Altera todos os eventos da série (data, hora, playlist)." />
      <Kv k="IGNORAR APENAS HOJE" v="Remove uma ocorrência específica sem afectar a série inteira." />
      <Kv k="PARAR SÉRIE" v="Elimina definitivamente toda a série de repetição." />
    </Section>

    <Section title="EPG — Guia de Programação">
      <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
        Na barra TV GUIDE, dois ícones permitem:
      </Typography>
      <Kv k="🌐 Abrir no Browser" v="Abre o ficheiro EPG XML para visualização directa." />
      <Kv k="⬇️ Descarregar" v="Gera e descarrega o ficheiro epg_YYYY-MM-DD.xml para o disco." />
      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
        O EPG é gerado automaticamente com base nos agendamentos e metadados dos clips. Compatível com players IPTV (Kodi, VLC, Plex, etc.).
      </Typography>
    </Section>
  </Box>
);

const HelpGraphics = () => (
  <Box>
    <Section title="Graphics Engine — Editor de Gráficos">
      <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
        O Graphics Engine permite posicionar o logo da estação e adicionar camadas gráficas animadas sobre a emissão em tempo real.
      </Typography>
    </Section>

    <Section title="Pré-Visualização ao Vivo">
      <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
        O painel de PRÉ-VISUALIZAÇÃO (16:9) mostra o fundo da emissão em tempo real:
      </Typography>
      <Kv k="Quando em emissão" v="O feed HLS ao vivo aparece como fundo (75% de opacidade) para posicionamento preciso." />
      <Kv k="Quando parado" v="Um fundo de stock é mostrado para referência visual." />
    </Section>

    <Section title="Posicionar o Logo">
      <Step n="1" text="Arraste o logo directamente no preview para o posicionar." />
      <Step n="2" text="Use os sliders EIXO X e EIXO Y para ajuste milimétrico." />
      <Step n="3" text="Escolha o PONTO DE ANCORAGEM (canto): top-left, top-right, bottom-left, bottom-right." />
      <Step n="4" text="Ajuste a ESCALA e a OPACIDADE no tab ESTILO." />
      <Step n="5" text="Clique em GUARDAR ALTERAÇÕES. O logo é aplicado à emissão no próximo ciclo FFmpeg." />
    </Section>

    <Section title="Camadas Gráficas (Layers)">
      <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
        No tab LAYER pode criar e gerir camadas gráficas animadas:
      </Typography>
      <Kv k="Lower Third" v="Faixa inferior com nome e título (ex: apresentador). Animação de entrada/saída." />
      <Kv k="Marquee (Ticker)" v="Texto corrido horizontal no rodapé. Velocidade e cor configuráveis." />
      <Kv k="Relógio (Clock)" v="Relógio digital em tempo real, com fusos horários." />
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
        Cada layer pode ser activada/desactivada individualmente. As alterações são aplicadas automaticamente ao playout em execução.
      </Typography>
    </Section>
  </Box>
);

const HelpSettings = () => (
  <Box>
    <Section title="Configurações do Sistema">
      <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', display: 'block' }}>
        O menu Settings tem 5 áreas principais. As alterações são guardadas na base de dados e aplicadas ao motor na próxima sessão.
      </Typography>
    </Section>

    <Section title="Emissão & Saída">
      <Kv k="Tipo de Saída" v="RTMP, SRT, UDP, HLS. Define o protocolo principal de emissão." />
      <Kv k="URL de Saída" v="Endereço destino (ex: rtmp://192.168.1.100:1935/live/stream)." />
      <Kv k="Resolução" v="1920×1080 (Full HD), 1280×720 (HD), 720×576 (SD)." />
      <Kv k="Bitrate de Vídeo" v="Em kbps. Recomendado: 4000 para HD, 2000 para SD." />
      <Kv k="FPS" v="Frames por segundo: 25 (PAL/Europa), 30 (NTSC/EUA), 50/60 (progressivo)." />
      <Kv k="Codec" v="H.264 (compatibilidade máxima) ou H.265 (menor bitrate, maior qualidade)." />
    </Section>

    <Section title="Multi-streaming (Protocolos Adicionais)">
      <Typography variant="caption" sx={{ mb: 0.5, color: 'text.secondary', display: 'block' }}>
        Para além do protocolo principal, pode activar protocolos adicionais simultaneamente:
      </Typography>
      <Kv k="DASH" v="Dynamic Adaptive Streaming over HTTP. Para players web modernos." />
      <Kv k="MSS" v="Microsoft Smooth Streaming. Para compatibilidade com Azure e Silverlight." />
      <Kv k="RTSP" v="Real Time Streaming Protocol. Para câmaras IP e sistemas CCTV." />
      <Kv k="WebRTC" v="Latência ultra-baixa (<1s) para aplicações web interactivas." />
      <Alert severity="info" sx={{ mt: 0.75, py: 0.3, '& .MuiAlert-message': { py: 0 } }}>
        <Typography variant="caption">Por defeito, DASH/MSS/RTSP/WebRTC estão desactivados e não aparecem no Dashboard. Active apenas os que necessitar.</Typography>
      </Alert>
    </Section>

    <Section title="Caminhos & Media">
      <Kv k="Pasta de Media" v="Diretório raiz dos ficheiros de vídeo (ex: /media/videos)." />
      <Kv k="Pasta HLS" v="Onde os segmentos .m3u8 são escritos (ex: /var/hls)." />
      <Kv k="Logo do Canal" v="Imagem PNG/SVG para overlay. Tamanho recomendado: 200×200px." />
      <Kv k="Vídeo de Fallback" v="Vídeo reproduzido quando não há conteúdo agendado." />
      <Kv k="Log do Playout" v="Caminho do ficheiro de log activo do motor FFmpeg." />
    </Section>

    <Section title="Playout & Presets">
      <Kv k="Nome do Canal" v="Identificador visual mostrado no Dashboard e EPG." />
      <Kv k="Modo Gapless" v="Elimina pausas entre clips. Recomendado: activo." />
      <Kv k="Auto-start Protocolos" v="Liga os protocolos configurados automaticamente ao iniciar." />
      <Kv k="Presets" v="Configurações pré-definidas para cada tipo de emissão (SD, HD, Streaming)." />
    </Section>

    <Section title="Utilizadores & RBAC">
      <Kv k="Admin" v="Acesso total: configurações, utilizadores, playout, media." />
      <Kv k="Editor" v="Gere media, playlists e agendamentos. Não acede a configurações sensíveis." />
      <Kv k="Viewer" v="Apenas visualiza o estado do playout. Sem permissão de escrita." />
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
        Permissões granulares: READ, WRITE, DELETE, EXECUTE por módulo (media, schedule, settings, playout).
      </Typography>
    </Section>
  </Box>
);

const HelpTroubleshooting = () => (
  <Box>
    <Section title="Resolução de Problemas" severity="warning">
      <Typography variant="caption">Soluções para os problemas mais comuns do Cloud Onepa Playout.</Typography>
    </Section>

    {[
      {
        q: 'O playout não inicia — "Erro de Agendamento"',
        a: 'Não existe uma playlist agendada para o dia/hora actual. Aceda ao Calendário e crie um agendamento. O motor valida sempre antes de arrancar.'
      },
      {
        q: 'O Live Preview não aparece no Dashboard',
        a: 'O stream HLS demora 6-15 segundos a ficar disponível após START. Aguarde. Se persistir, verifique se a pasta HLS tem permissões de escrita e se o nginx está a servir /hls/.'
      },
      {
        q: 'O VLC não abre / stream não reproduz',
        a: 'Verifique: (1) A porta 1935 (RTMP) ou 9000 (SRT) está aberta no firewall. (2) O URL de saída está correcto em Settings → Emissão. (3) Copie o link e cole directamente no VLC em Media → Abrir Localização.'
      },
      {
        q: 'O overlay / logo não aparece na emissão',
        a: 'Verifique em Settings → Caminhos que o ficheiro do logo existe no caminho definido. Em Graphics Editor, confirme que a opacidade não está a 0 e guarde as alterações.'
      },
      {
        q: 'Emissão em negro ou clips em falta',
        a: 'Verifique em LOGS (Diagnóstico) se há ficheiros em falta. Os caminhos dos vídeos devem estar acessíveis ao container Docker. Monte o volume correcto no docker-compose.yml.'
      },
      {
        q: 'Erro de SRT — "Connection refused"',
        a: 'O SRT usa a porta UDP 9000. Verifique que não está bloqueada. Em Settings, confirme o SRT URL (ex: srt://0.0.0.0:9000). Use o comando: nc -u -v IP 9000 para testar.'
      },
      {
        q: 'O EPG XML está vazio ou incompleto',
        a: 'Adicione metadados (título, sinopse, género) aos clips na Biblioteca de Media. O EPG só inclui clips com agendamento activo nos próximos N dias (configurável em Settings).'
      },
      {
        q: 'O sistema fica lento ou o Docker ocupa muito disco',
        a: 'Execute a rotação de logs em Settings → Caminhos → Gestão de Logs. Para o Docker: docker system prune -f. Verifique o disco com: df -h no servidor.'
      }
    ].map((item, i) => (
      <Accordion key={i} sx={{ bgcolor: 'rgba(255,255,255,0.02)', mb: 0, border: '1px solid rgba(255,255,255,0.05)', '&:before': { display: 'none' }, '&:not(:last-child)': { borderBottom: 0 } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />} sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>{item.q}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 1, px: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.a}</Typography>
        </AccordionDetails>
      </Accordion>
    ))}

    <Section title="Contacto & Suporte" >
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
        Para problemas não cobertos aqui, use o botão LOGS no Dashboard para exportar o relatório de diagnóstico e partilhe com o suporte técnico.
      </Typography>
    </Section>
  </Box>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const TABS = [
  { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 14 }} />, content: <HelpDashboard /> },
  { label: 'Media', icon: <LibraryIcon sx={{ fontSize: 14 }} />, content: <HelpLibrary /> },
  { label: 'Playlists', icon: <PlaylistIcon sx={{ fontSize: 14 }} />, content: <HelpPlaylists /> },
  { label: 'Calendário', icon: <CalendarIcon sx={{ fontSize: 14 }} />, content: <HelpCalendar /> },
  { label: 'Graphics', icon: <GraphicsIcon sx={{ fontSize: 14 }} />, content: <HelpGraphics /> },
  { label: 'Settings', icon: <SettingsIcon sx={{ fontSize: 14 }} />, content: <HelpSettings /> },
  { label: 'Problemas', icon: <BugIcon sx={{ fontSize: 14 }} />, content: <HelpTroubleshooting /> },
];

export default function HelpSystem() {
  const { helpMode, helpContent, closeHelp, toggleHelpMode } = useHelp();
  const [tabIndex, setTabIndex] = React.useState(0);

  return (
    <Dialog
      open={!!helpContent}
      onClose={closeHelp}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'glass-panel',
        sx: { backgroundImage: 'none', border: '1px solid rgba(0,229,255,0.15)', maxHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', py: 0.75, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TvIcon color="primary" sx={{ fontSize: 20 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1, fontSize: '1rem' }}>
              {helpContent?.title || 'Central de Ajuda'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: 0.5, fontSize: '0.6rem' }}>
              CLOUD ONEPA PLAYOUT — GUIA DE OPERAÇÕES
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={closeHelp} size="small">
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Tabs
          value={tabIndex}
          onChange={(e, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { minHeight: 36, fontSize: '0.65rem', fontWeight: 700, py: 0.5, px: 1.5 },
            '& .Mui-selected': { color: 'primary.main !important' }
          }}
        >
          {TABS.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" sx={{ gap: 0.4 }} />
          ))}
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 2, overflowY: 'auto' }}>
        {helpContent?.content ? (
          <Typography variant="caption">{helpContent.content}</Typography>
        ) : (
          TABS[tabIndex]?.content
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', px: 2, py: 0.75 }}>
        {helpMode && toggleHelpMode && (
          <Button variant="outlined" color="warning" size="small" onClick={() => { toggleHelpMode(); closeHelp(); }}>
            Desactivar Modo Ajuda
          </Button>
        )}
        <Button onClick={closeHelp} variant="contained" size="small" sx={{ ml: 'auto' }}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
