import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "success" | "warning" | "info";
}

const variantClasses = {
  default: "bg-card",
  primary: "bg-accent",
  success: "bg-success/10",
  warning: "bg-warning/10",
  info: "bg-info/10",
};

const iconVariantClasses = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-info text-info-foreground",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className={`stat-card ${variantClasses[variant]} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconVariantClasses[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
