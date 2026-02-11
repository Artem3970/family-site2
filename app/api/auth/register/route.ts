import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  role: z.enum(['parent', 'child']),
  parentEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = registerSchema.parse(body);
    
    if (validatedData.password !== validatedData.confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    const userData: Record<string, unknown> = {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
    };

    if (validatedData.role === 'child' && validatedData.parentEmail) {
      const parent = await User.findOne({ email: validatedData.parentEmail, role: 'parent' });
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent not found' },
          { status: 400 }
        );
      }
      userData.parent = parent._id;
    }

    const user = new User(userData);
    await user.save();

    if (validatedData.role === 'parent') {
    } else if (validatedData.role === 'child' && validatedData.parentEmail) {
      const parent = await User.findOne({ email: validatedData.parentEmail });
      if (parent) {
        parent.children = parent.children || [];
        if (!parent.children.includes(user._id)) {
          parent.children.push(user._id);
          await parent.save();
        }
      }
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
