import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";
import { UserRole } from "../auth/entities/user.entity";
import {
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from "./product.dto";
import { Product, ProductStatus } from "./product.entity";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  async list(query: ListProductsQueryDto, role: UserRole) {
    if (role !== UserRole.ADMIN && query.status)
      throw new ForbiddenException("Only admins can filter by product status");

    const builder = this.products.createQueryBuilder("product");
    if (role !== UserRole.ADMIN) {
      builder.andWhere("product.status = :active", {
        active: ProductStatus.ACTIVE,
      });
    } else if (query.status) {
      builder.andWhere("product.status = :status", { status: query.status });
    }

    if (query.search) {
      const escaped = query.search.replace(/[!%_]/g, (value) => `!${value}`);
      builder.andWhere(
        "(product.name ILIKE :search ESCAPE '!' OR product.sku ILIKE :search ESCAPE '!')",
        { search: `%${escaped}%` },
      );
    }

    const [items, total] = await builder
      .orderBy("product.createdAt", "DESC")
      .addOrderBy("product.id", "DESC")
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return { items, page: query.page, limit: query.limit, total };
  }

  async findOne(id: string, role: UserRole) {
    const where =
      role === UserRole.ADMIN ? { id } : { id, status: ProductStatus.ACTIVE };
    const product = await this.products.findOneBy(where);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async create(dto: CreateProductDto) {
    try {
      return await this.products.save(
        this.products.create({
          ...dto,
          description: dto.description ?? null,
          imageUrl: dto.imageUrl ?? null,
          status: ProductStatus.ACTIVE,
        }),
      );
    } catch (error) {
      this.rethrowSkuConflict(error);
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    const hasChanges = (
      ["sku", "name", "description", "priceVnd", "status", "imageUrl"] as const
    ).some((field) => dto[field] !== undefined);
    if (!hasChanges)
      throw new BadRequestException("At least one product field is required");
    const product = await this.products.findOneBy({ id });
    if (!product) throw new NotFoundException("Product not found");
    this.products.merge(product, dto);
    try {
      return await this.products.save(product);
    } catch (error) {
      this.rethrowSkuConflict(error);
    }
  }

  async deactivate(id: string) {
    const result = await this.products.update(
      { id },
      { status: ProductStatus.INACTIVE },
    );
    if (!result.affected) throw new NotFoundException("Product not found");
  }

  private rethrowSkuConflict(error: unknown): never {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === "23505"
    )
      throw new ConflictException("SKU is already in use");
    throw error;
  }
}
