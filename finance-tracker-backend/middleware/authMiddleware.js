const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  // Expecting: Authorization: Bearer <token>
  const authHeader = req.headers["authorization"];
  console.log("🔐 authHeader:", authHeader);
  console.log("🔐 JWT_SECRET present?:", !!process.env.JWT_SECRET);
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Malformed token" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // We set the user id on the request for later use
    req.user = { id: decoded.id };
 // matches what you put in jwt.sign({ id: user.id }, ...)
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
