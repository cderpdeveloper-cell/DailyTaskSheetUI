import React from "react";
import { 
  Home, 
  Users, 
  Settings, 
  FileText, 
  UserCircle, 
  ShieldCheck, 
  Briefcase, 
  Layers, 
  Building2,
  BookOpen,
  Tag,
  Target,
  Clock,
  HelpCircle,
  Receipt
} from "lucide-react";

export const iconMap: Record<string, React.ElementType> = {
  "bar-chart-2": Home,
  "users": Users,
  "layers": Layers,
  "fa-solid fa-user-tag": ShieldCheck,
  "fa-solid fa-person-military-to-person": ShieldCheck,
  "fa-solid fa-user-tie": UserCircle,
  "book": BookOpen,
  "fa-solid fa-receipt": Receipt,
  "tag": Tag,
  "fa-solid fa-building-columns": Building2,
  "target": Target,
  "clock": Clock,
};

export const getIcon = (iconName: string | null) => {
  if (!iconName) return HelpCircle;
  return iconMap[iconName] || HelpCircle;
};
