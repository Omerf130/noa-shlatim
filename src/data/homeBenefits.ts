import type { LucideIcon } from "lucide-react";
import { Heart, Layers, Sparkles, TreeDeciduous } from "lucide-react";

export type HomeBenefitItem = {
  label: string;
  Icon: LucideIcon;
};

export const homeBenefits: HomeBenefitItem[] = [
  { label: "עיצוב אישי באמת", Icon: Heart },
  { label: "איור מהתמונה שלכם", Icon: Sparkles },
  { label: "תהליך פשוט", Icon: Layers },
  { label: "עץ או מגנט", Icon: TreeDeciduous },
];
