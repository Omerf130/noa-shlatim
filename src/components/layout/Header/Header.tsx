"use client";

import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import { Button } from "@/components/ui/Button/Button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import styles from "./Header.module.scss";

const navLinks = [
  { href: "/", label: "דף הבית" },
  { href: "#how-it-works", label: "איך זה עובד" },
  { href: "#designs", label: "עיצובים" },
] as const;

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const onNavClick = () => {
    closeMenu();
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <BrandLogo variant="compact" />

        <nav className={styles.desktopNav} aria-label="ניווט ראשי">
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <Button href="/create" className={styles.desktopCta}>
            מתחילים לעצב
          </Button>

          <button
            ref={toggleRef}
            type="button"
            className={styles.menuToggle}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "סגירת תפריט" : "פתיחת תפריט"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>

      <nav
        ref={panelRef}
        id={menuId}
        className={[styles.mobileNav, menuOpen ? styles.mobileNavOpen : ""]
          .filter(Boolean)
          .join(" ")}
        aria-label="ניווט נייד"
        hidden={!menuOpen}
      >
        <ul className={styles.mobileList}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={styles.mobileLink}
                onClick={onNavClick}
                tabIndex={menuOpen ? 0 : -1}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className={styles.mobileCtaItem}>
            <Button href="/create" className={styles.mobileCta} onClick={onNavClick}>
              מתחילים לעצב
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
