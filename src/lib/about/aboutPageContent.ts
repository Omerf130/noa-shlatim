export const ABOUT_PAGE_METADATA_TITLE = "מי אנחנו | נועה - שלטים לדלת";

export const ABOUT_PAGE_METADATA_DESCRIPTION =
  "הסיפור האישי מאחורי נועה | שלטים לדלת — על נועה מבאר שבע, על הבית, ועל הרגע שבו הבנתי שהיא שייכת גם על הדלת.";

export const ABOUT_PAGE_IMAGE_SRC =
  "/about us/WhatsApp Image 2026-10-07 at 17.12.31.jpeg";

export const ABOUT_PAGE_IMAGE_ALT =
  "נועה — הכלב שמאחורי המותג נועה שלטים לדלת";

export const aboutHero = {
  title: "אז למה בכלל נועה?",
  supportingLine:
    "נועה הגיעה אליי מבאר שבע בתקופה שבה גרתי בתל אביב.",
} as const;

export const aboutOpeningLead = [
  "האמת היא שלא תכננתי להקים עסק של שלטים לדלת.",
  "בטח שלא בגלל כלב.",
] as const;

export const aboutNoaArrives = [
  "נועה הגיעה אליי מבאר שבע בתקופה שבה גרתי בתל אביב. אימצתי אותה בלי לדעת שהיא הולכת להפוך לאחת הדמויות הכי משמעותיות בחיים שלי.",
  "מאז עברנו ביחד לא מעט.",
] as const;

export const aboutLifeTogether = [
  "עברנו דירות. עברנו תקופות. עברנו זוגיות ופרידות. היו ימים מצחיקים והיו גם ימים שפחות. אפילו במילואים ביחידה קרבית היא הייתה חלק מהחיים שלי. אני הייתי רחוק והיא הייתה אחת המחשבות הראשונות שעלו לי כשסוף סוף יכולתי לחזור הביתה.",
  "אני צלם חתונות ואירועים. העבודה שלי היא לתעד את הרגעים הכי חשובים של אנשים אחרים.",
  "אני נמצא בחתונות עד שעות הלילה. רץ מאירוע לאירוע. מצלם אהבה של אנשים אחרים וחוזר לפעמים הביתה גמור.",
  "ושם היא תמיד הייתה.",
  "מחכה לי.",
  "לפעמים עם התלהבות כאילו לא ראתה אותי שנה.",
] as const;

export const aboutNoaFaceQuote = {
  lead: "ולפעמים עם פרצוף של",
  quote: "״איפה היית כל היום ואיך אתה מעז לאחר לארוחת ערב שלי?״",
} as const;

export const aboutTurningPoint = {
  intro: "עם הזמן הבנתי משהו.",
  emphasis: "נועה הייתה איתי כמעט בכל גרסה של החיים שלי.",
  follow: [
    "כשעברתי בית היא עברה איתי. כשנגמרה זוגיות היא נשארה. כשלא ידעתי מה אני רוצה לעשות היא פשוט הייתה שם.",
    "ואז חשבתי לעצמי…",
  ],
  doorQuestion: [
    "אם היא כל כך חלק מהבית שלי",
    "למה שהיא לא תהיה גם על הדלת?",
  ],
} as const;

export const aboutBrandOrigin =
  "ככה נולד הרעיון של נועה | שלטים לדלת." as const;

export const aboutBrandMeaning = [
  "רציתי ליצור משהו שהוא לא סתם שלט יפה לדלת.",
  "משהו שמרגיש אישי.",
  "משהו שכשאתם נכנסים הביתה אתם מסתכלים עליו ומחייכים.",
  "כי בסוף כמעט לכל כלב יש סיפור.",
] as const;

export const aboutDogStories = [
  "יש את הכלב שהיה שם בתקופה הכי קשה.",
  "את הכלב שגדל איתכם בדירה הראשונה.",
  "את הכלב שעבר איתכם מדירה לדירה.",
  "את הכלב שהיה שם אחרי פרידה.",
  "את הכלב שחיכה לכם כשחזרתם ממילואים.",
  "ואת הכלב שפשוט יודע מתי אתם צריכים חיבוק בלי לשאול שאלות.",
] as const;

export const aboutMeaningClose = [
  "אז אולי זה רק שלט לדלת.",
  "אבל בשבילי הוא מסמל משהו הרבה יותר גדול.",
  "את האנשים והחברים שהופכים בית לבית.",
] as const;

export const aboutFinalClose = [
  "ואם יש מישהו שמחכה לכם מאחורי הדלת בכל פעם שאתם חוזרים הביתה…",
  "כנראה שמגיע לו להיות גם על הדלת.",
] as const;

export const aboutCta = {
  prompt: "רוצים ליצור את השלט שלכם?",
  buttonLabel: "ליצירת השלט שלי",
  href: "/create",
} as const;

/** Flat list of distinctive phrases for regression tests. */
export const ABOUT_PAGE_COPY_MARKERS = [
  aboutHero.title,
  ...aboutOpeningLead,
  ...aboutNoaArrives,
  ...aboutLifeTogether,
  aboutNoaFaceQuote.quote,
  aboutTurningPoint.emphasis,
  aboutTurningPoint.doorQuestion[1]!,
  aboutBrandOrigin,
  ...aboutDogStories,
  aboutFinalClose[1]!,
  aboutCta.prompt,
  aboutCta.buttonLabel,
] as const;
