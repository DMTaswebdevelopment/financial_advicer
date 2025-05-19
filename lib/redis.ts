import Redis from "ioredis";

export const redis = new Redis({
  host: "redis-11861.c270.us-east-1-3.ec2.redns.redis-cloud.com", // your host
  port: 11861,
  username: "default", // Redis Enterprise usually requires 'default'
  password: process.env.REDIS_PASSWORD, // set this in .env
});

console.log("redis", redis);
