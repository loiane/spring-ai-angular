# Spring AI API

[![Java](https://img.shields.io/badge/Java-25-orange.svg)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-2.0.0-blue.svg)](https://docs.spring.io/spring-ai/reference/)
[![Maven](https://img.shields.io/badge/Maven-3.6+-red.svg)](https://maven.apache.org/)

A comprehensive Spring AI demonstration application showcasing various AI capabilities including chat interactions, memory management, RAG (Retrieval-Augmented Generation), and document processing.

## 🚀 Features

### 🤖 AI Chat Services

- **Simple Chat**: Direct OpenAI integration for single-turn conversations
- **Memory Chat**: Persistent conversation history with PostgreSQL storage
- **Chat with Documents**: Upload documents and have context-aware conversations
- **Book Recommendations**: AI-powered book suggestions by author

### 📚 RAG (Retrieval-Augmented Generation)

- **PDF Document Upload**: Upload, list, and delete PDF documents
- **Vector Store Integration**: Semantic search capabilities with pgvector
- **Context-Aware Responses**: Enhanced AI responses with document context and sources

### ✈️ Flight Reservations

- **Reservation Management**: Create, list, and search reservations
- **Status Updates**: Cancel reservations and update reservation status

### 💾 Data Persistence

- **PostgreSQL Integration**: Robust data storage for chat history
- **Vector Database Support**: pgvector for semantic search
- **H2 Database**: In-memory database for testing

## 📋 Prerequisites

- **Java 25** or higher
- **Docker & Docker Compose** (for the database)
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

Docker must be running: the project uses Spring Boot's Docker Compose integration
(`spring-boot-docker-compose`), which automatically starts the PostgreSQL/pgvector
container from `compose.yaml` when the application starts — no manual
`docker compose up` needed.

The application will start on `http://localhost:8080`

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
- **Database**: PostgreSQL connection settings (matching `compose.yaml`)
- **Vector Store**: pgvector dimensions, distance type, and index type
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

The database container is managed automatically by Spring Boot's Docker Compose
integration when running the application. To manage it manually:

```bash
docker compose up -d      # start PostgreSQL/pgvector
docker compose down       # stop services
docker compose logs -f    # view logs
```

To build a container image of the application:

```bash
./mvnw spring-boot:build-image
```

## 🔧 Development

- **Hot Reload**: Spring Boot DevTools restarts the app automatically on changes
- **API Testing**: use the included `api.http` file
- **Monitoring**: Spring Boot Actuator endpoints are enabled

## 📖 Dependencies

- **Spring Boot**: application framework (Web MVC, JDBC, Actuator, DevTools)
- **Spring AI**: OpenAI chat and embedding models, JDBC chat memory,
  pgvector vector store, PDF document reader, vector store advisor
- **PostgreSQL + pgvector**: production database and vector store
- **H2**: test database

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](../LICENSE) file at the repository root.

## 🔗 Related Resources

- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

Built with ❤️ using Spring AI and Spring Boot
