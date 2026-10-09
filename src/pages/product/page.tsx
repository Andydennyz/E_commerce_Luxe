import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart, Heart, Star, ArrowLeft, ZoomIn, X,
  Truck, Shield, RotateCcw, Share2, CheckCircle,
} from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import { toast } from "sonner";
import NeonButton from "@/components/neon-button.tsx";
import ProductCard from "@/components/product-card.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import { useGuestCart } from "@/components/providers/guest-cart.tsx";
import { useRequireAuth } from "@/hooks/use-require-auth.ts";
import { SignInButton } from "@/components/ui/signin.tsx";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = useQuery(api.products.getBySlug, { slug: slug ?? "" });
  const reviews = useQuery(api.reviews.getProductReviews, product ? { productId: product._id } : "skip");
  const userReview = useQuery(api.reviews.getUserReview, product ? { productId: product._id } : "skip");
  const related = useQuery(api.products.getRelated, product ? { categoryId: product.categoryId, excludeId: product._id } : "skip");
  const isWishlisted = useQuery(api.wishlist.isInWishlist, product ? { productId: product._id } : "skip");

  const { addItem } = useGuestCart();
  const { requireAuth } = useRequireAuth();
  const recordCartAddition = useMutation(api.userActivity.recordCartAddition);
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);
  const addReview = useMutation(api.reviews.addReview);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customAttributes, setCustomAttributes] = useState([{ name: "", value: "" }]);
  const [quantity, setQuantity] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  if (product === undefined) {
    return (
      <div className="pt-24 max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <Skeleton className="aspect-square rounded-md" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-sm" />)}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link to="/shop"><NeonButton>Back to Shop</NeonButton></Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!(await requireAuth("add items to your cart"))) return;
    try {
      if (customMode) {
        const attributes = customAttributes
          .map(({ name, value }) => ({ name: name.trim(), value: value.trim() }))
          .filter(({ name, value }) => name && value);
        if (attributes.length === 0 || attributes.length !== customAttributes.length) {
          toast.error("Please complete each custom attribute");
          return;
        }
        await recordCartAddition({
          productId: product._id,
          quantity,
          size: "Custom",
          color: "Custom",
        });
        addItem(product, quantity, "Custom", "Custom", attributes);
      } else {
        if (product.sizes.length > 0 && !selectedSize) { toast.error("Please select a size"); return; }
        if (product.colors.length > 0 && !selectedColor) { toast.error("Please select a color"); return; }
        await recordCartAddition({
          productId: product._id,
          quantity,
          size: selectedSize ?? "N/A",
          color: selectedColor ?? "N/A",
        });
        addItem(product, quantity, selectedSize ?? "N/A", selectedColor ?? "N/A");
      }
      setAddedToCart(true);
      toast.success("Added to cart!");
      setTimeout(() => setAddedToCart(false), 2500);
    } catch { toast.error("Could not add this item to your cart"); }
  };

  const handleWishlist = async () => {
    if (!(await requireAuth("add items to your wishlist"))) return;
    try {
      const added = await toggleWishlist({ productId: product._id });
      toast.success(added ? "Added to wishlist" : "Removed from wishlist");
    } catch { toast.error("Sign in to use wishlist"); }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewBody.trim()) { toast.error("Please fill in all review fields"); return; }
    setSubmittingReview(true);
    try {
      await addReview({ productId: product._id, rating: reviewRating, title: reviewTitle, body: reviewBody });
      toast.success("Review submitted!");
      setReviewTitle("");
      setReviewBody("");
      setReviewRating(5);
    } catch {
      toast.error("Could not submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
          <button onClick={handleShare} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 mb-20">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-md border border-border/50 cursor-zoom-in bg-secondary"
              onClick={() => setZoomed(true)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={product.images[selectedImage]}
                  alt={product.name}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute top-3 right-3 p-2 bg-card/60 backdrop-blur-md rounded-sm border border-border/50 text-muted-foreground pointer-events-none">
                <ZoomIn className="w-4 h-4" />
              </div>
              {discount > 0 && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-[oklch(0.72_0.2_330)] text-white text-xs font-bold uppercase rounded-sm">
                  -{discount}%
                </div>
              )}
              {product.newArrival && (
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase rounded-sm">
                  New
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "aspect-square rounded-sm overflow-hidden border-2 transition-all cursor-pointer",
                      selectedImage === i
                        ? "border-primary shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                        : "border-border/30 hover:border-border opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {/* Rating & title */}
            <div>
              {product.rating ? (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < Math.round(product.rating!)
                            ? "fill-[oklch(0.75_0.15_60)] text-[oklch(0.75_0.15_60)]"
                            : "text-border",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>
              ) : null}
              <h1
                className="text-3xl md:text-4xl font-black uppercase mb-3 leading-tight"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                {product.name}
              </h1>
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-black text-primary">Ksh {product.price.toFixed(2)}</span>
                {product.comparePrice && (
                  <span className="text-xl text-muted-foreground line-through">Ksh {product.comparePrice.toFixed(2)}</span>
                )}
                {discount > 0 && (
                  <span className="text-sm font-bold text-[oklch(0.72_0.2_330)]">Save {discount}%</span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Product options</p>
                <div className="flex gap-2">
                  {(["standard", "custom"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={customMode === (mode === "custom")}
                      onClick={() => setCustomMode(mode === "custom")}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold uppercase tracking-widest rounded-sm border transition-all cursor-pointer",
                        customMode === (mode === "custom")
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {mode === "custom" ? "Custom" : "Standard"}
                    </button>
                  ))}
                </div>
              </div>

            {!customMode && product.colors.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Color: <span className="text-foreground font-semibold">{selectedColor ?? "Select one"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-sm border transition-all cursor-pointer",
                        selectedColor === color
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!customMode && product.sizes.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Size: <span className="text-foreground font-semibold">{selectedSize ?? "Select one"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-12 h-12 text-sm font-bold uppercase rounded-sm border transition-all cursor-pointer",
                        selectedSize === size
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/50",
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {customMode && (
              <div className="space-y-3 rounded-sm border border-primary/30 bg-primary/5 p-4">
                <div>
                  <p className="text-sm font-bold text-primary">Custom attributes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Specify the product details you want, such as a custom size, color, or material.
                  </p>
                </div>
                {customAttributes.map((attribute, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      aria-label={`Custom attribute ${index + 1} name`}
                      value={attribute.name}
                      onChange={(event) =>
                        setCustomAttributes((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, name: event.target.value } : item,
                          ),
                        )
                      }
                      maxLength={40}
                      placeholder="Attribute (e.g. Material)"
                      className="w-full bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    />
                    <div className="flex gap-2">
                      <input
                        aria-label={`Custom attribute ${index + 1} value`}
                        value={attribute.value}
                        onChange={(event) =>
                          setCustomAttributes((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, value: event.target.value } : item,
                            ),
                          )
                        }
                        maxLength={100}
                        placeholder="Your preference"
                        className="min-w-0 flex-1 bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
                      />
                      {customAttributes.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remove custom attribute ${index + 1}`}
                          onClick={() =>
                            setCustomAttributes((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                          className="px-3 rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {customAttributes.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setCustomAttributes((current) => [...current, { name: "", value: "" }])}
                    className="text-xs font-semibold uppercase tracking-widest text-primary hover:text-foreground transition-colors"
                  >
                    + Add another attribute
                  </button>
                )}
              </div>
            )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Qty:</p>
              <div className="flex items-center border border-border rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer text-lg"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <NeonButton fullWidth onClick={handleAddToCart} variant={addedToCart ? "blue" : "purple"}>
                {addedToCart ? (
                  <><CheckCircle className="w-5 h-5" /> Added!</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Add to Cart</>
                )}
              </NeonButton>
              <button
                  onClick={handleWishlist}
                  className={cn(
                    "p-3 rounded-sm border transition-all cursor-pointer flex-shrink-0",
                    isWishlisted
                      ? "bg-primary/20 border-primary text-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Over $50" },
                { icon: Shield, label: "Secure Pay", sub: "100% safe" },
                { icon: RotateCcw, label: "Free Returns", sub: "30 days" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="text-center p-2">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1 bg-secondary border border-border/50 rounded-sm text-muted-foreground uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-20">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Reviews
            </h2>
            {reviews && reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < Math.round(product.rating ?? 0) ? "fill-[oklch(0.75_0.15_60)] text-[oklch(0.75_0.15_60)]" : "text-border")} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{product.rating} avg · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Review list */}
            <div className="space-y-4">
              {reviews === undefined ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-md" />)
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-border/40 rounded-md bg-card/30">
                  <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>No reviews yet. Be the first to share your experience!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <GlassCard key={review._id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5", i < review.rating ? "fill-[oklch(0.75_0.15_60)] text-[oklch(0.75_0.15_60)]" : "text-border")} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {review.user?.name ?? "Anonymous"}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{review.title}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{review.body}</p>
                  </GlassCard>
                ))
              )}
            </div>

            {/* Write review form */}
            <Authenticated>
              {userReview ? (
                <GlassCard className="p-6 space-y-3 h-fit">
                  <h3 className="font-bold uppercase tracking-wider text-sm">Your Review</h3>
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("w-4 h-4", i < userReview.rating ? "fill-[oklch(0.75_0.15_60)] text-[oklch(0.75_0.15_60)]" : "text-border")} />
                    ))}
                  </div>
                  <p className="font-semibold text-sm">{userReview.title}</p>
                  <p className="text-sm text-muted-foreground">{userReview.body}</p>
                  <p className="text-xs text-primary uppercase tracking-widest">You have already reviewed this product</p>
                </GlassCard>
              ) : (
              <GlassCard className="p-6 space-y-4 h-fit">
                <h3 className="font-bold uppercase tracking-wider text-sm">Write a Review</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Star picker */}
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your Rating</p>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewRating(i + 1)}
                          onMouseEnter={() => setReviewHoverRating(i + 1)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          className="cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            className={cn(
                              "w-6 h-6 transition-colors",
                              i < (reviewHoverRating || reviewRating)
                                ? "fill-[oklch(0.75_0.15_60)] text-[oklch(0.75_0.15_60)]"
                                : "text-border",
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Review title"
                      maxLength={80}
                      className="w-full px-4 py-2.5 bg-secondary border border-border rounded-sm text-sm outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Share your thoughts about this product..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-2.5 bg-secondary border border-border rounded-sm text-sm outline-none focus:border-primary transition-all text-foreground placeholder:text-muted-foreground resize-none"
                    />
                  </div>
                  <NeonButton type="submit" fullWidth variant="purple" disabled={submittingReview}>
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </NeonButton>
                </form>
              </GlassCard>
              )}
            </Authenticated>
            <Unauthenticated>
              <GlassCard className="p-6 space-y-3 h-fit">
                <h3 className="font-bold uppercase tracking-wider text-sm">Write a Review</h3>
                <p className="text-sm text-muted-foreground">
                  Sign in to share your experience with this product.
                </p>
                <SignInButton className="w-full" />
              </GlassCard>
            </Unauthenticated>
          </div>
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black uppercase mb-8" style={{ fontFamily: "Orbitron, sans-serif" }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Zoom overlay */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomed(false)}
          >
            <button className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10">
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              src={product.images[selectedImage]}
              alt={product.name}
              className="max-w-full max-h-full object-contain rounded-md"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
