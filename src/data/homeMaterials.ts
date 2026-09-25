import type { Material } from "@/types/signDesign";

export type HomeMaterialItem = {
  material: Material;
  name: string;
  description: string;
};

export const homeMaterials: HomeMaterialItem[] = [
  {
    material: "wood",
    name: "עץ",
    description: "מראה חם וקלאסי — מתאים במיוחד לכניסה ביתית.",
  },
  {
    material: "magnet",
    name: "מגנט",
    description: "קל ומודרני — מתאים לדלתות מתכת ולשינוי מהיר.",
  },
];
