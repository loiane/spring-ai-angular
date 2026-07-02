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

### 🏗️ Architecture
- **RESTful API**: Clean and well-documented endpoints
- **Modular Design**: Organized by feature domains
- **Comprehensive Testing**: Unit and integration tests
- **Docker Support**: Container-ready with Docker Compose

## 📋 Prerequisites

- **Java 25** or higher
- **Maven 3.6+**
- **Docker & Docker Compose** (for database)
- **OpenAI API Key**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd api-ai
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start Database Services
```bash
docker compose up -d
```

This starts:
- PostgreSQL database on port 5432
- pgvector extension for vector operations

### 4. Build the Application
```bash
./mvnw clean install
```

### 5. Run the Application
```bash
./mvnw spring-boot:run
```

Or with environment variables:
```bash
source .env && ./mvnw spring-boot:run
```

The application will start on `http://localhost:8080`

## 📚 API Documentation

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
```http
POST /api/chat-memory/start
Content-Type: application/json

{
    "message": "Tell me a joke about programming"
}
```

#### Memory Chat - Continue Conversation
```http
POST /api/chat-memory/{conversationId}
Content-Type: application/json

{
    "message": "Tell me another one"
}
```

#### Get Chat History
```http
GET /api/chat-memory
GET /api/chat-memory/{conversationId}
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

```
src/
├── main/
│   ├── java/com/loiane/api_ai/
│   │   ├── ApiAiApplication.java           # Main application class
│   │   ├── chat/                           # Simple chat functionality
│   │   │   ├── ChatController.java
│   │   │   ├── ChatRequest.java
│   │   │   ├── ChatResponse.java
│   │   │   └── SimpleChatService.java
│   │   ├── memory/                         # Chat with memory
│   │   │   ├── MemoryChatController.java
│   │   │   ├── MemoryChatService.java
│   │   │   ├── ChatMemoryIDRepository.java
│   │   │   └── Chat*.java
│   │   ├── booksprompt/                    # Book recommendations
│   │   │   ├── BookController.java
│   │   │   ├── BookPromptService.java
│   │   │   ├── Author.java (Record)
│   │   │   └── Book.java (Record)
│   │   ├── flightreservation/              # Flight reservations
│   │   │   ├── FlightReservationController.java
│   │   │   ├── FlightReservationService.java
│   │   │   ├── FlightReservationRepository.java
│   │   │   └── FlightReservation*.java
│   │   └── rag/                            # RAG implementation
│   │       ├── RagController.java
│   │       ├── RagService.java
│   │       ├── DocumentService.java
│   │       ├── DocumentRepository.java
│   │       ├── config/                     # Vector store and reader config
│   │       ├── exception/                  # Document exceptions
│   │       └── model/                      # Document and response models
│   └── resources/
│       ├── application.properties          # Main configuration
│       ├── schema.sql                      # Database schema
│       ├── rag-schema.sql                  # RAG document metadata schema
│       ├── pgvector.sql                    # Vector store schema
│       ├── docs/                           # PDF documents for RAG
│       ├── data/                           # Sample data
│       └── templates/                      # AI prompt templates
└── test/
    ├── java/com/loiane/api_ai/
    │   ├── ApiAiApplicationTests.java
    │   ├── chat/                           # Chat service tests
    │   ├── booksprompt/                    # Book service tests
    │   └── flightreservation/              # Flight reservation tests
    └── resources/
        └── application-test.properties     # Test configuration
```

## ⚙️ Configuration

### Application Properties
Key configuration options in `application.properties`:

```properties
# Application
spring.application.name=spring-ai-api

# OpenAI Configuration
spring.ai.openai.api-key=${OPENAI_API_KEY}

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/mydatabase
spring.datasource.username=myuser
spring.datasource.password=secret

# JPA Configuration
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true

# Logging
logging.level.org.springframework.ai=debug
```

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)

## 🧪 Testing

### Run All Tests
```bash
./mvnw test
```

### Test Coverage
The project includes comprehensive tests:
- **Unit Tests**: Service and controller layer testing
- **Integration Tests**: Full application context testing
- **Mocking**: Extensive use of Mockito for isolation

### Test Configuration
Tests use H2 in-memory database with test-specific configuration in `application-test.properties`.

## 🐳 Docker Support

### Database Services
```bash
# Start PostgreSQL and pgvector
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f
```

### Application Containerization
The project is ready for containerization with Spring Boot's built-in Docker support:

```bash
./mvnw spring-boot:build-image
```

## 🔧 Development

### Prerequisites
- IDE with Java 25 support (IntelliJ IDEA, Eclipse, VS Code)
- Maven integration
- Docker for local database

### Hot Reload
The application includes Spring Boot DevTools for automatic restart during development.

### API Testing
Use the included `api.http` file with HTTP clients like:
- IntelliJ IDEA HTTP Client
- VS Code REST Client
- Postman
- curl

## 📖 Dependencies

### Core Dependencies
- **Spring Boot 4.1.0**: Application framework
- **Spring AI 2.0.0**: AI integration framework
- **OpenAI Integration**: Chat completion APIs
- **PostgreSQL**: Production database
- **H2**: Test database

### AI Features
- **Chat Memory**: JDBC-based conversation storage
- **Vector Store**: Semantic search capabilities
- **PDF Reader**: Document processing
- **Prompt Templates**: Structured AI interactions

### Development Tools
- **Spring Boot DevTools**: Hot reload
- **Spring Boot Test**: Testing framework
- **Mockito**: Mocking framework
- **AssertJ**: Fluent assertions

## 🚀 Deployment

### Local Development
```bash
# With Maven
./mvnw spring-boot:run

# With Docker Compose
docker compose up -d postgres
./mvnw spring-boot:run
```

### Production Considerations
1. **Environment Variables**: Secure API key management
2. **Database**: PostgreSQL with pgvector extension
3. **Monitoring**: Spring Boot Actuator endpoints
4. **Logging**: Structured logging configuration
5. **Security**: API authentication and authorization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow Java coding standards
- Write comprehensive tests
- Update documentation
- Use meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Ensure PostgreSQL is running
docker compose ps

# Check database logs
docker compose logs postgres
```

#### OpenAI API Issues
```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Check application logs for API errors
./mvnw spring-boot:run
```

#### Test Failures
```bash
# Run tests with verbose output
./mvnw test -X

# Run specific test class
./mvnw test -Dtest=ChatControllerTest
```

### Support
- Create an issue for bugs or feature requests
- Check existing issues for solutions
- Review Spring AI documentation: https://docs.spring.io/spring-ai/reference/

## 🔗 Related Resources

- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

**Built with ❤️ using Spring AI and Spring Boot**
