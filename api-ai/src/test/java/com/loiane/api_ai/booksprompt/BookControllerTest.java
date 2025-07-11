package com.loiane.api_ai.booksprompt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for BookController
 */
@ExtendWith(MockitoExtension.class)
class BookControllerTest {

    @Mock
    private BookPromptService bookPromptService;

    private BookController bookController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        bookController = new BookController(bookPromptService);
        mockMvc = MockMvcBuilders.standaloneSetup(bookController).build();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Stephen King", "Agatha Christie", "George Orwell"})
    void testListBooksByAuthorString_WithDifferentAuthors_ShouldReturnStringResponse(String author) throws Exception {
        // Given
        String expectedResponse = "Books by " + author + ": [Book1, Book2, Book3]";
        when(bookPromptService.listBooksByAuthor(author)).thenReturn(expectedResponse);

        // When & Then
        mockMvc.perform(get("/api/books/by-author")
                .param("author", author))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string(expectedResponse));

        verify(bookPromptService, times(1)).listBooksByAuthor(author);
    }

    @Test
    void testListBooksByAuthorString_WithNullAuthor_ShouldHandleGracefully() throws Exception {
        // Given
        String expectedResponse = "Please provide a valid author name.";
        when(bookPromptService.listBooksByAuthor(null)).thenReturn(expectedResponse);

        // When & Then
        mockMvc.perform(get("/api/books/by-author"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string(expectedResponse));

        verify(bookPromptService, times(1)).listBooksByAuthor(null);
    }

    @Test
    void testListBooksByAuthorString_WithEmptyAuthor_ShouldHandleGracefully() throws Exception {
        // Given
        String author = "";
        String expectedResponse = "Please provide a valid author name.";
        when(bookPromptService.listBooksByAuthor(author)).thenReturn(expectedResponse);

        // When & Then
        mockMvc.perform(get("/api/books/by-author")
                .param("author", author))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string(expectedResponse));

        verify(bookPromptService, times(1)).listBooksByAuthor(author);
    }

    @ParameterizedTest
    @ValueSource(strings = {"J.R.R. Tolkien", "Isaac Asimov", "Douglas Adams"})
    void testListBooksByAuthorFormatted_WithDifferentAuthors_ShouldReturnAuthorObject(String authorName) throws Exception {
        // Given
        Author expectedAuthor = new Author(authorName, 
            List.of(
                new Book("Book 1", "123-456-789", "Description 1"),
                new Book("Book 2", "987-654-321", "Description 2")
            )
        );
        when(bookPromptService.listBooksByAuthorFormatted(authorName)).thenReturn(expectedAuthor);

        // When & Then
        mockMvc.perform(get("/api/books/by-author-formatted")
                .param("author", authorName))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.authorName").value(authorName))
                .andExpect(jsonPath("$.books").isArray())
                .andExpect(jsonPath("$.books.length()").value(2))
                .andExpect(jsonPath("$.books[0].bookName").value("Book 1"))
                .andExpect(jsonPath("$.books[1].bookName").value("Book 2"));

        verify(bookPromptService, times(1)).listBooksByAuthorFormatted(authorName);
    }

    @Test
    void testListBooksByAuthorFormatted_WithUnknownAuthor_ShouldReturnEmptyResult() throws Exception {
        // Given
        String authorName = "Unknown Author";
        Author expectedAuthor = new Author(authorName, List.of());
        when(bookPromptService.listBooksByAuthorFormatted(authorName)).thenReturn(expectedAuthor);

        // When & Then
        mockMvc.perform(get("/api/books/by-author-formatted")
                .param("author", authorName))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.authorName").value(authorName))
                .andExpect(jsonPath("$.books").isArray())
                .andExpect(jsonPath("$.books.length()").value(0));

        verify(bookPromptService, times(1)).listBooksByAuthorFormatted(authorName);
    }

    @Test
    void testListBooksByAuthorFormatted_WithNullAuthor_ShouldHandleGracefully() throws Exception {
        // Given
        Author expectedAuthor = new Author("", List.of());
        when(bookPromptService.listBooksByAuthorFormatted(null)).thenReturn(expectedAuthor);

        // When & Then
        mockMvc.perform(get("/api/books/by-author-formatted"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"));

        verify(bookPromptService, times(1)).listBooksByAuthorFormatted(null);
    }

    @Test
    void testEndpointMapping_ShouldMapToCorrectController() throws Exception {
        // Given
        String author = "Test Author";
        String expectedResponse = "Test response";
        when(bookPromptService.listBooksByAuthor(author)).thenReturn(expectedResponse);

        // When & Then
        mockMvc.perform(get("/api/books/by-author")
                .param("author", author))
                .andExpect(status().isOk())
                .andExpect(handler().handlerType(BookController.class))
                .andExpect(handler().methodName("listBooksByAuthorString"));
    }

    @Test
    void testEndpointMappingFormatted_ShouldMapToCorrectController() throws Exception {
        // Given
        String author = "Test Author";
        Author expectedAuthor = new Author(author, List.of());
        when(bookPromptService.listBooksByAuthorFormatted(author)).thenReturn(expectedAuthor);

        // When & Then
        mockMvc.perform(get("/api/books/by-author-formatted")
                .param("author", author))
                .andExpect(status().isOk())
                .andExpect(handler().handlerType(BookController.class))
                .andExpect(handler().methodName("listBooksByAuthor"));
    }

    @Test
    void testControllerHasProperAnnotations() {
        // Verify that the controller class has proper Spring annotations
        org.springframework.web.bind.annotation.RestController restControllerAnnotation = 
            BookController.class.getAnnotation(org.springframework.web.bind.annotation.RestController.class);
        org.springframework.web.bind.annotation.RequestMapping requestMappingAnnotation = 
            BookController.class.getAnnotation(org.springframework.web.bind.annotation.RequestMapping.class);

        assertThat(restControllerAnnotation).isNotNull();
        assertThat(requestMappingAnnotation).isNotNull();
        assertThat(requestMappingAnnotation.value()).containsExactly("/api/books");
    }
}
