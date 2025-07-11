package com.loiane.api_ai.rag;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.transformer.splitter.TextSplitter;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

@Profile("rag")
@Configuration
public class RagReader {

    @Value("classpath:/docs/SpringAIReference.pdf")
    private Resource pdfResource;

    @Bean
    VectorStore ragVectorStore(VectorStore vectorStore, JdbcTemplate jdbcTemplate) {

        // check if the document is already in the vector store
        Integer count = jdbcTemplate.queryForObject("select count(*) from vector_store", Integer.class);

        if (count != null && count > 0) {
            return vectorStore;
        }
        List<Document> documents = getDocsFromPdf();
        TextSplitter textSplitter = new TokenTextSplitter();
        List<Document> splitDocuments = textSplitter.apply(documents);
        vectorStore.add(splitDocuments);
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
