const express = require("express");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");
const mongoclient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const URL = process.env.DB;
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const nodemailer = require("nodemailer");
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD ;


app.use(
  cors({
    orgin:"https://stunning-mandazi-8adbbb.netlify.app"  //"http://localhost:3000",
  })
);

app.use(express.json());

let account = [];

app.post("/user/register", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("password_rest_flow");

    //hash
    var salt = await bcrypt.genSalt(10); //$2b$10$TuImFpJf327l0XDn5.Ropu
    var hash = await bcrypt.hash(req.body.password, salt); //$2b$10$h0vKL1wJUpyhf0Q2EHPbcuzeih1kCX7c891uS70nB5FFjRkBSaDHC
    // console.log(hash);

    req.body.password = hash;

    const user = await db.collection("users").insertOne(req.body);
    await connection.close();
    res.json({ message: "user created" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("password_rest_flow");

    const user = await db
      .collection("users")
      .findOne({ email: req.body.email });
      await connection.close();
    if (user) {
      const compare = await bcrypt.compare(req.body.password, user.password);
      if (compare) {
        const token = jwt.sign({_id:user._id},JWT_SECRET,{expiresIn:"2m"})
        res.json({ message: "Success"});
      } else {
        res.json({ message: "username or password incorrect" });
      }
    }else{
      res.json({ message: "username or password incorrect" });
    }
  } catch (error) {
    res.status(400).json({ message: "Something went wrong" });
  }
});

app.post("/forgot", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("pizza_application");

    const user = await db
      .collection("users")
      .findOne({ email: req.body.email });
    await connection.close();

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    var mailOptions = {
      from: EMAIL,
      to: user.email,
      subject: "Rest Password",
      text: "Hi Raj",
      html: `<h1>Hiii ${user.name} <a href="http://localhost:3000/reset/${user._id}">please click the link and reset your password</a> </h1>`,
    };
    transporter.sendMail(mailOptions, function (error, response) {
      if (error) {
        console.log(error);
        return;
      }
      transporter.close();  
    });
  
      res.json({message:"Message sent"});
   
  } catch (error) {
    res.status(400).send({ sucess: false, msg: error.message });
  }
});

app.post("/reset/:userId", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("pizza_application");

    var salt = await bcrypt.genSalt(10);
    var hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;

    const user = await db
      .collection("users")
      .updateOne(
        { _id: mongodb.ObjectId(req.params.userId) },
        { $set: { password: req.body.password } }
      );
    await connection.close();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: "Something went wrong" });
  }
});

app.listen(process.env.PORT || 3003);
