import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ItemStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
}

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.ACTIVE,
  })
  status: ItemStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}