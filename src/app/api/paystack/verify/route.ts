export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentReceipt } from '@/lib/mailer'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')
    if (!reference) {
      return NextResponse.json({ success: false, message: 'Missing reference parameter' }, { status: 400 })
    }

    // 1) Verify with Paystack
    const secret = process.env.PAYSTACK_SECRET_KEY!
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
      }
    )
    const body = await res.json()
    console.log('🔍 Paystack verify response:', body)

    if (!res.ok || body.status !== true || body.data.status !== 'success') {
      return NextResponse.json({ success: false, message: 'Payment not successful' }, { status: 400 })
    }

    // 2) Update Payment record
    const payment = await prisma.payment.update({
      where: { reference },
      data: { status: 'success' },
    })

    // 3) Assign room and mark hasPaid
    await prisma.student.update({
      where: { id: payment.studentId },
      data: {
        roomId:  payment.roomId,
        hasPaid: true,
      },
    })

    // 4) Send receipt email
    const student = await prisma.student.findUnique({
      where: { id: payment.studentId },
      select: { fullName: true, email: true },
    })
    if (student) {
      const room = await prisma.room.findUnique({ where: { id: payment.roomId } })
      await sendPaymentReceipt({
        to:     student.email!,
        studentName: student.fullName,
        roomBlock:   room?.block || '',
        roomNumber:  room?.number || 0,
        amount:      payment.amount / 100,
        reference,
        date:        payment.createdAt,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[VERIFY PAYSTACK ERROR]', err)
    return NextResponse.json(
      { success: false, message: 'Server error during verification' },
      { status: 500 }
    )
  }
}
