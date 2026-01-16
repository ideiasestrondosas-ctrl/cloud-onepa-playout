# Guia de Implantação - ONEPA Playout PRO

Este documento descreve como instalar, atualizar e gerenciar o sistema em diferentes sistemas operacionais.

## 🏗️ Modos de Instalação

Pode escolher entre dois modos de funcionamento:

### 1. Recomendado: Docker (Multi-plataforma)

O sistema corre em contentores isolados, garantindo que todas as dependências (Postgres, FFmpeg, MediaMTX) funcionam exatamente da mesma forma em Linux, macOS e Windows.

**O que será instalado:**

- **onepa-backend**: O motor de playout em Rust.
- **onepa-frontend**: A interface web em React.
- **onepa-postgres**: Base de dados para clips e agendamentos.
- **onepa-mediamtx**: Servidor de streaming para HLS, RTMP, SRT e WebRTC.

### 2. Manual: Nativo (Apenas Linux/macOS)

Não recomendado para iniciantes. Requer instalação manual de:

- Rust (Cargo) v1.75+
- Node.js v18+
- PostgreSQL v16
- FFmpeg v6.1+
- MediaMTX

---

## 🚀 Instruções de Instalação (Docker)

### Linux e macOS

1. Abra o terminal na pasta do projeto.
2. Execute o instalador:
   ```bash
   chmod +x scripts/install.sh
   ./scripts/install.sh
   ```

### Windows

1. Certifique-se de que o **Docker Desktop** está a correr.
2. Dê um duplo clique em `scripts\install.bat` ou execute via CMD/PowerShell:
   ```cmd
   scripts\install.bat
   ```

---

## 🔄 Atualização e Manutenção

### Como atualizar a aplicação

Se houver novas versões do código, execute:

**Linux/macOS:**

```bash
./scripts/update.sh
```

**Windows:**

```cmd
scripts\update.bat
```

### Como fazer um Reset Completo (Fábrica)

Se quiser apagar todos os vídeos, playlists e definições, voltando ao estado original:

**Linux/macOS:**

```bash
./scripts/update.sh --reset
```

**Windows:**

```cmd
scripts\update.bat --reset
```

---

## 📋 Requisitos do Sistema

| Componente | Requisito Mínimo | Notas                                           |
| :--------- | :--------------- | :---------------------------------------------- |
| **CPU**    | 2 Cores          | Recomendado 4+ para streaming 1080p             |
| **RAM**    | 4GB              | O motor de vídeo consome RAM conforme o bitrate |
| **Disco**  | 10GB+            | Espaço para contentores e clips de vídeo        |
| **Docker** | v24.0+           | Docker Compose V2 incluído                      |

---

## 🌐 Acesso ao Sistema

- **Painel de Controlo**: [http://localhost:3000](http://localhost:3000)
- **API Backend**: [http://localhost:8081](http://localhost:8081)
- **HLS Stream**: [http://localhost:3000/hls/stream.m3u8](http://localhost:3000/hls/stream.m3u8)
- **RTMP Stream**: `rtmp://localhost:1935/live/stream`
