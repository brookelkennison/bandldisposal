import type { EmailAdapter, SendEmailOptions } from 'payload'
import { Resend } from 'resend'

export function resendAdapter(config: {
  apiKey: string
  defaultFromAddress: string
  defaultFromName?: string
}): EmailAdapter {
  const resend = new Resend(config.apiKey)

  return {
    name: 'resend',
    defaultFromAddress: config.defaultFromAddress,
    defaultFromName: config.defaultFromName || 'B&L Disposal',
    sendEmail: async (email: SendEmailOptions): Promise<void> => {
      try {
        const result = await resend.emails.send({
          from: email.from || `${config.defaultFromName} <${config.defaultFromAddress}>`,
          to: Array.isArray(email.to) ? email.to : [email.to],
          subject: email.subject,
          html: email.html || '',
          text: email.text,
        })

        if (result.error) {
          console.error('[Resend] Error sending email:', result.error)
          throw new Error(`Failed to send email: ${result.error.message}`)
        }

        console.log('[Resend] Email sent successfully:', result.data?.id)
      } catch (error) {
        console.error('[Resend] Error sending email:', error)
        throw error
      }
    },
  }
}

