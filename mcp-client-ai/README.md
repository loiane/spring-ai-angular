# MCP Client AI

A minimal Spring Boot service demonstrating the **client side** of the Model
Context Protocol (MCP): it connects to `api-ai`'s MCP server and discovers
its flight reservation tools remotely, instead of calling them in-process.

It replicates `api-ai`'s SpringFly Concierge chat behaviour, but the tools
(`getAllReservations`, `getReservation`, `searchReservationsByEmail`,
`cancelReservation`) are resolved at runtime via MCP rather than from a local
Spring bean — proving the tool call actually crosses a process boundary.

## Prerequisites

- Java 25
- `api-ai` running locally with its MCP server enabled (default: `http://localhost:8080/mcp`)
- An OpenAI API key

## Running

```bash
export OPENAI_API_KEY=your_openai_api_key_here
./mvnw spring-boot:run
```

The service starts on `http://localhost:8081`.

## Usage

```http
POST http://localhost:8081/api/chat
Content-Type: application/json

{
    "message": "Can you look up reservations for jane.doe@example.com?"
}
```

To verify the tool call actually round-trips through MCP, watch `api-ai`'s
logs while sending a request above — you should see a line like
`Tool call: searchReservationsByEmail jane.doe@example.com` originating from
the `api-ai` process, even though the request was sent to `mcp-client-ai`.

## Configuration

`src/main/resources/application.properties`:

- `spring.ai.mcp.client.streamable-http.connections.flight-reservations.url` —
  base URL of the `api-ai` MCP server
- `spring.ai.mcp.client.streamable-http.connections.flight-reservations.endpoint` —
  MCP endpoint path (`/mcp`)
- `OPENAI_API_KEY` — required environment variable

## Related

- [`api-ai`](../api-ai/README.md) — exposes the flight reservation tools, both
  in-process (SpringFly Concierge) and over MCP (this client's counterpart)
