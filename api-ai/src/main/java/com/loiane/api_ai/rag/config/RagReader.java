package com.loiane.api_ai.rag.config;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.transformer.splitter.TextSplitter;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;

import java.io.File;
import java.util.List;

@Profile("rag")
@Configuration
public class RagReader {

    @Value("classpath:/docs/SpringAIReference.pdf")
    private Resource pdfResource;

    @Value("${app.vectorstore.file:./data/vectorstore.json}")
    private String vectorStoreFilePath;

    @Bean
    VectorStore ragVectorStore(VectorStore vectorStore) {

        // check if the document is already in the vector store
        if (!vectorStore.similaritySearch("Spring AI").isEmpty()) {
            return vectorStore;
        }
        List<Document> documents = getDocsFromPdf();
        TextSplitter textSplitter = TokenTextSplitter.builder().build();
        List<Document> splitDocuments = textSplitter.apply(documents);
        vectorStore.add(splitDocuments);
        if (vectorStore instanceof SimpleVectorStore simpleVectorStore) {
            simpleVectorStore.save(new File(vectorStoreFilePath));
        }
        return vectorStore;
    }

    private List<Document> getDocsFromPdf() {
        PagePdfDocumentReader pdfReader = new PagePdfDocumentReader(pdfResource,
                PdfDocumentReaderConfig.builder()
                        .withPageTopMargin(0)
                        .withPageExtractedTextFormatter(ExtractedTextFormatter.builder()
                                .withNumberOfTopTextLinesToDelete(0)
                                .build())
                        .withPagesPerDocument(1)
                        .build());
        return pdfReader.read();
    }
}
