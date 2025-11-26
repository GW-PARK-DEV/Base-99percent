import { Entity, PrimaryColumn, CreateDateColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text', name: 'wallet_address', nullable: true })
  walletAddress: string | null;

  @CreateDateColumn()
  createdAt: Date;
}

