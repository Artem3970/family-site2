import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authConfig = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const validatedCredentials = credentialsSchema.parse(credentials);
          
          await connectDB();
          
          const user = await User.findOne({ email: validatedCredentials.email });
          
          if (!user) {
            throw new Error('User not found');
          }
          
          const isPasswordValid = await bcrypt.compare(
            validatedCredentials.password,
            user.password
          );
          
          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user?: unknown }) {
      if (user) {
        const userData = user as { role: string; id: string };
        token.role = userData.role;
        token.id = userData.id;
      }
      return token;
    },
    async session({ session, token }: { session: unknown; token: unknown }) {
      const sessionData = session as { user?: { role?: string; id?: string } };
      const tokenData = token as { role?: string; id?: string };
      if (sessionData?.user) {
        sessionData.user.role = tokenData.role;
        sessionData.user.id = tokenData.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register',
  },
};
