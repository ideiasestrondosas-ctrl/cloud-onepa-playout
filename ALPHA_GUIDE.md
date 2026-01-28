# Alpha Project - Configuration & Comparison Guide

This document provides a complete overview of the configurations for the **Alpha** project, how they differ from the **Master** project, and how to manage the transition between these environments.

## 1. Port Configuration (Alpha vs. Master)

The Alpha project uses a consistent shift to avoid conflicts with an existing Master installation on the same host or network.

| Service               | Protocol | **Master (Default)**          | **Alpha (Shifted)**                 | Local Dev (Alpha)                              |
| :-------------------- | :------- | :---------------------------- | :---------------------------------- | :--------------------------------------------- |
| **Frontend UI**       | HTTP     | 3001 (Host) / 3000 (Dev)      | **3011 (Host) / 3010 (Dev)**        | [http://localhost:3010](http://localhost:3010) |
| **Frontend (Docker)** | HTTP     | 3001 (Host)                   | **3011 (Host)**                     | [http://localhost:3011](http://localhost:3011) |
| **Backend API**       | HTTP     | 8082 (Host) / 8081 (Internal) | **8182 (Host) / 8181 (Internal)**   | [http://localhost:8181](http://localhost:8181) |
| **Database**          | Postgres | 5434 (Host) / 5432 (Internal) | **5534 (Host) / 5432 (Internal)**   | `localhost:5534`                               |
| **MediaMTX RTMP**     | RTMP     | 1936 (Host) / 1935 (Internal) | **2036 (Host) / 2035 (Internal)**   | `rtmp://localhost:2035`                        |
| **MediaMTX HLS**      | HTTP     | 8891 (Host) / 8888 (Internal) | **8991 (Host) / 8988 (Internal)**   | `http://localhost:8988`                        |
| **MediaMTX WebRTC**   | HTTP     | 8892 (Host) / 8889 (Internal) | **8992 (Host) / 8989 (Internal)**   | `http://localhost:8989`                        |
| **MediaMTX SRT**      | SRT      | 8893 (Host) / 8890 (Internal) | **8993 (Host) / 8990 (Internal)**   | `srt://localhost:8990`                         |
| **SRT Listener**      | SRT      | 9901 (Host) / 9900 (Internal) | **10901 (Host) / 10900 (Internal)** | `srt://localhost:10900`                        |

## 2. Path & Environment Variations

| Configuration              | Master Path / Value            | Alpha Path / Value                                  |
| :------------------------- | :----------------------------- | :-------------------------------------------------- |
| **Docker Container Names** | `onepa-*`                      | `alpha-*`                                           |
| **HLS Data**               | `/var/lib/onepa-playout/hls`   | `./data/hls` (or similar relative path)             |
| **Media Data**             | `/var/lib/onepa-playout/media` | `./data/media`                                      |
| **Binary Name**            | `onepa-playout`                | `onepa-playout` (Same, but in distinct environment) |

## 3. Access Credentials (Default)

The following credentials are the default for the Alpha environment:

- **Utilizador**: `admin`
- **Password**: `onepa2026!`

> [!NOTE]
> **Login Fix**: A silent login failure issue was resolved. The system now correctly redirects to the dashboard upon successful login and remains on the login page with proper validation for incorrect credentials.

## 4. Rollback to Master Configuration

A dedicated script `./rollback_to_master.sh` has been created to automate the reversion of all ports and container names to the Master defaults.

## 5. Test Phase Instructions - STATUS: ACTIVE

The Alpha project is now in the **Test Phase**. Please focus your testing on:

1. **Concurrency**: Verify that both Master and Alpha environments can run simultaneously without interference.
2. **Streaming**: Confirm RTMP ingests and HLS playback on the new ports (2036 and 8991).
3. **Database Isolation**: verify that data created in Alpha does not appear in Master.
4. **Login UI**: Confirm the "ENTRAR" button correctly handles the authentication flow.
