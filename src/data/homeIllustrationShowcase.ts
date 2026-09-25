import { illustrationStyles } from "@/data/illustrationStyles";
import { publicAssetPath } from "@/lib/home/publicAssetPath";

export type HomeIllustrationShowcaseItem = {
  styleId: string;
  name: string;
  description: string;
  imageSrc: string | null;
  imageAlt: string;
  imageObjectPosition: string;
};

const descriptions: Record<string, string> = {
  "style-classic": "אווירה קלאסית וחמה — מתאים לכניסה אלגנטית.",
  "style-soft": "קווים רכים ומשפחתיים — מרגיש טבעי וקרוב.",
  "style-playful": "צבע ואופי — שמח ומלא חיים.",
};

/** Homepage example images in public/examples/ — same three styles as the builder. */
const exampleImagesByStyleId: Record<
  string,
  { fileName: string; objectPosition: string }
> = {
  "style-classic": {
    fileName: "ChatGPT Image Sep 25, 2026, 12_21_31 PM.png",
    objectPosition: "50% 32%",
  },
  "style-soft": {
    fileName: "ChatGPT Image Sep 25, 2026, 12_23_13 PM.png",
    objectPosition: "50% 38%",
  },
  "style-playful": {
    fileName: "ChatGPT Image Sep 25, 2026, 12_24_27 PM.png",
    objectPosition: "50% 36%",
  },
};

export const homeIllustrationShowcaseItems: HomeIllustrationShowcaseItem[] =
  illustrationStyles.map((style) => {
    const example = exampleImagesByStyleId[style.id];
    const imageSrc = example
      ? publicAssetPath(`examples/${example.fileName}`)
      : null;

    return {
      styleId: style.id,
      name: style.name,
      description: descriptions[style.id] ?? "",
      imageSrc,
      imageAlt: `דוגמת איור בסגנון ${style.name}`,
      imageObjectPosition: example?.objectPosition ?? "50% 50%",
    };
  });
