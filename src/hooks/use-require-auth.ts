import { useCallback } from "react";
import { useAuth } from "@usehercules/auth/react";
import { toast } from "sonner";
import { storePostSignInPath } from "@/lib/auth-redirect.ts";

export function useRequireAuth() {
  const { isAuthenticated, isLoading, signin } = useAuth();

  const requireAuth = useCallback(
    async (action: string) => {
      if (isAuthenticated) return true;
      if (isLoading) {
        toast.info("Please wait while we check your sign-in status.");
        return false;
      }

      toast.info(`Sign in to ${action}.`);
      try {
        storePostSignInPath();
        await signin();
      } catch (error) {
        console.error("Sign-in failed:", error);
        toast.error("Unable to start sign-in. Please try again.");
      }
      return false;
    },
    [isAuthenticated, isLoading, signin],
  );

  return { isAuthenticated, requireAuth };
}
