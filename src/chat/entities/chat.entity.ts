import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'item_id' })
  itemId: number;

  @Column({ type: 'bigint', name: 'seller_id' })
  sellerId: number;

  @Column({ type: 'bigint', name: 'buyer_id' })
  buyerId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

