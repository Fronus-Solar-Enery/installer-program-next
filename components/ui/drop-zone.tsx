import React, { useCallback, useMemo } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { IconCloudUpload } from "../icons";

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  label: string;
  accept: Record<string, string[]>;
  acceptedFileTypes?: string[];
  fileTypeLabel?: string;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export const FileDropzone = React.memo(
  ({
    onDrop,
    onReject,
    label,
    accept = {},
    acceptedFileTypes = [".xlsx", ".xls"],
    fileTypeLabel = "Excel files",
    maxFiles,
    maxSize,
    disabled = false,
    className,
  }: FileDropzoneProps) => {
    const handleDrop = useCallback(
      (acceptedFiles: File[]) => {
        const folders = acceptedFiles.filter(
          (file) => file.size === 0 && !file.type && !file.name
        );

        if (folders.length > 0) {
          toast.error(
            `Folders are not allowed. Please upload ${fileTypeLabel} only.`
          );
          return;
        }

        if (acceptedFiles.length > 0) {
          onDrop(acceptedFiles);
        }
      },
      [onDrop, fileTypeLabel]
    );

    const handleDropRejected = useCallback(
      (rejectedFiles: FileRejection[]) => {
        rejectedFiles.forEach((rejection) => {
          const error = rejection.errors[0];
          if (error.code === "file-invalid-type") {
            toast.error(
              `"${rejection.file.name}" is not allowed. Please upload ${fileTypeLabel} only.`
            );
          } else if (error.code === "too-many-files") {
            toast.error(`Too many files. Maximum ${maxFiles} files allowed.`);
          } else if (error.code === "file-too-large") {
            toast.error(
              `File "${rejection.file.name}" is too large. Maximum size is ${
                maxSize ? maxSize / 1024 / 1024 : "unknown"
              }MB.`
            );
          } else {
            toast.error(`Error: ${error.message}`);
          }
        });
        onReject?.(rejectedFiles);
      },
      [onReject, fileTypeLabel, maxFiles, maxSize]
    );

    // Defensive validator: safely handle missing name/type
    const fileValidator = useCallback(
      (file: File) => {
        try {
          const fileType = String(file?.type || "").toLowerCase();
          const fileName = String(file?.name || "").toLowerCase();

          // Normalize accepted extensions (ensure they start with a dot)
          const normalizedExts = (acceptedFileTypes || []).map((ext) =>
            ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`
          );

          // Allowed mime types from accept prop
          const allowedMimes = accept
            ? Object.keys(accept).map((m) => String(m).toLowerCase())
            : [];

          const hasValidExtension = normalizedExts.length
            ? normalizedExts.some((ext) => fileName.endsWith(ext))
            : false;

          const hasValidMime = allowedMimes.length
            ? allowedMimes.includes(fileType)
            : false;

          if (!hasValidMime && !hasValidExtension) {
            return {
              code: "file-invalid-type",
              message: `Only ${fileTypeLabel} are allowed`,
            };
          }

          return null;
        } catch (err) {
          // If something unexpected happens, reject the file without crashing the app.
          return {
            code: "file-invalid-type",
            message: `Only ${fileTypeLabel} are allowed`,
          };
        }
      },
      [acceptedFileTypes, accept, fileTypeLabel]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: handleDrop,
      onDropRejected: handleDropRejected,
      accept,
      multiple: maxFiles ? maxFiles > 1 : true,
      maxFiles,
      maxSize,
      disabled,
      noClick: disabled,
      noDrag: disabled,
      validator: fileValidator,
    });

    const dropzoneClasses = useMemo(
      () =>
        cn(
          "relative h-full w-full border border-dashed p-6 pb-10 rounded-[4rem] transition-colors duration-300 group/dropzone border-black/20 dark:border-border [corner-shape:squircle]",
          "hover:bg-muted/20",
          isDragActive && "border-primary/30 border-[1.5px] bg-muted/40",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer",
          className
        ),
      [isDragActive, disabled, className]
    );

    const labelClasses = useMemo(
      () =>
        cn(
          "absolute ",
          "px-2 py-1 rounded-full text-[10px] font-bold tracking-wider transition-colors duration-300 leading-none",
          "text-muted-foreground/80 group-hover/dropzone:text-muted-foreground",
          "group-hover/dropzone:border-primary/15 group-hover/dropzone:bg-muted/70",
          "border border-border",
          isDragActive && "text-foreground bg-muted border-primary/25"
        ),
      [isDragActive]
    );

    const contentClasses = useMemo(
      () =>
        cn(
          "flex gap-2 flex-col w-full h-full items-center justify-center text-center transition-colors duration-300 font-normal",
          "text-muted-foreground group-hover/dropzone:text-foreground",
          isDragActive && "text-foreground"
        ),
      [isDragActive]
    );

    return (
      <div {...getRootProps()} className={dropzoneClasses}>
        <input {...getInputProps()} className="hidden" />
        <label className={labelClasses}>{label}</label>
        <div className={contentClasses}>
          <IconCloudUpload className="size-14" />
          <p>
            Drag and drop files here, <br /> or click to select files
          </p>
          <p className="text-sm text-muted-foreground/50">
            Supports {fileTypeLabel} only
            {maxFiles && ` (max ${maxFiles} file${maxFiles > 1 ? "s" : ""})`}
          </p>
        </div>
      </div>
    );
  }
);

FileDropzone.displayName = "FileDropzone";
