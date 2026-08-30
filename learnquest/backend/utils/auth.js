const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "learnquest_dev_secret_change_me";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function requireAuth(role) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing auth token" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (role && decoded.role !== role) {
        return res.status(403).json({ error: `Requires ${role} role` });
      }
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

module.exports = { signToken, requireAuth };
