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

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOrCreateByEmail(email: string): Promise<User> {
    let user = await this.findByEmail(email);
    if (!user) {
      // 타임스탬프 + 랜덤 숫자로 고유 id 생성
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000);
      const id = Number(`${timestamp}${random}`.slice(0, 15));
      
      user = this.userRepository.create({ id, email });
      user = await this.userRepository.save(user);
    }
    return user;
  }
}