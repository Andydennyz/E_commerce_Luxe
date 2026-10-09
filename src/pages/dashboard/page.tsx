import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Activity, Heart, PackageCheck, ShoppingBag, Copy, Share2, Gift } from "lucide-react";
import { SignInButton } from "@/components/ui/signin.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

function getFirstName(name?: string, email?: string) {
  const displayName = name?.trim().split(/\s+/)[0];
  const emailName = email?.split("@")[0]?.split(/[._+-]/)[0];
  const firstName = displayName || emailName || "there";
  return firstName.charAt(0).toLocaleUpperCase() + firstName.slice(1);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}

function HistoryLoader() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-24 rounded-md" />
      ))}
    </div>
  );
}

function UserDashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const referral = useQuery(api.referrals.getMyReferralInfo);
  const ensureReferralCode = useMutation(api.referrals.ensureMyReferralCode);
  const orders = usePaginatedQuery(
    api.orders.listMyOrders,
    {},
    { initialNumItems: 10 },
  );
  const activity = usePaginatedQuery(
    api.userActivity.getMyActivity,
    {},
    { initialNumItems: 20 },
  );
  const referralCodeRequested = useRef(false);

  useEffect(() => {
    if (!user || referralCodeRequested.current) return;
    referralCodeRequested.current = true;
    void ensureReferralCode({}).catch((error: unknown) => {
      referralCodeRequested.current = false;
      console.error("Unable to create referral code:", error);
      toast.error("Unable to prepare your referral code. Please try again.");
    });
  }, [ensureReferralCode, user]);

  const copyReferralCode = async () => {
    if (!referral?.code) return;
    try {
      await navigator.clipboard.writeText(referral.code);
      toast.success("Referral code copied");
    } catch (error) {
      console.error("Unable to copy referral code:", error);
      toast.error("Unable to copy the referral code.");
    }
  };

  const shareReferralCode = async () => {
    if (!referral?.code) return;
    const message = `Use my referral code ${referral.code} for 10% off your first order at Luxe.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Luxe referral code", text: message });
      } else {
        await navigator.clipboard.writeText(message);
        toast.success("Referral message copied");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Unable to share referral code:", error);
      toast.error("Unable to share your referral code.");
    }
  };

  if (user === undefined || orders.status === "LoadingFirstPage" || activity.status === "LoadingFirstPage") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-md" />
        <HistoryLoader />
        <HistoryLoader />
      </div>
    );
  }

  const paidOrders = orders.results.filter(
    ({ order }) => order.paymentStatus === "paid",
  );

  return (
    <div className="space-y-10">
      <GlassCard glow="purple" className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-5 h-5 text-primary" />
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Your account
          </p>
        </div>
        <h1
          className="text-3xl md:text-4xl font-black uppercase"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Welcome, {getFirstName(user?.name, user?.email)}
        </h1>
        {user?.email && (
          <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          Review your purchases and the products you have saved or added to your cart.
        </p>
      </GlassCard>

      <GlassCard glow="blue" className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
              Give a friend 10% off
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your code with a new customer. It can be redeemed once and is valid on their first order.
            </p>
            <p className="mt-3 font-mono text-lg font-bold tracking-wider text-foreground break-all">
              {referral?.code ?? "Creating your code..."}
            </p>
            {referral?.redeemed && (
              <p className="mt-1 text-xs text-accent">Your referral code has been redeemed.</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={copyReferralCode}
              disabled={!referral?.code || referral.redeemed}
              className="flex items-center gap-2 px-3 py-2 border border-primary/40 rounded-sm text-xs uppercase tracking-wider text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
            <button
              type="button"
              onClick={shareReferralCode}
              disabled={!referral?.code || referral.redeemed}
              className="flex items-center gap-2 px-3 py-2 border border-accent/40 rounded-sm text-xs uppercase tracking-wider text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </GlassCard>

      <section>
        <div className="flex items-center gap-3 mb-5">
          <PackageCheck className="w-5 h-5 text-primary" />
          <h2
            className="text-xl md:text-2xl font-black uppercase"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Purchase History
          </h2>
        </div>
        {paidOrders.length === 0 ? (
          <GlassCard className="p-6 text-sm text-muted-foreground">
            No completed purchases yet.
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {paidOrders.map(({ order, items }) => (
              <GlassCard key={order._id} className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      Order <span className="font-mono text-primary">{order._id}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(order._creationTime)} · {order.status}
                    </p>
                  </div>
                  <p className="font-black text-primary">
                    Ksh {order.total.toFixed(2)}
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <img
                        src={item.productImage}
                        alt=""
                        className="w-10 h-12 object-cover rounded-sm bg-secondary"
                        loading="lazy"
                      />
                      <span className="flex-1 min-w-0 truncate">{item.productName}</span>
                      <span className="text-muted-foreground">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
        {orders.status !== "Exhausted" && (
          <button
            type="button"
            onClick={() => orders.loadMore(10)}
            disabled={orders.status === "LoadingMore"}
            className="mt-4 px-5 py-2.5 border border-primary/40 rounded-sm text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {orders.status === "LoadingMore" ? "Loading..." : "Load More Orders"}
          </button>
        )}
      </section>

      <section>
        <div className="flex items-center gap-3 mb-5">
          <Heart className="w-5 h-5 text-primary" />
          <h2
            className="text-xl md:text-2xl font-black uppercase"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Wishlist & Cart Activity
          </h2>
        </div>
        {activity.results.length === 0 ? (
          <GlassCard className="p-6 text-sm text-muted-foreground">
            No wishlist or cart activity recorded yet.
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {activity.results.map((entry) => {
              const isWishlist = entry.type === "wishlist_added";
              const Icon = isWishlist ? Heart : ShoppingBag;
              return (
                <GlassCard key={entry._id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/product/${entry.productSlug}`}
                      className="shrink-0"
                      aria-label={`View ${entry.productName}`}
                    >
                      <img
                        src={entry.productImage}
                        alt=""
                        className="w-14 h-16 object-cover rounded-sm bg-secondary"
                        loading="lazy"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                        <Icon className="w-3.5 h-3.5" />
                        {isWishlist ? "Added to wishlist" : "Added to cart"}
                      </p>
                      <Link
                        to={`/product/${entry.productSlug}`}
                        className="block mt-1 text-sm font-semibold truncate hover:text-primary"
                      >
                        {entry.productName}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(entry._creationTime)}
                        {!isWishlist && ` · Quantity ${entry.quantity}`}
                        {entry.size && ` · Size ${entry.size}`}
                        {entry.color && ` · Color ${entry.color}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary whitespace-nowrap">
                      Ksh {entry.price.toFixed(2)}
                    </p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
        {activity.status !== "Exhausted" && (
          <button
            type="button"
            onClick={() => activity.loadMore(20)}
            disabled={activity.status === "LoadingMore"}
            className="mt-4 px-5 py-2.5 border border-primary/40 rounded-sm text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {activity.status === "LoadingMore" ? "Loading..." : "Load More Activity"}
          </button>
        )}
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <AuthLoading>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-md" />
            <HistoryLoader />
          </div>
        </AuthLoading>
        <Authenticated>
          <UserDashboard />
        </Authenticated>
        <Unauthenticated>
          <GlassCard className="max-w-lg mx-auto p-8 text-center space-y-4">
            <h1
              className="text-2xl font-black uppercase"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Sign in to view your dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Your purchase and shopping activity is private to your account.
            </p>
            <SignInButton className="mx-auto" />
          </GlassCard>
        </Unauthenticated>
      </div>
    </div>
  );
}
