import { BUSINESS_DETAILS } from "@/data/businessDetails";
import styles from "./CheckoutBusinessInfo.module.scss";

export function CheckoutBusinessInfo() {
  return (
    <aside className={styles.block} aria-label="פרטי בית העסק">
      <h2 className={styles.title}>פרטי בית העסק</h2>
      <p className={styles.name}>{BUSINESS_DETAILS.businessName}</p>
      <p className={styles.line}>{BUSINESS_DETAILS.address}</p>
      <p className={styles.line}>
        טלפון:{" "}
        <a href={BUSINESS_DETAILS.telHref} className={styles.link} dir="ltr">
          {BUSINESS_DETAILS.phone}
        </a>
      </p>
      <p className={styles.line}>
        מייל:{" "}
        <a
          href={BUSINESS_DETAILS.mailtoHref}
          className={styles.link}
          dir="ltr"
        >
          {BUSINESS_DETAILS.email}
        </a>
      </p>
    </aside>
  );
}
