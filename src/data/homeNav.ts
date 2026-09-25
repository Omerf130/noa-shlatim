export type HomeNavLink = {
  href: string;
  label: string;
};

export const homeNavLinks: HomeNavLink[] = [
  { href: "/", label: "דף הבית" },
  { href: "#how-it-works", label: "איך זה עובד" },
  { href: "#examples", label: "דוגמאות" },
  { href: "#materials", label: "החומרים" },
];

export const homePrimaryCta = {
  href: "/create",
  label: "עיצוב שלט עכשיו",
} as const;
