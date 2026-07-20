# Spring AI + Angular

Monorepo with a Spring AI backend and an Angular frontend.

The project demonstrates practical AI application patterns end-to-end:

- simple chat
- chat with memory
- chat with documents
- RAG with document upload and retrieval
- an AI-assisted flight reservation workflow
- an MCP (Model Context Protocol) server/client pair exposing the flight reservation tools remotely

## Technologies

- Java 25
- Spring Boot 4.x
- Spring AI 2.x
- Maven Wrapper
- H2 (file-based, no external database/Docker required)
- Angular 22
- Angular Material
- Playwright + Vitest tooling

## Repository Structure

- `api-ai/`: Spring Boot API and AI services (also acts as an MCP server for flight reservation tools)
- `angular-ai/`: Angular UI client
- `mcp-client-ai/`: Standalone Spring Boot MCP client that consumes `api-ai`'s flight reservation tools over MCP

## Features

### Backend (`api-ai`)

- Simple chat endpoint (`POST /api/chat`)
- Memory chat endpoints (`/api/chat-memory/**`)
- RAG endpoints (`/api/rag/**`)
  - upload document
  - list/get/delete documents
  - ask questions using retrieved context
- Flight reservation endpoints (`/api/flight-reservations/**`)
  - list/create/get reservations
  - cancel reservation
  - update reservation status
  - search by passenger email
- Book recommendation prompt endpoints (`/api/books/**`)
- MCP server exposing the flight reservation tools (list, get, search, cancel) at `/mcp`, consumed by the standalone `mcp-client-ai` module

### Frontend (`angular-ai`)

- Simple Chat page
- Memory Chat page
- Chat with Documents page
- Flight Reservations page
- Material UI layout with route-based navigation

## Quick Start

### 1. Start the backend

From `api-ai/`, set at least:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Start the API:

```bash
./mvnw spring-boot:run
```

No Docker or external database is required - the app uses a file-based H2
database (`api-ai/data/`) created automatically on first run. See
[`api-ai/README.md`](api-ai/README.md) for details, including the H2 console
and the one feature that behaves differently than the old Postgres/pgvector setup.

API base URL: `http://localhost:8080`

### 2. Start the frontend

From `angular-ai/`:

```bash
npm install
npm start
```

Frontend URL: `http://localhost:4200`

The Angular app uses `proxy.conf.js` to forward API calls to the backend
during development.

### 3. (Optional) Start the MCP client example

With `api-ai` already running (its MCP server is available at `/mcp`), from `mcp-client-ai/`:

```bash
OPENAI_API_KEY=your_openai_api_key ./mvnw spring-boot:run
```

This starts a separate service on `http://localhost:8081` that discovers and
calls the flight reservation tools over MCP instead of in-process. See
[`mcp-client-ai/README.md`](mcp-client-ai/README.md) for details.

## Useful Commands

### Backend Commands (`api-ai`)

```bash
./mvnw test
./mvnw clean package
```

### Frontend Commands (`angular-ai`)

```bash
npm run test
npm run e2e
npm run build
```

## API Samples

The file `api-ai/api.http` contains request examples for local API testing.

## Learning Resources

### Tutorials (English)

- [Getting Starting with Intelligent Java Applications using Spring AI](https://loiane.com/2024/12/getting-starting-with-intelligent-java-applications-using-spring-ai/)
- [Intelligent Java Applications using Spring AI and Gemini](https://loiane.com/2025/01/intelligent-java-applications-using-spring-ai-and-gemini/)

### Videos (Portuguese)

#### Intro and Simple Chat Client

- [Spring AI + Angular: Introdução](https://youtu.be/10oDBG6V5Q8)
- [Spring AI + Angular: Primeiro Projeto [Chat Client]](https://youtu.be/M7j84Y16bFk)
- [Spring AI + Angular: Chat Client com Gemini](https://youtu.be/Kq37KNwt3bA)
- [Spring AI + Angular: Chat Client com Azure OpenAI](https://youtu.be/fjkZjObT3ro)
- Spring AI + Angular: Chat Client com Oracle GenAI
- [Spring AI + Angular: Criando Projeto Angular](https://youtu.be/WUhUB0IChxE)
- Spring AI + Angular: Criando Cliente de Chat
- Spring AI + Angular: Conectando Cliente de Chat com API
