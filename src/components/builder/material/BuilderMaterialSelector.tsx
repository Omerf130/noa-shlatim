"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import {
  BUILDER_MATERIALS_UNAVAILABLE_MESSAGE,
  listPurchasableMaterials,
} from "@/lib/builder/materialSelection";
import { MagnetSizeSelector } from "@/components/builder/material/MagnetSizeSelector";
import type { Material } from "@/types/signDesign";
import type { ReactNode } from "react";

type MaterialOption = {
  value: Material;
  title: string;
  desc?: string;
  sampleClass: string;
};

type BuilderMaterialSelectorProps = {
  options: MaterialOption[];
  layout: "panel" | "mobile";
  panelIntroClass?: string;
  panelIntroText?: string;
  sampleBaseClass: string;
  cardClass: string;
  selectedCardClass: string;
  titleClass: string;
  descClass?: string;
  rowClass: string;
  unavailableClass: string;
  children?: ReactNode;
};

export function BuilderMaterialSelector({
  options,
  layout,
  panelIntroClass,
  panelIntroText,
  sampleBaseClass,
  cardClass,
  selectedCardClass,
  titleClass,
  descClass,
  rowClass,
  unavailableClass,
  children,
}: BuilderMaterialSelectorProps) {
  const { state, dispatch, materialAvailability, customerMagnetCatalog } =
    useBuilder();
  const selected = state.design.material;
  const enabledKeys = listPurchasableMaterials(
    materialAvailability,
    customerMagnetCatalog.magnetPurchasable,
  );
  const visible = options.filter((opt) => enabledKeys.includes(opt.value));

  if (enabledKeys.length === 0) {
    return (
      <div className={unavailableClass} role="status">
        <p>{BUILDER_MATERIALS_UNAVAILABLE_MESSAGE}</p>
        {children}
      </div>
    );
  }

  return (
    <>
      {layout === "panel" && panelIntroClass && panelIntroText ? (
        <p className={panelIntroClass}>{panelIntroText}</p>
      ) : null}
      <div className={rowClass} role="radiogroup" aria-label="חומר השלט">
        {visible.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={[cardClass, isSelected ? selectedCardClass : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() => dispatch({ type: "SET_MATERIAL", material: opt.value })}
            >
              <span
                className={[sampleBaseClass, opt.sampleClass].join(" ")}
                aria-hidden
              />
              <span className={titleClass}>{opt.title}</span>
              {layout === "panel" && opt.desc && descClass ? (
                <span className={descClass}>{opt.desc}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <MagnetSizeSelector
        rowClass={rowClass}
        cardClass={cardClass}
        selectedCardClass={selectedCardClass}
        titleClass={titleClass}
        descClass={descClass}
      />
      {children}
    </>
  );
}
