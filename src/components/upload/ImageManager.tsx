"use client";

import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/upload/ImageUpload";
import { ImageGallery } from "@/components/upload/ImageGallery";
import { Loader2 } from "lucide-react";

type ImageManagerProps = {
  userId?: string;
  machineId?: string;
  title?: string;
  multiple?: boolean;
  maxFiles?: number;
};

export function ImageManager({
  userId,
  machineId,
  title,
  multiple = true,
  maxFiles = 5,
}: ImageManagerProps) {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const endpoint = userId ? `/api/uploads/users/${userId}` : `/api/uploads/machines/${machineId}`;

  useEffect(() => {
    fetchImages();
  }, [endpoint]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const result = await response.json();
        setImages(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newImages: any[]) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDelete = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSetPrimary = (imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }))
    );
  };

  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">Upload and manage images</p>
        </div>
      )}

      {/* Upload */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-medium text-slate-900">Upload Images</h3>
        <ImageUpload
          userId={userId}
          machineId={machineId}
          onUploadSuccess={handleUploadSuccess}
          multiple={multiple}
          maxFiles={maxFiles}
        />
      </div>

      {/* Gallery */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-medium text-slate-900">Gallery ({images.length})</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <ImageGallery
            images={images}
            onDelete={handleDelete}
            onSetPrimary={handleSetPrimary}
            userId={userId}
            machineId={machineId}
          />
        )}
      </div>
    </div>
  );
}
