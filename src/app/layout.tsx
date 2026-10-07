import { CartCountProvider } from "@/components/cart/CartCountProvider";
import { CookieNotice } from "@/components/layout/CookieNotice/CookieNotice";
import { getCartSummaryForRequest } from "@/lib/cart/getCartSummaryForRequest";
import { navbarBadgeQuantityFromSummary } from "@/lib/cart/cartSummary";
import type { Metadata } from "next";
import { homeDisplayFont } from "@/lib/fonts/homeDisplayFontLoader";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const summary = await getCartSummaryForRequest();
  const initialBadgeQuantity = navbarBadgeQuantityFromSummary(summary);

  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} ${signTextFontClassNames} ${homeDisplayFont.variable}`}
    >
      <body>
        <CartCountProvider
          key={initialBadgeQuantity}
          initialBadgeQuantity={initialBadgeQuantity}
        >
          {children}
        </CartCountProvider>
        <CookieNotice />
      </body>
    </html>
  );
}
