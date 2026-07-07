package com.scriptwriter.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

/**
 * Proxy for the Google Input Tools transliteration API.
 * The browser cannot call the API directly due to CORS restrictions,
 * so we relay the request through the backend.
 */
@RestController
@RequestMapping("/api/v1/transliterate")
public class TransliterateController {

    private static final String GOOGLE_URL =
            "https://inputtools.google.com/request?text={text}&itc={itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8";

    @GetMapping
    public ResponseEntity<Object> transliterate(
            @RequestParam String text,
            @RequestParam String itc) {
        try {
            RestTemplate rt = new RestTemplate();
            Object response = rt.getForObject(GOOGLE_URL, Object.class, text, itc);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Return a failure-shaped response so the frontend falls back to the original word
            return ResponseEntity.ok(new Object[]{"FAIL"});
        }
    }
}
