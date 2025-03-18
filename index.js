const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// PARSER
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const access_token_secret = process.env.ACCESS_TOKEN_SECRET;

// Middlewares
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "Unauthorized Access" });

  jwt.verify(token, access_token_secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }

    req.user = decoded;
    console.log(
      "-------------------------User Decoded Successfully------------------------"
    );
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.88ffpvi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const database = client.db("express_js_DB");
const peopleCollection = database.collection("peoples");
const insertedPeopleCollection = database.collection("inserted_peoples");
const userCollection = database.collection("users");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // JWT Related API
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, access_token_secret, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ status: true });
    });

    // GET API
    app.get("/peoples", async (req, res) => {
      const result = await peopleCollection.find().toArray();
      res.send(result);
    });

    app.get("/inserted-peoples", verifyToken, async (req, res) => {
      const queryEmail = req.query?.email;
      const tokenEmail = req?.user?.email;
      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "Forbidden" });
      }

      let query = {};
      if (queryEmail) {
        query = { email: queryEmail };
      }

      try {
        const result = await insertedPeopleCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/inserted-peoples/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await insertedPeopleCollection.findOne(query);
      res.send(user);
    });

    // POST API
    app.post("/peoples", async (req, res) => {
      const people = req.body;

      const result = await insertedPeopleCollection.insertOne(people);

      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log("Users ------------>", user);
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // UPDATE API
    app.put("/inserted-peoples/:id", async (req, res) => {
      const id = req.params.id;
      const people = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedPeople = {
        $set: {
          ...people,
        },
      };
      const result = await insertedPeopleCollection.updateOne(
        filter,
        updatedPeople,
        options
      );
      res.send(result);
    });

    // DELETE API
    app.delete("/inserted-peoples/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("Delete API", id);
      const query = { _id: new ObjectId(id) };
      const result = await insertedPeopleCollection.deleteOne(query);
      // console.log("Result", result);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.log);

app.get("/", (req, res) => {
  res.send("Express Js Recap is Running");
});

app.listen(port, () => {
  console.log(`Express JS Recap is listening on port : ${port}`);
});
