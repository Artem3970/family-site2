import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  points: number;
  status: 'active' | 'completed' | 'archived';
  parent: mongoose.Types.ObjectId;
  child: mongoose.Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    points: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
    parent: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    child: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const Task = mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
