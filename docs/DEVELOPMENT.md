# Cloud Onepa Playout - Guia de Desenvolvimento

## 🛠️ Setup do Ambiente de Desenvolvimento

### Pré-requisitos

- **Rust**: 1.75+ (`rustup install stable`)
- **Node.js**: 18+ (`nvm install 18`)
- **PostgreSQL**: 16+ (local ou Docker)
- **FFmpeg**: 7.2+ (`brew install ffmpeg` ou `apt install ffmpeg`)
- **Git**: Para controlo de versão

### Clone e Setup Inicial

```bash
# Clone do repositório
git clone https://github.com/your-org/cloud-onepa-playout.git
cd cloud-onepa-playout

# Setup backend
cd backend
cp .env.example .env
cargo build

# Setup frontend
cd ../frontend
npm install
```

---

## 🏗️ Estrutura do Projeto

```
cloud-onepa-playout/
├── backend/                 # Rust API
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── api/            # API endpoints
│   │   │   ├── auth.rs
│   │   │   ├── media.rs
│   │   │   ├── playlists.rs
│   │   │   ├── schedule.rs
│   │   │   └── playout.rs
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   │   └── ffmpeg.rs
│   │   ├── utils/          # Utilities
│   │   │   ├── jwt.rs
│   │   │   ├── errors.rs
│   │   │   └── middleware.rs
│   │   └── config/         # Configuration
│   ├── migrations/         # SQL migrations
│   └── Cargo.toml
│
├── frontend/               # React App
│   ├── src/
│   │   ├── main.jsx       # Entry point
│   │   ├── App.jsx        # Main app
│   │   ├── components/    # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── VideoPreview.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MediaLibrary.jsx
│   │   │   ├── PlaylistEditor.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Templates.jsx
│   │   │   └── Login.jsx
│   │   ├── services/      # API client
│   │   │   └── api.js
│   │   ├── stores/        # State management
│   │   │   └── authStore.js
│   │   └── contexts/      # React contexts
│   │       └── NotificationContext.jsx
│   └── package.json
│
├── docker/                # Docker configs
├── docs/                  # Documentation
└── docker-compose.yml
```

---

## 🔧 Desenvolvimento

### Backend (Rust)

```bash
cd backend

# Desenvolvimento com hot-reload
cargo watch -x run

# Build
cargo build

# Testes
cargo test

# Lint
cargo clippy

# Format
cargo fmt
```

### Frontend (React)

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint

# Preview build
npm run preview
```

### Database

```bash
# Executar migrations
cd backend
sqlx migrate run

# Criar nova migration
sqlx migrate add create_new_table

# Reverter última migration
sqlx migrate revert
```

---

## 📝 Convenções de Código

### Rust

**Naming:**

- `snake_case` para funções e variáveis
- `PascalCase` para structs e enums
- `SCREAMING_SNAKE_CASE` para constantes

**Exemplo:**

```rust
const MAX_FILE_SIZE: usize = 2_000_000_000;

pub struct MediaInfo {
    pub duration: Option<f64>,
    pub width: Option<i32>,
}

pub async fn get_media_info(file_path: &str) -> Result<MediaInfo, String> {
    // ...
}
```

**Error Handling:**

```rust
// Use Result para erros recuperáveis
fn process_file(path: &str) -> Result<(), AppError> {
    // ...
}

// Use ? operator
let info = ffmpeg.get_media_info(path)?;
```

### JavaScript/React

**Naming:**

- `camelCase` para variáveis e funções
- `PascalCase` para componentes
- `SCREAMING_SNAKE_CASE` para constantes

**Exemplo:**

```javascript
const MAX_UPLOAD_SIZE = 2000000000;

function formatDuration(seconds) {
  // ...
}

export default function MediaLibrary() {
  // ...
}
```

**Hooks:**

```javascript
// useState
const [loading, setLoading] = useState(false);

// useEffect
useEffect(() => {
  fetchData();
}, [dependency]);

// Custom hooks
function useNotification() {
  // ...
}
```

---

## 🧪 Testes

### Backend Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ffmpeg_service_creation() {
        let service = FFmpegService::new();
        assert!(!service.ffmpeg_path.is_empty());
    }

    #[tokio::test]
    async fn test_get_media_info() {
        let service = FFmpegService::new();
        let result = service.get_media_info("test.mp4").await;
        assert!(result.is_ok());
    }
}
```

### Frontend Tests (TODO)

```javascript
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

test("renders dashboard title", () => {
  render(<Dashboard />);
  const title = screen.getByText(/Dashboard/i);
  expect(title).toBeInTheDocument();
});
```

---

## 🔌 API Endpoints

### Autenticação

- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Registar utilizador

### Media

- `GET /api/media` - Listar media (paginação)
- `GET /api/media/{id}` - Obter media por ID
- `POST /api/media/upload` - Upload de ficheiros
- `DELETE /api/media/{id}` - Deletar media

### Playlists

- `GET /api/playlists` - Listar playlists
- `GET /api/playlists/{id}` - Obter playlist
- `POST /api/playlists` - Criar playlist
- `PUT /api/playlists/{id}` - Atualizar playlist
- `DELETE /api/playlists/{id}` - Deletar playlist
- `POST /api/playlists/validate` - Validar duração

### Schedule

- `GET /api/schedule` - Listar agendamentos
- `GET /api/schedule?light=true` - Listar agendamentos (resposta leve, sem playlist_content)
- `GET /api/schedule/light` - Listar agendamentos (resposta leve, sem playlist_content)
- `POST /api/schedule` - Criar agendamento
- `DELETE /api/schedule/{id}` - Deletar agendamento
- `GET /api/schedule/for-date` - Obter playlist para data

### Playout

- `GET /api/playout/status` - Status do playout
- `POST /api/playout/start` - Iniciar playout
- `POST /api/playout/stop` - Parar playout
- `POST /api/playout/skip` - Skip para próximo clip
- `POST /api/playout/pause` - Pausar playout
- `POST /api/playout/resume` - Retomar playout

---

## 🐛 Debugging

### Backend

```bash
# Logs detalhados
RUST_LOG=debug cargo run

# Backtrace em panics
RUST_BACKTRACE=1 cargo run

# Debug com lldb
rust-lldb target/debug/onepa-playout
```

### Frontend

```javascript
// Console logs
console.log("Data:", data);

// React DevTools
// Instalar extensão do browser

// Network tab
// Verificar requests no DevTools
```

---

## 📦 Dependências Principais

### Backend (Rust)

- `actix-web` - Web framework
- `sqlx` - Database driver (PostgreSQL)
- `tokio` - Async runtime
- `serde` - Serialization
- `jsonwebtoken` - JWT
- `bcrypt` - Password hashing
- `ffmpeg-next` - FFmpeg bindings

### Frontend (React)

- `react` - UI library
- `react-router-dom` - Routing
- `@mui/material` - UI components
- `axios` - HTTP client
- `zustand` - State management
- `@dnd-kit` - Drag and drop
- `@fullcalendar` - Calendar
- `video.js` - Video player
- `react-dropzone` - File upload

---

## 🚀 Workflow de Desenvolvimento

### 1. Criar Feature Branch

```bash
git checkout -b feature/new-feature
```

### 2. Desenvolver

```bash
# Backend
cd backend
cargo watch -x run

# Frontend (novo terminal)
cd frontend
npm run dev
```

### 3. Testar

```bash
# Backend tests
cargo test

# Frontend (manual testing)
# Aceder http://localhost:5173
```

### 4. Commit

```bash
git add .
git commit -m "feat: add new feature"
```

### 5. Push e PR

```bash
git push origin feature/new-feature
# Criar Pull Request no GitHub
```

---

## 📚 Recursos

### Documentação

- [Rust Book](https://doc.rust-lang.org/book/)
- [Actix Web](https://actix.rs/)
- [React Docs](https://react.dev/)
- [Material-UI](https://mui.com/)

### Ferramentas

- [Rust Analyzer](https://rust-analyzer.github.io/) - IDE support
- [Postman](https://www.postman.com/) - API testing
- [TablePlus](https://tableplus.com/) - Database GUI

---

**Última atualização:** 2026-01-09
