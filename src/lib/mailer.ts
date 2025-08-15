import nodemailer from 'nodemailer'
import type { Attachment } from 'nodemailer/lib/mailer'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import path from 'path'
import fs from 'fs'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
})

/**
 * Generic email sender for invites, password resets, etc.
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Attachment[]
}) {
  const { to, subject, html, text, cc, bcc, attachments } = opts

  await transporter.sendMail({
    from: `"${process.env.SCHOOL_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    attachments,
  })
}

/**
 * Specialised sender: generates a PDF receipt and attaches it to the email
 */
export async function sendPaymentReceipt(opts: {
  to: string
  studentName: string
  roomBlock: string
  roomNumber: number
  amount: number  
  reference: string
  date: Date
}) {
  const { to, studentName, roomBlock, roomNumber, amount, reference, date } = opts
  const attachments: Attachment[] = []

  const nairaAmount = amount / 100

  try {
    // PDF generation
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit as never)
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'static', 'Roboto-Regular.ttf')
    const fontBytes = fs.readFileSync(fontPath)
    const customFont = await pdfDoc.embedFont(fontBytes)

    let logoImage
    try {
      const logoBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'))
      logoImage = await pdfDoc.embedPng(logoBytes)
    } catch {
      logoImage = null
    }

    const page = pdfDoc.addPage([612, 792])
    const { width, height } = page.getSize()
    const margin = 50

    if (logoImage) {
      const dims = logoImage.scale(0.25)
      page.drawImage(logoImage, {
        x: width - dims.width - margin,
        y: height - dims.height - margin,
        width: dims.width,
        height: dims.height,
      })
    }

    page.drawText(process.env.SCHOOL_NAME || 'Hostel Management', {
      x: margin,
      y: height - margin - 20,
      size: 20,
      font: customFont,
      color: rgb(0, 0, 0),
    })

    const startY = height - margin - 60
    page.drawText('Payment Receipt', { x: margin, y: startY, size: 16, font: customFont })

    const details = [
      `Date: ${date.toLocaleString()}`,
      `Reference: ${reference}`,
      `Student: ${studentName}`,
      `Room: ${roomBlock}-${roomNumber}`,
      `Amount Paid: ₦${nairaAmount.toLocaleString()}`,
    ]
    details.forEach((line, idx) => {
      page.drawText(line, {
        x: margin,
        y: startY - (idx + 1) * 18,
        size: 14,
        font: customFont,
      })
    })

    page.drawText('Thank you for your payment.', {
      x: margin,
      y: startY - (details.length + 2) * 18,
      size: 14,
      font: customFont,
    })

    const pdfBytes = await pdfDoc.save()
    attachments.push({
      filename: `receipt-${reference}.pdf`,
      content: Buffer.from(pdfBytes),
      contentType: 'application/pdf'
    })
  } catch (err) {
    console.error('[Mailer] PDF generation failed, sending plain email', err)
  }

  // send email with or without attachment
  await transporter.sendMail({
    from: `"${process.env.SCHOOL_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Payment Receipt — ${reference}`,
    html: `
      <p>Hi ${studentName},</p>
      <p>Thank you for your payment of 
         <strong>₦${nairaAmount.toLocaleString()}</strong>
         for room <strong>${roomBlock}-${roomNumber}</strong> 
         on ${date.toLocaleDateString()}.</p>
      <p>Your reference is <code>${reference}</code>.</p>
      <p>– ${process.env.SCHOOL_NAME}</p>
    `,
    attachments,
  })
}
