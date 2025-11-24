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

  @Column({ type: 'varchar', length: 100, nullable: true })
  usageLevel: string;

  @Column({ type: 'int', nullable: true })
  recommendedPrice: number;

  @Column({ type: 'text', nullable: true })
  priceReason: string;
}

