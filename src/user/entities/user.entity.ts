import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @CreateDateColumn()
  createdAt: Date;
}

