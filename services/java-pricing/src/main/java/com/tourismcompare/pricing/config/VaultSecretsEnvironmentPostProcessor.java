package com.tourismcompare.pricing.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.logging.Log;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.boot.logging.DeferredLogFactory;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Loads secrets missing from the environment from Supabase Vault through the service-role-only
 * {@code get_app_secrets} RPC (supabase/migrations/*_app_secrets.sql). Env vars always win, because
 * the Vault source is added with the lowest precedence.
 */
public class VaultSecretsEnvironmentPostProcessor implements EnvironmentPostProcessor {

    static final List<String> KEYS = List.of("SERPAPI_API_KEY", "PRICING_SERVICE_TOKEN");
    static final String SOURCE_NAME = "supabaseVault";

    private final Log log;

    public VaultSecretsEnvironmentPostProcessor(DeferredLogFactory logFactory) {
        this.log = logFactory.getLog(VaultSecretsEnvironmentPostProcessor.class);
    }

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
        String url = env.getProperty("SUPABASE_URL", "");
        String key = env.getProperty("SUPABASE_SERVICE_ROLE_KEY", "");
        boolean anyMissing = KEYS.stream().anyMatch(k -> env.getProperty(k, "").isBlank());
        if (!anyMissing || url.isBlank() || key.isBlank()) return;

        Map<String, Object> loaded = fetch(url, key);
        loaded.keySet().removeIf(k -> !env.getProperty(k, "").isBlank());
        if (!loaded.isEmpty()) {
            env.getPropertySources().addLast(new MapPropertySource(SOURCE_NAME, loaded));
            log.info("Loaded secrets from Supabase Vault: " + loaded.keySet());
        }
    }

    static Map<String, Object> fetch(String supabaseUrl, String serviceKey) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(supabaseUrl.replaceAll("/+$", "") + "/rest/v1/rpc/get_app_secrets"))
                    .timeout(Duration.ofSeconds(10))
                    .header("apikey", serviceKey)
                    .header("Authorization", "Bearer " + serviceKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString("{}"))
                    .build();
            HttpResponse<String> res = HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                throw new IllegalStateException("Could not load secrets from Supabase Vault (HTTP " + res.statusCode()
                        + "). Apply supabase/migrations/*_app_secrets.sql and check SUPABASE_SERVICE_ROLE_KEY.");
            }
            Map<String, Object> out = new HashMap<>();
            for (JsonNode row : new ObjectMapper().readTree(res.body())) {
                String name = row.path("name").asText();
                String value = row.path("value").asText("");
                if (KEYS.contains(name) && !value.isBlank()) out.put(name, value);
            }
            return out;
        } catch (IllegalStateException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while loading secrets from Supabase Vault", e);
        } catch (Exception e) {
            throw new IllegalStateException("Could not reach Supabase Vault: " + e.getMessage(), e);
        }
    }
}
