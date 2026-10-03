import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "@/convex/_generated/api.js";
import { Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import NeonButton from "@/components/neon-button.tsx";

export default function LookbookPage() {
  const videos = useQuery(api.lookbook.listActive);

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Video className="w-6 h-6 text-primary" />
          <h1
            className="text-3xl font-black uppercase"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Lookbook
          </h1>
        </div>

        {videos === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[9/16] w-full rounded-md" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
            <Video className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-bold mb-2">No videos yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Check back soon for the latest looks.
            </p>
            <Link to="/shop">
              <NeonButton>Explore the Shop</NeonButton>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map((video) => (
              <article
                key={video._id}
                className="overflow-hidden rounded-md border border-border/60 bg-card/40"
              >
                <div className="aspect-[9/16] max-h-[75vh] bg-black">
                  <video
                    src={video.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                    aria-label={video.title}
                  />
                </div>
                <div className="p-4">
                  <h2 className="font-bold text-sm">{video.title}</h2>
                  {video.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                      {video.description}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
