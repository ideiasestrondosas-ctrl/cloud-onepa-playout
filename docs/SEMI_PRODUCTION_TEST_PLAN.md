# Plano de Testes Semi-Produção - Cloud Onepa Playout (ALPHA.28-PRO)

Este plano foca-se na estabilidade de longo prazo e prontidão operativa para cenários reais de broadcasting 24/7.

## 🎯 Objectivos de Semi-Produção
1. **Uptime Ininterrupto:** Garantir que o stream não cai por fugas de memória ou erros de lógica cíclica.
2. **Eficiência de Recursos:** Manter a carga da CPU estável nos 4 Cores da VM.
3. **Integridade de Dados:** Garantir que o desfasamento entre DB e Disco é zero.

---

## 1. Teste de Resistência (Long Haul Test)
- **Duração:** 48 horas de playout contínuo.
- **Verificação:** 
  - [ ] Monitorizar uso de RAM (`docker stats`): Não deve exceder 2GB constantes para o backend.
  - [ ] Logs: Procurar por `FFmpeg pipe error` ou `reconnect failed` em intervalos regulares.
  - [ ] Sincronia de Áudio/Vídeo após 24h de emissão.

## 2. Monitorização de Performance (Load Audit)
- **CPU Benchmarking:**
  - Playout em modo `Copy` (Baixa carga): ~5-10% CPU.
  - Playout com Transcoding/Scaling (Alta carga): Validar se os 4 cores distribuem a carga sem picos de 100%.
- **Network Stability:**
  - Verificar latência SRT na VM Ubuntu (Alvo: <200ms em rede local).
  - Validar taxa de drops em RTMP.

## 3. Estratégia de Armazenamento (Log & Cleanup)
- **Log Rotation:**
  - Verificar se os ficheiros em `/data/logs` têm limite de tamanho (ex: 50MB) para não saturar os 70GB de disco.
- **Gestão de HLS Segments:**
  - Garantir que o directório `/var/lib/onepa-playout/hls` limpa segmentos antigos (máximo 6 segmentos em disco).
- **Snapshot de Base de Dados:**
  - Testar `pg_dump` e `pg_restore` no volume Docker para recuperação em menos de 5 minutos.

## 4. Segurança e Acesso
- **Token Lifecycle:** Validar expiração de sessão após 24h (Configuração JWT).
- **Protected Paths:** Tentar apagar ficheiros em `/assets/protected` via API e garantir que o backend bloqueia a acção com erro 403.
- **Firewall Ubuntu:** Testar acesso externo às portas 8182 (API) e 3011 (UI) apenas por IPs permitidos.

## 5. Plano de Rollback
- Caso a versão ALPHA.28-PRO apresente instabilidade na VM:
  1. Parar containers: `docker-compose down`.
  2. Reverter base de dados para Snapshot anterior.
  3. Deploy da tag estável anterior via Git.

---

## 🛠️ Comandos de Verificação Rápida (Shell)
```bash
# Monitorização global de containers
docker stats alpha-backend alpha-frontend alpha-postgres alpha-mediamtx

# Verificação de espaço em disco na partição da App
df -h /var/lib/onepa-playout

# Teste de latência de API
curl -w "Connect: %{time_connect}s\n" -o /dev/null -s http://localhost:8182/api/health
```
