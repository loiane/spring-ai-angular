package com.loiane.api_ai.booksprompt;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class BookPromptService {

    private final ChatClient chatClient;

    @Value("classpath:templates/books-by-author.st")
    private Resource booksByAuthor;

    public BookPromptService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String listBooksByAuthor(String author) {
        PromptTemplate promptTemplate = new PromptTemplate(booksByAuthor);
        Prompt prompt = promptTemplate.create(Map.of("authorName", author));

        return chatClient.prompt(prompt).call().content();
    }

    public Author listBooksByAuthorFormatted(String author) {
        String system = "You are a book lover assistant system. For each book description, asnwer with the tone of a Tolkien elf.";
        SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(system);
        Message systemMessage = systemPromptTemplate.createMessage();

        PromptTemplate promptTemplate = new PromptTemplate("Generate a list of books written by {authorName}?");
        Message userMessage = promptTemplate.createMessage(Map.of("authorName", author));

        Prompt prompt = new Prompt(List.of(systemMessage, userMessage));

        return chatClient.prompt(prompt).call().entity(Author.class);
    }
}
