# Spring AI + Angular

Monorepo with a Spring AI backend and an Angular frontend.

The project demonstrates practical AI application patterns end-to-end:

- simple chat
- chat with memory
- RAG with document upload and retrieval
- an AI-assisted flight reservation workflow

## Technologies

- Java 25
- Spring Boot 4.x
- Spring AI 2.x
- Maven Wrapper
- PostgreSQL + pgvector
- Angular 21
- Angular Material
- Playwright + Vitest/Karma tooling

## Repository Structure

- `api-ai/`: Spring Boot API and AI services
- `angular-ai/`: Angular UI client

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

### Frontend (`angular-ai`)

- Simple Chat page
- Memory Chat page
- Flight Reservations page
- Material UI layout with route-based navigation

## Quick Start

### 1. Start the backend

From `api-ai/`, set at least:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Start database and API:

```bash
./mvnw spring-boot:run
```

Spring Boot Docker Compose integration will start PostgreSQL/pgvector from `compose.yaml`.

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
