'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, ExternalLink } from 'lucide-react';
import { ReactNode } from 'react';

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
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl',
  };

  const handleOpenInTab = () => {
    if (openInTabUrl) {
      window.open(openInTabUrl, '_blank');
      onOpenChange(false); // Close modal after opening in tab
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${sizeClasses[size]} max-h-[90vh] bg-white rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col`}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-gray-600">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {openInTabUrl && (
                <button
                  onClick={handleOpenInTab}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-5 w-5" />
                </button>
              )}
              <Dialog.Close className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
