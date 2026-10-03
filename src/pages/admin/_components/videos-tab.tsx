import { useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Video,
  Loader2,
  Play,
  Pause,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Check,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";
import GlassCard from "@/components/glass-card.tsx";
import NeonButton from "@/components/neon-button.tsx";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

/* ─── Upload dropzone ─────────────────────────────────────────── */
type UploadZoneProps = {
  onUploaded: (storageId: Id<"_storage">, url: string) => void;
};

function VideoUploadZone({ onUploaded }: UploadZoneProps) {
  const generateUrl = useMutation(api.files.generateVideoUploadUrl);
  const getUrl = useMutation(api.files.getStorageUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draggingOver, setDraggingOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        toast.error("Only video files are allowed");
        return;
      }
      setUploading(true);
      setProgress(0);
      try {
        const uploadUrl = await generateUrl();
        // Upload with XHR so we can track progress
        const storageId = await new Promise<Id<"_storage">>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const { storageId } = JSON.parse(xhr.responseText) as { storageId: Id<"_storage"> };
              resolve(storageId);
            } else {
              reject(new Error("Upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.open("POST", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
        const url = await getUrl({ storageId });
        if (!url) throw new Error("Could not resolve URL");
        onUploaded(storageId, url);
        toast.success("Video uploaded successfully");
      } catch (err) {
        toast.error("Upload failed — please try again");
        console.error(err);
      } finally {
        setUploading(false);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [generateUrl, getUrl, onUploaded],
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("video/"));
    if (file) void uploadFile(file);
    else toast.error("Please drop a video file");
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
      onDragLeave={() => setDraggingOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={cn(
        "relative border-2 border-dashed rounded-sm p-8 text-center transition-all duration-200",
        uploading ? "cursor-default" : "cursor-pointer",
        draggingOver
          ? "border-primary bg-primary/10 shadow-[0_0_24px_rgba(168,85,247,0.25)]"
          : "border-border/60 hover:border-primary/50 hover:bg-primary/5",
      )}
    >
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleInput} />

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
          <p className="text-sm font-semibold text-foreground">Uploading… {progress}%</p>
          {/* Progress bar */}
          <div className="w-full max-w-xs h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Please wait — large videos may take a moment</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Video className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {draggingOver ? "Drop video here" : "Click or drag a video to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">MP4, MOV, WebM · Short outfit try-on clips</p>
          </div>
        </div>
      )}
    </div>
  );
}

type ProductStub = { _id: Id<"products">; name: string; price: number; images: string[] };

/* ─── Video card ──────────────────────────────────────────────── */
type VideoCardProps = {
  video: Doc<"lookbookVideos">;
  products: ProductStub[];
  onEdit: (v: Doc<"lookbookVideos">) => void;
  onDelete: (id: Id<"lookbookVideos">) => void;
  onToggle: (id: Id<"lookbookVideos">, active: boolean) => void;
};

function VideoCard({ video, products, onEdit, onDelete, onToggle }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const linkedProducts = products.filter((p) => video.productIds.includes(p._id));

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { void videoRef.current.play(); setPlaying(true); }
  };

  return (
    <GlassCard className="overflow-hidden p-0">
      {/* Video preview */}
      <div className="relative aspect-[9/16] max-h-64 bg-black group cursor-pointer" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={video.url}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          onEnded={() => setPlaying(false)}
        />
        {/* Play/pause overlay */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity",
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100",
        )}>
          <div className="w-12 h-12 rounded-full bg-background/80 border border-border flex items-center justify-center">
            {playing
              ? <Pause className="w-5 h-5 text-foreground" />
              : <Play className="w-5 h-5 text-foreground ml-0.5" />}
          </div>
        </div>
        {/* Active badge */}
        <div className={cn(
          "absolute top-2 left-2 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest border",
          video.active
            ? "bg-primary/20 text-primary border-primary/40"
            : "bg-muted/60 text-muted-foreground border-border",
        )}>
          {video.active ? "Live" : "Hidden"}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <p className="font-bold text-sm truncate" title={video.title}>{video.title}</p>
        {video.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
        )}
        {linkedProducts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {linkedProducts.map((p) => (
              <span key={p._id} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary border border-border text-muted-foreground truncate max-w-[120px]">
                {p.name}
              </span>
            ))}
          </div>
        )}
        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onToggle(video._id, !video.active)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-sm border transition-all cursor-pointer",
              video.active
                ? "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                : "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20",
            )}
          >
            {video.active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {video.active ? "Hide" : "Show"}
          </button>
          <button
            onClick={() => onEdit(video)}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all cursor-pointer"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={() => onDelete(video._id)}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-sm border border-destructive/30 text-destructive/80 hover:bg-destructive/10 transition-all cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

/* ─── Add / Edit form ─────────────────────────────────────────── */
type FormProps = {
  products: ProductStub[];
  editing: Doc<"lookbookVideos"> | null;
  onClose: () => void;
};

function VideoForm({ products, editing, onClose }: FormProps) {
  const addVideo = useMutation(api.lookbook.addVideo);
  const updateVideo = useMutation(api.lookbook.updateVideo);

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [selectedProductIds, setSelectedProductIds] = useState<Id<"products">[]>(editing?.productIds ?? []);
  const [uploadedStorageId, setUploadedStorageId] = useState<Id<"_storage"> | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleProduct = (id: Id<"products">) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!editing && !uploadedStorageId) { toast.error("Please upload a video first"); return; }

    setSaving(true);
    try {
      if (editing) {
        await updateVideo({
          id: editing._id,
          title: title.trim(),
          description: description.trim() || undefined,
          productIds: selectedProductIds,
          active: editing.active,
        });
        toast.success("Video updated");
      } else {
        await addVideo({
          title: title.trim(),
          description: description.trim() || undefined,
          storageId: uploadedStorageId!,
          url: uploadedUrl!,
          productIds: selectedProductIds,
        });
        toast.success("Video added to lookbook");
      }
      onClose();
    } catch {
      toast.error("Failed to save video");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <GlassCard className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {editing ? "Edit Video" : "Add New Video"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload zone — only shown for new videos */}
        {!editing && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
              Video File *
            </label>
            {uploadedUrl ? (
              <div className="relative rounded-sm overflow-hidden border border-primary/40 bg-black">
                <video src={uploadedUrl} className="w-full max-h-48 object-contain" controls />
                <button
                  onClick={() => { setUploadedStorageId(null); setUploadedUrl(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-background/80 border border-border rounded-full flex items-center justify-center hover:bg-destructive hover:border-destructive hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-sm">
                  Uploaded
                </div>
              </div>
            ) : (
              <VideoUploadZone
                onUploaded={(storageId, url) => {
                  setUploadedStorageId(storageId);
                  setUploadedUrl(url);
                }}
              />
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Title *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Neon Moto Jacket Try-On"
            className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short caption shown below the video…"
            rows={2}
            className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Link products */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">
            Linked Products ({selectedProductIds.length} selected)
          </label>
          <input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors mb-2"
          />
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {filteredProducts.map((p) => {
              const selected = selectedProductIds.includes(p._id);
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => toggleProduct(p._id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-sm text-sm transition-all cursor-pointer text-left",
                    selected
                      ? "bg-primary/20 border border-primary/40 text-primary"
                      : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-border/80",
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-sm border flex items-center justify-center shrink-0",
                    selected ? "bg-primary border-primary" : "border-border",
                  )}>
                    {selected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </div>
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-xs opacity-60 shrink-0">Ksh {p.price}</span>
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <p className="text-xs text-muted-foreground py-2 text-center">No products found</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <NeonButton variant="purple" onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving…" : editing ? "Save Changes" : "Add to Lookbook"}
          </NeonButton>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ─── Main Videos Tab ─────────────────────────────────────────── */
export default function VideosTab() {
  const videos = useQuery(api.lookbook.listAll);
  const productNames = useQuery(api.products.getAllNames);
  const toggleActive = useMutation(api.lookbook.toggleActive);
  const deleteVideo = useMutation(api.lookbook.deleteVideo);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Doc<"lookbookVideos"> | null>(null);

  const productList = productNames ?? [];

  const handleDelete = async (id: Id<"lookbookVideos">) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    try {
      await deleteVideo({ id });
      toast.success("Video deleted");
    } catch {
      toast.error("Failed to delete video");
    }
  };

  const handleToggle = async (id: Id<"lookbookVideos">, active: boolean) => {
    try {
      await toggleActive({ id, active });
      toast.success(active ? "Video is now live" : "Video hidden");
    } catch {
      toast.error("Failed to update video");
    }
  };

  const openEdit = (video: Doc<"lookbookVideos">) => {
    setEditing(video);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {videos?.length ?? 0} video{(videos?.length ?? 0) !== 1 ? "s" : ""} · {videos?.filter((v) => v.active).length ?? 0} live
          </p>
        </div>
        {!showForm && (
          <NeonButton variant="purple" size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Video
          </NeonButton>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <VideoForm
            products={productList}
            editing={editing}
            onClose={closeForm}
          />
        )}
      </AnimatePresence>

      {/* Video grid */}
      {videos === undefined ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-sm bg-secondary animate-pulse aspect-[9/16] max-h-72" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-sm uppercase tracking-widest mb-1">No videos yet</p>
          <p className="text-xs text-muted-foreground">Add short outfit try-on clips to feature in your lookbook</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {videos.map((video) => (
              <motion.div
                key={video._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <VideoCard
                  video={video}
                  products={productList}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
