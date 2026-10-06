"use client";

import {
  saveSiteContentCustomerExamplesAction,
  saveSiteContentEmotionalCtaAction,
  saveSiteContentFooterAction,
  saveSiteContentHeroAction,
  saveSiteContentHowItWorksAction,
  saveSiteContentSeoAction,
  saveSiteContentSignExamplesAction,
  type SiteContentActionState,
} from "@/app/admin/(protected)/content/actions";
import type { SiteContentData } from "@/lib/siteContent/siteContentSchema";
import { HOW_IT_WORKS_STEP_IDS } from "@/lib/siteContent/siteContentSchema";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition, type FormEvent, type ReactNode } from "react";
import styles from "./AdminSiteContentView.module.scss";

const initialActionState: SiteContentActionState = {};

const STEP_SECTION_LABELS: Record<(typeof HOW_IT_WORKS_STEP_IDS)[number], string> = {
  upload: "שלב 1 — העלאת תמונה",
  illustrate: "שלב 2 — יצירת איור",
  design: "שלב 3 — עיצוב השלט",
  order: "שלב 4 — הזמנה",
};

type AdminSiteContentViewProps = {
  initialContent: SiteContentData;
};

export function AdminSiteContentView({ initialContent }: AdminSiteContentViewProps) {
  const [openSection, setOpenSection] = useState<string | null>("hero");

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.heading}>תוכן האתר</h1>
        <p className={styles.lead}>עריכת התוכן המרכזי שמופיע באתר</p>
      </header>

      <ul className={styles.sections}>
        <SectionCard
          id="hero"
          title="Hero — דף הבית"
          hint="כותרות וטקסט פתיחה"
          open={openSection === "hero"}
          onToggle={() => setOpenSection((s) => (s === "hero" ? null : "hero"))}
        >
          <HeroForm content={initialContent} />
        </SectionCard>

        <SectionCard
          id="howItWorks"
          title="איך זה עובד"
          hint="כותרת וארבעה שלבים"
          open={openSection === "howItWorks"}
          onToggle={() => setOpenSection((s) => (s === "howItWorks" ? null : "howItWorks"))}
        >
          <HowItWorksForm content={initialContent} />
        </SectionCard>

        <SectionCard
          id="signExamples"
          title="דוגמאות לשלטים"
          hint="כותרת מקטע"
          open={openSection === "signExamples"}
          onToggle={() => setOpenSection((s) => (s === "signExamples" ? null : "signExamples"))}
        >
          <SignExamplesForm content={initialContent} />
        </SectionCard>

        <SectionCard
          id="customerExamples"
          title="דוגמאות לקוחות"
          hint="כותרת, הקדמה וכפתור"
          open={openSection === "customerExamples"}
          onToggle={() =>
            setOpenSection((s) => (s === "customerExamples" ? null : "customerExamples"))
          }
        >
          <CustomerExamplesForm content={initialContent} />
        </SectionCard>

        <SectionCard
          id="emotionalCta"
          title="קריאה לפעולה"
          hint="באנר לפני סיום הדף"
          open={openSection === "emotionalCta"}
          onToggle={() => setOpenSection((s) => (s === "emotionalCta" ? null : "emotionalCta"))}
        >
          <EmotionalCtaForm content={initialContent} />
        </SectionCard>

        <SectionCard
          id="footer"
          title="Footer"
          hint="תיאור קצר בתחתית"
          open={openSection === "footer"}
          onToggle={() => setOpenSection((s) => (s === "footer" ? null : "footer"))}
        >
          <FooterForm content={initialContent} />
        </SectionCard>

        <SectionCard
          id="seo"
          title="SEO — דף הבית"
          hint="כותרת ותיאור למנועי חיפוש"
          open={openSection === "seo"}
          onToggle={() => setOpenSection((s) => (s === "seo" ? null : "seo"))}
        >
          <SeoForm content={initialContent} />
        </SectionCard>
      </ul>
    </>
  );
}

function SectionCard({
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <li className={styles.sectionCard}>
      <button type="button" className={styles.sectionHead} onClick={onToggle} aria-expanded={open}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <span className={styles.sectionHint}>{hint}</span>
        </div>
        <ChevronDown
          size={18}
          className={[styles.chevron, open ? styles.chevronOpen : ""].filter(Boolean).join(" ")}
          aria-hidden
        />
      </button>
      {open ? <div className={styles.sectionBody}>{children}</div> : null}
    </li>
  );
}

function useSectionSubmit(
  action: (
    prev: SiteContentActionState,
    formData: FormData,
  ) => Promise<SiteContentActionState>,
) {
  const router = useRouter();
  const [state, setState] = useState<SiteContentActionState>(initialActionState);
  const [pending, startTransition] = useTransition();

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      startTransition(async () => {
        try {
          const next = await action(initialActionState, formData);
          setState(next);
          if (next.ok) {
            router.refresh();
          }
        } catch (err) {
          console.error("[admin/content] save failed", err);
          setState({ ok: false, message: "שמירה נכשלה. נסו שוב." });
        }
      });
    },
    [action, router],
  );

  return { state, pending, onSubmit };
}

function FormFeedback({ state }: { state: SiteContentActionState }) {
  if (!state.message) {
    return null;
  }
  return (
    <p
      className={[styles.feedback, state.ok ? styles.feedbackOk : styles.feedbackErr].join(" ")}
      role={state.ok ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}

function HeroForm({ content }: { content: SiteContentData }) {
  const { state, pending, onSubmit } = useSectionSubmit(saveSiteContentHeroAction);
  const { hero } = content.home;
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <FormFeedback state={state} />
      <Field label="שורת פתיחה (Eyebrow)" name="eyebrow" defaultValue={hero.eyebrow} />
      <Field label="שורת כותרת 1" name="titleLine1" defaultValue={hero.titleLine1} />
      <Field label="שורת כותרת 2" name="titleLine2" defaultValue={hero.titleLine2} />
      <Field label="שורת הדגשה" name="accent" defaultValue={hero.accent} />
      <Field label="טקסט מרכזי" name="lead" defaultValue={hero.lead} multiline />
      <Field
        label="טקסט כפתור ראשי (גם בכותרת ובפוטר)"
        name="primaryCtaLabel"
        defaultValue={content.global.primaryCtaLabel}
      />
      <Submit pending={pending} />
    </form>
  );
}

function HowItWorksForm({ content }: { content: SiteContentData }) {
  const { state, pending, onSubmit } = useSectionSubmit(saveSiteContentHowItWorksAction);
  const { howItWorks } = content.home;
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <FormFeedback state={state} />
      <Field label="כותרת המקטע" name="heading" defaultValue={howItWorks.heading} />
      <Field label="תת-כותרת" name="subtitle" defaultValue={howItWorks.subtitle} multiline />
      {HOW_IT_WORKS_STEP_IDS.map((id) => {
        const step = howItWorks.steps.find((s) => s.id === id)!;
        return (
          <div key={id} className={styles.stepBlock}>
            <p className={styles.stepBlockTitle}>{STEP_SECTION_LABELS[id]}</p>
            <Field label="כותרת" name={`step_${id}_title`} defaultValue={step.title} />
            <Field
              label="תיאור"
              name={`step_${id}_description`}
              defaultValue={step.description}
              multiline
            />
          </div>
        );
      })}
      <Submit pending={pending} />
    </form>
  );
}

function SignExamplesForm({ content }: { content: SiteContentData }) {
  const { state, pending, onSubmit } = useSectionSubmit(saveSiteContentSignExamplesAction);
  const { signExamples } = content.home;
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <FormFeedback state={state} />
      <Field label="כותרת המקטע" name="heading" defaultValue={signExamples.heading} />
      <Field label="תת-כותרת" name="subtitle" defaultValue={signExamples.subtitle} multiline />
      <Submit pending={pending} />
    </form>
  );
}

function CustomerExamplesForm({ content }: { content: SiteContentData }) {
  const { state, pending, onSubmit } = useSectionSubmit(saveSiteContentCustomerExamplesAction);
  const { customerExamples } = content.home;
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <FormFeedback state={state} />
      <Field label="כותרת המקטע" name="heading" defaultValue={customerExamples.heading} />
      <Field label="טקסט הקדמה" name="intro" defaultValue={customerExamples.intro} multiline />
      <Field label="טקסט כפתור" name="ctaLabel" defaultValue={customerExamples.ctaLabel} />
      <Submit pending={pending} />
    </form>
  );
}

function EmotionalCtaForm({ content }: { content: SiteContentData }) {
  const { state, pending, onSubmit } = useSectionSubmit(saveSiteContentEmotionalCtaAction);
  const { emotionalCta } = content.home;
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <FormFeedback state={state} />
      <Field label="כותרת" name="title" defaultValue={emotionalCta.title} />
      <Field label="טקסט" name="bodyText" defaultValue={emotionalCta.bodyText} multiline />
      <p className={styles.sectionHint}>
        כפתור הפעולה משתמש בטקסט הכפתור הראשי (נערך במקטע Hero).
      </p>
      <Submit pending={pending} />
    </form>
  );
}

function FooterForm({ content }: { content: SiteContentData }) {
  const { state, pending, onSubmit } = useSectionSubmit(saveSiteContentFooterAction);
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <FormFeedback state={state} />
      <Field
        label="תיאור קצר ליד הלוגו"
        name="footerTagline"
        defaultValue={content.global.footerTagline}
        multiline
      />
      <Submit pending={pending} />
    </form>
  );
}

function SeoForm({ content }: { content: SiteContentData }) {
  const { state, pending, onSubmit } = useSectionSubmit(saveSiteContentSeoAction);
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <FormFeedback state={state} />
      <Field label="כותרת דף (title)" name="homeTitle" defaultValue={content.seo.homeTitle} />
      <Field
        label="תיאור (meta description)"
        name="homeDescription"
        defaultValue={content.seo.homeDescription}
        multiline
      />
      <Submit pending={pending} />
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  multiline,
}: {
  label: string;
  name: string;
  defaultValue: string;
  multiline?: boolean;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          className={styles.textarea}
          defaultValue={defaultValue}
          required
        />
      ) : (
        <input
          id={name}
          name={name}
          type="text"
          className={styles.input}
          defaultValue={defaultValue}
          required
        />
      )}
    </div>
  );
}

function Submit({ pending }: { pending: boolean }) {
  return (
    <button type="submit" className={styles.submitBtn} disabled={pending}>
      {pending ? "שומר…" : "שמירה"}
    </button>
  );
}
