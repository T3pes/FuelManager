import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { to, subject, text, html, csvContent, csvFilename } = req.body;
  if (!to || !subject || (!text && !html)) return res.status(400).json({ error: 'Missing fields' });

  // Usa Mailtrap se configurato, altrimenti Gmail
  const useMailtrap = !!process.env.MAILTRAP_USER;

  const transporter = nodemailer.createTransport(
    useMailtrap
      ? {
          host: 'sandbox.smtp.mailtrap.io',
          port: 2525,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
          },
        }
      : {
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        }
  );

  const mailOptions: any = {
    from: useMailtrap ? process.env.MAILTRAP_USER : process.env.GMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  // Allegato CSV se presente
  if (csvContent && csvFilename) {
    mailOptions.attachments = [
      {
        filename: csvFilename,
        content: '\uFEFF' + csvContent,
        contentType: 'text/csv;charset=utf-8',
      },
    ];
  }

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
