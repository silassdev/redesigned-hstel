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

  const ticketId = Number(req.query.id)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { message } = req.body
  if (typeof message !== 'string' || message.trim().length < 1) {
    return res.status(400).json({ message: 'Reply cannot be empty.' })
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' })
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        author: 'admin',
        message: message.trim(),
      },
    })

    return res.status(201).json(reply)
  } catch (err: unknown) {
    // Narrow to Error only for logging; keep client response generic
    if (err instanceof Error) {
      console.error('Admin reply error:', err.message, err.stack)
    } else {
      console.error('Admin reply error (non-Error):', err)
    }
    return res.status(500).json({ message: 'Internal server error.' })
  }
}

export default withLogging(handler, 'admin.tickets.reply')
