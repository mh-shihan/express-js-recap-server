const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// parser
app.use(cors());
app.use(express.json());

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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // GET API
    app.get("/peoples", async (req, res) => {
      const result = await peopleCollection.find().toArray();
      console.log(result);

      res.send(result);
    });

    app.get("/inserted-peoples", async (req, res) => {
      const result = await insertedPeopleCollection.find().toArray();
      res.send(result);
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
      console.log("Delete API", id);
      const query = { _id: new ObjectId(id) };
      const result = await insertedPeopleCollection.deleteOne(query);
      console.log("Result", result);
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
