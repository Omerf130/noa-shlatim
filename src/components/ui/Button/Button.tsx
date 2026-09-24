import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonVariant = "primary" | "secondary" | "ghost";

type CommonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ComponentPropsWithoutRef<"button"> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", children, className, ...rest } = props;
  const classes = [styles.button, styles[variant], className]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href !== undefined) {
    const { href, onClick, ...linkRest } = rest as Omit<
      ButtonAsLink,
      keyof CommonProps
    >;

    if (href.startsWith("http") || href.startsWith("#")) {
      return (
        <a href={href} className={classes} onClick={onClick} {...linkRest}>
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} onClick={onClick} {...linkRest}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ComponentPropsWithoutRef<"button">)}>
      {children}
    </button>
  );
}
