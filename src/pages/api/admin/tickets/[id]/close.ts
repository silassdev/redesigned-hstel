import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withLogging } from '@/lib/withLogging'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.role || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Validate id param (handles string | string[])
  const idParam = req.query.id
  const ticketId = Number(Array.isArray(idParam) ? idParam[0] : idParam)
  if (!Number.isFinite(ticketId)) {
    return res.status(400).json({ message: 'Invalid ticket id.' })
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' })
    }

    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ message: 'Ticket already closed.' })
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'CLOSED' },
    })

    return res.status(200).json({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Admin close ticket error:', err.message, err.stack)
    } else {
      console.error('Admin close ticket error (non-Error):', err)
    }
    return res.status(500).json({ message: 'Internal server error.' })
  }
}

export default withLogging(handler, 'admin.tickets.close')
