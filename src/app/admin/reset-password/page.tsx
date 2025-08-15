'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import Textarea   from '@/components/ui/Textarea'

export default function ResetPasswordPage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const token        = params?.get('token') || ''
  const [valid, setValid]     = useState<boolean|null>(null)
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string|null>(null)
  const [success, setSuccess]     = useState(false)
  const [loading, setLoading]     = useState(false)

  
  useEffect(() => {
    if (!token) {
      setValid(false)
      return
    }
    axios.get(`/api/admin/admins/reset-password?token=${token}`)
      .then(() => setValid(true))
      .catch(() => setValid(false))
  }, [token])

  // 2) Handle form submit
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
    setLoading(true)
    try {
      await axios.post('/api/admin/admins/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed.')
    } finally {
      setLoading(false)
    }
  }

  // 3) Render invalid page
  if (valid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-white rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-500">Invalid or Expired Token</h2>
          <p>This reset link is no longer valid.</p>
        </div>
      </div>
    )
  }

  // 4) Success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-white rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-4">Password Reset!</h2>
          <p>You can now <a className="text-indigo-600 underline" href="/auth/login">log in</a> with your new password.</p>
        </div>
      </div>
    )
  }

  // 5) Loading or form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4 text-green-500">Set a New Password</h2>
        {valid === null ? (
          <p>Validating link…</p>
        ) : valid === true ? (
          <>
            {error && <p className="mb-2 text-red-500">{error}</p>}
            <label className="block mb-2">
              <span className="text-sm font-medium text-gray-500">New Password</span>
              <Textarea
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="new password"
       placeholderClassName="placeholder:font-bold placeholder-gray-600 placeholder-opacity-100"
         className="w-full h-24 resize-y text-gray-800 border rounded-lg px-3 py-2"
              />
            </label>
            <label className="block mb-4">
  <span className="text-sm font-medium text-gray-500">Confirm Password</span>
  <Textarea
    value={confirm}
    onChange={e => setConfirm(e.target.value)}
    required
    placeholder="Confirm password"
    placeholderClassName="placeholder:font-bold placeholder-gray-600 placeholder-opacity-100"
    className="w-full h-24 resize-y text-gray-800 border rounded-lg px-3 py-2"
  />
</label>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </>
        ) : null}
      </form>
    </div>
  )
}