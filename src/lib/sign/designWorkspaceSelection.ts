import type { DesignSelectedElement, DesignWorkspaceTab } from "@/types/builder";
import type { SignDesignState } from "@/types/signDesign";

export function selectedElementForTab(
  tab: DesignWorkspaceTab,
  design: SignDesignState,
): DesignSelectedElement | null {
  if (tab === "image" && design.illustration) return "illustration";
  if (tab === "text" && design.text.value.trim().length > 0) return "text";
  return null;
}
