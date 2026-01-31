# Cloud Onepa Playout - Arquitetura do Sistema

## Pipeline de Vídeo (Phase 31)

O sistema utiliza um pipeline de processamento em tempo real baseado em FFmpeg, com normalização de áudio e sobreposição dinâmica.

```mermaid
graph TD
    A[Base de Dados SQLx] -->|Settings/Schedule| B(Playout Engine Rust)
    C[Media Library / S3] -->|Ficheiros Vídeo| B

    B -->|Detecta Mudanças| D{Decisão de Reinício}
    D -->|Sim: Opacidade/Escala Alterada| E[Kill FFmpeg Process]
    D -->|Não: Stream em curso| F[Keep Running]

    E --> G[Novo Processo FFmpeg]
    G -->|Filtro: loudnorm| H[Áudio Standardizado R128]
    H -->|Filtro: overlay| I[Logotipo do Canal]
    I -->|Muxer: Tee| J[HLS Local Preview]
    I -->|Muxer: Tee| K[Saída RTMP/SRT/VLC]

    L[Dashboard React] -->|vlc:// Protocol| M[VLC Player Local]
    K -.->|HLS Stream| M
    J -.->|HLS Stream| L
```

### Componentes Principais

1.  **Backend (Rust/Actix)**: Gere a lógica de agendamento, o ciclo de vida dos processos FFmpeg e a API controladora.
2.  **Audio Normalization**: Implementação da norma EBU R128 (`loudnorm`) para garantir volume consistente entre clips de diferentes origens.
3.  **Real-time Overlay**: Monitorização de configurações de escala e opacidade para atualização instantânea (via restart seamless).
4.  **Frontend (React)**: Interface administrativa com monitor de LUFS e launcher inteligente para VLC.

```

```
