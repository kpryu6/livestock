package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        // ✅ ECS Task Definition 환경변수에서 Redis 호스트와 포트 가져오기
        String redisHost = System.getenv("spring.redis.host");
        String redisPort = System.getenv("spring.redis.port");

        if (redisHost == null || redisPort == null) {
            log.error("❌ [ECS ENV ERROR] Redis 환경변수가 설정되지 않았습니다!");
            throw new IllegalStateException("Redis 환경변수를 찾을 수 없습니다.");
        }

        log.info("✅ [ECS ENV CHECK] Redis Host: {}", redisHost);
        log.info("✅ [ECS ENV CHECK] Redis Port: {}", redisPort);

        return new LettuceConnectionFactory(redisHost, Integer.parseInt(redisPort));
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Key와 Value를 String으로 직렬화
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());

        return template;
    }

    @Bean
    public HashOperations<String, String, String> hashOperations(RedisTemplate<String, String> redisTemplate) {
        return redisTemplate.opsForHash();
    }
}
