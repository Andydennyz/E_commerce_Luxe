import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import ProductCard from "@/components/product-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { toast } from "sonner";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = [
  "Black",
  "White",
  "Purple",
  "Blue",
  "Pink",
  "Silver",
  "Green",
  "Red",
];
const MAX_PRICE_FILTER = 1_000_000;

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? "",
  );
  const [debouncedSearch] = useDebounce(searchInput, 400);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);

  const seedData = useMutation(api.seed.seedData);
  const categories = useQuery(api.categories.list);
  const categorySlug = searchParams.get("category");
  const categoryIdParam = searchParams.get("categoryId");
  const activeCategory = categories?.find((category) =>
    categoryIdParam
      ? category._id === categoryIdParam
      : category.slug === categorySlug,
  );
  const activeCategoryId: Id<"categories"> | undefined = activeCategory?._id;
  const hasCategoryFilter = categoryIdParam !== null || categorySlug !== null;
  const categoryPending = hasCategoryFilter && categories === undefined;
  const categoryNotFound =
    hasCategoryFilter && categories !== undefined && !activeCategory;

  const { results, status, loadMore } = usePaginatedQuery(
    api.products.list,
    {
      categoryId: activeCategoryId,
      featured: undefined,
      trending: undefined,
      newArrival: undefined,
      search: debouncedSearch || undefined,
    },
    { initialNumItems: 12 },
  );

  const filtered = useMemo(() => {
    let items = results ?? [];
    if (selectedSizes.length > 0) {
      items = items.filter((p) =>
        selectedSizes.some((s) => p.sizes.includes(s)),
      );
    }
    if (selectedColors.length > 0) {
      items = items.filter((p) =>
        selectedColors.some((c) => p.colors.includes(c)),
      );
    }
    if (maxPrice !== null) {
      items = items.filter((p) => p.price <= maxPrice);
    }
    if (sortBy === "price-asc")
      items = [...items].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc")
      items = [...items].sort((a, b) => b.price - a.price);
    if (sortBy === "rating")
      items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return items;
  }, [results, selectedSizes, selectedColors, maxPrice, sortBy]);

  const toggleSize = (size: string) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  const toggleColor = (color: string) =>
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setMaxPrice(null);
  };

  const hasFilters =
    selectedSizes.length > 0 || selectedColors.length > 0 || maxPrice !== null;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedData({});
      toast.success((result as { message: string }).message);
    } catch {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  const isEmpty =
    status !== "LoadingFirstPage" &&
    filtered.length === 0 &&
    !debouncedSearch &&
    !hasFilters &&
    !hasCategoryFilter;
  const selectCategory = (categoryId?: Id<"categories">) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("category");
    if (categoryId) nextParams.set("categoryId", categoryId);
    else nextParams.delete("categoryId");
    setSearchParams(nextParams);
  };

  return (
    <div className="pt-20 min-h-screen">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/40 backdrop-blur-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-1">
                Collections
              </p>
              <h1
                className="text-3xl md:text-4xl font-black uppercase"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                SHOP
              </h1>
            </div>
            <div className="flex gap-3 items-center">
              {/* Sort */}
              <div className="relative hidden sm:block">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-secondary border border-border rounded-sm px-4 py-2.5 pr-8 text-sm text-foreground outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {/* Filter toggle */}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-sm border text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer",
                  filterOpen || hasFilters
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {hasFilters && (
                  <span className="w-2 h-2 bg-primary rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-sm text-sm outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          {categories && categories.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => selectCategory()}
                className={cn(
                  "flex-shrink-0 px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer",
                  !activeCategoryId
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => selectCategory(cat._id)}
                  className={cn(
                    "flex-shrink-0 px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer",
                    activeCategory?._id === cat._id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Filters Panel */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sizes */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                      Size
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "w-10 h-10 text-xs font-bold rounded-sm border transition-all cursor-pointer",
                            selectedSizes.includes(size)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50",
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Colors */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                      Color
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-sm border transition-all cursor-pointer",
                            selectedColors.includes(color)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50",
                          )}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Price */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                      Max Price:{" "}
                      <span className="text-foreground">
                        {maxPrice === null
                          ? "No limit"
                          : `Ksh ${maxPrice.toLocaleString("en-KE")}`}
                      </span>
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={MAX_PRICE_FILTER}
                      step={10}
                      value={maxPrice ?? MAX_PRICE_FILTER}
                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    {hasFilters && (
                      <button
                        onClick={clearFilters}
                        className="mt-3 flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {status !== "LoadingFirstPage" && (
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            {activeCategoryId && categories && (
              <span className="text-primary">
                {" "}
                in {categories.find((c) => c._id === activeCategoryId)?.name}
              </span>
            )}
          </p>
        )}

        {status === "LoadingFirstPage" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] rounded-md" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : categoryPending ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-md" />
            ))}
          </div>
        ) : categoryNotFound ? (
          <div className="text-center py-20">
            <p className="text-xl font-bold mb-2">Collection not found</p>
            <p className="text-muted-foreground mb-5">
              This collection may have been removed.
            </p>
            <Link to="/collections" className="text-primary underline">
              Browse all collections
            </Link>
          </div>
        ) : isEmpty ? (
          // Empty state with seed button
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2
                className="text-2xl font-black uppercase mb-2"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                No Products Yet
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                The shop is empty. Load the demo catalogue to see how products
                look and feel.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {seeding ? "Loading..." : "Load Demo Products"}
            </button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">No products found</p>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-primary text-sm underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}

        {status === "CanLoadMore" && (
          <div className="text-center mt-12">
            <button
              onClick={() => loadMore(12)}
              className="px-8 py-3 border border-primary/50 text-primary rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
