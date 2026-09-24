import type { ReactNode } from "react";
import styles from "./Container.module.scss";

type ContainerSize = "narrow" | "default" | "wide";

type ContainerProps = {
  children: ReactNode;
  size?: ContainerSize;
  className?: string;
  as?: "div" | "section";
};

export function Container({
  children,
  size = "default",
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag
      className={[styles.container, styles[size], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}
