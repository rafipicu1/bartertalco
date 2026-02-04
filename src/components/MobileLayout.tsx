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
    <div className="min-h-screen bg-background overflow-x-hidden max-w-full">
      <div className={`overflow-x-hidden max-w-full ${showBottomNav && user ? "pb-20" : ""}`}>
        {children}
      </div>
      {showBottomNav && user && <BottomNav />}
    </div>
  );
};
