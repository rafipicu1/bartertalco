import { useNavigate, useLocation } from "react-router-dom";
import { Home, Heart, MessageCircle, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Beranda", path: "/" },
  { icon: Heart, label: "Swipe", path: "/swipe" },
  { icon: Plus, label: "Pasang", path: "/upload", highlight: true },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profil", path: "/profile" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around py-2 px-4 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] mt-1 text-muted-foreground">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className={cn("text-[10px] mt-1", isActive && "font-semibold")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
