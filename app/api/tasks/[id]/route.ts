import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  points: z.number().int().positive().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  dueDate: z.string().datetime().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user?: { id?: string; role?: string } } | null;

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    await connectDB();

    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (!sessionData?.user?.id || task.parent.toString() !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this task' },
        { status: 403 }
      );
    }

    Object.assign(task, validatedData);
    if (validatedData.dueDate) {
      task.dueDate = new Date(validatedData.dueDate);
    }

    await task.save();
    await task.populate('parent', 'name');
    await task.populate('child', 'name');

    return NextResponse.json(
      { task, message: 'Task updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating task:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user?: { id?: string; role?: string } } | null;

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (!sessionData?.user?.id || task.parent.toString() !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this task' },
        { status: 403 }
      );
    }

    await Task.deleteOne({ _id: id });

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
