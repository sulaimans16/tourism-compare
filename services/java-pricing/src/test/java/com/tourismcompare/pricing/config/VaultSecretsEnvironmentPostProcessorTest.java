package com.tourismcompare.pricing.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.logging.DeferredLogs;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.io.support.SpringFactoriesLoader;
import org.springframework.core.env.StandardEnvironment;

class VaultSecretsEnvironmentPostProcessorTest {

    private HttpServer server;
    private final AtomicReference<String> auth = new AtomicReference<>();

    private String start(int status, String body) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/rest/v1/rpc/get_app_secrets", ex -> {
            auth.set(ex.getRequestHeaders().getFirst("Authorization"));
            byte[] b = body.getBytes(StandardCharsets.UTF_8);
            ex.sendResponseHeaders(status, b.length);
            ex.getResponseBody().write(b);
            ex.close();
        });
        server.start();
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    @AfterEach
    void stop() {
        if (server != null) server.stop(0);
    }

    private StandardEnvironment env(Map<String, Object> props) {
        var env = new StandardEnvironment();
        env.getPropertySources().addFirst(new MapPropertySource("test", new HashMap<>(props)));
        return env;
    }

    @Test
    void fillsMissingSecretsAndEnvWins() throws Exception {
        String url = start(200, "[{\"name\":\"SERPAPI_API_KEY\",\"value\":\"vault-serp\"},"
                + "{\"name\":\"PRICING_SERVICE_TOKEN\",\"value\":\"vault-token\"}]");
        var env = env(Map.of("SUPABASE_URL", url, "SUPABASE_SERVICE_ROLE_KEY", "svc", "PRICING_SERVICE_TOKEN", "env-token"));
        new VaultSecretsEnvironmentPostProcessor(new DeferredLogs()).postProcessEnvironment(env, new SpringApplication());
        assertThat(env.getProperty("SERPAPI_API_KEY")).isEqualTo("vault-serp");
        assertThat(env.getProperty("PRICING_SERVICE_TOKEN")).isEqualTo("env-token");
        assertThat(auth.get()).isEqualTo("Bearer svc");
    }

    @Test
    void failsLoudlyWhenRpcMissing() throws Exception {
        String url = start(404, "{}");
        var env = env(Map.of("SUPABASE_URL", url, "SUPABASE_SERVICE_ROLE_KEY", "svc"));
        assertThatThrownBy(() -> new VaultSecretsEnvironmentPostProcessor(new DeferredLogs())
                .postProcessEnvironment(env, new SpringApplication()))
                .hasMessageContaining("app_secrets.sql");
    }

    @Test
    void isRegisteredWithSpringBoot() {
        var names = SpringFactoriesLoader.forDefaultResourceLocation()
                .load(EnvironmentPostProcessor.class, SpringFactoriesLoader.ArgumentResolver.of(
                        org.springframework.boot.logging.DeferredLogFactory.class, new DeferredLogs()))
                .stream().map(p -> p.getClass().getName()).toList();
        assertThat(names).contains(VaultSecretsEnvironmentPostProcessor.class.getName());
    }

    @Test
    void skipsWithoutServiceRoleKey() {
        var env = env(Map.of("SUPABASE_URL", "http://unused"));
        new VaultSecretsEnvironmentPostProcessor(new DeferredLogs()).postProcessEnvironment(env, new SpringApplication());
        assertThat(env.getPropertySources().contains(VaultSecretsEnvironmentPostProcessor.SOURCE_NAME)).isFalse();
    }
}
