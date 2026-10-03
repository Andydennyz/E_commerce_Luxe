import { useRef, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, ImageIcon, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";

type Props = {
  /** Current image URLs (may be external URLs from seeded data OR convex storage URLs) */
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
};

export default function AdminImageUploader({ value, onChange, maxImages = 8 }: Props) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getStorageUrl = useMutation(api.files.getStorageUrl);

  const [uploading, setUploading] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const remaining = maxImages - value.length;
      if (remaining <= 0) {
        toast.error(`Max ${maxImages} images allowed`);
        return;
      }
      const toUpload = files.slice(0, remaining);
      setUploading(true);
      const newUrls: string[] = [];

      try {
        for (const file of toUpload) {
          // 1. Get upload URL
          const uploadUrl = await generateUploadUrl();
          // 2. POST file bytes
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
          const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
          // 3. Resolve to serving URL
          const url = await getStorageUrl({ storageId });
          if (url) newUrls.push(url);
        }
        onChange([...value, ...newUrls]);
        toast.success(`${newUrls.length} image${newUrls.length > 1 ? "s" : ""} uploaded`);
      } catch (err) {
        toast.error("Upload failed — please try again");
        console.error(err);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [value, onChange, maxImages, generateUploadUrl, getStorageUrl],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    void uploadFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) void uploadFiles(files);
  };

  const removeImage = (index: number) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  // Drag-to-reorder helpers
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragEnter = (index: number) => setDragOverIndex(index);
  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const next = [...value];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dragOverIndex, 0, moved);
      onChange(next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const canAddMore = value.length < maxImages && !uploading;

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all duration-200",
            draggingOver
              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {draggingOver ? "Drop images here" : "Click or drag images to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Any format · Full quality · Up to {maxImages - value.length} more
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {value.map((url, i) => (
              <motion.div
                key={url}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "relative group rounded-sm overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing",
                  i === 0 ? "border-primary shadow-[0_0_10px_rgba(168,85,247,0.3)]" : "border-border/40",
                  dragOverIndex === i && dragIndex !== i ? "border-accent opacity-70" : "",
                )}
              >
                <img
                  src={url}
                  alt={`Product image ${i + 1}`}
                  className="w-full aspect-square object-cover"
                />

                {/* Overlay controls */}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <GripVertical className="w-5 h-5 text-foreground/70" />
                </div>

                {/* Primary badge */}
                {i === 0 && (
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase rounded-sm">
                    Main
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-background/80 border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:border-destructive hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state hint */}
      {value.length === 0 && !canAddMore && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
          <ImageIcon className="w-4 h-4" />
          <span>No images yet</span>
        </div>
      )}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxImages} images · Drag to reorder · First image is the main display image
        </p>
      )}
    </div>
  );
}
