"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

type ImageUploadProps = {
  userId?: string;
  machineId?: string;
  onUploadSuccess?: (images: any[]) => void;
  multiple?: boolean;
  maxFiles?: number;
};

export function ImageUpload({
  userId,
  machineId,
  onUploadSuccess,
  multiple = true,
  maxFiles = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string[]>([]);

  const endpoint = userId ? `/api/uploads/users/${userId}` : `/api/uploads/machines/${machineId}`;

  const handleFiles = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);

      if (maxFiles && fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Generate previews
      const previews: string[] = [];
      for (const file of fileArray) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            previews.push(e.target.result as string);
            if (previews.length === fileArray.length) {
              setPreview(previews);
            }
          }
        };
        reader.readAsDataURL(file);
      }

      // Upload files
      setUploading(true);
      try {
        const formData = new FormData();

        if (multiple) {
          fileArray.forEach((file) => {
            formData.append("files", file);
          });
        } else {
          formData.append("file", fileArray[0]);
        }

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Upload failed");
        }

        const result = await response.json();
        toast.success(`${fileArray.length} image(s) uploaded successfully`);
        onUploadSuccess?.(result.data);
        setPreview([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
        setPreview([]);
      } finally {
        setUploading(false);
      }
    },
    [endpoint, maxFiles, multiple, onUploadSuccess]
  );

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragActive
            ? "border-slate-900 bg-slate-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            <p className="text-sm font-medium text-slate-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-900">Drag and drop images here</p>
            <p className="text-xs text-slate-500">or click to select files</p>
            <p className="mt-2 text-xs text-slate-500">
              Supported formats: JPG, PNG, WebP, GIF (Max {maxFiles} files, 5MB each)
            </p>
          </div>
        )}
      </div>

      {/* Previews */}
      {preview.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Preview ({preview.length})</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {preview.map((src, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                <img
                  src={src}
                  alt={`Preview ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
