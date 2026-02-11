import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
  title: string;
  description: string;
  pointsCost: number;
  parent: mongoose.Types.ObjectId;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema = new Schema<IReward>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    pointsCost: { type: Number, required: true, min: 1 },
    parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Reward = mongoose.models.Reward || mongoose.model<IReward>('Reward', rewardSchema);
