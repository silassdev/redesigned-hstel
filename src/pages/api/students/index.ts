import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma, Gender } from '@prisma/client' 
import bcrypt from 'bcrypt'
import formidable, { File } from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { withLogging } from '@/lib/withLogging'

export const config = {
  api: { bodyParser: false },
}

function parseForm(req: NextApiRequest): Promise<{
  fields: formidable.Fields
  files: formidable.Files
}> {
  const form = formidable({
    uploadDir: path.join(process.cwd(), 'public', 'uploads'),
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
  })
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

function toStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? (val[0] ?? '') : (val ?? '')
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { fields, files } = await parseForm(req)

    const fullName = toStr(fields.fullName)
    const regNo = toStr(fields.regNo)
    const email = toStr(fields.email)
    const phone = toStr(fields.phone)
    const state = toStr(fields.state)
    const lga = toStr(fields.lga)
    const genderRaw = toStr(fields.gender).toUpperCase()
    const sponsorName = toStr(fields.sponsorName)
    const sponsorPhone = toStr(fields.sponsorPhone)
    const sessionYear = toStr(fields.sessionYear)
    const password = toStr(fields.password)
    const confirmPassword = toStr(fields.confirmPassword)

    if (!fullName || !regNo || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Missing required fields' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // ✅ Gender validation
    if (!Object.values(Gender).includes(genderRaw as Gender)) {
      return res.status(400).json({ message: 'Invalid gender' })
    }
    const gender = genderRaw as Gender

    const exists = await prisma.student.findFirst({
      where: { OR: [{ email }, { regNo }] },
    })
    if (exists) {
      return res.status(409).json({ message: 'Email or RegNo already registered' })
    }

    let photoUrl: string | null = null
    const fileField = files.profilePhoto as File | File[] | undefined
    if (fileField) {
      const file = Array.isArray(fileField) ? fileField[0] : fileField
      const data = await fs.readFile(file.filepath)
      const safeBase = (file.originalFilename ?? file.newFilename ?? 'upload').replace(/[^\w.\-]/g, '_')
      const fileName = `${Date.now()}_${safeBase}`
      const dest = path.join(process.cwd(), 'public', 'uploads', fileName)
      await fs.writeFile(dest, data)
      photoUrl = `/uploads/${fileName}`
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.student.create({
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
        passwordHash,
        profilePhoto: photoUrl,
      },
    })

    return res.status(201).json({ message: 'Registered' })
  } catch (error: unknown) {  
    console.error('Registration error:', error)
    if (error instanceof Error && error.message.includes('maxFileSize')) {
      return res.status(413).json({ message: 'Uploaded file too large' })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

export default withLogging(handler, 'students.register')
