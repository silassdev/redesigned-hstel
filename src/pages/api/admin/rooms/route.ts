import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

type RoomWithStudents = {
  id: number
  block: string
  number: number
  price: number
  isFilled: boolean
  gender: string
  students: { id: number; fullName: string; hasPaid: boolean }[]
}

export async function GET(_req: NextRequest) {
  try {
    // include students (select the correct student fields)
    const roomsRaw = await prisma.room.findMany({
      include: {
        students: {
          select: { id: true, fullName: true, hasPaid: true },
        },
      },
      orderBy: [
        { block: 'asc' },
        { number: 'asc' },
      ],
    })

    // map to a client-friendly shape
    const rooms: RoomWithStudents[] = roomsRaw.map((r) => ({
      id: r.id,
      block: r.block,
      number: r.number,
      price: r.price,
      gender: r.gender,
      isFilled: r.isFilled,
      students: r.students,
    }))

    const shaped = rooms.map((r) => ({
      id: r.id,
      label: `${r.block}-${r.number}`,
      block: r.block,
      number: r.number,
      price: r.price,
      gender: r.gender,
      isFilled: r.isFilled,
      totalStudents: r.students.length,
      paidCount: r.students.filter((s) => s.hasPaid).length,
      students: r.students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        hasPaid: s.hasPaid,
      })),
    }))

    return NextResponse.json(shaped)
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[/api/admin/rooms] GET error:', err.message, err.stack)
    } else {
      console.error('[/api/admin/rooms] GET error (non-Error):', err)
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { block, number, price, gender } = body ?? {}

    if (!block || !number || !price || !gender) {
      return NextResponse.json(
        { message: 'block, number, price and gender are required' },
        { status: 400 }
      )
    }

    // normalize
    const blockU = String(block).toUpperCase()
    const numberN = Number(number)
    const priceN = Number(price)
    const genderU = String(gender).toUpperCase()

    try {
      const room = await prisma.room.create({
        data: {
          block: blockU,
          number: numberN,
          price: priceN,
          gender: genderU,
        },
      })
      return NextResponse.json(room, { status: 201 })
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code?: string }).code === 'P2002'
      ) {
        return NextResponse.json(
          {
            message: `Room ${blockU}-${numberN} for ${genderU} already exists.`,
          },
          { status: 409 }
        )
      }
      console.error('[/api/admin/rooms] create error:', e)
      return NextResponse.json(
        { message: 'Failed to create room' },
        { status: 500 }
      )
    }
  } catch (err: unknown) {
    console.error('[/api/admin/rooms] POST error:', err)
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
  }
}
