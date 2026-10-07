"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import styles from "../designWorkspace/panels/panels.module.scss";

type MagnetSizeSelectorProps = {
  rowClass: string;
  cardClass: string;
  selectedCardClass: string;
  titleClass: string;
  descClass?: string;
};

export function MagnetSizeSelector({
  rowClass,
  cardClass,
  selectedCardClass,
  titleClass,
  descClass,
}: MagnetSizeSelectorProps) {
  const { state, dispatch, customerMagnetCatalog } = useBuilder();
  const { material, magnetSizeId } = state.design;

  if (material !== "magnet") {
    return null;
  }

  const sizes = customerMagnetCatalog.sizes;
  if (sizes.length === 0) {
    return null;
  }

  return (
    <div className={styles.magnetSizesBlock}>
      <p className={styles.magnetSizesIntro}>בחרו גודל מגנט</p>
      <div className={rowClass} role="radiogroup" aria-label="גודל מגנט">
        {sizes.map((size) => {
          const isSelected = magnetSizeId === size.id;
          return (
            <button
              key={size.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={[cardClass, isSelected ? selectedCardClass : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() =>
                dispatch({ type: "SET_MAGNET_SIZE_ID", magnetSizeId: size.id })
              }
            >
              <span className={titleClass}>{size.name}</span>
              {size.dimensionsLabel ? (
                <span className={descClass ?? titleClass}>{size.dimensionsLabel}</span>
              ) : null}
              <span className={styles.magnetSizePrice} dir="ltr">
                {size.displayPrice}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
