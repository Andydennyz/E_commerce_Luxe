import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useAuthCallback } from "@usehercules/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import {
  getAdminDisplayName,
  isAuthorizedAdminEmail,
} from "@/convex/adminAccess.ts";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, signout } = useAuth();
  const { isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const updateCurrentUser = useMutation(api.users.updateCurrentUser);

  const onSync = useCallback(async () => {
    const email = user?.profile?.email as string | undefined;

    if (!isAuthorizedAdminEmail(email)) {
      toast.error("Access denied", {
        description: "This email is not authorized to access this site.",
      });
      await signout();
      throw new Error("This email is not authorized to access this site.");
    }

    await updateCurrentUser();

    const adminName = getAdminDisplayName(email);
    if (adminName) {
      toast.success(`Welcome, Admin ${adminName}`);
    }
  }, [signout, updateCurrentUser, user]);

  const navigateHome = useCallback(
    () => navigate("/", { replace: true }),
    [navigate],
  );

  const { status, error, retry } = useAuthCallback({
    isBackendAuthenticated: isConvexAuthenticated,
    onSync,
    onSuccess: navigateHome,
    onNoAuthParams: navigateHome,
  });

  if (status === "error" && error) {
    return (
      <div className="flex flex-col items-center justify-center h-svh gap-6 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-destructive font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={navigateHome}>
            Return home
          </Button>
          <Button onClick={retry}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-svh gap-4">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
