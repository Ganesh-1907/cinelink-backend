const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/cinelink';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check first 10 auditions
    const auditions = await db.collection('auditions').find({}).limit(10).toArray();
    console.log('--- Auditions ---');
    auditions.forEach(a => {
      console.log({
        title: a.title,
        directorId: a.directorId,
        postedById: a.postedById,
        directorName: a.directorName,
      });
    });
    
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
