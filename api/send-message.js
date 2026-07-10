import nodemailer from "nodemailer";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "info@3cscareservices.co.uk";

function clean(value) {
  return String(value || "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    return res.status(500).json({ error: "Email service is not configured." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone);
  const postcode = clean(body.postcode);
  const service = clean(body.service);
  const message = clean(body.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const subject = `New care enquiry from ${name}`;
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
    <h2>New care enquiry</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
    <p><strong>Postcode:</strong> ${postcode || "Not provided"}</p>
    <p><strong>Service:</strong> ${service || "Not selected"}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, "<br>")}</p>
  `;

  let transporter;
  try {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create email transporter.", details: error.message });
  }

  const attachments = [];
  if (req.file) {
    attachments.push({
      filename: req.file.originalname,
      content: req.file.buffer,
      contentType: req.file.mimetype,
    });
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: TO_EMAIL,
      replyTo: email,
      subject,
      text,
      html,
      attachments,
    });
  } catch (error) {
    return res.status(502).json({ error: "Email could not be sent.", details: error.message });
  }

  return res.status(200).json({ ok: true });
}