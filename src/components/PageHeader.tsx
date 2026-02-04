import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  icon?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: ReactNode;
}

export const PageHeader = ({ 
  title, 
  icon, 
  showBack = true, 
  onBack,
  rightContent 
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {icon && <span className="text-primary">{icon}</span>}
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </header>
  );
};
