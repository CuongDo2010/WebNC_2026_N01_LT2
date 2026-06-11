import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    private productsService: ProductsService,
  ) {}

  async create(dto: CreateOrderDto, userId: number) {
    let totalAmount = 0;
    const itemsData: Partial<OrderItem>[] = [];

    for (const item of dto.items) {
      const product = await this.productsService.findOne(item.productId);
      if (!product.isActive) throw new BadRequestException(`${product.name} đã ngừng bán`);
      if (product.stock < item.quantity) throw new BadRequestException(`${product.name} không đủ tồn kho`);
      itemsData.push({ productId: item.productId, quantity: item.quantity, priceAtTime: product.price });
      totalAmount += Number(product.price) * item.quantity;
    }

    const order = this.orderRepo.create({ totalAmount, createdBy: userId, items: itemsData as OrderItem[] });
    const saved = await this.orderRepo.save(order);

    for (const item of dto.items) {
      await this.productsService.decreaseStock(item.productId, item.quantity);
    }

    return saved;
  }

  findAll(userId: number, role: string) {
    if (role === UserRole.ADMIN) return this.orderRepo.find({ order: { createdAt: 'DESC' } });
    return this.orderRepo.find({ where: { createdBy: userId }, order: { createdAt: 'DESC' } });
  }

  findOne(id: number) {
    return this.orderRepo.findOne({ where: { id } });
  }

  async cancel(id: number, userId: number, role: string) {
    if (role !== UserRole.ADMIN) throw new ForbiddenException('Chỉ quản lý mới được hủy đơn');
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new BadRequestException('Đơn hàng không tồn tại');
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Đơn đã bị hủy trước đó');

    order.status = OrderStatus.CANCELLED;
    await this.orderRepo.save(order);

    for (const item of order.items) {
      await this.productsService.updateStock(item.productId, item.quantity);
    }
    return { message: 'Hủy đơn thành công' };
  }

  async getRevenueToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('o.createdAt >= :today AND o.createdAt < :tomorrow AND o.status = :status', {
        today,
        tomorrow,
        status: OrderStatus.COMPLETED,
      })
      .getMany();

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;

    const productSales: Record<number, { name: string; quantity: number; totalRevenue: number }> = {};
    for (const order of orders) {
      for (const item of order.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.product?.name || '', quantity: 0, totalRevenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].totalRevenue += Number(item.priceAtTime) * item.quantity;
      }
    }

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id: +id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return { totalRevenue, totalOrders, topProducts };
  }
}
