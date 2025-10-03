import { handlers } from '@/lib/auth';

// Use Node.js runtime for auth routes (required for MongoDB)
export const runtime = 'nodejs';

export const { GET, POST } = handlers;
