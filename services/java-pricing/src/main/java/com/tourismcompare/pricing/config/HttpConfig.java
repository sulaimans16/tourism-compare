package com.tourismcompare.pricing.config;

import java.net.http.HttpClient;
import java.util.concurrent.Executors;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpConfig {

    /** JDK HttpClient honours the JVM proxy settings (https.proxyHost) and runs on virtual threads. */
    @Bean
    HttpClient jdkHttpClient(PricingProperties props) {
        return HttpClient.newBuilder()
                .connectTimeout(props.serpapi().timeout())
                .followRedirects(HttpClient.Redirect.NORMAL)
                .executor(Executors.newVirtualThreadPerTaskExecutor())
                .build();
    }

    @Bean
    RestClient.Builder pricingRestClientBuilder(HttpClient jdkHttpClient, PricingProperties props) {
        var factory = new JdkClientHttpRequestFactory(jdkHttpClient);
        factory.setReadTimeout(props.serpapi().timeout());
        return RestClient.builder().requestFactory(factory);
    }
}
