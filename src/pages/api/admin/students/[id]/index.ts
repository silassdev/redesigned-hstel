
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { IncomingForm, type Fields, type Files, type File } from 'formidable'
import path from 'path'
import { withLogging } from '@/lib/withLogging'


export const config = {
  api: {
    bodyParser: false,
  },
}


function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), 'public', 'uploads'),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, 
    })

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })
  })
}

function toStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? '') : (val ?? '')
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
 
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.role || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const idParam = req.query.id
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: 'Invalid student ID' })
  }

  try {
    const { fields, files } = await parseForm(req)

    const fullName     = toStr(fields.fullName)
    const regNo        = toStr(fields.regNo)
    const phone        = toStr(fields.phone)
    const email        = toStr(fields.email)
    const state        = toStr(fields.state)
    const lga          = toStr(fields.lga)
    const gender       = toStr(fields.gender).toUpperCase() as 'MALE' | 'FEMALE'
    const sponsorName  = toStr(fields.sponsorName)
    const sponsorPhone = toStr(fields.sponsorPhone)
    const sessionYear  = toStr(fields.sessionYear)
    const roomIdStr    = toStr(fields.roomId)
    const hasPaidRaw   = toStr(fields.hasPaid)
    const roomId       = roomIdStr ? Number(roomIdStr) : null
    const hasPaid      = hasPaidRaw === 'true' || hasPaidRaw === 'on'

  
    let profilePhoto: string | undefined
    const fileField = (files as Files).profilePhoto as File | File[] | undefined
    if (fileField) {
      const file = Array.isArray(fileField) ? fileField[0] : fileField
      const filename = path.basename(file.filepath)
      profilePhoto = `/uploads/${filename}`
    }

    await prisma.student.update({
      where: { id },
      data: {
        fullName,
        regNo,
        phone,
        email,
        state,
        lga,
        gender,
        sponsorName,
        sponsorPhone,
        sessionYear,
        roomId,
        hasPaid,
        ...(profilePhoto ? { profilePhoto } : {}),
      },
    })

    return res.status(200).json({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[/api/admin/students/[id]] update error:', err.message, err.stack)
      return res.status(500).json({ message: err.message })
    }
    console.error('[/api/admin/students/[id]] update error (non-Error):', err)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

export default withLogging(handler, 'admin.students.list')
