import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Item } from '../../item/entities/item.entity';

@Entity('product_analysis')
export class ProductAnalysis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  analysis: string;

  @Column({ type: 'text', array: true, default: [] })
  issues: string[];

  @Column({ type: 'text', array: true, default: [] })
  positives: string[];

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'usage_level' })
  usageLevel: string;

  @Column({ type: 'int', nullable: true, name: 'recommended_price' })
  recommendedPrice: number;

  @Column({ type: 'text', nullable: true, name: 'price_reason' })
  priceReason: string;

  @Column({ type: 'bigint', name: 'item_id' })
  itemId: number;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @CreateDateColumn({ name: 'created_at', nullable: true })
  createdAt: Date;
}

