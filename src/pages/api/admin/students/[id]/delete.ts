import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withLogging } from '@/lib/withLogging'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Auth check
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.role || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  // Validate query param
  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const id = Number(idParam)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: 'Invalid ID' })
  }

  try {
    // Delete the student record
    await prisma.student.delete({ where: { id } })
    return res.status(200).json({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[/api/admin/students/[id]/delete]', err.message, err.stack)
      return res.status(500).json({ message: err.message })
    }
    console.error('[/api/admin/students/[id]/delete] Non-Error thrown:', err)
    return res.status(500).json({ message: 'Failed to delete student' })
  }
}

export default withLogging(handler, 'admin.students.delete')
