// app/api/checkout-session/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { priceId, email, uid } = await req.json();

  // Optional: You can verify user here with Firebase Auth JWT from headers
  const customer = await stripe.customers.create({
    email,
    metadata: {
      firebaseUID: uid, // Replace with real UID
    },
  });

  const session = await stripe.checkout.sessions.create({
    ...NextRequest,
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customer.id,
    metadata: {
      firebaseUID: uid, // Replace with real UID
    },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `http://localhost:3002/payment/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:3002/payment/price`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
