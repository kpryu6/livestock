package com.example.backend.controller;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RedisTestController {

    private final StringRedisTemplate redisTemplate;

    public RedisTestController(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/test-redis")
    public String testRedis(@RequestParam String key, @RequestParam String value) {
        try {
            redisTemplate.opsForValue().set(key, value);
            return "✅ Redis 저장 성공: " + key + " -> " + value;
        } catch (Exception e) {
            return "❌ Redis 연결 실패: " + e.getMessage();
        }
    }
}
