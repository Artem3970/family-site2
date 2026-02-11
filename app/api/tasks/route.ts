import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  points: z.number().int().positive(),
  dueDate: z.string().datetime().optional(),
  childId: z.string(),
});

export async function GET(_request: NextRequest) {
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

    const searchParams = _request.nextUrl.searchParams;
    const role = searchParams.get('role');

    // Build query explicitly. For child role, restrict to active tasks only.
    const userId = sessionData.user.id;
    const query: Record<string, unknown> = {};
    if (role === 'parent') {
      if (userId) query.parent = userId;
    } else if (role === 'child') {
      if (userId) {
        query.child = userId;
        query.status = 'active';
      }
    }

    const tasks = await Task.find(query)
      .populate('parent', 'name')
      .populate('child', 'name')
      .sort({ createdAt: -1 });

    const response = NextResponse.json({ tasks }, { status: 200 });
    // Avoid caching to ensure children see up-to-date task status after approvals
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user?: { id?: string; role?: string } } | null;

    if (!sessionData?.user || sessionData.user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can create tasks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    await connectDB();

    const task = new Task({
      ...validatedData,
      parent: sessionData.user.id,
      child: validatedData.childId,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
    });

    await task.save();
    await task.populate('parent', 'name');
    await task.populate('child', 'name');

    return NextResponse.json(
      { task, message: 'Task created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating task:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
