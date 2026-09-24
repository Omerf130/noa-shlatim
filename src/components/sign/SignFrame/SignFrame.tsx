import type { Material } from "@/types/signDesign";
import type { ReactNode } from "react";
import styles from "./SignFrame.module.scss";

type SignFrameProps = {
  material?: Material | null;
  children: ReactNode;
  className?: string;
};

export function SignFrame({ material, children, className }: SignFrameProps) {
  return (
    <div
      className={[
        styles.frame,
        material === "wood" ? styles.wood : "",
        material === "magnet" ? styles.magnet : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.knob} aria-hidden="true" />
      <div className={styles.canvas}>{children}</div>
    </div>
  );
}
