import mongoose, { Schema, Document } from 'mongoose';

export interface IRedemption extends Document {
  reward: mongoose.Types.ObjectId;
  child: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  pointsSpent: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const redemptionSchema = new Schema<IRedemption>(
  {
    reward: { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
    child: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pointsSpent: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
    approvedAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Redemption = mongoose.models.Redemption || mongoose.model<IRedemption>('Redemption', redemptionSchema);
