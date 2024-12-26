package com.loiane.api_ai.booksprompt;

import java.util.List;

public record Author(String authorName, List<Book> books) {
}
