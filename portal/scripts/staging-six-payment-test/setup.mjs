// Step 1: temporary member + Stripe test clock customer (no email is sent: example.invalid, created confirmed).
import { randomBytes } from "node:crypto";
import { stripe, sbAdmin, save } from "./lib.mjs";
const email = `staging-installments-${randomBytes(3).toString("hex")}@example.invalid`;
const user = await sbAdmin("POST", "/auth/v1/admin/users", { email, password: randomBytes(18).toString("base64url"), email_confirm: true, user_metadata: { display_name: "STAGING TEST Installments" } });
const clock = await stripe("POST", "/test_helpers/test_clocks", { frozen_time: Math.floor(Date.now() / 1000), name: "BOSS six payment lifecycle test" });
const cust = await stripe("POST", "/customers", { email, test_clock: clock.id, name: "STAGING TEST Installments", metadata: { user_id: user.id } });
await sbAdmin("POST", "/rest/v1/stripe_customers", { user_id: user.id, stripe_customer_id: cust.id });
save({ userId: user.id, email, clockId: clock.id, customerId: cust.id });
console.log("temporary member, test clock and clock customer created");
