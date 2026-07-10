package com.loiane.api_ai.booksprompt;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping("/identify-cover")
    public Book identifyCover(@RequestParam MultipartFile file) {
        return bookPromptService.identifyBookFromCover(file);
    }

    @ExceptionHandler(BookCoverException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public void handleBookCoverException() {
    }
}
