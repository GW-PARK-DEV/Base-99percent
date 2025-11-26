import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOrCreate(fid: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: fid } });
    return user ?? this.userRepository.save(this.userRepository.create({ id: fid }));
  }

  findById(fid: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: fid } });
  }

  async updateEmail(userId: number, email: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.email = email;
    return this.userRepository.save(user);
  }

  async updateEmailByFid(fid: number, email: string): Promise<User> {
    const user = await this.findOrCreate(fid);
    user.email = email;
    return this.userRepository.save(user);
  }
}