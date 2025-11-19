import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static('uploads'));

//----- MongoDB Setup -----//

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1 }
});

let db, lessonsCollection, ordersCollection;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("afterSchoolDB");
    lessonsCollection = db.collection("lessons");
    ordersCollection = db.collection("orders");
    console.log("✅ Connected to MongoDB Atlas");

    // Optional: Insert sample lessons if collection is empty
    const count = await lessonsCollection.countDocuments();
    if (count === 0) {
      await lessonsCollection.insertMany([
        { subject: 'Math', location: 'London', price: 100, spaces: 5, icon: 'math.png' },
        { subject: 'English', location: 'Cambridge', price: 80, spaces: 10, icon: 'english.png' },
        { subject: 'Science', location: 'Oxford', price: 90, spaces: 6, icon: 'science.png' },
        { subject: 'Art', location: 'York', price: 95, spaces: 10, icon: 'art.png' },
        { subject: 'Music', location: 'London', price: 85, spaces: 8, icon: 'music.png' },
        { subject: 'Drama', location: 'York', price: 75, spaces: 7, icon: 'drama.png' },
        { subject: 'Coding', location: 'Oxford', price: 110, spaces: 6, icon: 'coding.png' },
        { subject: 'Dance', location: 'Cambridge', price: 70, spaces: 7, icon: 'dance.png' },
        { subject: 'Chess', location: 'Oxford', price: 65, spaces: 6, icon: 'chess.png' },
        { subject: 'Robotics', location: 'London', price: 120, spaces: 5, icon: 'robotics.png' }
      ]);
      console.log("✅ Sample lessons inserted");
    }
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  }
}
connectDB();

// -----Routes------- //

// GET all lessons
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await lessonsCollection.find().toArray();
    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// SEARCH lessons
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || '';
    const lessons = await lessonsCollection.find({
      $or: [
        { subject: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { price: { $regex: query, $options: "i" } },
        { spaces: { $regex: query, $options: "i" } }
      ]
    }).toArray();
    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST new order
app.post('/order', async (req, res) => {
  try {
    const order = req.body;
    await ordersCollection.insertOne(order);
    res.json({ success: true, message: 'Order placed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Order failed' });
  }
});

// PUT update lesson spaces
app.put('/update/:id', async (req, res) => {
  try {
    const lessonId = new ObjectId(req.params.id);
    const { spaces } = req.body;
    await lessonsCollection.updateOne({ _id: lessonId }, { $set: { spaces } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('🎓 After School Classes API is running...');
});

// Start server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
