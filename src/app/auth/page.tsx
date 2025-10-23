'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'https://prodavajbrzo.vercel.app/dashboard',
          data: {
            custom_email_template: {
              subject: 'Welcome to ProdavajBrzo! 🎉',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Welcome to ProdavajBrzo</title>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>🎉 Welcome to ProdavajBrzo!</h1>
                    <p>Your marketplace adventure starts here</p>
                  </div>
                  <div class="content">
                    <h2>Hi there!</h2>
                    <p>Thank you for joining ProdavajBrzo! We're excited to have you as part of our community.</p>
                    <p>Click the button below to complete your sign-in and start exploring amazing products:</p>
                    <a href="{{ .ConfirmationURL }}" class="button">🚀 Sign In to Your Account</a>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">{{ .ConfirmationURL }}</p>
                    <p>Happy shopping and selling! 🛒✨</p>
                  </div>
                  <div class="footer">
                    <p>ProdavajBrzo - Your trusted marketplace</p>
                    <p>If you didn't request this email, please ignore it.</p>
                  </div>
                </body>
                </html>
              `,
            },
          },
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Check your email to complete sign-in')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In / Register</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link for passwordless authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={loading}
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Magic Link
                </>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>We'll send you a secure link to sign in instantly.</p>
            <p>No password required!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}