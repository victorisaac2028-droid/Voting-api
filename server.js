const express = require("express");
const appRouter = require("./router/index");
const { CONFIG} = require("./config/env");
const app = express();
const cors = require("cors");
const { WHITE_LIST } = require("./config/env");
const dbconnection = require("./config/database");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    "http://localhost:5500",
    // "http://127.0.0.1:5500"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));

const PORT = CONFIG.PORT || 3000;

app.use("/api", appRouter);

app.get("/api/status", (req, res) => {
  res.send("welcome to voting api");
});

app.listen(PORT, async() => {
  await dbconnection.connectMONGODB();
  console.log(`server is running on ${PORT}`);
});
