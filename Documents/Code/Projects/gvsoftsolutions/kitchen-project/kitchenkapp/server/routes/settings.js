const express       = require("express");
const nodemailer    = require("nodemailer");
const router        = express.Router();
const VendorSettings = require("../models/VendorSettings");

const VENDORS = ["Costco", "Mid East Market", "Spice Bazaar"];

// GET /api/settings/vendors
router.get("/vendors", async (req, res) => {
  try {
    const docs = await VendorSettings.find({ vendor: { $in: VENDORS } }).lean();
    const map = {};
    for (const d of docs) map[d.vendor] = d;
    const data = VENDORS.map((v) => ({
      vendor: v,
      email:  map[v]?.email || "",
      _id:    map[v]?._id   || null,
    }));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PUT /api/settings/vendors/:vendor
router.put("/vendors/:vendor", async (req, res) => {
  try {
    const { vendor } = req.params;
    const email = String(req.body.email || "").trim();
    if (!VENDORS.includes(vendor))
      return res.status(400).json({ success: false, message: "Unknown vendor" });
    const doc = await VendorSettings.findOneAndUpdate(
      { vendor },
      { $set: { email } },
      { upsert: true, new: true }
    );
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/settings/email/send
router.post("/email/send", async (req, res) => {
  const { to, cc, subject, body } = req.body || {};
  if (!to)      return res.status(400).json({ success: false, message: "Recipient (To) is required" });
  if (!subject) return res.status(400).json({ success: false, message: "Subject is required" });
  if (!body)    return res.status(400).json({ success: false, message: "Email body is required" });

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return res.status(503).json({
      success: false,
      message: "Email not configured on server. Add SMTP_HOST, SMTP_USER, SMTP_PASS to server .env",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const mail = { from, to, subject, text: body };
    if (cc && cc.trim()) mail.cc = cc.trim();

    await transporter.sendMail(mail);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
