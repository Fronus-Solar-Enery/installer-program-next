'use client';

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  openInTabUrl?: string; // URL to open in new tab
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'lg',
  openInTabUrl,
}: ModalProps) {
  const sizeClasses = {
    sm: 'sm:max-w-[425px]',
    md: 'sm:max-w-[600px]',
    lg: 'sm:max-w-[800px]',
    xl: 'sm:max-w-[1000px]',
    full: 'sm:max-w-[1200px]',
  };

  const handleOpenInTab = () => {
    if (openInTabUrl) {
      window.open(openInTabUrl, '_blank');
      onOpenChange(false); // Close modal after opening in tab
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
            {openInTabUrl && (
              <Button
                onClick={handleOpenInTab}
                variant="ghost"
                size="icon"
                className="ml-4"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
