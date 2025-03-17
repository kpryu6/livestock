package com.example.backend.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

import java.util.Map;

@Slf4j
public class AwsSecretsManagerUtil {

    private static final String SECRET_NAME = "prod/springboot/config";
    private static final Region REGION = Region.AP_NORTHEAST_1;

    public static Map<String, String> fetchSecrets() {
        try (SecretsManagerClient secretsClient = SecretsManagerClient.builder()
                .region(REGION)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build()) {

            GetSecretValueRequest valueRequest = GetSecretValueRequest.builder()
                    .secretId(SECRET_NAME)
                    .build();

            GetSecretValueResponse valueResponse = secretsClient.getSecretValue(valueRequest);
            String secretString = valueResponse.secretString();
            // log.info("AWS에서 가져온 Secret: {}", secretString);

            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(secretString, Map.class);
        } catch (Exception e) {
            log.error("AWS Secrets Manager에서 값을 가져오는 중 오류 발생", e);
            throw new RuntimeException("Failed to retrieve secrets from AWS Secrets Manager", e);
        }
    }
}
