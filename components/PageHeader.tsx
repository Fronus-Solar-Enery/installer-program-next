'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import { BreadcrumbItem } from '@/contexts/BreadcrumbContext';
import { getRouteIcon } from '@/components/breadcrumbIcons';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbLabel?: string; // Custom label for the current page in breadcrumb
}

export default function PageHeader({ title, description, action, breadcrumbLabel }: PageHeaderProps) {
  const pathname = usePathname();

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(() => {
    const paths = pathname.split('/').filter(Boolean);

    // If we're on the dashboard, only show "Home"
    if (pathname === '/dashboard' || paths.length === 0) {
      return [{ label: 'Home', href: '/dashboard' }];
    }

    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/dashboard' }];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;

      // Skip if this is the dashboard path (already added as Home)
      if (currentPath === '/dashboard') {
        return;
      }

      // Use custom breadcrumbLabel for the last item if provided
      const isLast = index === paths.length - 1;
      const label = isLast && breadcrumbLabel
        ? breadcrumbLabel
        : path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

      // Get icon for this route segment
      const icon = getRouteIcon(path);

      breadcrumbs.push({
        label,
        href: currentPath,
        icon,
      });
    });

    return breadcrumbs;
  }, [pathname, breadcrumbLabel]);

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <div className="flex items-center justify-between px-6 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
