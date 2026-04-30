import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { to, subject, text, html, csvContent, csvFilename } = req.body;
  if (!to || !subject || (!text && !html)) return res.status(400).json({ error: 'Missing fields' });

  const useMailtrap = !!process.env.MAILTRAP_USER;

  // Controllo esplicito credenziali
  if (useMailtrap && (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS)) {
    return res.status(500).json({ error: 'Credenziali Mailtrap mancanti nelle variabili d\'ambiente' });
  }
  if (!useMailtrap && (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)) {
    return res.status(500).json({ error: 'Credenziali Gmail mancanti nelle variabili d\'ambiente' });
  }

  const transporter = nodemailer.createTransport(
    useMailtrap
      ? {
          host: 'sandbox.smtp.mailtrap.io',
          port: 2525,
          secure: false,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
          },
          tls: { rejectUnauthorized: false },
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
    from: useMailtrap ? `"FuelManager" <${process.env.MAILTRAP_USER}>` : process.env.GMAIL_USER,
    to,
    subject,
    text,
    html,
  };

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
