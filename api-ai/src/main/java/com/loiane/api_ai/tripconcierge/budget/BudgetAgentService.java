package com.loiane.api_ai.tripconcierge.budget;

import java.time.temporal.ChronoUnit;
import java.time.LocalDate;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;

/**
 * Budget planning agent. Given the traveler's total budget, the flight cost and the
 * trip length, breaks down a realistic estimate for lodging, food and activities,
 * converting currencies as needed via the currency tool.
 */
@Service
public class BudgetAgentService {

    private static final Logger logger = LoggerFactory.getLogger(BudgetAgentService.class);

    private static final String SYSTEM_PROMPT = """
            You are a travel budget planner. Given a traveler's total budget, currency,
            the cost of their flight (which may be in a different currency), and the
            number of nights of the trip, produce a realistic spend breakdown:
            lodging estimate, food estimate, and activities estimate, plus the amount
            remaining after all of these and the flight are subtracted from the budget.

            Use the convertCurrency tool whenever the flight cost currency differs from
            the traveler's budget currency, so all figures in your breakdown are in the
            traveler's budget currency.

            If the estimated spend exceeds the budget, still provide the breakdown but
            note this clearly in the notes field, along with any suggestion to reduce
            costs (e.g. shorter trip, cheaper lodging tier).
            """;

    private static final PromptTemplate BUDGET_PROMPT = new PromptTemplate("""
            Traveler budget: {budget} {budgetCurrency}
            Flight cost: {flightCost} {flightCurrency}
            Trip length: {nights} nights
            Number of travelers: {travelers}
            """);

    private final ChatClient chatClient;

    public BudgetAgentService(ChatClient.Builder chatClientBuilder, CurrencyTools currencyTools) {
        this.chatClient = chatClientBuilder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultTools(currencyTools)
                .build();
    }

    public BudgetBreakdown planBudget(double budget, String budgetCurrency, double flightCost,
            String flightCurrency, LocalDate startDate, LocalDate endDate, int travelers) {
        logger.info("Planning budget: {} {} budget, flight cost {} {}", budget, budgetCurrency, flightCost, flightCurrency);

        long nights = Math.max(1, ChronoUnit.DAYS.between(startDate, endDate));

        String prompt = BUDGET_PROMPT.render(Map.of(
                "budget", budget,
                "budgetCurrency", budgetCurrency,
                "flightCost", flightCost,
                "flightCurrency", flightCurrency,
                "nights", nights,
                "travelers", travelers
        ));

        return chatClient.prompt()
                .user(prompt)
                .call()
                .entity(BudgetBreakdown.class);
    }
}
