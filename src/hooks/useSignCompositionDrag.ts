"use client";

import { useCallback, useRef } from "react";

type DragSession = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startState: Record<string, number>;
};

type UseSignCompositionDragOptions = {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragMove: (
    deltaClientX: number,
    deltaClientY: number,
    startState: Record<string, number>,
  ) => void;
};

export function useSignCompositionDrag({
  onDragStart,
  onDragEnd,
  onDragMove,
}: UseSignCompositionDragOptions) {
  const sessionRef = useRef<DragSession | null>(null);

  const endDrag = useCallback(
    (target: HTMLElement, pointerId: number) => {
      if (sessionRef.current?.pointerId === pointerId) {
        sessionRef.current = null;
        try {
          target.releasePointerCapture(pointerId);
        } catch {
          /* already released */
        }
        onDragEnd?.();
      }
    },
    [onDragEnd],
  );

  const bindDragTarget = useCallback(
    (startState: Record<string, number>) => ({
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        sessionRef.current = {
          pointerId: e.pointerId,
          startClientX: e.clientX,
          startClientY: e.clientY,
          startState,
        };
        onDragStart?.();
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        const session = sessionRef.current;
        if (!session || session.pointerId !== e.pointerId) return;
        e.preventDefault();
        const deltaX = e.clientX - session.startClientX;
        const deltaY = e.clientY - session.startClientY;
        onDragMove(deltaX, deltaY, session.startState);
      },
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
        endDrag(e.currentTarget, e.pointerId);
      },
      onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
        endDrag(e.currentTarget, e.pointerId);
      },
    }),
    [onDragMove, onDragStart, endDrag],
  );

  return { bindDragTarget };
}
