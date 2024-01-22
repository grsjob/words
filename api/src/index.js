const express = require("express");
const axios = require("axios");
const { connectDb } = require("./helpers/db");
const { port, db, authApiUrl } = require("./configuration");
const mongoose = require("mongoose");
const app = express();

const postSchema = new mongoose.Schema({
  name: String,
});

const Post = mongoose.model("Post", postSchema);

const startServer = () => {
  app.listen(port, async () => {
    console.log(`Service api started on port: ${port}`);
    console.log(`DataBase ${db}`);

    const silence = new Post({ name: "Silence" });
    // await silence.save();

    const posts = await Post.find();

    console.log("posts", posts);
  });
};

app.get("/api/test", (req, res) => {
  res.send("Server is working!");
});

app.get("/api/testwithCurrentUser", (req, res) => {
  axios.get(`${authApiUrl}/currentUser`).then((response) => {
    res.json({ testWithCurrentUser: true, currentUserFromAuth: response.data });
  });
});

app.get("/api/testApiData", (req, res) => {
  res.json({
    testWithApi: true,
  });
});

connectDb()
  .on("error", console.log)
  .on("disconnect", connectDb)
  .once("open", startServer);
