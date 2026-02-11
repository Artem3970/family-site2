import mongoose, { Schema, Document } from 'mongoose';

export interface ICompletion extends Document {
  task: mongoose.Types.ObjectId;
  child: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  completedAt: Date;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const completionSchema = new Schema<ICompletion>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    child: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    completedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Completion = mongoose.models.Completion || mongoose.model<ICompletion>('Completion', completionSchema);
