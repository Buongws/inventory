import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AccessTokenGuard, CurrentUser, requireRole } from "../auth/auth.guard";
import { UserRole } from "../auth/entities/user.entity";
import { AccessClaims } from "../auth/types/auth.types";
import {
  CreateProductDto,
  ListProductsQueryDto,
  ProductEnvelopeDto,
  ProductListDto,
  UpdateProductDto,
} from "./product.dto";
import { ProductsService } from "./products.service";

const AdminGuard = requireRole(UserRole.ADMIN);

@ApiTags("products")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOkResponse({ type: ProductListDto })
  list(
    @Query() query: ListProductsQueryDto,
    @CurrentUser() claims: AccessClaims,
  ) {
    return this.products.list(query, claims.role);
  }

  @Get(":id")
  @ApiOkResponse({ type: ProductEnvelopeDto })
  async findOne(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() claims: AccessClaims,
  ) {
    return { product: await this.products.findOne(id, claims.role) };
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiCreatedResponse({ type: ProductEnvelopeDto })
  async create(@Body() dto: CreateProductDto) {
    return { product: await this.products.create(dto) };
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  @ApiOkResponse({ type: ProductEnvelopeDto })
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return { product: await this.products.update(id, dto) };
  }

  @Delete(":id")
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: "Product is inactive" })
  async deactivate(@Param("id", new ParseUUIDPipe()) id: string) {
    await this.products.deactivate(id);
  }
}
