// app/dashboard/admin/students/page.tsx
import React from 'react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StudentsAdminClient from './StudentAdminClient'

// 1) “raw” type matching exactly what Prisma returns
type RawStudent = {
  id: number
  fullName: string
  email: string
  room: { block: string; number: number } | null
  gender: 'MALE' | 'FEMALE'
  sessionYear: string
}

// 2) The exact shape StudentsAdminClient expects
export type StudentAdmin = {
  id: number
  fullName: string
  email: string
  room: string              
  gender: 'MALE' | 'FEMALE'
  sessionYear: number        
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>
}) {
  // Next.js requires you to await searchParams if you use them
  const params = (await searchParams) as Record<string, string | undefined>

  // 1) Auth guard
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== 'admin') {
    redirect('/auth/login')
  }

  const TAKE = 10
  
  const pageParam = params.page || '1'
  const gender    = params.gender?.toUpperCase()
  const yearParam = params.year || ''
  const page      = parseInt(pageParam, 10) || 1
  const take      = 10
  const skip      = (page - 1) * TAKE

 
  const where: Record<string, any> = {}
  if (gender === 'MALE' || gender === 'FEMALE') {
    where.gender = gender
  }
  if (/^\d{4}$/.test(yearParam)) {
    where.sessionYear = yearParam 
  }

  const [rawRows, total]: [RawStudent[], number] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        fullName: true,
        email: true,
        room: { select: { block: true, number: true } },
        gender: true,
        sessionYear: true,
      },
    }),
    prisma.student.count({ where }),
  ])

  const totalPages = Math.ceil(total / take)

  // 5) Map into the shape your client component expects
  const students: StudentAdmin[] = rawRows.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    email: s.email,
    room: s.room ? `${s.room.block}-${s.room.number}` : '—',
    gender: s.gender,
    sessionYear: parseInt(s.sessionYear, 10),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-950">Student Records</h1>
          <Link
            href="/dashboard/admin"
            className="text-indigo-600 hover:underline text-sm"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <StudentsAdminClient
          students={students}
          page={page}
          totalPages={totalPages}
          currentGender={(gender as 'MALE' | 'FEMALE') || 'ALL'}
          currentYear={yearParam}
        />
      </main>
    </div>
  )
}
