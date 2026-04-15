const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// DATABASE
const db = new sqlite3.Database("./wedding_data.db");

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      date TEXT,
      status TEXT,
      confirmed INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      score INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// RSVP
app.post("/api/rsvp", (req, res) => {
    const { name, phone, date, status } = req.body;

    db.run(
        `INSERT INTO rsvps (name, phone, date, status) VALUES (?, ?, ?, ?)`,
        [name, phone, date, status],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.get("/api/rsvps", (req, res) => {
    db.all(`SELECT * FROM rsvps ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/rsvp/confirm/:id", (req, res) => {
    const id = req.params.id;
    const { confirmed } = req.body;

    db.run(
        `UPDATE rsvps SET confirmed=? WHERE id=?`,
        [confirmed ? 1 : 0, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// GAME SCORE
app.post("/api/game/score", (req, res) => {
    const { username, score } = req.body;

    if (!username || score == null) {
        return res.status(400).json({ error: "Missing data" });
    }

    db.run(
        `INSERT INTO scores (username, score) VALUES (?, ?)`,
        [username, score],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ success: true, id: this.lastID });
        }
    );
});

app.get("/api/game/leaderboard", (req, res) => {
    db.all(
        `SELECT username, score FROM scores ORDER BY score DESC LIMIT 10`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// START
app.listen(PORT, () => {
    console.log(`🔥 Server running at http://localhost:${PORT}`);
});
