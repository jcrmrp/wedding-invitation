// Create a file named 'server.js' in your root folder
const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// This is the route your Login.tsx will talk to
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for:", email);
  
  // Later: Add logic to check your database
  res.json({ success: true, message: "Server received your login!" });
});

app.listen(5000, () => console.log("Server running on port 5000"));