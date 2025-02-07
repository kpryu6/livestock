package com.example.backend.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

import java.time.Instant;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;


@Slf4j
@Service
public class KisTokenService {
    // @Value("${kis.api.appKey}")
    // private String appKey;

    // @Value("${kis.api.appSecret}")
    // private String appSecret;

    // @Value("${kis.api.baseUrl}")
    // private String baseUrl;

    // private final String TOKEN_PATH = "/oauth2/tokenP";
    
    // private String cachedToken;
    // private Instant tokenExpirationTime;

    private String appKey;
    private String appSecret;
    private String baseUrl;
    private final String secretName = "prod/springboot/config"; // AWS Secrets Manager에 저장된 보안 암호 이름
    private final Region region = Region.AP_NORTHEAST_2; // AWS 리전 (서울 리전)

    private final String TOKEN_PATH = "/oauth2/tokenP";
    private String cachedToken;
    private Instant tokenExpirationTime;

    public KisTokenService() {
        fetchSecretsFromAWS();
    }

    private void fetchSecretsFromAWS() {
        try (SecretsManagerClient secretsClient = SecretsManagerClient.builder()
                .region(region)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build()) {

            GetSecretValueRequest valueRequest = GetSecretValueRequest.builder()
                    .secretId(secretName)
                    .build();

            GetSecretValueResponse valueResponse = secretsClient.getSecretValue(valueRequest);
            String secretString = valueResponse.secretString();
            log.info("AWS에서 가져온 Secret: {}", secretString);

            // JSON 형태의 보안 암호를 파싱
            ObjectMapper objectMapper = new ObjectMapper();
            Map<String, String> secretsMap = objectMapper.readValue(secretString, Map.class);

            this.appKey = secretsMap.get("kis.api.appKey");
            this.appSecret = secretsMap.get("kis.api.appSecret");
            this.baseUrl = secretsMap.get("kis.api.baseUrl");

            log.info("App Key: {}", appKey);
            log.info("App Secret: {}", appSecret);
            log.info("Base URL: {}", baseUrl);
        } catch (Exception e) {
            log.error("AWS Secrets Manager에서 값을 가져오는 중 오류 발생", e);
            throw new RuntimeException("Failed to retrieve secrets from AWS Secrets Manager", e);
        }
    }


    public String getAccessToken() throws Exception {
        if (isTokenValid()) {
            return cachedToken;
        }
        
        OkHttpClient client = new OkHttpClient().newBuilder().build();
        
        String jsonBody = String.format(
            "{\"grant_type\":\"client_credentials\",\"appkey\":\"%s\",\"appsecret\":\"%s\"}",
            appKey, appSecret
        );
        
        log.info("Request URL: {}", baseUrl + TOKEN_PATH);
        log.info("Request Body: {}", jsonBody);
        
        RequestBody body = RequestBody.create(
            MediaType.parse("application/json"), 
            jsonBody
        );
        
        Request request = new Request.Builder()
                .url(baseUrl + TOKEN_PATH)
                .post(body)
                .addHeader("content-type", "application/json")
                .build();
                
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            log.info("Response Code: {}", response.code());
            log.info("Response Body: {}", responseBody);
            
            if (!response.isSuccessful()) {
                throw new RuntimeException("API 호출 실패: " + response.code() + ", Body: " + responseBody);
            }
            
            cachedToken = responseBody.split("\"access_token\":\"")[1].split("\"")[0];
            tokenExpirationTime = Instant.now().plusSeconds(86400); // 토큰 유효 기간을 24시간으로 설정
            return cachedToken;
        } catch (Exception e) {
            log.error("토큰 발급 중 오류 발생", e);
            throw e;
        }
    }

    public String getCachedAccessToken() throws Exception {
        if (isTokenValid()) {
            return cachedToken;
        } else {
            return getAccessToken(); // 토큰이 만료되었거나 없으면 새로 발급
        }
    }

    private boolean isTokenValid() {
        return cachedToken != null && Instant.now().isBefore(tokenExpirationTime);
    }

}

