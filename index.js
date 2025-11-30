const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB connection
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

    // ----------------------------------------------------------------------
    // Optional: Convert old string amounts to numbers
    await fineaseCollection.updateMany({ amount: { $type: "string" } }, [
      { $set: { amount: { $toDouble: "$amount" } } },
    ]);

    // ---------------------------------------------------------------------
    // GET all transactions
    app.get("/finance-all", async (req, res) => {
      const { sortBy, order } = req.query;
      let sortOption = {};

      if (sortBy === "date") {
        sortOption = { date: order === "asc" ? 1 : -1 };
      } else if (sortBy === "amount") {
        sortOption = { amount: order === "asc" ? 1 : -1 };
      } else {
        sortOption = { createdAt: -1 };
      }

      const result = await fineaseCollection.find().sort(sortOption).toArray();
      // console.log(result)
      res.send(result);
    });

    // ---------------------------------------------------------------------

    // POST a new transaction
    app.post("/finance-all", async (req, res) => {
      const data = req.body;
      // console.log(data)

      // Convert amount to number
      if (data.amount) data.amount = Number(data.amount);
      data.createdAt = new Date();

      const result = await fineaseCollection.insertOne(data);
      res.send({
        success: true,
        result,
      });
    });

    // ---------------------------------------------------------------------
    // GET transaction details + total amount (same category & type)
    app.get("/finance-all/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id)
      const result = await fineaseCollection.findOne({ _id: new ObjectId(id) });
      if (!result) {
        return res.send({ success: false, message: "Not found" });
      }

      // Calculate total amount for same category & type
      const total = await fineaseCollection
        .aggregate([
          {
            $match: {
              email: result.email,
              category: result.category,
              type: result.type,
            },
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" },
            },
          },
        ])
        .toArray();

      const totalAmount = total[0]?.totalAmount || 0;

      res.send({ success: true, result, totalAmount });
    });

    // ---------------------------------------------------------------------
    // UPDATE transaction
    app.put("/finance-all/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id);
      const data = req.body;

      // Convert amount to number
      if (data.amount) {
        data.amount = Number(data.amount);
      }
      // const objectId = new ObjectId(id);
      const filter = { _id: new ObjectId(id) };
      const update = {
        $set: data,
      };
      const result = await fineaseCollection.updateOne(filter, update);

      res.send({
        success: true,
        result,
      });
    });

    // ---------------------------------------------------------------------
    // DELETE transaction
    app.delete("/finance-all/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id)
      // const objectId = new ObjectId(id);
      // const filter = { _id: objectId };
      const result = await fineaseCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send({
        success: true,
        result,
      });
    });

    // ---------------------------------------------------------------------
    // GET /overview
    app.get("/overview", async (req, res) => {
      try {
        const email = req.query.email;
        const matchQuery = email ? { email } : {};

        const allTransactions = await fineaseCollection
          .find(matchQuery)
          .toArray();

        let totalIncome = 0;
        let totalExpense = 0;

        allTransactions.forEach((item) => {
          if (item.type === "Income") totalIncome += item.amount;
          if (item.type === "Expense") totalExpense += item.amount;
        });

        const totalBalance = totalIncome + totalExpense;

        res.send({
          success: true,
          totalBalance,
          totalIncome,
          totalExpense,
        });
      } catch (err) {
        res.status(500).send({ success: false, message: err.message });
      }
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
