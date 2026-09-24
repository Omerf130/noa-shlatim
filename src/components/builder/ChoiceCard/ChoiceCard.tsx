import styles from "./ChoiceCard.module.scss";

type ChoiceCardProps = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  children,
}: ChoiceCardProps) {
  return (
    <label
      className={[styles.card, checked ? styles.selected : ""].filter(Boolean).join(" ")}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className={styles.input}
      />
      <span className={styles.check} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
        {children}
      </span>
    </label>
  );
}
