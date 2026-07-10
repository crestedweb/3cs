import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
    }
  },
});

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, '.env'));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('dist'));

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "info@3cscareservices.co.uk";

function clean(value) {
  return String(value || "").trim();
}

app.post('/api/send-message', upload.single('cv'), async (req, res) => {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
      return res.status(500).json({ error: "Email service is not configured." });
    }

    const body = req.body || {};
    const name = clean(body.name);
    const email = clean(body.email);
    const phone = clean(body.phone);
    const postcode = clean(body.postcode);
    const service = clean(body.service);
    const message = clean(body.message);

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }

    const subject = `New Care Enquiry from ${name}`;
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Postcode: ${postcode || "Not provided"}`,
      `Service: ${service || "Not selected"}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Care Enquiry</title>
</head>

<body style="margin:0;padding:30px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="700" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:14px;overflow:hidden;
box-shadow:0 8px 25px rgba(0,0,0,.08);">

<!-- Header -->
<tr>
<td style="background:#0d2240;padding:30px;text-align:center;">

<h1 style="margin:0;color:#ffffff;font-size:32px;">
3CS Care Services
</h1>

<p style="margin:10px 0 0;color:#b8ffd2;font-size:17px;">
New Website Care Enquiry
</p>

</td>
</tr>

<!-- Greeting -->
<tr>
<td style="padding:35px;">

<p style="font-size:17px;color:#333;margin-top:0;">
A new enquiry has been submitted through your website.
</p>

<!-- Client Information -->
<table width="100%" cellpadding="12" cellspacing="0"
style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">

<tr style="background:#f8fafc;">
<td width="180"><strong>Full Name</strong></td>
<td>${name}</td>
</tr>

<tr>
<td><strong>Email Address</strong></td>
<td>
<a href="mailto:${email}" style="color:#16a34a;text-decoration:none;">
${email}
</a>
</td>
</tr>

<tr style="background:#f8fafc;">
<td><strong>Phone Number</strong></td>
<td>${phone || "Not provided"}</td>
</tr>

<tr>
<td><strong>Postcode</strong></td>
<td>${postcode || "Not provided"}</td>
</tr>

<tr style="background:#f8fafc;">
<td><strong>Service Required</strong></td>
<td>${service || "Not selected"}</td>
</tr>

</table>

<!-- Message -->
<h2 style="margin-top:35px;color:#16a34a;font-size:22px;">
Client Message
</h2>

<div style="
background:#f8fafc;
padding:20px;
border-left:5px solid #16a34a;
border-radius:6px;
line-height:1.8;
font-size:15px;
color:#333;
">

${message.replace(/\n/g,"<br>")}

</div>

<!-- Attachment -->
${
req.file
? `
<h2 style="margin-top:35px;color:#16a34a;font-size:22px;">
Attached Document
</h2>

<div style="
background:#ecfdf5;
padding:15px;
border-radius:8px;
border:1px solid #bbf7d0;
font-size:15px;
">

📎 <strong>${req.file.originalname}</strong>

</div>
`
: ""
}

<!-- Buttons -->
<table width="100%" style="margin-top:40px;">
<tr>

<td align="center">

<a href="mailto:${email}"
style="
display:inline-block;
background:#16a34a;
color:#ffffff;
padding:14px 30px;
text-decoration:none;
border-radius:8px;
font-weight:bold;
margin-right:10px;
">
Reply to Client
</a>

${
phone
? `
<a href="tel:${phone}"
style="
display:inline-block;
background:#0d2240;
color:#ffffff;
padding:14px 30px;
text-decoration:none;
border-radius:8px;
font-weight:bold;
">
Call Client
</a>
`
: ""
}

</td>

</tr>
</table>

<hr style="margin:40px 0;border:none;border-top:1px solid #e5e7eb;">

<p style="font-size:13px;color:#777;text-align:center;line-height:1.6;">

This enquiry was submitted via the
<strong>3CS Care Services</strong> website.

<br><br>

Received on:
<strong>${new Date().toLocaleString("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
})}</strong>

</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort === 587,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const attachments = [];
    if (req.file) {
      attachments.push({
        filename: req.file.originalname,
        content: req.file.buffer,
        contentType: req.file.mimetype,
      });
    }

    await transporter.sendMail({
      from: fromEmail,
      to: TO_EMAIL,
      replyTo: email,
      subject,
      text,
      html,
      attachments,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Email error:', error);
    console.error('req.body:', req.body);
    console.error('req.file:', req.file);
    return res.status(502).json({ error: "Email could not be sent.", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
