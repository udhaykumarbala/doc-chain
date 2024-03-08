const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'files/');
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});
const upload = multer({ storage: storage });
const db = new sqlite3.Database('filedata.db');

// Initialize SQLite database
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, name TEXT, filehash TEXT)");
});

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const fileHash = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');
  const fileId = crypto.randomBytes(16).toString('hex');

  db.run("INSERT INTO files (id, name, filehash) VALUES (?, ?, ?)", [fileId, file.originalname, fileHash], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send({ fileId: fileId });
  });
});

// Verify endpoint
app.get('/verify/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  db.get("SELECT * FROM files WHERE id = ?", [fileId], (err, row) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    if (!row) {
      return res.status(404).send('File not found');
    }

    const fileHash = crypto.createHash('sha256').update(fs.readFileSync(`files/${row.name}`)).digest('hex');
    const isFileIntact = fileHash === row.filehash;
    res.status(200).send({ isFileIntact });
  });
});

// post filehash with id stored in db
app.post('/filehash', (req, res) => {
  //parse body

  const fileHash = req.body.fileHash;
  const fileId = req.body.fileId;

  if (!fileHash || !fileId) {
    return res.status(400).send({ message: "fileHash and fileId required" });
  }
  // insert filehash into db
  db.run("INSERT INTO files (id,name,filehash) VALUES (?,?,?)", [fileId,fileId,fileHash], function(err) {
    if (err) {
      return res.status(500).send({ message: "somethig went wrong" });
    }
    res.status(200).send({ fileId: fileId });
  });
});

// compare filehash with id stored in db
app.post('/compare', (req, res) => {
  const fileHash = req.body.fileHash;
  const fileId = req.body.fileId;

  if (!fileHash || !fileId) {
    return res.status(400).send({ message: "fileHash and fileId required" });
  }

  console.log("fileHash: " + fileHash + " fileId: " + fileId);
  // insert filehash into db
  db.get("SELECT * FROM files WHERE id = ?", [fileId], (err, row) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    if (!row) {
      return res.status(404).send('File not found');
    }
    const isFileIntact = fileHash === row.filehash;
    res.status(200).send({ isFileIntact });
  });
});


app.get('/files', (req, res) => {
  db.all("SELECT * FROM files", (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.status(200).send(rows);
  });
});

// wildcard route
app.get('*', (req, res) => {
  console.log('Wildcard route');
  // log route, method & body to console
  console.log('Route:', req.path);
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  res.status(404).send('OK');

});


const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
