import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { code, totalPrice } = await request.json();
    console.log('Validating promo code:', { code, totalPrice });

    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }

    // Check Supabase for promo code
    const { data: promoData, error: promoError } = await supabase
      .from('promo_codes')
      .select('code, discount_percent, stripe_promo_code_id, active')
      .eq('code', code)
      .eq('active', true)
      .single();

    if (promoError || !promoData) {
      console.log('Promo code not found in Supabase, checking Stripe:', { code });
      // Fallback to Stripe
      const promotionCodes = await stripe.promotionCodes.list({
        code,
        active: true,
      });

      if (promotionCodes.data.length === 0) {
        console.log('No active promotion codes found in Stripe:', { code });
        return NextResponse.json(
          { error: 'Invalid or inactive promo code' },
          { status: 400 }
        );
      }

      const promoCode = promotionCodes.data[0];
      const coupon = promoCode.coupon;

      if (!coupon.valid) {
        console.log('Invalid Stripe coupon:', { couponId: coupon.id });
        return NextResponse.json(
          { error: 'Promo code is not valid' },
          { status: 400 }
        );
      }

      let discountPercent = 0;
      if (coupon.percent_off) {
        discountPercent = coupon.percent_off;
      } else if (coupon.amount_off && totalPrice) {
        discountPercent = (coupon.amount_off / (totalPrice * 100)) * 100;
      }

      const response = {
        success: true,
        promoCodeId: promoCode.id,
        discountPercent,
      };
      console.log('Stripe promo code validated:', response);
      return NextResponse.json(response);
    }

    // Use Supabase promo data
    let discountPercent = promoData.discount_percent;
    const promoCodeId = promoData.stripe_promo_code_id;

    if (promoCodeId) {
      const promotionCode = await stripe.promotionCodes.retrieve(promoCodeId);
      if (!promotionCode.active || !promotionCode.coupon.valid) {
        console.log('Invalid Stripe promo code from Supabase:', { promoCodeId });
        return NextResponse.json(
          { error: 'Promo code is not valid' },
          { status: 400 }
        );
      }
      discountPercent = promotionCode.coupon.percent_off || discountPercent;
    }

    const response = {
      success: true,
      promoCodeId,
      discountPercent,
    };
    console.log('Supabase promo code validated:', response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}