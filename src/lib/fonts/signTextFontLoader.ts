import { Frank_Ruhl_Libre, Heebo, Karantina } from "next/font/google";

/** Import only from server layout — not from client components. */
export const signFontClean = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["600", "700"],
  variable: "--font-sign-text-clean",
  display: "swap",
});

export const signFontSoft = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: "500",
  variable: "--font-sign-text-soft",
  display: "swap",
});

export const signFontPersonal = Karantina({
  subsets: ["hebrew", "latin"],
  weight: "400",
  variable: "--font-sign-text-personal",
  display: "swap",
});

export const signTextFontClassNames = [
  signFontClean.variable,
  signFontSoft.variable,
  signFontPersonal.variable,
].join(" ");
