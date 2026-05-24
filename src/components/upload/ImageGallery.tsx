"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, Star, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type ImageGalleryProps = {
  images: {
    id: string;
    url: string;
    isPrimary: boolean;
    createdAt: string;
  }[];
  onDelete?: (imageId: string) => void;
  onSetPrimary?: (imageId: string) => void;
  machineId?: string;
  userId?: string;
  editable?: boolean;
};

export function ImageGallery({
  images,
  onDelete,
  onSetPrimary,
  machineId,
  userId,
  editable = true,
}: ImageGalleryProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [imageList, setImageList] = useState(images);

  const endpoint = userId
    ? `/api/uploads/users/images`
    : `/api/uploads/machines/images`;

  const handleDelete = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;

    setDeleting(imageId);
    try {
      const response = await fetch(`${endpoint}/${imageId}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      setImageList((prev) => prev.filter((img) => img.id !== imageId));
      onDelete?.(imageId);
      toast.success("Image deleted");
    } catch (error) {
      toast.error("Failed to delete image");
    } finally {
      setDeleting(null);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setLoading(imageId);
    try {
      const response = await fetch(`${endpoint}/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPrimary" }),
      });

      if (!response.ok) {
        throw new Error("Failed to set primary image");
      }

      // Update local state
      setImageList((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.id === imageId,
        }))
      );

      onSetPrimary?.(imageId);
      toast.success("Primary image updated");
    } catch (error) {
      toast.error("Failed to set primary image");
    } finally {
      setLoading(null);
    }
  };

  if (imageList.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {imageList.map((image) => (
        <div
          key={image.id}
          className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition ${
            image.isPrimary
              ? "border-slate-900 bg-slate-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          {/* Image */}
          <img
            src={image.url}
            alt="Gallery"
            className="h-full w-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition group-hover:bg-black/40">
            {editable && (
              <>
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-1 text-xs font-medium text-white">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}

                {/* Set Primary Button */}
                {!image.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    disabled={loading === image.id}
                    className="rounded-lg bg-black p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-slate-900 disabled:bg-slate-400 dark:bg-slate-950 dark:hover:bg-black"
                    title="Set as primary image"
                  >
                    {loading === image.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Star className="h-5 w-5" />
                    )}
                  </button>
                )}

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(image.id)}
                  disabled={deleting === image.id}
                  className="rounded-lg bg-black p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-slate-900 disabled:bg-slate-400 dark:bg-slate-950 dark:hover:bg-black"
                  title="Delete image"
                >
                  {deleting === image.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Date */}
          <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">
            {new Date(image.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
