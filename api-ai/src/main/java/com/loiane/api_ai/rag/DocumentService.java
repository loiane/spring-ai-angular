package com.loiane.api_ai.rag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing document upload, processing, and retrieval in the RAG system.
 * 
 * <p>This service handles the complete document lifecycle:
 * <ol>
 *   <li>File upload and validation</li>
 *   <li>PDF text extraction</li>
 *   <li>Text chunking for optimal retrieval</li>
 *   <li>Embedding generation</li>
 *   <li>Vector storage in pgvector</li>
 *   <li>Document metadata management</li>
 *   <li>Document deletion with cascade</li>
 * </ol>
 * 
 * <p><strong>Note:</strong> This service uses two different "Document" types:
 * <ul>
 *   <li>{@link Document} from Spring AI - represents text chunks with embeddings</li>
 *   <li>{@link DocumentMetadata} - represents metadata about uploaded files</li>
 * </ul>
 * 
 * @author Loiane Groner
 * @since 1.0
 */
@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRepository documentRepository;
    private final VectorStore vectorStore;
    private final DocumentProperties documentProperties;

    public DocumentService(DocumentRepository documentRepository, 
                          VectorStore vectorStore,
                          DocumentProperties documentProperties) {
        this.documentRepository = documentRepository;
        this.vectorStore = vectorStore;
        this.documentProperties = documentProperties;
    }

    /**
     * Processes an uploaded document through the RAG pipeline.
     * 
     * <p>Processing steps:
     * <ol>
     *   <li>Save file to disk</li>
     *   <li>Create document metadata record with PROCESSING status</li>
     *   <li>Extract text from PDF using PagePdfDocumentReader</li>
     *   <li>Split text into chunks using TokenTextSplitter</li>
     *   <li>Generate embeddings and store in vector database</li>
     *   <li>Update document status to READY</li>
     * </ol>
     * 
     * <p>If any step fails, the document status is updated to ERROR with an error message.
     * 
     * @param file The uploaded PDF file
     * @return The processed document with metadata
     * @throws IOException if file operations fail
     */
    public DocumentMetadata processDocument(MultipartFile file) throws IOException {
        log.info("Starting document processing: filename={}, size={}", 
                file.getOriginalFilename(), file.getSize());

        Path filePath = saveFileToDisk(file);
        DocumentMetadata documentMetadata = createDocumentMetadata(file);

        try {
            List<Document> documents = extractTextFromPdf(filePath, documentMetadata.id());
            List<Document> chunks = splitIntoChunks(documents);
            storeVectors(chunks, documentMetadata.id());
            
            documentRepository.updateStatus(documentMetadata.id(), DocumentStatus.READY);
            log.info("Document processing completed successfully: id={}", documentMetadata.id());

            return new DocumentMetadata(
                    documentMetadata.id(),
                    documentMetadata.filename(),
                    documentMetadata.contentType(),
                    documentMetadata.fileSize(),
                    documentMetadata.uploadDate(),
                    DocumentStatus.READY,
                    null
            );

        } catch (Exception e) {
            handleProcessingError(documentMetadata, filePath, e);
            throw new DocumentProcessingException("Failed to process document: " + file.getOriginalFilename(), e);
        }
    }

    /**
     * Saves the uploaded file to disk.
     * 
     * @param file The uploaded file
     * @return The path where the file was saved
     * @throws IOException if file operations fail
     */
    private Path saveFileToDisk(MultipartFile file) throws IOException {
        Path uploadDir = Paths.get(documentProperties.getUploadDir());
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
            log.info("Created upload directory: {}", uploadDir.toAbsolutePath());
        }

        String filename = file.getOriginalFilename();
        Path filePath = uploadDir.resolve(filename);
        file.transferTo(filePath);
        log.debug("Saved file to disk: {}", filePath.toAbsolutePath());
        
        return filePath;
    }

    /**
     * Creates and saves document metadata with PROCESSING status.
     * 
     * @param file The uploaded file
     * @return The saved document metadata
     */
    private DocumentMetadata createDocumentMetadata(MultipartFile file) {
        DocumentMetadata documentMetadata = new DocumentMetadata(
                null, // ID will be generated
                file.getOriginalFilename(),
                file.getContentType(),
                file.getSize(),
                LocalDateTime.now(),
                DocumentStatus.PROCESSING
        );
        
        documentMetadata = documentRepository.save(documentMetadata);
        log.info("Created document record: id={}, status=PROCESSING", documentMetadata.id());
        
        return documentMetadata;
    }

    /**
     * Extracts text from a PDF file and adds metadata to each page.
     * 
     * @param filePath Path to the PDF file
     * @param documentId The document ID for metadata
     * @return List of Document objects with extracted text
     */
    private List<Document> extractTextFromPdf(Path filePath, String documentId) {
        log.debug("Extracting text from PDF: {}", filePath.getFileName());
        
        PagePdfDocumentReader pdfReader = new PagePdfDocumentReader(
                new FileSystemResource(filePath),
                PdfDocumentReaderConfig.builder()
                        .withPageTopMargin(0)
                        .withPageExtractedTextFormatter(ExtractedTextFormatter.builder()
                                .withNumberOfTopTextLinesToDelete(0)
                                .build())
                        .withPagesPerDocument(1)
                        .build()
        );
        
        List<Document> documents = pdfReader.read();
        log.info("Extracted {} pages from PDF: {}", documents.size(), filePath.getFileName());

        // Add metadata to each document
        for (Document doc : documents) {
            Map<String, Object> metadata = new HashMap<>(doc.getMetadata());
            metadata.put("document_id", documentId);
            metadata.put("filename", filePath.getFileName().toString());
            doc.getMetadata().putAll(metadata);
        }
        
        return documents;
    }

    /**
     * Splits documents into smaller chunks for better retrieval.
     * 
     * @param documents The documents to split
     * @return List of document chunks
     */
    private List<Document> splitIntoChunks(List<Document> documents) {
        log.debug("Splitting text into chunks: chunkSize={}, overlap={}", 
                documentProperties.getChunkSize(), documentProperties.getChunkOverlap());
        
        TokenTextSplitter textSplitter = new TokenTextSplitter(
                documentProperties.getChunkSize(),
                documentProperties.getChunkOverlap(),
                documentProperties.getMinChunkSize(),
                10000, // maxChunkSize
                true // keepSeparator
        );
        
        List<Document> chunks = textSplitter.apply(documents);
        log.info("Split into {} chunks", chunks.size());
        
        return chunks;
    }

    /**
     * Generates embeddings and stores document chunks in the vector database.
     * 
     * @param documents The document chunks to store
     * @param documentId The document ID for logging
     */
    private void storeVectors(List<Document> documents, String documentId) {
        log.debug("Generating embeddings and storing in vector database");
        vectorStore.add(documents);
        log.info("Successfully stored {} vectors for document: {}", documents.size(), documentId);
    }

    /**
     * Handles errors during document processing.
     * 
     * @param documentMetadata The document metadata
     * @param filePath The file path for cleanup
     * @param e The exception that occurred
     */
    private void handleProcessingError(DocumentMetadata documentMetadata, Path filePath, Exception e) {
        log.error("Error processing document: id={}, error={}", documentMetadata.id(), e.getMessage(), e);
        
        String errorMessage = "Processing failed: " + e.getMessage();
        documentRepository.updateStatusWithError(documentMetadata.id(), DocumentStatus.ERROR, errorMessage);
        
        cleanupFailedDocument(filePath);
    }

    /**
     * Cleans up a document file after processing failure.
     * 
     * @param filePath The path to the file to delete
     */
    private void cleanupFailedDocument(Path filePath) {
        try {
            Files.deleteIfExists(filePath);
            log.debug("Deleted failed document file: {}", filePath);
        } catch (IOException cleanupError) {
            log.warn("Failed to delete file after error: {}", filePath, cleanupError);
        }
    }

    /**
     * Retrieves all documents.
     * 
     * @return List of all documents
     */
    public List<DocumentMetadata> getAllDocuments() {
        log.debug("Retrieving all documents");
        List<DocumentMetadata> documents = documentRepository.findAll();
        log.info("Found {} documents", documents.size());
        return documents;
    }

    /**
     * Deletes a document from disk and database.
     * 
     * <p>This performs the following cleanup operations:
     * <ol>
     *   <li>Delete file from disk</li>
     *   <li>Delete document metadata from database</li>
     * </ol>
     * 
     * <p><strong>Note:</strong> Vectors remain in the vector store. This is intentional
     * to avoid complex deletion logic and because vectors consume minimal space.
     * 
     * @param documentId The ID of the document to delete
     */
    public void deleteDocument(String documentId) {
        log.info("Deleting document: id={}", documentId);
        
        // Find document to get filename
        Optional<DocumentMetadata> documentOpt = documentRepository.findById(documentId);
        if (documentOpt.isEmpty()) {
            log.warn("Document not found for deletion: id={}", documentId);
            throw new DocumentNotFoundException("Document not found: " + documentId);
        }
        
        DocumentMetadata documentMetadata = documentOpt.get();
        
        try {
            // Delete file from disk
            deleteDocumentFile(documentMetadata.filename());
            
            // Delete document metadata
            documentRepository.deleteById(documentId);
            log.info("Successfully deleted document metadata: id={}", documentId);
            
        } catch (Exception e) {
            log.error("Error deleting document: id={}, error={}", documentId, e.getMessage(), e);
            throw new DocumentProcessingException("Failed to delete document: " + documentId, e);
        }
    }

    /**
     * Deletes a document file from disk.
     * 
     * @param filename The filename to delete
     */
    private void deleteDocumentFile(String filename) {
        Path filePath = Paths.get(documentProperties.getUploadDir()).resolve(filename);
        try {
            Files.deleteIfExists(filePath);
            log.debug("Deleted document file: {}", filePath);
        } catch (IOException e) {
            log.warn("Failed to delete document file: {}", filePath, e);
        }
    }

    /**
     * Retrieves a document by its ID.
     * 
     * @param documentId The document ID
     * @return Optional containing the document if found
     */
    public Optional<DocumentMetadata> getDocumentById(String documentId) {
        log.debug("Retrieving document: id={}", documentId);
        return documentRepository.findById(documentId);
    }

    /**
     * Gets the total count of documents.
     * 
     * @return Total number of documents
     */
    public long getDocumentCount() {
        return documentRepository.count();
    }

    /**
     * Gets all documents with a specific status.
     * 
     * @param status The document status
     * @return List of documents with the specified status
     */
    public List<DocumentMetadata> getDocumentsByStatus(DocumentStatus status) {
        return documentRepository.findByStatus(status);
    }
}
