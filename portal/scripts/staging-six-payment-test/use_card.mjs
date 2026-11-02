// Attach a Stripe test payment method and make it the subscription's payment method.
import { load, save, stripe } from "./lib.mjs";
const s = load();
const token = process.argv[2]; // pm_card_chargeCustomerFail (attaches, every charge declines) or pm_card_visa
const pm = await stripe("POST", `/payment_methods/${token}/attach`, { customer: s.customerId });
await stripe("POST", `/subscriptions/${s.subscriptionId}`, { default_payment_method: pm.id });
s.currentPm = pm.id; save(s);
console.log(`subscription now uses ${token} (${pm.card?.brand} ending ${pm.card?.last4})`);
