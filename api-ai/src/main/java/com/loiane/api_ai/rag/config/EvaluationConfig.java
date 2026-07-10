package com.loiane.api_ai.rag.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.evaluation.RelevancyEvaluator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for evaluating RAG answer quality.
 *
 * @author Loiane Groner
 * @since 1.0
 */
@Configuration
public class EvaluationConfig {

    @Bean
    public RelevancyEvaluator relevancyEvaluator(ChatClient.Builder chatClientBuilder) {
        return RelevancyEvaluator.builder()
                .chatClientBuilder(chatClientBuilder)
                .build();
    }
}
