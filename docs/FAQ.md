# Cloud Onepa Playout - FAQ

## Perguntas Frequentes

### Instalação e Configuração

**Q: Qual a diferença entre instalação Docker e manual?**  
A: Docker é mais simples e isolado. Manual oferece mais controlo mas requer configuração de dependências.

**Q: Posso usar SQLite em vez de PostgreSQL?**  
A: Atualmente apenas PostgreSQL é suportado. SQLite pode ser adicionado no futuro.

**Q: Preciso de GPU para usar o Cloud Onepa Playout?**  
A: Não. O FFmpeg usa apenas CPU. GPU pode acelerar encoding mas não é necessária.

---

### Uso Geral

**Q: Como faço upload de vídeos?**  
A: Vá para Media Library → Upload → Arraste ficheiros ou clique para selecionar.

**Q: Que formatos de vídeo são suportados?**  
A: Todos os formatos suportados pelo FFmpeg (MP4, MKV, AVI, MOV, WebM, etc).

**Q: Como criar uma playlist 24h?**  
A: Playlist Editor → Adicione clips → Sistema calcula duração → Auto-fill com fillers se necessário.

**Q: Posso agendar playlists diferentes para cada dia?**  
A: Sim! Use o Calendário para atribuir playlists a datas específicas.

---

### Playout e Streaming

**Q: Como iniciar o broadcast?**  
A: Dashboard → Botão "Start Playout" → Selecione playlist → Confirme.

**Q: Posso fazer stream para múltiplos destinos?**  
A: Atualmente suporta um output. Multi-output será adicionado em versões futuras.

**Q: Que protocolos de streaming são suportados?**  
A: RTMP, HLS, SRT, UDP. Configurável em Settings.

**Q: Como vejo preview do que está a transmitir?**  
A: Dashboard tem preview em tempo real do stream.

---

### Troubleshooting

**Q: Vídeo não reproduz - áudio sem som**  
A: Verifique se vídeo tem track de áudio. Sistema adiciona silêncio automaticamente se configurado.

**Q: Playlist não completa 24h**  
A: Configure fillers em Settings → Playout → Filler Content. Sistema preenche automaticamente.

**Q: Stream está a fazer buffering**  
A: Reduza bitrate em Settings → Output → Bitrate. Recomendado: 5000k para 1080p.

**Q: Erro "FFmpeg not found"**  
A: Instale FFmpeg: `brew install ffmpeg` (macOS) ou `apt install ffmpeg` (Linux).

---

### Funcionalidades Avançadas

**Q: Posso adicionar logos aos vídeos?**  
A: Sim! Settings → Overlay → Upload logo → Configure posição.

**Q: Como normalizar áudio de diferentes clips?**  
A: Settings → Audio → Enable EBU R128 Loudness Normalization.

**Q: Posso usar fontes remotas (URLs)?**  
A: Sim. Media Library → Add Remote Source → Cole URL (HTTP/RTMP/etc).

---

### Performance

**Q: Quantos recursos preciso para 1080p?**  
A: Mínimo: 4 cores CPU, 4GB RAM. Recomendado: 8 cores, 8GB RAM.

**Q: Posso rodar em Raspberry Pi?**  
A: Possível mas não recomendado para resoluções > 720p. Use Pi 4 com 8GB RAM.

---

### Desenvolvimento

**Q: Como contribuir para o projeto?**  
A: Fork → Branch → Commits → Pull Request. Ver CONTRIBUTING.md.

**Q: Posso usar comercialmente?**  
A: Sim, sob licença GPL v3. Modificações devem ser open-source.

---

## Não encontrou resposta?

Abra uma [issue no GitHub](https://github.com/onepa/cloud-onepa-playout/issues) ou consulte a [documentação completa](https://docs.onepa.cloud).
