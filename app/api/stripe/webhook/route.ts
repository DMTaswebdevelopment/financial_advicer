// app/api/stripe/webhook/route.ts

import { NextRequest } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function buffer(readable: ReadableStream<Uint8Array>) {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const buf = await buffer(req.body!);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Signature verification error:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    } else {
      console.error("❌ Unknown error during signature verification");
      return new Response("Webhook Error: Unknown error", { status: 400 });
    }
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const subscriptionId = session.subscription as string;
      const customerEmail = session.customer_details?.email;
      const firebaseUID = session.metadata?.firebaseUID;

      if (!firebaseUID) {
        console.error("Missing firebaseUID in session metadata");
        return new Response("Missing firebase UID", { status: 400 });
      }

      try {
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );
        const item = subscription.items.data[0];
        const interval = item.price.recurring?.interval || "unknown";
        const priceId = item.price.id;
        const productId = item.price.product as string;
        const amount = item.price.unit_amount! / 100;
        const currency = item.price.currency;

        await db.collection("subscriptions").doc(firebaseUID).set({
          uid: firebaseUID,
          email: customerEmail,
          subscriptionId,
          interval,
          amount,
          priceId,
          productId,
          currency,
          status: subscription.status,
          created: new Date(),
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("🔥 Saving error:", error.message);
        } else {
          console.error("🔥 Unknown saving error");
        }
        return new Response("Error saving subscription", { status: 500 });
      }

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      try {
        await db.collection("subscriptions").doc(customerId).update({
          status: "canceled",
        });

        console.log(`🚫 Subscription canceled for ${customerId}`);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("🔥 Cancellation error:", error.message);
        } else {
          console.error("🔥 Unknown cancellation error");
        }
        return new Response("Error canceling subscription", { status: 500 });
      }

      break;
    }

    default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
