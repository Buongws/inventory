import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { envSchema } from "./config/env";
import { databaseOptions } from "./database/options";
import { CacheModule } from "./cache/cache.module";
import { HealthController } from "./health/health.controller";
import { AuthModule } from "./auth/auth.module";
import { ProductsModule } from "./products/products.module";
import { InventoryModule } from "./inventory/inventory.module";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        databaseOptions(config.getOrThrow<string>("DATABASE_URL")),
    }),
    CacheModule,
    AuthModule,
    ProductsModule,
    InventoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
