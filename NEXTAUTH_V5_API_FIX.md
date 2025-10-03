# ✅ NextAuth v5 API Routes Fix

## Error Fixed

```
Export getServerSession doesn't exist in target module
```

---

## 🔍 The Problem

NextAuth v5 (beta) removed the `getServerSession` function and replaced it with a simpler `auth()` function.

**What Changed in NextAuth v5**:
- ❌ `getServerSession(authOptions)` - Removed
- ✅ `auth()` - New way to get session

---

## 🔧 The Fix

Updated **12 API route files** to use the new NextAuth v5 syntax.

### Before (NextAuth v4):
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // ...
}
```

### After (NextAuth v5):
```typescript
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  // ...
}
```

---

## 📝 Files Updated

All API routes now use `auth()` instead of `getServerSession()`:

### Team Management APIs:
1. ✅ `app/api/team/register/route.ts`
2. ✅ `app/api/team/route.ts`
3. ✅ `app/api/team/[id]/route.ts`
4. ✅ `app/api/team/profile/route.ts`
5. ✅ `app/api/team/change-password/route.ts`

### Installer APIs:
6. ✅ `app/api/installers/route.ts`
7. ✅ `app/api/installers/[id]/route.ts`

### Reward APIs:
8. ✅ `app/api/rewards/route.ts`
9. ✅ `app/api/rewards/[id]/route.ts`

### Report APIs:
10. ✅ `app/api/reports/installers/route.ts`
11. ✅ `app/api/reports/rewards/route.ts`
12. ✅ `app/api/reports/payment-format/route.ts`

---

## 🎯 Why This is Better

### NextAuth v4:
```typescript
getServerSession(authOptions)  // ❌ Need to pass config every time
```

### NextAuth v5:
```typescript
auth()  // ✅ Simpler! Config already bundled
```

**Benefits**:
- Less code
- No need to pass `authOptions` everywhere
- Consistent API across middleware, server components, and API routes
- Better TypeScript support

---

## 🚀 Related Documentation

This fix is part of the NextAuth v5 migration. See also:
- [NEXTAUTH_V5_MIGRATION.md](./NEXTAUTH_V5_MIGRATION.md) - Middleware migration
- [EDGE_RUNTIME_FIX.md](./EDGE_RUNTIME_FIX.md) - Edge Runtime compatibility

---

## ✅ Build Should Work Now

Run the dev server:
```bash
npm run dev
```

Expected result:
- ✅ No build errors
- ✅ All API routes work
- ✅ Authentication functions properly
- ✅ Session management works

---

## 📚 NextAuth v5 Changes Summary

| Feature | v4 | v5 |
|---------|----|----|
| **Session in API** | `getServerSession(authOptions)` | `auth()` |
| **Session in Middleware** | `withAuth(callback, config)` | `auth()` |
| **Session in Server Components** | `getServerSession(authOptions)` | `auth()` |
| **Configuration** | `NextAuthOptions` | `NextAuthConfig` |
| **Exports** | N/A | `{ handlers, auth, signIn, signOut }` |

---

## 🎉 All NextAuth v5 Migration Complete!

Your app now fully uses NextAuth v5 (beta):
- ✅ Middleware updated
- ✅ API routes updated
- ✅ Auth configuration updated
- ✅ Type definitions updated

Everything should build and run correctly now! 🚀
