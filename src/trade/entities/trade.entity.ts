import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'item_id' })
  itemId: number;

  @Column({ type: 'bigint', name: 'buyer_id' })
  buyerId: number;

  @Column({ type: 'bigint', name: 'seller_id' })
  sellerId: number;

  @Column({ type: 'bigint' })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

