package com.loiane.api_ai.tripconcierge.budget;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

/**
 * Currency conversion tool for the budget agent. Uses a small static rate table
 * (relative to USD) since this demo has no live FX data source; rates are
 * illustrative only, not suitable for real financial use.
 */
@Component
public class CurrencyTools {

    private static final Logger logger = LoggerFactory.getLogger(CurrencyTools.class);

    private static final Map<String, Double> USD_RATES = Map.ofEntries(
            Map.entry("USD", 1.0),
            Map.entry("EUR", 0.92),
            Map.entry("GBP", 0.79),
            Map.entry("JPY", 156.0),
            Map.entry("BRL", 5.6),
            Map.entry("CAD", 1.37),
            Map.entry("AUD", 1.52),
            Map.entry("MXN", 18.0),
            Map.entry("CHF", 0.88),
            Map.entry("CNY", 7.25)
    );

    @Tool(description = "Convert an amount from one currency to another using indicative exchange rates. "
            + "Supported currencies: USD, EUR, GBP, JPY, BRL, CAD, AUD, MXN, CHF, CNY.")
    public double convertCurrency(
            @ToolParam(description = "Amount to convert") double amount,
            @ToolParam(description = "Source currency code, e.g. USD") String from,
            @ToolParam(description = "Target currency code, e.g. EUR") String to) {
        logger.info("Tool call: convertCurrency {} {} -> {}", amount, from, to);

        Double fromRate = USD_RATES.get(from.toUpperCase());
        Double toRate = USD_RATES.get(to.toUpperCase());
        if (fromRate == null || toRate == null) {
            throw new IllegalArgumentException("Unsupported currency: " + (fromRate == null ? from : to));
        }

        double amountInUsd = amount / fromRate;
        return amountInUsd * toRate;
    }
}
