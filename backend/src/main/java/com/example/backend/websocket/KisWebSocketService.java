package com.example.backend.websocket;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import com.example.backend.util.AwsSecretsManagerUtil;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.RequestBody;
import okhttp3.MediaType;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class KisWebSocketService {
    private String baseUrl;
    private String appKey;
    private String appSecret;
    private final String APPROVAL_PATH = "/oauth2/Approval";

    public KisWebSocketService() {
        Map<String, String> secretsMap = AwsSecretsManagerUtil.fetchSecrets();
        this.baseUrl = secretsMap.get("kis.api.baseUrl");
        this.appKey = secretsMap.get("kis.api.appKey");
        this.appSecret = secretsMap.get("kis.api.appSecret");

        // log.info("Base URL: {}", baseUrl);
        // log.info("App Key: {}", appKey);
        // log.info("App Secret: {}", appSecret);
    }

    public String getWebSocketApprovalKey() throws IOException {
        OkHttpClient client = new OkHttpClient();
        
        String jsonBody = String.format(
            "{\"grant_type\":\"client_credentials\",\"appkey\":\"%s\",\"secretkey\":\"%s\"}",
            appKey, appSecret
        );
        
        RequestBody body = RequestBody.create(
            MediaType.parse("application/json"),
            jsonBody
        );
        
        String fullUrl = baseUrl.trim() + APPROVAL_PATH;
        
        Request request = new Request.Builder()
            .url(fullUrl)
            .post(body)
            .addHeader("content-type", "application/json")
            .build();
            
        try (Response response = client.newCall(request).execute()) {
            return response.body().string();
        }
    }
}


