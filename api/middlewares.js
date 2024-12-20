const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const logger = require("./logger.js");

dotenv.config();

const authMiddleware = async (req, res, next) => {
  //splits the header with space as parameter, maps it to an array and then takes the string at 1st index
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    logger.error("Token Problem", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const userDecoded = jwt.verify(token, process.env.JWT_SECRET);
    req.User = userDecoded;
    next();
  } catch (err) {
    logger.error("Error occurred", err);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = jwtMiddleware;
