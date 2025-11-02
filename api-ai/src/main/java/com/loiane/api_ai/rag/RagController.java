package com.loiane.api_ai.rag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

import com.loiane.api_ai.rag.exception.DocumentNotFoundException;
import com.loiane.api_ai.rag.model.DocumentMetadata;
import com.loiane.api_ai.rag.model.RagResponse;

@RestController
@RequestMapping("/api/rag")
public class RagController {

    private static final Logger log = LoggerFactory.getLogger(RagController.class);

    private final DocumentService documentService;
    private final RagService ragService;

    public RagController(DocumentService documentService, RagService ragService) {
        this.documentService = documentService;
        this.ragService = ragService;
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentMetadata> upload(@RequestParam("file") MultipartFile file) {
        try {
            DocumentMetadata saved = documentService.processDocument(file);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IOException e) {
            log.error("Upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/documents")
    public List<DocumentMetadata> listDocuments() {
        return documentService.getAllDocuments();
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<DocumentMetadata> getDocument(@PathVariable String id) {
        return documentService.getDocumentById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id) {
        try {
            documentService.deleteDocument(id);
            return ResponseEntity.noContent().build();
        } catch (DocumentNotFoundException _) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/ask")
    public ResponseEntity<RagResponse> ask(@RequestBody String question) {
        RagResponse response = ragService.askQuestion(question);
        return ResponseEntity.ok(response);
    }
}
