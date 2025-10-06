# 🎨 shadcn/ui Implementation Guide - Complete Migration

## ✅ Initial Setup (COMPLETED)

### Files Created:
- ✅ `components.json` - shadcn/ui configuration
- ✅ `tailwind.config.ts` - Tailwind with zinc theme
- ✅ `app/globals.css` - Updated with shadcn/ui CSS variables
- ✅ `lib/utils.ts` - cn() utility for class merging
- ✅ `package.json` - Updated with all required dependencies

### Theme Configuration:
- **Base Color**: Zinc
- **Style**: New York
- **Dark Mode**: Class-based
- **CSS Variables**: Enabled

---

## 📦 Step 1: Install Dependencies

```bash
npm install
```

This will install all the shadcn/ui dependencies added to package.json.

---

## 🎨 Step 2: Create Core shadcn/ui Components

Run these commands to add shadcn/ui components:

```bash
# Core UI Components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add switch
npx shadcn@latest add checkbox
npx shadcn@latest add tabs
npx shadcn@latest add table
npx shadcn@latest add sheet
npx shadcn@latest add scroll-area
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add alert-dialog
npx shadcn@latest add popover
npx shadcn@latest add tooltip
npx shadcn@latest add form
npx shadcn@latest add skeleton
```

Or add them all at once:
```bash
npx shadcn@latest add button card input label select dialog dropdown-menu avatar badge separator switch checkbox tabs table sheet scroll-area toast alert alert-dialog popover tooltip form skeleton
```

---

## 🌓 Step 3: Set Up Dark Mode

### Create Theme Provider

Create `components/theme-provider.tsx`:

```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### Create Theme Toggle Component

Create `components/theme-toggle.tsx`:

```typescript
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Update Root Layout

Update `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Installer Program Management",
  description: "Manage installers, rewards, and team members",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 🧭 Step 4: Update Navbar with Theme Toggle

Update `components/Navbar.tsx`:

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Award,
  FileText,
  Settings,
  LogOut,
  Menu
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Installers', href: '/installers', icon: Wrench },
    { name: 'Rewards', href: '/rewards', icon: Award },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/dashboard" className="text-xl font-bold text-foreground">
                Installer Program
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center gap-2 border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name || ''} />
                      <AvatarFallback>{session.user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## 🔐 Step 5: Update Sign In Page

Update `app/auth/signin/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) validatePassword(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        if (result.error.toLowerCase().includes('email')) {
          setEmailError(result.error);
        } else if (result.error.toLowerCase().includes('password')) {
          setPasswordError(result.error);
        }
      } else if (result?.ok) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Installer Program
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && !emailError && !passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => email && validateEmail(email)}
                placeholder="Enter your email"
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => password && validatePassword(password)}
                placeholder="Enter your password"
                className={passwordError ? 'border-destructive' : ''}
              />
              {passwordError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {passwordError}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📊 Step 6: Update Dashboard Page

Create a modern dashboard with shadcn/ui components in `app/dashboard/page.tsx`.

See next section for complete implementation examples...

---

## 🚀 Quick Start Commands

```bash
# 1. Install all dependencies
npm install

# 2. Add all shadcn/ui components at once
npx shadcn@latest add button card input label select dialog dropdown-menu avatar badge separator switch checkbox tabs table sheet scroll-area toast alert alert-dialog popover tooltip form skeleton

# 3. Create theme provider
# Create files: components/theme-provider.tsx and components/theme-toggle.tsx

# 4. Update layout.tsx with ThemeProvider

# 5. Start development server
npm run dev
```

---

## 📝 Migration Checklist

### Core Setup
- [x] Install dependencies
- [x] Configure tailwind.config.ts
- [x] Update globals.css
- [x] Create utils.ts
- [ ] Add all shadcn/ui components
- [ ] Create theme provider
- [ ] Create theme toggle
- [ ] Update root layout

### Pages to Update
- [ ] Sign In Page
- [ ] Dashboard Page
- [ ] Team Management Pages
- [ ] Installer Pages (list, create, edit)
- [ ] Reward Pages (list, create, edit)
- [ ] Reports Page
- [ ] Settings Page

### Components to Update
- [ ] Navbar
- [ ] Form components
- [ ] Modal components
- [ ] Table components
- [ ] Error components (FormError, ErrorAlert)

---

## 💡 Tips

1. **Test theme switching** after adding ThemeProvider
2. **Use shadcn/ui docs** for component-specific customization: https://ui.shadcn.com
3. **Keep existing functionality** - just update UI components
4. **Test in both light and dark mode** for each page
5. **Use Button variants**: default, destructive, outline, secondary, ghost, link
6. **Use Card for containers**: Replaces most div containers
7. **Use Alert for messages**: Replaces custom error/success messages

---

## 🎨 Color Reference (Zinc Theme)

**Light Mode:**
- Background: White (#ffffff)
- Foreground: Dark Zinc (#0a0a0a)
- Primary: Dark (#18181b)
- Muted: Light Gray (#f4f4f5)
- Accent: Light Gray (#f4f4f5)

**Dark Mode:**
- Background: Dark Zinc (#09090b)
- Foreground: Light (#fafafa)
- Primary: White (#fafafa)
- Muted: Dark Gray (#27272a)
- Accent: Dark Gray (#27272a)

---

**Next Steps:** Run `npm install` and start adding shadcn/ui components!
