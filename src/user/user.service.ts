import { Injectable } from '@nestjs/common';
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
}

