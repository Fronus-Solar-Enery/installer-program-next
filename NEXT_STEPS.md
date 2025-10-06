# ✅ Dependencies Installed! Next Steps

## Current Status

✅ All npm packages installed with `--legacy-peer-deps`
✅ Tailwind configured with zinc theme
✅ Dark mode CSS variables added
✅ Theme provider component created
✅ Utils (cn) function created

---

## 🚀 Next: Add shadcn/ui Components

### Option 1: Add All Components at Once (Recommended)

Run this single command:

```bash
npx shadcn@latest add button card input label select dialog dropdown-menu avatar badge separator switch checkbox tabs table sheet scroll-area toast alert alert-dialog popover tooltip form skeleton
```

### Option 2: Add Components One by One

```bash
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

This will create `components/ui/` directory with all the components.

---

## 📝 After Adding Components

### 1. Create Theme Toggle

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

### 2. Update Root Layout

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

### 3. Test Theme Switching

```bash
npm run dev
```

Visit http://localhost:3000 and you should see the app with the new zinc theme!

---

## 📖 Full Documentation

- **[SHADCN_UI_IMPLEMENTATION_GUIDE.md](./SHADCN_UI_IMPLEMENTATION_GUIDE.md)** - Complete step-by-step guide for migrating all pages
- **[SHADCN_IMPLEMENTATION_SUMMARY.md](./SHADCN_IMPLEMENTATION_SUMMARY.md)** - Quick reference with component examples

---

## 🎯 Quick Summary

1. ✅ Dependencies installed
2. ⬜ Add shadcn/ui components (run command above)
3. ⬜ Create theme-toggle.tsx
4. ⬜ Update layout.tsx
5. ⬜ Test theme switching
6. ⬜ Migrate pages to use shadcn components

**Start with:** Run the `npx shadcn@latest add...` command above! 🚀
