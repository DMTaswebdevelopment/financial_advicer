// app/api/checkout-session/route.ts

import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper function to get the correct base URL
function getBaseUrl(): string {
  // For production (Vercel deployment)
  if (process.env.NODE_ENV === "production") {
    // Use custom domain if available, otherwise use Vercel URL
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Fallback for production
    return "https://financial-advicer-six.vercel.app"; // Replace with your actual domain
  }

  // For development
  return "http://localhost:3002";
}

export async function POST(req: Request) {
  try {
    const { priceId, email, uid } = await req.json();

    // Validate required fields
    if (!priceId || !email || !uid) {
      return NextResponse.json(
        { error: "Missing required fields: priceId, email, or uid" },
        { status: 400 }
      );
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        firebaseUID: uid,
      },
    });

    const baseUrl = getBaseUrl();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer.id,
      metadata: {
        firebaseUID: uid,
        priceId: priceId,
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/payment/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}`,
    });

    // Add/Update user details in Firestore
    const userRef = adminDb.collection("users");
    // Query for user by UID field
    const userQuery = await userRef.where("id", "==", uid).get();

    if (!userQuery.empty) {
      // Update existing user document
      const userDoc = userQuery.docs[0];
      const userRef = userDoc.ref;

      await userRef.update({
        email: email,
        stripeCustomerId: customer.id,
        productId: priceId,
        lastCheckoutSession: {
          sessionId: session.id,
          priceId: priceId,
          status: "Approved",
          createdAt: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      customerId: customer.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
