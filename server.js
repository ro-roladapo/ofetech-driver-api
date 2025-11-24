// server.js
const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [
      "https://ofetechlogistics.com",
      "https://ro-roladapo.github.io",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
  })
);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "Ofetech Driver API" });
});

// POST /applications
app.post("/applications", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      city,
      state,
      vehicleType,
      experienceYears,
      hasCommercialInsurance,
      startDate,
      notes,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !city ||
      !state ||
      !vehicleType ||
      !hasCommercialInsurance
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const expYears =
      experienceYears === undefined || experienceYears === null
        ? 0
        : Number(experienceYears);

    if (Number.isNaN(expYears) || expYears < 0) {
      return res
        .status(400)
        .json({ message: "experienceYears must be a non-negative number." });
    }

    const sql = `
      INSERT INTO driver_applications (
        full_name,
        email,
        phone,
        city,
        state,
        vehicle_type,
        experience_years,
        has_commercial_insurance,
        start_date,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      fullName.trim(),
      email.trim(),
      phone.trim(),
      city.trim(),
      state.trim().toUpperCase(),
      vehicleType.trim(),
      expYears,
      hasCommercialInsurance === "yes" ? "yes" : "no",
      startDate || null,
      notes || null,
    ];

    const [result] = await pool.execute(sql, params);

    return res.status(201).json({
      message: "Application submitted successfully.",
      applicationId: result.insertId,
    });
  } catch (err) {
    console.error("Error inserting application:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// GET /applications (for future dashboard)
app.get("/applications", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, phone, city, state, vehicle_type, experience_years, has_commercial_insurance, start_date, notes, created_at FROM driver_applications ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Ofetech Driver API listening on port ${port}`);
});

