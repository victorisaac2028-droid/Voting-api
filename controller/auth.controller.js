const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const { buildRes } = require("../utils/builder");
const filePath = path.join(__dirname, "../", "accounts.json");
const jwt = require("jsonwebtoken");
const { CONFIG } = require("../config/env");
const { error } = require("console");
const { type } = require("os");
const register = (req, res) => {
  try {
    const email = req.body.email;
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const password = req.body.password;

    // Required fields
    if (!email) throw new Error("Email is required");
    if (!firstname) throw new Error("Firstname is required");
    if (!lastname) throw new Error("Lastname is required");
    if (!password) throw new Error("Password is required");

    // Email validation
    if (!email.includes("@")) {
      throw new Error("Email is invalid");
    }

    // Name validation
    if (!isNaN(firstname)) {
      throw new Error("Firstname should contain characters");
    }

    if (firstname.length < 3) {
      throw new Error("Firstname must be at least 3 characters");
    }

    if (firstname.length > 30) {
      throw new Error("Firstname cannot exceed 30 characters");
    }

    if (!isNaN(lastname)) {
      throw new Error("Lastname should contain characters");
    }

    if (lastname.length < 3) {
      throw new Error("Lastname must be at least 3 characters");
    }

    if (lastname.length > 30) {
      throw new Error("Lastname cannot exceed 30 characters");
    }

    // Password validation
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    if (password.length > 15)
      throw new Error("Pasword can not exceed 15 characters");

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = {
      id: Math.floor(Math.random() * 1000000),
      email,
      firstname,
      lastname,
      password: hashedPassword,
    };
    // check if file exist

    if (fs.existsSync(filePath)) {
      const readData = fs.readFileSync(filePath, "utf-8");
      const objdata = JSON.parse(readData);
      const emailExist = objdata.find(
        (x) => x.email.toLowerCase() === email.toLowerCase(),
      );
      if (emailExist)
        return res.status(400).json({ error: "Email already exist" });
      objdata.push(user);
      const save = fs.writeFileSync(filePath, JSON.stringify(objdata), "utf-8");
      if (save) throw new Error(save);
    } else {
      const save = fs.writeFileSync(filePath, JSON.stringify([user]), "utf-8");
      if (save) throw new Error(save);
    }

    const responseUser = buildRes(user);
    res.status(201).json({
      msg: "Registration successful",
      data: responseUser,
    });
  } catch (error) {
    res.status(400).json({
      error: error.msg || "An error occurred",
    });
  }
};
const readFile = (filePath) => {
  let data;
  if (fs.existsSync(filePath)) {
    data = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(data);

    if (data.length === 0) throw new Error("No record found");
  }
  return data;
};
// for login
const login = (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    // email validation

    if (!email) throw new Error("email is required");
    if (!password) throw new Error("Password is required");

    if (email.length < 2) throw new Error("email must be at least 3 character");
    if (email.length > 30) throw new Error("email cannot exceed 30 character");

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    let token = req?.cookies?.VoTin_ex;
    if (!token) token = req.headers?.authorization?.split(" ")[1];
    if (!token) token = req.headers?.cookie?.split("=")[1];
    if (token) {
      return res.status(401).json({ msg: "You are already logged in" });
    }

    const data = readFile(filePath);
    if (!data) throw new Error("No record found");
    const userExist = data.find(
      (x) => x.email.toLowerCase() === email.toLowerCase(),
    );
    const others = data.filter(
      (x) => x.email.toLowerCase() === email.toLowerCase(),
    );

    if (!userExist) throw new Error("account does not exixt");
    if (!bcrypt.compareSync(password, userExist.password))
      throw new Error("incorrect password");
    // read accounts
    const readData = fs.readFileSync(filePath, "utf-8");
    const objdata = JSON.parse(readData);
    // to find user
    const emailExist = objdata.find(
      (x) => x.email.toLowerCase() === email.toLowerCase(),
    );
    if (!emailExist) {
      throw new Error("Account does not exist");
    }

    const payload = {
      id: userExist.id,
      email,
      userType: userExist.type,
    };
    const userData = buildRes(userExist);
    // sign access token
    const accessToken = jwt.sign(payload, CONFIG.ACCESS_TOKEN_SECRET, {
      expiresIn: "1m",
    });
    const refreshToken = jwt.sign(payload, CONFIG.REFRESH_TOKEN_SECRET, {
      expiresIn: "2m",
    });
    userExist.refreshToken = refreshToken;
    others.push(userExist);

    const save = fs.writeFileSync(filePath, JSON.stringify(others), "utf-8");

    res.clearCookie("VoTin_ex");
    res.cookie("VoTin_ex", accessToken, {
      htttponly: false,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 1000,
    });
    const responseUser = buildRes(emailExist);
    res.status(200).json({
      msg: "login successful",
      data: responseUser,
      data: userData,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "an error occured" });
  }
};

const check = (req, res) => {
  try {
    let token = req?.cookies?.VoTin_ex;
    if (!token) token = req.headers?.authorization?.split(" ")[1];
    if (!token) token = req.headers?.cookie?.split("=")[1];
    if (!token) throw new Error("You have to Login")
console.log(token)
    const data = readFile(filePath);
    if (!data) throw new Error("No record found");
    const verify = jwt.verify(token, CONFIG.ACCESS_TOKEN_SECRET);
    const userExist = data.find((x) => x.id === verify.id);

    if (!userExist.refreshToken) {
      return res.status(401).json({ error: "Please login" });
    }

    res.status(200).json({ message: "Check Successful" });
  } catch (error) {
    if (error.name === "TokenExpireError" || error.message === "You have to Login first"){

      // res.clearCookie("VoTin_ex")
      return res
        .status(401)
        .json({ msg: "Acess token expired, Generate new token" });
  }

  res.status(400).json({ error: error.message || "an error occured" });
   }
};
// for forgot password
const forgotPassword = (req, res) => {
  try {
    const email = req.body.email;

    // required field
    if (!email) throw new Error("Email is required");

    // email validation
    if (!email.includes("@") || !email.includes(".")) {
      throw new Error("Email is invalid");
    }

    res.status(200).json({
      msg: "Password reset link has been sent to your email",
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || "An error occurred",
    });
  }
};
const getAccounts = (req, res) => {
  try {
    const { search } = req.query;
    const resData = [];

    if (fs.existsSync(filePath)) {
      let data = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(data);
      if (data.length === 0)
        return res.status(404).json({ error: "No error found" });

      if (search) {
        const findUser = data.find(
          (x) =>
            x.email.toLowerCase() === search.toLowerCase() ||
            x.firstname.toLowerCase() === search.toLowerCase() ||
            x.lastname.toLowerCase() === search.toLowerCase(),
        );
        if (!findUser) throw new Error("No record found");
        const found = buildRes(findUser);
        return res.status(200).json({ message: "found", data: found });
      }
      //   const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      data.forEach((cur) => {
        resData.push(buildRes(cur));
      });
      res.status(200).json({ message: "Found", data: resData });
    } else {
      res.status(404).json({ error: "no account exist" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message || "an error occured" });
  }
};

const removeAccount = (req, res) => {
  try {
    const email = req.params.email || req.query.search;

    if (!email) throw new Error("Email is required");
    if (!email.includes("@")) throw new Error("invalid email");

    // check if file exist
    if (fs.existsSync(filePath)) {
      let data = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(data);

      if (data.length === 0) {
        return res.status(404).json({ error: "No record found" });
      }

      const userExist = data.find(
        (x) => x.email.toLowerCase() === email.toLowerCase(),
      );

      if (!userExist) throw new Error("User does not exist");

      const others = data.filter(
        (x) => x.email.toLowerCase() !== email.toLowerCase(),
      );

      const save = fs.writeFileSync(filePath, JSON.stringify(others), "utf-8");

      if (save) throw new Error(save);

      return res.status(200).json({
        message: "Account deleted successfully",
      });
    } else {
      res.status(404).json({ error: "No account exists" });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message || "an error occurred",
    });
  }
};
const logOut = (req, res) => {
  try {
    let token = req?.cookies?.VoTin_ex;
    if (!token) token = req.headers?.authorization?.split("")[1];
    if (!token) token = req.headers?.cookie?.split("=")[1];

    if (!token)
      return res.status(401).json({ msg: "You are not logged in" });
    const verify = jwt.verify(token, CONFIG.ACCESS_TOKEN_SECRET);
    if (!verify) return res.status(401).json({ msg: "Generate new token" });

    const data = readFile(filePath);
    if (!data) throw new Error("No record found");
    const userExist = data.find(
      (x) => x.email.toLowerCase() === verify.email.toLowerCase(),
    );
    const others = data.filter(
      (x) => x.email.toLowerCase() === verify.email.toLowerCase(),
    );

    if (userExist?.refreshToken) {
      delete userExist.refreshToken;
      others.push(userExist);

      const save = fs.writeFileSync(filePath, JSON.stringify(others), "utf-8");
      if (save) throw new Error(save);
      res.clearCookie("VoTin_ex");
    } else throw new Error({ msg: "You have to log in first......." });
    console.log(verify);
    res.clearCookie("VoTin_ex");
    return res.status(200).json({ msg: "logged out successfully" });
  } catch (error) {
    if (error.name === "TokenExpireError")
      return res
        .status(401)
        .json({ msg: "Acess token expired, Generate new token" });
    res.status(400).json({ error: error.message || "an error occured" });
  }
};
const refreshToken = async (req, res) => {
  try {
    let token = req?.cookies?.VoTin_ex;
    if (!token) token = req.headers?.authorization?.split("")[1];
    if (!token) token = req.headers?.cookie?.split("=")[1];
    const { refreshToken } = req.body;

    if (!refreshToken)
      return res.status(401).json({ message: "Refersh Token is required" });

    const data = readFile(filePath);
    if (!data) throw new Error("No record found");

    const userExist = data.find((x) => x.refreshToken === refreshToken);
    let others = data.filter((x) => refreshToken !== refreshToken);
    console.log(userExist);
    if (!userExist) {
      const check = jwt.decode(refreshToken, CONFIG.REFRESH_TOKEN_SECRET);
      const findUser = data.find((x) => x.id === check.id);
      others = data.filter((x) => x.id !== check.id);
      if (findUser) {
        delete findUser.refreshToken;
        others.push(findUser);
        const save = fs.writeFileSync(
          filePath,
          JSON.stringify(others),
          "utf-8",
        );
        if (save) throw new Error(save);
      }
      res.clearCookie("VoTin_ex");
      return res.status(401).json({ error: "Token Reuse detected" });
    } else {
      jwt.verify(
        refreshToken,
        CONFIG.REFRESH_TOKEN_SECRET,
        async (err, decode) => {
          if (err) {
            delete userExist.refreshToken;
            others.push(userExist);
            const save = fs.writeFileSync(
              filePath,
              JSON.stringify(others),
              "utf-8",
            );
            if (save) throw new Error(save);
          }
          return res.status(401).json({ error: "Please login" });
        },
      );
      const payload = {
        id: userExist.id,
        email: user.email,
        type: userExist.type,
      };
      const accessToken = jwt.sign(payload, CONFIG.ACCESS_TOKEN_SECRET, {
        expiresIn: "1m",
      });
      res.clearCookie("VoTin_ex");
      res.cookie("VoTin_ex", accessToken, {
        htttponly: false,
        secure: true,
        sameSite: "none",
      });
      res.status(200).json({
        message: "Access token generated successfully",
        token: accessToken,
      });
    }
  } catch (error) {
    if (error.name === "TokenExpireError")
      return res
        .status(401)
        .json({ msg: "Acess token expired, Generate new token" });
    res.status(400).json({ error: error.message || "an error occured" });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  getAccounts,
  logOut,
  removeAccount,
  refreshToken,
  check,
};
