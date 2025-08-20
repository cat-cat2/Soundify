import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const USERS_DIR = path.join(__dirname, "Users");
if (!fs.existsSync(USERS_DIR)) fs.mkdirSync(USERS_DIR);

// Register new user
app.post("/register", (req, res) => {
  const { username, password, email } = req.body;
  if(!username || !password) return res.json({ success:false, error:"Missing fields" });

  const userDir = path.join(USERS_DIR, username);
  if (fs.existsSync(userDir)) {
    return res.json({ success:false, error:"User already exists" });
  }
  fs.mkdirSync(userDir, { recursive: true });
  fs.writeFileSync(path.join(userDir, "account.json"), JSON.stringify({ username, password, email }));
  fs.writeFileSync(path.join(userDir, "comments.json"), "[]");
  res.json({ success:true });
});

// Post a comment
app.post("/comment", (req, res) => {
  const { username, song, comment } = req.body;
  if(!username || !song || !comment) return res.json({ success:false, error:"Missing fields" });

  const userDir = path.join(USERS_DIR, username);
  if (!fs.existsSync(userDir)) return res.json({ success:false, error:"User not found" });

  const commentsFile = path.join(userDir, "comments.json");
  let comments = [];
  if (fs.existsSync(commentsFile)) {
    comments = JSON.parse(fs.readFileSync(commentsFile));
  }
  comments.push({ song, text: comment, username });
  fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2));
  res.json({ success:true });
});

// Get comments for a song
app.get("/comments", (req, res) => {
  const { song } = req.query;
  let allComments = [];
  for(const user of fs.readdirSync(USERS_DIR)){
    const commentsFile = path.join(USERS_DIR, user, "comments.json");
    if(fs.existsSync(commentsFile)){
      const userComments = JSON.parse(fs.readFileSync(commentsFile));
      allComments.push(...userComments.filter(c => c.song === song));
    }
  }
  res.json(allComments);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
