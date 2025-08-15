import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { IncomingForm, Fields, Files } from 'formidable'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withLogging } from '@/lib/withLogging'

export const config = { api: { bodyParser: false } }

// Helper to parse form with formidable
function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir: './public/uploads',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    })
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // 1) Session check
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.role || session.user.role !== 'student') {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  const studentId = Number(session.user.id)

  // 2) Prevent multiple open tickets
  const openCount = await prisma.ticket.count({
    where: { studentId, status: 'OPEN' },
  })
  if (openCount > 0) {
    return res
      .status(400)
      .json({ message: 'Please close your existing ticket before opening a new one.' })
  }

  try {
    // 3) Parse form
    const { fields, files } = await parseForm(req)
    const subjectRaw = Array.isArray(fields.subject) ? fields.subject[0] : fields.subject
    const messageRaw = Array.isArray(fields.message) ? fields.message[0] : fields.message
    const subject = String(subjectRaw || '').trim()
    const message = String(messageRaw || '').trim()

    console.log('🔍 Subject:', subject, 'Length:', subject.length)

    if (subject.length < 3) {
      return res.status(400).json({ message: 'Subject must be at least 3 characters.' })
    }
    if (message.length < 20) {
      return res.status(400).json({ message: 'Message must be at least 20 characters.' })
    }

    // 4) Handle optional image upload
    let imageUrl: string | null = null
    if (files.image) {
      const file = Array.isArray(files.image) ? files.image[0] : files.image
      const filename = file.newFilename || file.originalFilename
      if (filename) imageUrl = `/uploads/${filename}`
    }

    // 5) Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        studentId,
        subject,
        message,
        imageUrl,
        status: 'OPEN',
      },
    })

    return res.status(201).json(ticket)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Ticket creation error:', errMsg)
    return res.status(500).json({ message: 'Error opening ticket.' })
  }
}
export default withLogging(handler, 'students.ticket.create')