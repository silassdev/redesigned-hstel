'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Textarea from '../../../../../components/ui/Textarea'

interface Props {
  ticketId: number
}

export default function TicketReplyForm({ ticketId }: Props) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (message.trim().length < 1) {
      setError('Reply cannot be empty.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await axios.post(`/api/students/tickets/${ticketId}/reply`, { message })
      setMessage('')
      router.refresh() // re-fetch thread
    } catch (err: unknown) {
      let msg = 'Failed to send reply.'
      if (axios.isAxiosError(err)) {
        // If your API returns { message: string }
        const apiMsg = (err.response?.data as { message?: string } | undefined)?.message
        msg = apiMsg ?? msg
      } else if (err instanceof Error) {
        msg = err.message || msg
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Textarea
        value={message}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
      />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Sending…' : 'Send Reply'}
      </button>
    </form>
  )
}
