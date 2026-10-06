"use client";

import {
  createBackgroundAction,
  setBackgroundEnabled,
  type CreateBackgroundFormState,
  type SetBackgroundEnabledState,
} from "@/app/admin/(protected)/backgrounds/actions";
import type { AdminBackgroundCardDto } from "@/lib/backgrounds/adminBackgroundsDto";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition, type FormEvent } from "react";
import styles from "./AdminBackgroundsView.module.scss";

const toggleInitial: SetBackgroundEnabledState = {};
const createInitial: CreateBackgroundFormState = {};

type AdminBackgroundsViewProps = {
  initialBackgrounds: AdminBackgroundCardDto[];
};

export function AdminBackgroundsView({ initialBackgrounds }: AdminBackgroundsViewProps) {
  const router = useRouter();
  const [toggleState, setToggleState] = useState<SetBackgroundEnabledState>(toggleInitial);
  const [createState, setCreateState] = useState<CreateBackgroundFormState>(createInitial);
  const [isTogglePending, startToggleTransition] = useTransition();
  const [isCreatePending, startCreateTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onToggle = useCallback(
    (id: string, enabled: boolean) => {
      const formData = new FormData();
      formData.set("id", id);
      formData.set("enabled", enabled ? "true" : "false");
      startToggleTransition(async () => {
        const next = await setBackgroundEnabled(toggleInitial, formData);
        setToggleState(next);
        if (next.ok) {
          router.refresh();
        }
      });
    },
    [router],
  );

  const onFileChange = useCallback((file: File | null) => {
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      if (!file) {
        return null;
      }
      return URL.createObjectURL(file);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onCreateSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      startCreateTransition(async () => {
        try {
          const next = await createBackgroundAction(createInitial, formData);
          setCreateState(next);
          if (next.ok) {
            setAddOpen(false);
            setPreviewUrl(null);
            form.reset();
            router.refresh();
          }
        } catch (err) {
          console.error("[admin/backgrounds] create failed", err);
          setCreateState({
            ok: false,
            message: "העלאת הרקע נכשלה. נסו שוב או בחרו קובץ קטן יותר.",
          });
        }
      });
    },
    [router],
  );

  const openAdd = useCallback(() => {
    setCreateState(createInitial);
    setAddOpen(true);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.heading}>רקעים</h1>
          <p className={styles.lead}>ניהול הרקעים הזמינים ליצירת שלטים</p>
        </div>
        <button type="button" className={styles.addBtn} onClick={openAdd}>
          + הוספת רקע
        </button>
      </header>

      {toggleState.message && !toggleState.ok ? (
        <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
          {toggleState.message}
        </p>
      ) : null}

      {createState.message && !addOpen ? (
        <p
          className={`${styles.banner} ${createState.ok ? styles.bannerSuccess : styles.bannerError}`}
          role="status"
        >
          {createState.message}
        </p>
      ) : null}

      {initialBackgrounds.length === 0 ? (
        <p className={styles.empty}>אין רקעים בקטלוג. הריצו את פקודת האתחול או הוסיפו רקע חדש.</p>
      ) : (
        <ul className={styles.grid}>
          {initialBackgrounds.map((bg) => (
            <li key={bg.id}>
              <article className={styles.card}>
                <div className={styles.previewWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bg.imageSrc} alt="" className={styles.previewImg} loading="lazy" />
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{bg.displayName}</h2>
                  <div className={styles.cardFoot}>
                    <span
                      className={[
                        styles.statusPill,
                        bg.enabled ? styles.statusOn : styles.statusOff,
                      ].join(" ")}
                    >
                      {bg.enabled ? "פעיל" : "לא פעיל"}
                    </span>
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      disabled={isTogglePending}
                      onClick={() => onToggle(bg.id, !bg.enabled)}
                      aria-pressed={bg.enabled}
                    >
                      {bg.enabled ? "השבתה" : "הפעלה"}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {addOpen ? (
        <div className={styles.overlay} role="presentation" onClick={() => setAddOpen(false)}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-bg-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.panelHead}>
              <h2 id="add-bg-title" className={styles.panelTitle}>
                הוספת רקע
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                aria-label="סגירה"
                onClick={() => setAddOpen(false)}
              >
                ×
              </button>
            </div>

            <form className={styles.form} onSubmit={onCreateSubmit}>
              {createState.message && !createState.ok ? (
                <p className={`${styles.banner} ${styles.bannerError}`} role="alert">
                  {createState.message}
                </p>
              ) : null}

              <div>
                <label className={styles.fieldLabel} htmlFor="displayName">
                  שם הרקע
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  className={styles.textInput}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className={styles.fieldLabel} htmlFor="image">
                  העלאת תמונה
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.fileInput}
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                />
              </div>

              {previewUrl ? (
                <div className={styles.uploadPreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="" className={styles.uploadPreviewImg} />
                </div>
              ) : null}

              <aside className={styles.guidance}>
                <h3 className={styles.guidanceTitle}>הנחיות להעלאת רקע</h3>
                <ul className={styles.guidanceList}>
                  <li>מומלץ להשתמש בתמונה אופקית ביחס 3:2</li>
                  <li>גודל מומלץ: 1536×1024 פיקסלים ומעלה</li>
                  <li>מומלץ להעלות תמונה חדה ואיכותית</li>
                  <li>מומלץ להימנע מטקסט בתוך התמונה</li>
                  <li>מומלץ שלא למקם פרטים חשובים ממש בקצוות</li>
                </ul>
              </aside>

              <button type="submit" className={styles.submitBtn} disabled={isCreatePending}>
                {isCreatePending ? "שומר…" : "שמירת רקע"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
