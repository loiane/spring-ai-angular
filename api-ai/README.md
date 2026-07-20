# Spring AI API

[![Java](https://img.shields.io/badge/Java-25-orange.svg)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-2.0.0-blue.svg)](https://docs.spring.io/spring-ai/reference/)
[![Maven](https://img.shields.io/badge/Maven-3.6+-red.svg)](https://maven.apache.org/)

A comprehensive Spring AI demonstration application showcasing various AI capabilities including chat interactions, memory management, RAG (Retrieval-Augmented Generation), and document processing.

## 🚀 Features

### 🤖 AI Chat Services

- **Simple Chat**: Direct OpenAI integration for single-turn conversations
- **Memory Chat**: Persistent conversation history with H2 storage
- **Chat with Documents**: Upload documents and have context-aware conversations
- **Book Recommendations**: AI-powered book suggestions by author

### 📚 RAG (Retrieval-Augmented Generation)

- **PDF Document Upload**: Upload, list, and delete PDF documents
- **Vector Store Integration**: Semantic search via Spring AI's file-backed `SimpleVectorStore`
- **Context-Aware Responses**: Enhanced AI responses with document context and sources

### ✈️ Flight Reservations

- **Reservation Management**: Create, list, and search reservations
- **Status Updates**: Cancel reservations and update reservation status

### 🔌 MCP Server

- Exposes the same flight reservation tools used by the in-process SpringFly
  Concierge (list all, get by id, search by email, cancel) as an MCP
  (Model Context Protocol) server
- Streamable HTTP transport, reachable at `POST /mcp`
- Consumed by the standalone [`mcp-client-ai`](../mcp-client-ai/README.md) module,
  demonstrating tools being called across a process boundary instead of in-process

### 💾 Data Persistence

- **H2 Database**: File-based storage for chat history, flight reservations, and document
  metadata — no external database or Docker required. Tests use an in-memory H2 instance.
- **Vector Store**: Spring AI's `SimpleVectorStore`, persisted to a local JSON file
  (`data/vectorstore.json`)

## 📋 Prerequisites

- **Java 25** or higher
- **OpenAI API Key**

Maven is not required — the project includes the Maven Wrapper (`./mvnw`).

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/loiane/spring-ai-angular.git
cd spring-ai-angular/api-ai
```

### 2. Environment Configuration

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Application

```bash
./mvnw spring-boot:run
```

No Docker or external database needed. On first run, Spring Boot creates a
file-based H2 database at `data/mydatabase.mv.db` (relative to `api-ai/`) and
initializes it from `schema.sql`/`rag-schema.sql`. The `data/` directory is
gitignored.

The application will start on `http://localhost:8080`. The H2 web console is
available at `http://localhost:8080/h2-console` (JDBC URL
`jdbc:h2:file:./data/mydatabase`, user `sa`, empty password).

## 📚 API Documentation

The file `api.http` contains ready-to-run examples for all endpoints
(IntelliJ IDEA HTTP Client, VS Code REST Client, or similar).

### 🤖 Chat Endpoints

#### Simple Chat

```http
POST /api/chat
Content-Type: application/json

{
    "message": "What is Spring AI?"
}
```

#### Memory Chat - Start New Conversation

Returns a `chatId` along with the AI response — use it to continue the conversation.

```http
POST /api/chat-memory/start
Content-Type: application/json

{
    "message": "Tell me a joke about programming"
}
```

#### Memory Chat - Continue Conversation

```http
POST /api/chat-memory/{chatId}
Content-Type: application/json

{
    "message": "Tell me another one"
}
```

#### Get Chats and Chat History

```http
GET /api/chat-memory
GET /api/chat-memory/{chatId}
```

#### Chat with Documents - Upload Document

```http
POST /api/chat-documents/upload
Content-Type: multipart/form-data

file=<document file>
```

#### Chat with Documents - Ask Question

```http
POST /api/chat-documents/ask
Content-Type: application/json

{
    "message": "What is this document about?",
    "documentId": "document-uuid"
}
```

#### Chat with Documents - List / Get / Delete

```http
GET /api/chat-documents
GET /api/chat-documents/{id}
DELETE /api/chat-documents/{id}
```

### 📖 Book Recommendation Endpoints

#### Get Books by Author (String Response)

```http
GET /api/books/by-author?author=Rebecca+Yarros
```

#### Get Books by Author (Structured Response)

```http
GET /api/books/by-author-formatted?author=Rebecca+Yarros
```

### 🔍 RAG Endpoints

#### Upload PDF Document

```http
POST /api/rag/upload
Content-Type: multipart/form-data

file=<PDF file>
```

#### List / Get / Delete Documents

```http
GET /api/rag/documents
GET /api/rag/documents/{id}
DELETE /api/rag/documents/{id}
```

#### Ask Questions Using Retrieved Context

```http
POST /api/rag/ask
Content-Type: application/json

{
    "message": "What is Spring AI?"
}
```

### ✈️ Flight Reservation Endpoints

#### List / Get / Create Reservations

```http
GET /api/flight-reservations
GET /api/flight-reservations/{reservationId}
POST /api/flight-reservations
```

#### Cancel / Update Status

```http
PUT /api/flight-reservations/{reservationId}/cancel
PUT /api/flight-reservations/{reservationId}/status
```

#### Search by Passenger Email

```http
GET /api/flight-reservations/search?email=passenger@example.com
```

### 🔌 MCP Server Endpoint

The flight reservation tools (list, get, search, cancel) are exposed over MCP
at `/mcp` using the Streamable HTTP transport. Any MCP-compatible client can
connect to `http://localhost:8080/mcp` and discover the 4 tools, mirroring
what the in-process SpringFly Concierge already does. See
[`mcp-client-ai`](../mcp-client-ai/README.md) for a working example client.

## 🏗️ Project Structure

```text
src/main/java/com/loiane/api_ai/
├── chat/               # Simple chat
├── memory/             # Chat with persistent memory
├── booksprompt/        # Book recommendation prompts
├── flightreservation/  # Flight reservation management
└── rag/                # RAG: document upload, vector store, Q&A

src/main/resources/     # application.properties, SQL schemas,
                        # prompt templates, sample PDF
```

## ⚙️ Configuration

All configuration lives in `src/main/resources/application.properties`:

- **OpenAI**: API key and embedding model (`text-embedding-3-small`, 1536 dimensions)
- **Database**: H2 file-based connection settings (`data/mydatabase`)
- **Vector Store**: `app.vectorstore.file` — path to the local `SimpleVectorStore` JSON file
- **RAG**: document upload directory, chunking, and retrieval settings (`app.documents.*`)
- **Uploads**: multipart file size limits

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## 🧪 Testing

```bash
# Run all tests
./mvnw test

# Run a specific test class
./mvnw test -Dtest=ChatControllerTest
```

Tests use an H2 in-memory database with test-specific configuration in
`src/test/resources/application-test.properties`.

## 🐳 Docker

Docker is not required to run or develop this application. To build a container
image of the application:

```bash
./mvnw spring-boot:build-image
```

## 🔧 Development

- **Hot Reload**: Spring Boot DevTools restarts the app automatically on changes
- **API Testing**: use the included `api.http` file
- **Monitoring**: Spring Boot Actuator endpoints are enabled

## 📖 Dependencies

- **Spring Boot**: application framework (Web MVC, JDBC, H2 Console, Actuator, DevTools)
- **Spring AI**: OpenAI chat and embedding models, JDBC chat memory,
  `SimpleVectorStore`, PDF document reader, vector store advisor
- **H2**: file-based database (runtime) and in-memory database (tests)

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](../LICENSE) file at the repository root.

## 🔗 Related Resources

- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [H2 Database Documentation](https://www.h2database.com/html/main.html)

---

Built with ❤️ using Spring AI and Spring Boot
