import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DataSource } from "typeorm";
import { RedisService } from "../cache/redis.service";
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly db: DataSource,
    private readonly redis: RedisService,
  ) {}
  @Get("live")
  @ApiOperation({ summary: "Process is running" })
  live() {
    return { status: "ok" };
  }
  @Get("ready")
  @ApiOperation({ summary: "PostgreSQL and Redis are reachable" })
  @ApiResponse({ status: 503, description: "A dependency is unavailable" })
  async ready() {
    const results = await Promise.allSettled([
      this.db.query("SELECT 1"),
      this.redis.client.ping(),
    ]);
    const dependencies = {
      postgres: results[0].status === "fulfilled",
      redis: results[1].status === "fulfilled",
    };
    if (!dependencies.postgres || !dependencies.redis) {
      throw new ServiceUnavailableException({ status: "error", dependencies });
    }
    return { status: "ok", dependencies };
  }
}
