// api/check-email.js
import Airtable from "airtable";
import cors from "micro-cors";

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [];

const corsMiddleware = cors({
  allowMethods: ["POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  origin: (origin) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return true;
    }
    return false;
  },
});

async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    const records = await base(process.env.AIRTABLE_TABLE_NAME)
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1,
      })
      .firstPage();

    const approved = records.length > 0;

    res.status(200).json({ approved });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export default corsMiddleware(handler);
