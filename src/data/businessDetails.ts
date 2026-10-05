const phone = "0512552601";
const email = "avdala.gal@gmail.com";

/** Official business contact — single source for Footer, Terms, Checkout. */
export const BUSINESS_DETAILS = {
  businessName: "נועה – שלטים לדלת",
  address: "המעפילים 4, אשדוד",
  phone,
  email,
  telHref: `tel:${phone}`,
  mailtoHref: `mailto:${email}`,
} as const;

export type BusinessDetails = typeof BUSINESS_DETAILS;
