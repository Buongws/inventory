import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { InventoryIdempotencyCleanupService } from "./inventory-idempotency-cleanup.service";

const JOB_NAME = "inventory-idempotency-cleanup";

@Injectable()
export class InventoryIdempotencyCleanupJob
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(InventoryIdempotencyCleanupJob.name);
  private readonly shutdown = new AbortController();
  private running: Promise<void> | null = null;
  constructor(
    private readonly scheduler: SchedulerRegistry,
    private readonly cleanup: InventoryIdempotencyCleanupService,
  ) {}

  onApplicationBootstrap(): void {
    const job = CronJob.from({
      cronTime: "0 0 * * * *",
      timeZone: "UTC",
      onTick: () => this.run(),
    });
    this.scheduler.addCronJob(JOB_NAME, job);
    job.start();
  }

  private run(): Promise<void> | undefined {
    if (this.running || this.shutdown.signal.aborted) return;
    this.running = this.cleanup
      .cleanup(this.shutdown.signal)
      .catch(() =>
        this.logger.error(
          "Inventory cleanup failed; will retry on the next scheduled run",
        ),
      )
      .finally(() => {
        this.running = null;
      });
    return this.running;
  }

  async onModuleDestroy(): Promise<void> {
    this.shutdown.abort();
    if (this.scheduler.doesExist("cron", JOB_NAME))
      this.scheduler.deleteCronJob(JOB_NAME);
    await this.running;
  }
}
