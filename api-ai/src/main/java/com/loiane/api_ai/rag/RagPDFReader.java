package com.loiane.api_ai.rag;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RagPDFReader {

    List<Document> getDocsFromPdf() {
        PagePdfDocumentReader pdfReader = new PagePdfDocumentReader("classpath:/docs/SpringAIReference.pdf",
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
