import styles from "./homeShared.module.scss";

export function BotanicalDivider() {
  return (
    <svg
      className={styles.botanical}
      viewBox="0 0 280 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 12 C 40 4, 80 20, 120 12 S 200 4, 272 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="140" cy="12" r="3" fill="currentColor" opacity="0.6" />
      <path
        d="M130 8 Q 140 2, 150 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}
