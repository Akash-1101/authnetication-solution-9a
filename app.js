const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const dbpath = path.join(__dirname, "userData.db");
let db = null;
const initialzServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initialzServer();
app.post("/register", async (request, response) => {
  const personDetails = request.body;
  const { username, name, password, gender, location } = personDetails;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  //   console.log(hashedPassword);
  const selectuserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(selectuserQuery);
  if (dbuser === undefined) {
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO user(username,name,password,gender,location) VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
      const dbresponse = await db.run(createUserQuery);
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectuserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(selectuserQuery);
  if (dbuser === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const ispasswordMatch = await bcrypt.compare(password, dbuser.password);
    if (ispasswordMatch === true) {
      response.send("Login success!");
      response.status = 200;
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectuserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbuser = await db.get(selectuserQuery);
  const ispasswordMatched = await bcrypt.compare(oldPassword, dbuser.password);
  if (ispasswordMatched === true) {
    if (newPassword.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const hashedpassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `UPDATE user SET password='${hashedpassword}' WHERE username='${username}'`;
      await db.run(updatePasswordQuery);
      response.status = 200;
      response.send("Password updated");
    }
  } else {
    response.status = 400;
    response.send("Invalid current password");
  }
});
module.exports = app;
