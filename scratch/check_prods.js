const mongoose = require('./backend/node_modules/mongoose');
const dotenv = require('./backend/node_modules/dotenv');
dotenv.config({ path: './backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = require('./backend/models/Product');
  const prods = await Product.find({
    name: {
      $in: [
        /Noir Essence/i,
        /Sony WH-1000XM5/i,
        /Voltas 1.5 Ton/i,
        /Havells Meditate/i
      ]
    }
  }).select('name image images category').lean();
  console.log(JSON.stringify(prods, null, 2));
  process.exit(0);
}
check();
