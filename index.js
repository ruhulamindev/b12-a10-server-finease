const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = 5000;
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://b12-a10-server-finease:GfkOTZ9cvPhDRbzg@cluster0.ftpnek1.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("b12-a10-server-finease");
    const fineaseCollection = db.collection("finance-all");




    // get request
    app.get("/finance-all", async (req, res) => {
      const result = await fineaseCollection.find().toArray();
      // console.log(result)
      res.send(result);
    });




    // post request
    app.post("/finance-all", async (req, res) => {
      const data = req.body;
      // console.log(data)
      const result = await fineaseCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });




    // get request and detail page api create
    app.get("/finance-all/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id)
      const result = await fineaseCollection.findOne({ _id: new ObjectId(id) });

    res.send({ success: true, result });
    });

    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is runnig fine");
});

app.listen(port, () => {
  console.log(`Surver is listening on port ${port}`);
});
