import { Controller, Get } from "@nestjs/common";

@Controller("gateway")
export class GatewayHealthController {
  @Get("health")
  health(): { status: string; service: string } {
    return { status: "ok", service: "inventory-gateway" };
  }
}
