# Angular AI Client

[![Angular](https://img.shields.io/badge/Angular-22-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Angular Material](https://img.shields.io/badge/Angular%20Material-22-brightgreen.svg)](https://material.angular.io/)

A comprehensive Angular frontend client for the Spring AI backend, showcasing various AI capabilities with a modern Material Design UI.

## 🚀 Features

- **Simple Chat**: Direct chat interface for single-turn conversations
- **Memory Chat**: Multi-turn conversations with persistent history
- **Chat with Documents**: Upload documents and have context-aware conversations
- **Flight Reservations**: Manage and search flight reservations
- **Material UI Layout**: Responsive navigation with Angular Material components

## 📋 Prerequisites

- **Node.js** 20+ and npm
- **Angular CLI** 22+
- **Spring AI Backend** running on `http://localhost:8080`

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm start
```

Open your browser and navigate to `http://localhost:4200/`. The application will automatically reload when you modify source files.

### 3. API Configuration

The app uses `proxy.conf.js` to forward API calls to the backend during development. Ensure the backend is running on `http://localhost:8080`.

## 📚 Development

### Code Generation

Generate new components, services, or other artifacts using Angular CLI:

```bash
ng generate component component-name
ng generate service service-name
```

For a complete list of available schematics:

```bash
ng generate --help
```

### Building

To build the project for production:

```bash
npm run build
```

Build artifacts are stored in the `dist/` directory.

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

Tests run with [Vitest](https://vitest.dev/) and coverage reporting.

### End-to-End Tests

```bash
npm run e2e
```

E2E tests use [Playwright](https://playwright.dev/) for browser automation.

## 📁 Project Structure

```text
src/
├── app/
│   ├── chat/              # Simple chat component
│   ├── chat-memory/       # Memory chat component
│   ├── chat-documents/    # Chat with documents component
│   ├── flight-reservations/  # Flight reservations component
│   ├── services/          # API communication services
│   └── shared/            # Shared utilities and models
├── assets/                # Static assets
└── styles.scss            # Global styles
```

## 📖 Dependencies

- **Angular**: web application framework
- **Angular Material**: UI component library
- **RxJS**: reactive programming library
- **TypeScript**: typed JavaScript
- **Vitest & Playwright**: testing frameworks

## 🔧 Development Tips

- **Hot Reload**: Changes to source files automatically reload in the browser
- **DevTools**: Use Angular DevTools browser extension for debugging
- **API Testing**: Refer to `api-ai/api.http` for backend endpoint examples

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](../LICENSE) file at the repository root.

## 🔗 Related Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular Material](https://material.angular.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)

---

Built with ❤️ using Angular and Spring AI
