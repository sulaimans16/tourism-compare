package com.tourismcompare.pricing.api;

public record ErrorBody(Detail error) {
    public record Detail(String code, String message) {}

    public static ErrorBody of(String code, String message) {
        return new ErrorBody(new Detail(code, message));
    }
}
