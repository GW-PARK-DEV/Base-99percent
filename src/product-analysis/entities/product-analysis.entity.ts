import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}

