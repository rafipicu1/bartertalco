import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/lib/auth";

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export const MobileLayout = ({ children, showBottomNav = true }: MobileLayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className={showBottomNav && user ? "pb-20 md:pb-0" : ""}>
        {children}
      </div>
      {showBottomNav && user && <BottomNav />}
    </div>
  );
};
