package com.loiane.api_ai.booksprompt;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookPromptService bookPromptService;

    public BookController(BookPromptService bookPromptService) {
        this.bookPromptService = bookPromptService;
    }

    @RequestMapping("/by-author")
    public String listBooksByAuthorString(String author) {
        return bookPromptService.listBooksByAuthor(author);
    }

    @RequestMapping("/by-author-formatted")
    public Author listBooksByAuthor(String author) {
        return bookPromptService.listBooksByAuthorFormatted(author);
    }
}
