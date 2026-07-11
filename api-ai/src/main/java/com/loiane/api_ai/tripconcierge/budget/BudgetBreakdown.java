package com.loiane.api_ai.tripconcierge.budget;

/**
 * A breakdown of estimated trip spend against the traveler's budget.
 */
public record BudgetBreakdown(
        String currency,
        double flightCost,
        double lodgingEstimate,
        double activitiesEstimate,
        double foodEstimate,
        double remaining,
        String notes
) {
}
