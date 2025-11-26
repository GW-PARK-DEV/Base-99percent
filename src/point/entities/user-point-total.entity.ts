import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('user_point_totals')
export class UserPointTotal {
  @PrimaryColumn({ type: 'bigint', name: 'user_id' })
  userId: number;

  @Column({ type: 'bigint', name: 'total_points' })
  totalPoints: number;
}