import type { Material } from "@/types/signDesign";
import type { CSSProperties, PointerEventHandler, ReactNode, Ref } from "react";
import styles from "./SignFrame.module.scss";

type SignFrameProps = {
  material?: Material | null;
  children: ReactNode;
  className?: string;
  canvasRef?: Ref<HTMLDivElement>;
  canvasClassName?: string;
  canvasStyle?: CSSProperties;
  onCanvasPointerDown?: PointerEventHandler<HTMLDivElement>;
};

export function SignFrame({
  material,
  children,
  className,
  canvasRef,
  canvasClassName,
  canvasStyle,
  onCanvasPointerDown,
}: SignFrameProps) {
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
      {material === "wood" && <span className={styles.knob} aria-hidden="true" />}
      <div
        ref={canvasRef}
        className={[styles.canvas, canvasClassName].filter(Boolean).join(" ")}
        style={canvasStyle}
        onPointerDown={onCanvasPointerDown}
      >
        {children}
      </div>
    </div>
  );
}
