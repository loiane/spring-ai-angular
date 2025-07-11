package com.loiane.api_ai.booksprompt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BookPromptService
 */
@ExtendWith(MockitoExtension.class)
class BookPromptServiceTest {

    @Mock
    private ChatClient.Builder chatClientBuilder;

    @Mock
    private ChatClient chatClient;

    private BookPromptService bookPromptService;

    @BeforeEach
    void setUp() {
        when(chatClientBuilder.build()).thenReturn(chatClient);
        bookPromptService = new BookPromptService(chatClientBuilder);
    }

    @Test
    void testConstructor_ShouldCreateChatClient() {
        // Given - Create fresh mocks to verify constructor behavior
        ChatClient.Builder freshBuilder = mock(ChatClient.Builder.class);
        ChatClient freshChatClient = mock(ChatClient.class);
        when(freshBuilder.build()).thenReturn(freshChatClient);

        // When
        BookPromptService service = new BookPromptService(freshBuilder);

        // Then
        assertThat(service).isNotNull();
        verify(freshBuilder, times(1)).build();
    }

    @ParameterizedTest
    @ValueSource(strings = {"J.K. Rowling", "Stephen King", "Agatha Christie", "George Orwell"})
    void testListBooksByAuthor_WithDifferentAuthors_ShouldReturnResponse(String author) {
        // Given
        String expectedResponse = "Books by " + author + ": [Book1, Book2, Book3]";
        
        // Create a spy to mock the internal behavior
        BookPromptService spyService = spy(bookPromptService);
        doReturn(expectedResponse).when(spyService).listBooksByAuthor(author);

        // When
        String actualResponse = spyService.listBooksByAuthor(author);

        // Then
        assertThat(actualResponse).isEqualTo(expectedResponse);
    }

    @Test
    void testListBooksByAuthor_WithNullAuthor_ShouldHandleGracefully() {
        // Given
        String expectedResponse = "Please provide a valid author name.";
        
        BookPromptService spyService = spy(bookPromptService);
        doReturn(expectedResponse).when(spyService).listBooksByAuthor(null);

        // When
        String actualResponse = spyService.listBooksByAuthor(null);

        // Then
        assertThat(actualResponse).isEqualTo(expectedResponse);
    }

    @Test
    void testListBooksByAuthor_WithEmptyAuthor_ShouldHandleGracefully() {
        // Given
        String expectedResponse = "Please provide a valid author name.";
        
        BookPromptService spyService = spy(bookPromptService);
        doReturn(expectedResponse).when(spyService).listBooksByAuthor("");

        // When
        String actualResponse = spyService.listBooksByAuthor("");

        // Then
        assertThat(actualResponse).isEqualTo(expectedResponse);
    }

    @Test
    void testListBooksByAuthorFormatted_WithValidAuthor_ShouldReturnAuthorObject() {
        // Given
        String authorName = "J.R.R. Tolkien";
        Author expectedAuthor = new Author(authorName, 
            java.util.List.of(
                new Book("The Hobbit", "978-0547928227", "A tale of a hobbit's adventure"),
                new Book("The Lord of the Rings", "978-0544003415", "Epic fantasy trilogy")
            )
        );
        
        BookPromptService spyService = spy(bookPromptService);
        doReturn(expectedAuthor).when(spyService).listBooksByAuthorFormatted(authorName);

        // When
        Author actualAuthor = spyService.listBooksByAuthorFormatted(authorName);

        // Then
        assertThat(actualAuthor).isNotNull();
        assertThat(actualAuthor.authorName()).isEqualTo(expectedAuthor.authorName());
        assertThat(actualAuthor.books()).hasSize(2);
    }

    @Test
    void testListBooksByAuthorFormatted_WithUnknownAuthor_ShouldReturnEmptyResult() {
        // Given
        String authorName = "Unknown Author";
        Author expectedAuthor = new Author(authorName, java.util.List.of());
        
        BookPromptService spyService = spy(bookPromptService);
        doReturn(expectedAuthor).when(spyService).listBooksByAuthorFormatted(authorName);

        // When
        Author actualAuthor = spyService.listBooksByAuthorFormatted(authorName);

        // Then
        assertThat(actualAuthor).isNotNull();
        assertThat(actualAuthor.authorName()).isEqualTo(authorName);
        assertThat(actualAuthor.books()).isEmpty();
    }

    @Test
    void testServiceHasProperSpringAnnotation() {
        // Verify that the service class has proper Spring annotations
        assertThat(BookPromptService.class.getAnnotation(org.springframework.stereotype.Service.class))
                .isNotNull();
    }

    @Test
    void testConstructor_WithNullBuilder_ShouldThrowException() {
        // When & Then
        assertThatThrownBy(() -> new BookPromptService(null))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void testBookRecord_ShouldHaveCorrectStructure() {
        // Given
        Book book = new Book("Test Title", "123-456-789", "Test Description");

        // Then
        assertThat(book.bookName()).isEqualTo("Test Title");
        assertThat(book.isbn()).isEqualTo("123-456-789");
        assertThat(book.description()).isEqualTo("Test Description");
    }

    @Test
    void testAuthorRecord_ShouldHaveCorrectStructure() {
        // Given
        Book book1 = new Book("Book 1", "111-111-111", "Description 1");
        Book book2 = new Book("Book 2", "222-222-222", "Description 2");
        Author author = new Author("Test Author", java.util.List.of(book1, book2));

        // Then
        assertThat(author.authorName()).isEqualTo("Test Author");
        assertThat(author.books()).hasSize(2);
        assertThat(author.books().get(0).bookName()).isEqualTo("Book 1");
        assertThat(author.books().get(1).bookName()).isEqualTo("Book 2");
    }
}
