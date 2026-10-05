"use client";

import { ImageUpload } from "@/components/builder/ImageUpload/ImageUpload";
import { useBuilder } from "@/components/builder/BuilderContext";
import styles from "./stepShared.module.scss";

export function UploadStep() {
  const { state, dispatch, setSourcePhotoFile, setFinalArtworkBlob } = useBuilder();
  const isIllustrationPath = state.design.creationMode === "illustration";

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>העלאת תמונה</h2>
        <p className={styles.lead}>
          {isIllustrationPath
            ? "העלו את האיור שברצונכם להציג על השלט — זו עדיין לא תצוגת השלט הסופית."
            : "העלו תמונת מקור — התמונה המלבנית אינה השלט; בשלבים הבאים נבנה את השלט ממנה."}
        </p>
      </div>

      <ImageUpload
        value={state.design.originalImage}
        onChange={(image, file) => {
          setSourcePhotoFile(file ?? null);
          setFinalArtworkBlob(null);
          if (image) dispatch({ type: "SET_UPLOAD", image });
          else dispatch({ type: "CLEAR_UPLOAD" });
        }}
        hint={
          isIllustrationPath
            ? "מומלץ להעלות PNG עם רקע שקוף. גם איור עם רקע משלו מתאים — בשלב יצירת השלט נשלב אותו עם הרקע שבחרתם."
            : undefined
        }
      />
    </div>
  );
}
