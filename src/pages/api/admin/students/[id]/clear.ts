import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withLogging } from '@/lib/withLogging'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Keep PATCH if that's intentional (for partial updates)
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Authentication & role check
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.role || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  // Safely parse id from query (string | string[])
  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const id = Number(idParam)
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: 'Invalid ID' })
  }

  try {
    // Disconnect the room relation (sets roomId to null)
    await prisma.student.update({
      where: { id },
      data: { room: { disconnect: true } },
    })
    return res.status(200).json({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[/api/admin/students/[id]/clear]', err.message, err.stack)
      return res.status(500).json({ message: err.message })
    }
    console.error('[/api/admin/students/[id]/clear] Non-Error thrown:', err)
    return res.status(500).json({ message: 'Failed to clear room' })
  }
}

export default withLogging(handler, 'admin.students.clearRoom')
