# Cloud Onepa Playout - Manual de Operações 24/7

Bem-vindo ao sistema profissional de playout Cloud Onepa. Este manual fornece as diretrizes para manter um canal de TV online resiliente.

## 1. Configuração Inicial Recomendada

- **Resolução**: 1080p (1920x1080)
- **Video Bitrate**: 5000kbps (CBR recomendado)
- **Audio Bitrate**: 192kbps
- **GOP**: 2 segundos (50 frames a 25fps) para baixa latência HLS.

## 2. Fluxo de Trabalho Diário

1. **Ingestão**: Carregar conteúdos novos na Media Library.
2. **Organização**: Manter pelo menos 10 fillers de curta duração para transições automáticas.
3. **Programação**: Agendar as playlists no calendário com antecedência de 7 dias.
4. **Monitorização**: Verificar o Dashboard pelo menos 2 vezes por dia para validar o uptime.

## 3. Procedimentos de Emergência

- **Playout parado**: Clicar em "START" no Dashboard. O motor wall-clock retomará automaticamente o ponto exato da emissão.
- **Falha de Media**: Se um arquivo for apagado do disco mas estiver na playlist, o sistema saltará para o próximo clip válido.
- **Restart de Servidor**: O serviço Docker está configurado com `restart: always`. Após reboot, o backend iniciará e o `PlayoutEngine` retomará a emissão em menos de 10 segundos.

## 4. Branding e Identidade

- O logótipo deve ser PNG transparente de 32px de altura para o header.
- Use a animação de logo (filler) entre blocos de programação para reforçar a marca.

---

_Cloud Onepa Playout PRO v1.0_
