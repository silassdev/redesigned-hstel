// src/app/dashboard/admin/students/[id]/page.tsx
import React from 'react'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EditStudentForm from '@/components/forms/EditStudentForm'

interface Props {
  // Next.js 15 supplies params as a Promise
  params: Promise<{ id: string }>
}

export default async function EditStudentPage({ params }: Props) {
  // await the params promise (fixes the TypeScript mismatch from Next.js 15)
  const { id } = await params
  const studentId = Number(id)

  // if id is not a valid number, redirect back to list
  if (Number.isNaN(studentId)) {
    redirect('/dashboard/admin/students')
  }

  // 1) Auth guard (server-side)
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || session.user.role !== 'admin') {
    redirect('/auth/login')
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true,
      regNo: true,
      phone: true,
      email: true,
      state: true,
      lga: true,
      gender: true,
      sponsorName: true,
      sponsorPhone: true,
      sessionYear: true,
      roomId: true,
      hasPaid: true,
    },
  })

  if (!student) {
    redirect('/dashboard/admin/students')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Student</h1>
          <Link
            href="/dashboard/admin/students"
            className="text-indigo-600 hover:underline text-sm"
          >
            ← Back to List
          </Link>
        </header>

        <EditStudentForm
          initialData={{
            ...student,
            sessionYear: Number(student.sessionYear),
          }}
        />
      </main>
    </div>
  )
}
