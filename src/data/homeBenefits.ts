import type { LucideIcon } from "lucide-react";
import { Heart, Layers, Magnet, Sparkles } from "lucide-react";

export type HomeBenefitItem = {
  label: string;
  Icon: LucideIcon;
};

export const homeBenefits: HomeBenefitItem[] = [
  { label: "עיצוב אישי באמת", Icon: Heart },
  { label: "איור מהתמונה שלכם", Icon: Sparkles },
  { label: "תהליך פשוט", Icon: Layers },
  { label: "שלטי מגנט לדלת", Icon: Magnet },
];
