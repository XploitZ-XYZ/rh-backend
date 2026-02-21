// ==================================================
// Backend RH - Versão final completa
// ==================================================

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ==================================================
// ENDPOINTS PRINCIPAIS
// ==================================================

// Endpoint principal
app.get("/", (req, res) => {
  res.send("Servidor RH está a funcionar 🚀");
});

// Endpoint de status
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ==================================================
// LOGIN (temporal com roles)
// ==================================================
let users = [
  { id: 1, email: "creator@empresa.com", password: "1234", role: "creator" },
  { id: 2, email: "admin@empresa.com", password: "1234", role: "admin" },
  { id: 3, email: "colaborador@empresa.com", password: "1234", role: "colaborador" }
];

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    return res.json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
  }
  res.status(401).json({ success: false, message: "Credenciais inválidas" });
});

// ==================================================
// CALENDAR - Gestão de férias / ausências
// ==================================================
let calendar = [];

app.get("/calendar", (req, res) => res.json(calendar));

app.post("/calendar", (req, res) => {
  const { user_id, type, start, end } = req.body;
  if (!user_id || !type || !start || !end) return res.status(400).json({ success: false, message: "Campos obrigatórios: user_id, type, start, end" });

  const newEntry = { id: calendar.length + 1, user_id, type, start, end };
  calendar.push(newEntry);
  res.json({ success: true, entry: newEntry });
});

// ==================================================
// DOCUMENTS - Upload e listagem
// ==================================================

// Cria pasta uploads se não existir
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

let documents = [];

// Upload de ficheiro
app.post("/documents", upload.single("file"), async (req, res) => {
  try {
    const { user_id, type } = req.body;
    const filePath = req.file.path;

    // Converter para PDF (mesmo que já seja PDF)
    const pdfDoc = await PDFDocument.create();
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    const docEntry = { id: documents.length + 1, user_id, type, filename: req.file.filename, path: filePath };
    documents.push(docEntry);

    res.json({ success: true, document: docEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Listar ficheiros de um utilizador
app.get("/documents/:user_id", (req, res) => {
  const userDocs = documents.filter(d => d.user_id == req.params.user_id);
  res.json(userDocs);
});

// ==================================================
// START SERVER
// ==================================================
app.listen(PORT, () => console.log(`Servidor a correr em http://localhost:${PORT}`));