import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { AuthService } from "./auth.service";

async function run() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password)
    throw new Error(
      "Usage: npm run admin:create -- admin@example.com a-long-password",
    );
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const user = await app.get(AuthService).createAdmin(email, password);
    console.log(`Admin created: ${user.email}`);
  } finally {
    await app.close();
  }
}
run();
