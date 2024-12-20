const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const user = require("./models/user.js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const logger = require("./logger.js");
const cors = require("cors");
const authRouter = require("./oauth.js");
const requestRouter = require("./request.js");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const cookieParser = require("cookie-parser");
dotenv.config();

const app = express();
//to parse json data
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend's URL
    credentials: true, // Allow cookies or authentication headers
  })
);
app.use(cookieParser());

app.use("/oauth", authRouter);
app.use("/request", requestRouter);

//connect to mongo database
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connection Initiated");
}

app.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const isUserExisting = await user.findOne({ username });
    if (isUserExisting) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10); //2nd argument decides the number of cycles
    const User = new user({
      username,
      password: hashedPassword,
      email,
    });
    await User.save();

    const token = jwt.sign(
      { id: User._id, username: User.username, email: User.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h", //time upto which the token is valid
      }
    );
    res.cookie("jwt_token", token, {
      httpOnly: true, // Makes the cookie inaccessible to JavaScript (helps with XSS protection)
      secure: false, // Set to true in production for HTTPS
      maxAge: 3600000, // 1 hour expiry for the token
      sameSite: "Strict", // Helps with CSRF protection
    });
    res.status(200).json({ message: "Succesful Register", token });
  } catch (err) {
    logger.error("Error occurred on the server side", err);
    res.status(500).json({ message: "Error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const User = await user.findOne({ username });
    console.log("Inside user login");
    if (!User) {
      logger.error(err);
      return res.status(400).json({ message: "Invalid username or password" });
    }
    const isValidPassword = await bcrypt.compare(password, User.password);
    if (!isValidPassword) {
      logger.error(err);
      return res.status(400).json({ message: "Invalid username or password" });
    }
    //creates a token with parameters provided by the user
    const token = jwt.sign(
      { id: User._id, username: User.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.cookie("jwt_token", token, {
      httpOnly: true, // Makes the cookie inaccessible to JavaScript (helps with XSS protection)
      secure: false, // Set to true in production for HTTPS
      maxAge: 3600000, // 1 hour expiry for the token
      sameSite: "Strict", // Helps with CSRF protection
    });
    console.log("Stored the cookie");
    res.status(200).json({ message: "Succesful Register", token });
  } catch (err) {
    logger.error("Error occurred on the server side", err);
    res.status(500).json({ message: "Error" });
  }
});

const jwtMiddleware = async (req, res, next) => {
  //splits the header with space as parameter, maps it to an array and then takes the string at 1st index
  try {
    if (req.cookies.jwt_token) {
      let token = req.cookies.jwt_token; // Get JWT token from header
      try {
        const userDecoded = jwt.verify(token, process.env.JWT_SECRET);
        req.User = userDecoded;
        return next();
      } catch (err) {
        console.log("Error in jwt verification", err);
        res.status(400).json({ message: "Error" });
      }
    } else if (req.cookies.id_token) {
      let token = req.cookies.id_token;
      try {
        console.log("Inside the google authorization route");
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID, // Specify your client ID here
        });

        const payload = ticket.getPayload();
        // console.log(payload);
        req.User = payload; // Attach the Google user payload to the request
        return next();
      } catch (err) {
        console.log("Error in google verification", err);
        res.status(400).json({ message: "Error" });
      }
    }
  } catch (err) {
    console.log("Error in middleware", err);
    res.status(500).json({ message: "Error" });
  }
};

app.post("/verifyToken", jwtMiddleware, async (req, res) => {
  if (req.cookies.id_token) {
    try {
      const userId = req.User.sub;
      const User = await user.findOne({ googleId: userId });
      if (!User) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Sending the user to the front", User);
      res.status(200).json({ message: "Token is valid", User });
    } catch (err) {
      console.log("Verify error for google token", err);
      res.status(400).json({ message: "Error google" });
    }
  } else if (req.cookies.jwt_token) {
    try {
      const userId = req.User.id;
      const User = await user.findById(userId);
      if (!User) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Sending the user to the front", User);
      res.status(200).json({ message: "Token is valid", User });
    } catch (err) {
      console.log("Verify error for jwt token", err);
      res.status(400).json({ message: "Error jwt" });
    }
  }
});

app.get("/user", jwtMiddleware, async (req, res) => {
  try {
    const userId = req.User.id;

    if (!userId) {
      return res.status(400).json({ message: "Please Login/Signup" });
    }

    const userData = await user.findById(userId).select("username"); // Fetch username and email
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(userData);
  } catch (err) {
    logger.error("Error fetching user data", err);
    res.status(500).json({ message: "Error" });
  }
});

app.put("/edit", jwtMiddleware, async (req, res) => {
  try {
    const userId = req.User.id;
    const { username, password } = req.body;
    if (!userId) {
      logger.error("Auth error", err);
      return res.status(400).json({ message: "Please Login/Signup" });
    }
    const updatedFields = {};
    if (username) {
      updatedFields.username = username;
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.password = hashedPassword;
    }
    const updatedUser = await user.findByIdAndUpdate(userId, updatedFields, {
      new: true,
      runValidators: true,
    });
    res.status(200).json(updatedUser);
  } catch (err) {
    logger.error("Error occurred on the server side", err);
    res.status(500).json({ message: "Error" });
  }
});

app.delete("/delete", jwtMiddleware, async (req, res) => {
  try {
    const userId = req.User.id;
    const deletedUser = await user.findByIdAndDelete(userId);
    res.status(200).json(deletedUser);
  } catch (err) {
    logger.error("Error occurred on the server side", err);

    res.status(500).json({ message: "Error" });
  }
});

app.get("/sortedUsers", async (req, res) => {
  try {
    let { sortBy = "username", order = "ascending" } = req.query;
    if (order == "descending") {
      order = -1;
    } else {
      order = 1;
    }
    let sortedUsers = await user.find().sort({ [sortBy]: order });
    res.status(200).json(sortedUsers);
  } catch (err) {
    logger.error("Couldn't find users", err);
    res.status(500).json({ message: "Error" });
  }
});

app.listen("5000", () => {
  console.log("server is running on port 5000");
});
