package com.loiane.api_ai.booksprompt;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

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
        PromptTemplate promptTemplate = new PromptTemplate("Generate a list of books written by {authorName}?");
        Prompt prompt = promptTemplate.create(Map.of("authorName", author));

        return chatClient.prompt(prompt).call().entity(Author.class);
    }
}
