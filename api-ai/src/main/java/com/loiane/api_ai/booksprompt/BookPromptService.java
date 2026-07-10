package com.loiane.api_ai.booksprompt;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.content.Media;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class BookPromptService {

    private static final Set<String> SUPPORTED_IMAGE_TYPES = Set.of("image/png", "image/jpeg");

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

    public Book identifyBookFromCover(MultipartFile image) {
        String contentType = image.getContentType();
        if (contentType == null || !SUPPORTED_IMAGE_TYPES.contains(contentType)) {
            throw new BookCoverException("Unsupported image type: " + contentType);
        }

        byte[] imageBytes;
        try {
            imageBytes = image.getBytes();
        } catch (IOException e) {
            throw new BookCoverException("Failed to read uploaded image", e);
        }

        Media media = new Media(MimeType.valueOf(contentType), new ByteArrayResource(imageBytes));
        UserMessage userMessage = UserMessage.builder()
                .text("Identify the book shown on this cover. Provide its title as bookName, its ISBN if visible "
                        + "(otherwise an empty string), and a short description of the book.")
                .media(media)
                .build();

        return chatClient.prompt(new Prompt(userMessage)).call().entity(Book.class);
    }
}
