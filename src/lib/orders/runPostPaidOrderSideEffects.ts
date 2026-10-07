import { issueFinbotIncomeForOrder } from "@/lib/finbot/issueFinbotIncomeForOrder";
import { sendOwnerPaidOrderNotification } from "@/lib/notifications/sendOwnerPaidOrderNotification";

type PostPaidSideEffectOverrides = {
  finbot?: (orderId: string) => Promise<unknown>;
  ownerNotification?: (orderId: string) => Promise<unknown>;
};

/**
 * Post-payment side effects after Order is durably paid.
 * Each effect is isolated — failures must not affect payment or sibling effects.
 */
export async function runPostPaidOrderSideEffects(
  orderId: string,
  overrides?: PostPaidSideEffectOverrides,
): Promise<void> {
  const runFinbot =
    overrides?.finbot ??
    (async (id: string) => {
      await issueFinbotIncomeForOrder({ orderId: id });
    });
  const runNotify =
    overrides?.ownerNotification ??
    (async (id: string) => {
      await sendOwnerPaidOrderNotification({ orderId: id });
    });

  try {
    await runFinbot(orderId);
  } catch (err) {
    console.error("[post-paid] finbot issuance failed", err);
  }

  try {
    await runNotify(orderId);
  } catch (err) {
    console.error("[post-paid] owner notification failed", err);
  }
}
