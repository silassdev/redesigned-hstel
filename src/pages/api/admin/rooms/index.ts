import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withLogging } from '@/lib/withLogging'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.role || session.user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const rooms = await prisma.room.findMany()
    return res.status(200).json(rooms)
  }

  if (req.method === 'POST') {
    const { block, number, price, gender } = req.body as {
      block?: string
      number?: number | string
      price?: number | string
      gender?: string
    }

    if (!block || !number || !price || !gender) {
      return res.status(400).json({ message: 'All fields required' })
    }

    try {
      const room = await prisma.room.create({
        data: {
          block: block.toUpperCase(),
          number: Number(number),
          price: Number(price),
          gender,
        },
      })
      return res.status(201).json(room)
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code?: string }).code === 'P2002'
      ) {
        const msg = `Room ${block.toUpperCase()}-${number} for ${gender.toLowerCase()} already exists.`
        return res.status(409).json({ message: msg })
      }
      console.error(e)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default withLogging(handler, 'admin.room:list')
