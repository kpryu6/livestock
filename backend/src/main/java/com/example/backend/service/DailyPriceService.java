package com.example.backend.service;

import com.example.backend.dto.DailyPriceStockNameDTO;
import com.example.backend.dto.DailyPriceDTO;
import com.example.backend.entity.DailyStockPrice;
import com.example.backend.entity.Stock;
import com.example.backend.repository.DailyStockPriceRepository;
import com.example.backend.repository.StockRepository;
import com.example.backend.util.AwsSecretsManagerUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
@Service
@Transactional
public class DailyPriceService {

    private final RestTemplate restTemplate;
    private final DailyStockPriceRepository dailyStockPriceRepository;
    private final StockRepository stockRepository;
    private final String appKey;
    private final String appSecret;
    private final String baseUrl;

    private final String DAILY_PATH = "/uapi/domestic-stock/v1/quotations/inquire-daily-price";

    @Autowired
    public DailyPriceService(RestTemplate restTemplate, 
                             DailyStockPriceRepository dailyStockPriceRepository, 
                             StockRepository stockRepository) {
        this.restTemplate = restTemplate;
        this.dailyStockPriceRepository = dailyStockPriceRepository;
        this.stockRepository = stockRepository;

        // AWS Secrets Manager에서 값 불러오기
        Map<String, String> secretsMap = AwsSecretsManagerUtil.fetchSecrets();
        this.appKey = secretsMap.getOrDefault("kis.api.appKey", "");
        this.appSecret = secretsMap.getOrDefault("kis.api.appSecret", "");
        this.baseUrl = secretsMap.getOrDefault("kis.api.baseUrl", "");

        // 값이 정상적으로 로드되지 않았을 경우 로그 출력
        if (this.appKey.isEmpty() || this.appSecret.isEmpty() || this.baseUrl.isEmpty()) {
            throw new IllegalStateException("AWS Secrets Manager에서 필수 환경 변수를 가져오지 못했습니다.");
        }

        log.info("✅ App Key: {}", appKey);
        log.info("✅ App Secret: {}", appSecret);
        log.info("✅ Base URL: {}", baseUrl);
    }

    public List<DailyPriceDTO> postDailyPrice(String stockCode, String token) throws Exception {
        String url = baseUrl + DAILY_PATH;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("appkey", appKey);
        headers.set("appsecret", appSecret);
        headers.set("authorization", "Bearer " + token);
        headers.set("tr_id", "FHKST01010400");

        HttpEntity<String> entity = new HttpEntity<>(null, headers);
        ResponseEntity<String> response;

        try {
            response = restTemplate.exchange(
                    url + "?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=" + stockCode +
                            "&FID_PERIOD_DIV_CODE=D&FID_ORG_ADJ_PRC=0",
                    HttpMethod.GET,
                    entity,
                    String.class
            );
        } catch (Exception e) {
            log.error("❌ [ERROR] API 호출 중 오류 발생", e);
            throw new RuntimeException("API 호출 실패", e);
        }

        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("❌ [ERROR] API 호출 실패: " + response.getStatusCode());
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode rootNode = mapper.readTree(response.getBody());
        JsonNode outputArray = rootNode.path("output");

        List<DailyPriceDTO> priceList = new ArrayList<>();
        for (JsonNode item : outputArray) {
            DailyPriceDTO dto = new DailyPriceDTO(
                    stockCode,
                    item.path("stck_bsop_date").asInt(),
                    item.path("stck_hgpr").asInt(),
                    item.path("stck_lwpr").asInt(),
                    item.path("stck_clpr").asInt(),
                    item.path("stck_oprc").asInt(),
                    (float) item.path("prdy_ctrt").asDouble(),
                    item.path("acml_vol").asInt()
            );
            priceList.add(dto);
        }

        log.info("✅ [LOG] postDailyPrice API 호출 성공");
        return priceList;
    }

    @Transactional
    public void saveList(List<DailyPriceDTO> dtoList) {
        for (DailyPriceDTO dto : dtoList) {
            DailyStockPrice existingPrice = dailyStockPriceRepository.findByStockIdAndDate(dto.getStockId(), dto.getDate());

            if (existingPrice == null) {
                DailyStockPrice dailyStockPrice = new DailyStockPrice();
                dailyStockPrice.setStockId(dto.getStockId());
                dailyStockPrice.setDate(dto.getDate());
                dailyStockPrice.setFluctuationRateDaily(dto.getChangeRate());
                dailyStockPrice.setCntgVol(dto.getVolume());
                dailyStockPrice.setOpeningPrice(dto.getOpen());
                dailyStockPrice.setClosingPrice(dto.getClose());
                dailyStockPrice.setHighPrice(dto.getHigh());
                dailyStockPrice.setLowPrice(dto.getLow());

                try {
                    dailyStockPriceRepository.save(dailyStockPrice);
                } catch (Exception e) {
                    log.error("❌ saveList 실패: {}", e.getMessage());
                }
            }
        }
        log.info("✅ [LOG] saveList 성공");
    }

    public List<DailyPriceStockNameDTO> getDailyPrice(String stockCode) {
        return getDailyPriceFromDB(stockCode);
    }

    @Transactional
    public List<DailyPriceStockNameDTO> getDailyPriceFromDB(String stockCode) {
        List<DailyStockPrice> dailyPriceList = dailyStockPriceRepository.findByStockId(stockCode);
        List<DailyPriceStockNameDTO> dailyPriceDTOList = new ArrayList<>();
        Optional<Stock> stock = stockRepository.findByStockId(stockCode);

        if (stock.isEmpty()) {
            throw new IllegalArgumentException("❌ [ERROR] StockId not found in Stock DB");
        }

        for (DailyStockPrice dailyStockPrice : dailyPriceList) {
            DailyPriceStockNameDTO dailyPriceStockNameDTO = new DailyPriceStockNameDTO();
            dailyPriceStockNameDTO.setStockName(stock.get().getStockName());
            dailyPriceStockNameDTO.setStockId(dailyStockPrice.getStockId());
            dailyPriceStockNameDTO.setDate(dailyStockPrice.getDate());
            dailyPriceStockNameDTO.setHigh(dailyStockPrice.getHighPrice());
            dailyPriceStockNameDTO.setLow(dailyStockPrice.getLowPrice());
            dailyPriceStockNameDTO.setOpen(dailyStockPrice.getOpeningPrice());
            dailyPriceStockNameDTO.setClose(dailyStockPrice.getClosingPrice());
            dailyPriceStockNameDTO.setVolume(dailyStockPrice.getCntgVol());
            dailyPriceStockNameDTO.setChangeRate(dailyStockPrice.getFluctuationRateDaily());

            dailyPriceDTOList.add(dailyPriceStockNameDTO);
        }
        return dailyPriceDTOList;
    }
}
