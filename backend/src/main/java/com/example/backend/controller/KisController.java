package com.example.backend.controller;

import com.example.backend.dto.PopularDTO;
import com.example.backend.dto.RankingDTO;
import com.example.backend.dto.ResponseOutputDTO;
import com.example.backend.service.KisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import com.example.backend.service.KisTokenService;
import lombok.extern.slf4j.Slf4j;


import java.util.List;
@Slf4j
@RestController
public class KisController {

    private KisService kisService;
    private final KisTokenService kisTokenService;

    @Autowired
    public KisController(KisService kisService, KisTokenService kisTokenService) {
        this.kisService = kisService;
        this.kisTokenService = kisTokenService;
    }

    @GetMapping("/api/get-popular/{stockId}")
    public PopularDTO getPopular(@PathVariable String stockId) {
        return kisService.getPopular(stockId);
    }

    @GetMapping("/volume-rank")
    public Mono<List<ResponseOutputDTO>> getVolumeRank() {
        return Mono.fromCallable(() -> {
            try {
                String accessToken = kisTokenService.getCachedAccessToken();
                return kisService.getVolumeRank(accessToken);
            } catch (Exception e) {
                log.error("Error getting access token", e);
                return Mono.<List<ResponseOutputDTO>>error(e);
            }
        }).flatMap(mono -> mono);
    }

    @GetMapping("/popular")
    public List<RankingDTO> getPopular() {
        return kisService.getPopular10();
    }

    @GetMapping("/api/get-10-rankings-stockid")
    public List<String> getDailyData() {
        return kisService.getDailyDataFromAPI();
    }

}

