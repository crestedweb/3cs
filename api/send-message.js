import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "info@3cscareservices.co.uk";

function clean(value) {
  return String(value || "").trim();
}

function normalizeLead(row) {
  const message = row.message || "";
  const submittedUrgency = message.match(/(?:^|\|\s*)Urgency:\s*([^|]+)/i)?.[1]?.trim();
  const submittedBudget = message.match(/(?:^|\|\s*)Budget:\s*([^|]+)/i)?.[1]?.trim();

  return {
    id: row.id,
    family: row.family_name,
    need: row.care_need,
    area: row.area,
    urgency: submittedUrgency || row.urgency || "Soon",
    budget: submittedBudget || row.budget || "TBC",
    status: row.status || "New",
    providerName: row.provider_name || "Unassigned",
    score: Number(row.score || 80),
    matchStatus: row.match_status || "Awaiting triage",
    followUpStage: row.follow_up_stage || "Pending",
    adminRating: row.admin_rating || null,
    adminNote: row.admin_note || "",
    createdAt: row.created_at,
    contactEmail: row.contact_email || "",
    phone: row.phone || "",
    message,
  };
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
  const urgency = clean(body.urgency || "Soon");
  const budget = clean(body.budget || "TBC");

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ error: "Lead storage is not configured." });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: savedLeads, error: leadError } = await supabase.from("leads").insert([{
    family_name: name,
    care_need: service || "Care support",
    area: postcode || "Not set",
    urgency,
    budget,
    status: "new",
    provider_name: "Unassigned",
    score: 80,
    contact_email: email,
    phone,
    message,
  }]).select();

  if (leadError || !savedLeads?.[0]) {
    console.error("Lead save failed:", leadError?.message);
    return res.status(500).json({ error: "Your enquiry could not be saved. Please try again." });
  }

  const lead = normalizeLead(savedLeads[0]);

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
    console.error("Email delivery failed after lead was saved:", error.message);
    return res.status(502).json({ error: "Email could not be sent.", details: error.message, lead });
  }

  return res.status(200).json({ ok: true, lead });
}
