const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.userData = null;
    return next();
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(authHeader, process.env.JWT_SECRET);
    req.userData = decodedToken;
  } catch (err) {
    req.userData = null;
    return next();
  }

  if (!decodedToken) {
    req.userData = null;
    return next();
  }

  console.log(`\nDecodedToken: `, req.userData);
  next();
};
