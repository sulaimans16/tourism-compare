package com.tourismcompare.pricing.api;

import com.tourismcompare.pricing.provider.ProviderException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ProviderException.class)
    ResponseEntity<ErrorBody> provider(ProviderException e) {
        return ResponseEntity.status(e.code().status).body(ErrorBody.of(e.code().name(), e.getMessage()));
    }

    @ExceptionHandler({IllegalArgumentException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorBody> badRequest(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorBody.of("BAD_REQUEST", e.getMessage()));
    }
}
