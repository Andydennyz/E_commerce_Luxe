import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useSearchParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import ProductCard from "@/components/product-card.tsx";
import { useDebounce } from "@/hooks/use-debounce.ts";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("q") ?? "");
  const [debouncedQuery] = useDebounce(input, 350);

  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery, setSearchParams]);

  const results = useQuery(
    api.reviews.searchProducts,
    debouncedQuery.trim() ? { query: debouncedQuery } : "skip"
  );

  const isLoading = debouncedQuery.trim() && results === undefined;

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl md:text-5xl font-black uppercase mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Search
          </h1>
          <p className="text-muted-foreground">Find the perfect item from our catalogue</p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-2xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search products, styles, tags..."
            className="w-full pl-12 pr-12 py-4 bg-secondary border-2 border-border rounded-sm text-base outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground shadow-[0_0_30px_rgba(168,85,247,0.08)] focus:shadow-[0_0_30px_rgba(168,85,247,0.25)]"
          />
          {input && (
            <button
              onClick={() => setInput("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {!debouncedQuery.trim() ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <Sparkles className="w-12 h-12 text-primary/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Start typing to search the catalogue</p>
            </motion.div>
          ) : isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[3/4] rounded-md" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : results && results.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-xl font-bold mb-2">No results for {`"${debouncedQuery}"`}</p>
              <p className="text-muted-foreground mb-6">Try a different search term or browse all products</p>
              <Link
                to="/shop"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-sm font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Browse Shop
              </Link>
            </motion.div>
          ) : results && results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-muted-foreground mb-6">
                {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                <span className="text-primary font-semibold">{`"${debouncedQuery}"`}</span>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {results.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
