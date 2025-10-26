'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function AuthPage() {
  const t = useTranslations('auth')
  const { locale } = useParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [lastSentTime, setLastSentTime] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const router = useRouter()

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (lastSentTime && countdown > 0) {
      interval = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((60000 - (now - lastSentTime)) / 1000))
        setCountdown(remaining)

        if (remaining === 0) {
          setLastSentTime(null)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [lastSentTime, countdown])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user recently requested a magic link (within last 60 seconds)
    const now = Date.now()
    if (lastSentTime && (now - lastSentTime) < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - lastSentTime)) / 1000)
      toast.error(t('waitMessage', { seconds: remainingSeconds }), {
        duration: 4000,
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `https://prodavajbrzo.vercel.app/dashboard`,
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
        setLastSentTime(now)
        setCountdown(60)
        toast.success(t('checkEmail'), {
          duration: 4000,
        })
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900 dark:text-white">{t('title')}</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <Button
              type="submit"
              className={`w-full text-white ${countdown > 0 ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
              disabled={loading || countdown > 0}
            >
              {loading ? (
                t('sending')
              ) : countdown > 0 ? (
                t('tryAgainIn', { seconds: countdown })
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t('sendMagicLink')}
                </>
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>{t('footerText')}</p>
            <p>{t('noPassword')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}