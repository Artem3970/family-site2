import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Completion } from '@/models/Completion';
import { Task } from '@/models/Task';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';

const completionSchema = z.object({
  taskId: z.string(),
});

export async function GET() {
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

    const query: Record<string, string> = {};

    const userId = sessionData.user.id;
    if (sessionData.user.role === 'parent') {
      if (userId) query.parent = userId;
    } else if (sessionData.user.role === 'child') {
      if (userId) query.child = userId;
    }

    const completions = await Completion.find(query)
      .populate('task', 'title points')
      .populate('child', 'name')
      .populate('parent', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ completions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching completions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {

    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user?: { id?: string; role?: string } } | null;

    if (!sessionData?.user || sessionData.user.role !== 'child') {
      return NextResponse.json(
        { error: 'Only children can submit task completions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = completionSchema.parse(body);

    await connectDB();

    const task = await Task.findById(validatedData.taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    if (!sessionData?.user?.id || task.child.toString() !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Cannot submit completion for task not assigned to you' },
        { status: 403 }
      );
    }

    const existingCompletion = await Completion.findOne({
      task: validatedData.taskId,
      child: sessionData.user.id,
      status: 'pending',
    });

    if (existingCompletion) {
      return NextResponse.json(
        { error: 'You already have a pending completion for this task' },
        { status: 400 }
      );
    }

    const completion = new Completion({
      task: validatedData.taskId,
      child: sessionData.user.id,
      parent: task.parent,
    });

    await completion.save();
    await completion.populate('task', 'title points');
    await completion.populate('child', 'name');
    await completion.populate('parent', 'name');

    return NextResponse.json(
      { completion, message: 'Task completion submitted' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting completion:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit completion' },
      { status: 500 }
    );
  }
}
