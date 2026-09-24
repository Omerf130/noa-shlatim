"use client";

import { ChoiceCard } from "@/components/builder/ChoiceCard/ChoiceCard";
import { useBuilder } from "@/components/builder/BuilderContext";
import { Button } from "@/components/ui/Button/Button";
import { illustrationStyles } from "@/data/illustrationStyles";
import { useIllustrationGeneration } from "@/hooks/useIllustrationGeneration";
import {
  downloadObjectUrl,
  QA_AI_ILLUSTRATION_FILENAME,
} from "@/lib/builder/downloadObjectUrl";
import { Loader2 } from "lucide-react";
import styles from "./stepShared.module.scss";

const artClass: Record<string, string> = {
  classic: styles.classicArt,
  soft: styles.softArt,
  playful: styles.playfulArt,
};

export function IllustrationStyleStep() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.photoIllustrationStyleId;
  const illustration = state.design.illustration;
  const {
    statusLoading,
    generate,
    applyMockIllustration,
    canUseAi,
    canUseMock,
    aiUi,
  } = useIllustrationGeneration();

  const isGenerating = aiUi.status === "generating";
  const hasAiResult = illustration?.source === "ai";
  const hasMockResult = illustration?.source === "mockAi";

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>בחירת סגנון איור</h2>
        <p className={styles.lead}>
          בוחרים סגנון, ואז יוצרים מהתמונה שלכם איור מבודד עם רקע שקוף — מוכן
          להרכבה על השלט.
        </p>
      </div>

      {canUseMock && !canUseAi && (
        <p className={styles.notice} role="note">
          יצירת AI אינה פעילה בסביבה זו. ניתן להמשיך עם{" "}
          <strong>דוגמה פנימית</strong> לצורכי בדיקה בלבד.
        </p>
      )}

      <div className={styles.grid3} role="radiogroup" aria-label="סגנון איור">
        {illustrationStyles.map((style) => (
          <ChoiceCard
            key={style.id}
            name="illustration-style"
            value={style.id}
            checked={selected === style.id}
            onChange={(id) => dispatch({ type: "SET_ILLUSTRATION_STYLE", styleId: id })}
            title={style.name}
            description="כיוון עיצובי לאיור"
            disabled={isGenerating}
          >
            <div
              className={[styles.styleCardArt, artClass[style.cardVariant]].join(" ")}
              aria-hidden="true"
            />
          </ChoiceCard>
        ))}
      </div>

      {selected && (
        <div className={styles.generateBlock}>
          <div className={styles.generateActions}>
            {canUseAi && (
              <Button
                onClick={() => void generate()}
                disabled={isGenerating || statusLoading}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className={styles.spin} aria-hidden />
                    יוצרים איור…
                  </>
                ) : hasAiResult ? (
                  "יצירת איור חדש"
                ) : (
                  "צור איור"
                )}
              </Button>
            )}

            {hasAiResult && illustration?.objectUrl && (
              <Button
                variant="ghost"
                type="button"
                disabled={isGenerating}
                onClick={() =>
                  downloadObjectUrl(illustration.objectUrl, QA_AI_ILLUSTRATION_FILENAME)
                }
              >
                הורדת האיור לבדיקה
              </Button>
            )}
          </div>

          {canUseMock && !canUseAi && (
            <Button
              variant="secondary"
              onClick={applyMockIllustration}
              disabled={isGenerating}
            >
              המשך עם דוגמה (QA)
            </Button>
          )}

          {!statusLoading && !canUseAi && !canUseMock && (
            <p className={styles.notice} role="status">
              יצירת איור ב-AI אינה זמינה כרגע. פנו לתמיכה או נסו שוב מאוחר יותר.
            </p>
          )}

          {aiUi.status === "error" && aiUi.userMessage && (
            <p className={styles.errorText} role="alert">
              {aiUi.userMessage}
            </p>
          )}

          {(hasAiResult || hasMockResult) && illustration && (
            <div className={styles.aiPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={illustration.objectUrl}
                alt="תצוגה מקדימה של האיור שנוצר"
                className={styles.aiPreviewImg}
              />
              {hasMockResult && (
                <p className={styles.mockCaption} role="note">
                  דוגמה זמנית — לא תוצאת AI.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
