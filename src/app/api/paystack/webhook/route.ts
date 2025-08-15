// src/app/api/paystack/webhook/route.ts
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs' 
export async function POST(request: Request) {
  // 1) Read raw body for signature verification
  const bodyText = await request.text()
  const signature = request.headers.get('x-paystack-signature') || ''

  // 2) Verify signature
  const secret = process.env.PAYSTACK_SECRET_KEY!
  const hash = crypto
    .createHmac('sha512', secret)
    .update(bodyText)
    .digest('hex')

  if (hash !== signature) {
    console.error('⚠️ Webhook signature mismatch', { signature, hash })
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  // 3) Parse the event
  let event: any
  try {
    event = JSON.parse(bodyText)
  } catch (e) {
    console.error('⚠️ Webhook JSON parse error', e)
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  // 4) Handle only successful charges
  if (event.event === 'charge.success') {
    const reference = event.data.reference as string

    try {
      // mark payment record as paid
      const payment = await prisma.payment.update({
        where: { reference },
        data: { status: 'paid', updatedAt: new Date() },
      })

      // mark student as paid (optional)
      await prisma.student.update({
        where: { id: payment.studentId },
        data: { hasPaid: true },
      })

      console.log(`✅ Webhook: payment ${reference} recorded as paid`)
    } catch (err) {
      console.error('❌ Webhook handler error', err)
      // we still return 200 so Paystack won't retry endlessly
    }
  }

  // 5) Acknowledge receipt
  return NextResponse.json({ received: true }, { status: 200 })
}
