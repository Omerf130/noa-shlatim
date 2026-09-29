import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { connectDb } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { notFound } from "next/navigation";
import styles from "./checkout.module.scss";

type CheckoutPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { orderId } = await params;

  try {
    assertValidOrderId(orderId);
  } catch {
    notFound();
  }

  await connectDb();
  const order = await Order.findById(orderId).lean();

  if (!order || order.status !== "draft" || order.creationMode !== "photo") {
    notFound();
  }

  if (!order.assets?.originalImage || !order.assets?.finalArtwork) {
    notFound();
  }

  return (
    <main className={styles.main} dir="rtl">
      <div className={styles.card}>
        <h1 className={styles.title}>העיצוב נשמר בהצלחה</h1>
        <p className={styles.lead}>
          פרטי ההזמנה, המשלוח והתשלום יתווספו בשלב הבא.
        </p>
        <p className={styles.meta}>
          מספר הזמנה: <span className={styles.orderId}>{orderId}</span>
        </p>
      </div>
    </main>
  );
}
