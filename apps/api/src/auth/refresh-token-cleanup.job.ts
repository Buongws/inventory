import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { RefreshTokenCleanupService } from "./refresh-token-cleanup.service";

const JOB_NAME = "refresh-token-cleanup";

@Injectable()
export class RefreshTokenCleanupJob
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RefreshTokenCleanupJob.name);
  private readonly shutdown = new AbortController();
  private running: Promise<void> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly scheduler: SchedulerRegistry,
    private readonly cleanupService: RefreshTokenCleanupService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.config.getOrThrow<boolean>("REFRESH_TOKEN_CLEANUP_ENABLED"))
      return;
    const schedule = this.config.getOrThrow<string>(
      "REFRESH_TOKEN_CLEANUP_CRON",
    );
    const job = CronJob.from({
      cronTime: schedule,
      timeZone: "UTC",
      onTick: () => this.run(),
    });
    this.scheduler.addCronJob(JOB_NAME, job);
    job.start();
    this.logger.log(`Cleanup scheduled: ${schedule} (UTC)`);
  }

  private run(): Promise<void> | undefined {
    if (this.running || this.shutdown.signal.aborted) return;
    this.running = this.cleanupService
      .cleanup(this.shutdown.signal)
      .catch(() =>
        this.logger.error(
          "Refresh-token cleanup failed; will retry on the next scheduled run",
        ),
      )
      .finally(() => {
        this.running = null;
      });
    return this.running;
  }

  async onModuleDestroy(): Promise<void> {
    this.shutdown.abort();
    if (this.scheduler.doesExist("cron", JOB_NAME)) {
      this.scheduler.deleteCronJob(JOB_NAME);
    }
    await this.running;
  }
}
