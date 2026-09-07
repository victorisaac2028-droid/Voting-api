const express = require("express");
const appRouter = require("./router/index/index");
const { CONFIG} = require("./config/env");
const app = express();
const cors = require("cors");
const { WHITE_LIST } = require("./env");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: function(origin, cb){
    if(!origin || WHITE_LIST.includes(origin)){
      return cb(null, true)
    }else {
      return cb(new Error("Not Allowed by CORS"))
    }
  },
  methods: ["POST", "PUT", "DELETE", "PATCH"],
  Credential: true,
}))

const PORT = CONFIG.PORT || 3000;

app.use("/api", appRouter);

app.get("/api/status", (req, res) => {
  res.send("welcome to voting api");
});

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});
