// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { Readable } from "stream";

export const config = {
  api: {
    bodyParser: false, // Required for Stripe to verify signature
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // or service key
);

async function buffer(readable: Readable) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  const rawBody = await buffer(req.body as any);
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle event
  switch (event.type) {
    case "product.updated": {
      const product = event.data.object as any; // or Stripe.Product
      await supabase
        .from("product")
        .update({
          name: product.name,
          description: product.description,
          // etc...
        })
        .eq("stripe_product_id", product.id);
      break;
    }
    case "price.updated": {
      const price = event.data.object as any; // or Stripe.Price
      await supabase
        .from("product")
        .update({
          // e.g. storing latest price or something
          stripe_price_id: price.id,
        })
        .eq("stripe_product_id", price.product);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
