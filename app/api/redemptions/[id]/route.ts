import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Redemption } from '@/models/Redemption';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';

const updateRedemptionSchema = z.object({
  status: z.enum(['approved', 'rejected', 'completed']),
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
        { error: 'Only parents can approve/complete redemptions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateRedemptionSchema.parse(body);

    await connectDB();

    const redemption = await Redemption.findById(id);

    if (!redemption) {
      return NextResponse.json(
        { error: 'Redemption not found' },
        { status: 404 }
      );
    }

    if (!sessionData?.user?.id || redemption.parent.toString() !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this redemption' },
        { status: 403 }
      );
    }

    redemption.status = validatedData.status;
    if (validatedData.notes) {
      redemption.notes = validatedData.notes;
    }

    if (validatedData.status === 'approved') {
      redemption.approvedAt = new Date();
    } else if (validatedData.status === 'completed') {
      redemption.completedAt = new Date();
    }

    await redemption.save();
    await redemption.populate('reward', 'title pointsCost');
    await redemption.populate('child', 'name');
    await redemption.populate('parent', 'name');

    return NextResponse.json(
      { redemption, message: `Redemption ${validatedData.status}` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating redemption:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update redemption' },
      { status: 500 }
    );
  }
}
