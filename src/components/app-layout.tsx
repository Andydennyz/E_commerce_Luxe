import { Outlet } from "react-router-dom";
import Navbar from "@/components/navbar.tsx";
import Footer from "@/components/footer.tsx";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
