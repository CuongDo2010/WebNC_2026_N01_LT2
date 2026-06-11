import { Controller, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ProductsService } from '../products/products.service';
import { IsNumber, Min } from 'class-validator';

class AddStockDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class InventoryController {
  constructor(private productsService: ProductsService) {}

  @Patch(':id/add-stock')
  addStock(@Param('id') id: string, @Body() dto: AddStockDto) {
    return this.productsService.updateStock(+id, dto.quantity);
  }
}
