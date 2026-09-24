import type { Metadata } from "next";
import { signTextFontClassNames } from "@/lib/fonts/signTextFontLoader";
import { Rubik } from "next/font/google";
import "./globals.scss";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "נועה | שלטים לדלת",
  description:
    "שלטי דלת מותאמים אישית — מהתמונה שלכם לאיור, ומהאיור לשלט על הדלת.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${signTextFontClassNames}`}>
      <body>{children}</body>
    </html>
  );
}
