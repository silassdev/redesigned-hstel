// src/pages/api/admin/rooms/[id]/occupants.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withLogging } from '@/lib/withLogging'

type OccupantResp = {
  id: number
  fullName: string
  dept: string | null
  lastPaymentDate: string | null
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const roomId = Number(req.query.id)
  if (Number.isNaN(roomId)) {
    return res.status(400).json({ message: 'Invalid room id' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const occupants = await prisma.student.findMany({
      where: { roomId },
      select: {
        id: true,
        fullName: true,
        dept: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    })

    
    const mapped: OccupantResp[] = occupants.map((o) => ({
      id: o.id,
      fullName: o.fullName,
      dept: o.dept ?? null,
      lastPaymentDate: o.payments?.[0]?.createdAt
        ? (o.payments[0].createdAt as Date).toISOString()
        : null,
    }))

    return res.status(200).json(mapped)
  } catch (error) {
    console.error(`[/api/admin/rooms/${roomId}/occupants]`, error)
    return res.status(500).json({ message: 'Failed to load occupants' })
  }
}

export default withLogging(handler, 'admin.rooms.occupants')
