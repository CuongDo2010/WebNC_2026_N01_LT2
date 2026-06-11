import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DashboardService {
  constructor(
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private usersService: UsersService,
  ) {}

  async getSummary() {
    const { totalRevenue, totalOrders, topProducts } = await this.ordersService.getRevenueToday();
    const lowStockProducts = await this.productsService.getLowStock(10);
    const allStaff = await this.usersService.findAll();
    const activeStaff = allStaff.filter((u) => u.isActive).length;

    const formattedTop = topProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      totalQty: p.quantity,
      totalRevenue: Math.round(p.totalRevenue),
    }));

    return {
      totalRevenue,
      totalOrders,
      topProducts: formattedTop,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      activeStaff,
    };
  }
}
