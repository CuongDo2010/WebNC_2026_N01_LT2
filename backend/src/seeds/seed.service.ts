import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async onModuleInit() {
    const count = await this.userRepo.count();
    if (count === 0) {
      const hashed = await bcrypt.hash('admin123', 10);
      await this.userRepo.save({
        name: 'Quản trị viên',
        email: 'admin@cuahang.com',
        password: hashed,
        role: UserRole.ADMIN,
        isActive: true,
      });
      console.log('Đã tạo tài khoản admin: admin@cuahang.com / admin123');
    }
  }
}
