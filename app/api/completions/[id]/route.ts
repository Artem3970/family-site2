import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Completion } from '@/models/Completion';
import { Task } from '@/models/Task';
import { User } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';

const approveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user?: { id?: string; role?: string } } | null;

    if (!sessionData?.user || sessionData.user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can approve/reject completions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = approveSchema.parse(body);

    await connectDB();

    const completion = await Completion.findById(id);

    if (!completion) {
      return NextResponse.json(
        { error: 'Completion not found' },
        { status: 404 }
      );
    }

    if (!sessionData?.user?.id || completion.parent.toString() !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to review this completion' },
        { status: 403 }
      );
    }

    completion.status = validatedData.status;
    if (validatedData.notes) {
      completion.notes = validatedData.notes;
    }

    if (validatedData.status === 'approved') {
      completion.approvedAt = new Date();

      const task = await Task.findById(completion.task);
      if (task) {
        await User.findByIdAndUpdate(
          completion.child,
          { $inc: { points: task.points } }
        );

        task.status = 'completed';
        await task.save();
      }
    }

    await completion.save();
    await completion.populate('task', 'title points');
    await completion.populate('child', 'name');
    await completion.populate('parent', 'name');

    return NextResponse.json(
      { completion, message: `Task completion ${validatedData.status}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating completion:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update completion' },
      { status: 500 }
    );
  }
}
