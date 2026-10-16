package com.tourismcompare.pricing.provider;

import org.springframework.http.HttpStatus;

/** A failure talking to an upstream price provider, mapped to a stable error code for clients. */
public class ProviderException extends RuntimeException {

    public enum Code {
        PROVIDER_QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, false),
        PROVIDER_AUTH_FAILED(HttpStatus.BAD_GATEWAY, false),
        PROVIDER_BAD_REQUEST(HttpStatus.BAD_REQUEST, false),
        PROPERTY_NOT_FOUND(HttpStatus.NOT_FOUND, false),
        PROVIDER_UNAVAILABLE(HttpStatus.BAD_GATEWAY, true);

        public final HttpStatus status;
        /** Whether a retry might succeed. */
        public final boolean transientFailure;

        Code(HttpStatus status, boolean transientFailure) {
            this.status = status;
            this.transientFailure = transientFailure;
        }
    }

    private final Code code;

    public ProviderException(Code code, String message) {
        super(message);
        this.code = code;
    }

    public ProviderException(Code code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public Code code() {
        return code;
    }
}
