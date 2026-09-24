import styles from "./ChoiceCard.module.scss";

type ChoiceCardProps = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  disabled?: boolean;
};

export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  children,
  disabled = false,
}: ChoiceCardProps) {
  return (
    <label
      className={[
        styles.card,
        checked ? styles.selected : "",
        disabled ? styles.disabled : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
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
