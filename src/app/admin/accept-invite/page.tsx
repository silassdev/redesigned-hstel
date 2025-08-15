// app/admin/accept-invite/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { useToast } from '@/components/ui/use-toast'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params?.get('token')
  const { toast } = useToast()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [valid, setValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!token) {
      router.replace('/')
      return
    }
    const validate = async () => {
      try {
        await axios.get(`/api/admin/admins/accept-invite?token=${token}`)
        setValid(true)
      } catch (_) {
        setValid(false)
      }
    }
    validate()
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    if (!token) {
      setError('Invalid invite link.')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/admin/admins/accept-invite', { token, password })
      toast({ title: 'Success', description: 'Your password has been set.' })
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invite.')
    } finally {
      setLoading(false)
    }
  }


  if (valid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-white rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-400">Invalid or Expired Token</h2>
          <p>This invitation link is no longer valid.</p>
        </div>
      </div>
    )
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Set your password</h2>
        {error && <p className="mb-2 text-red-500">{error}</p>}

        <label className="block mb-2">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            className="input w-full"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium">Confirm Password</span>
          <input
            type="password"
            className="input w-full"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Setting…' : 'Set Password'}
        </button>
      </form>
    </div>
  )
}