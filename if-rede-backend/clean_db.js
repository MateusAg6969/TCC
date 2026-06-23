require('dotenv').config();
const mongoose = require('mongoose');

async function cleanDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    
    // IDs to keep: Antigravity and Administrador IF REDE
    const keepIds = [
      new mongoose.Types.ObjectId('6a38b6aa9248145417e45514'), // Antigravity
      new mongoose.Types.ObjectId('6a3577046c9ff41e2e0574f4')  // Administrador IF REDE
    ];

    // 1. Delete Users
    const userResult = await db.collection('usuarios').deleteMany({
      _id: { $nin: keepIds }
    });
    console.log(`Deleted ${userResult.deletedCount} users.`);

    // 2. Delete Posts
    const postResult = await db.collection('postagens').deleteMany({});
    console.log(`Deleted ${postResult.deletedCount} posts.`);

    // 3. Delete Comments
    const commentResult = await db.collection('comentarios').deleteMany({});
    console.log(`Deleted ${commentResult.deletedCount} comments.`);

    // 4. Delete Notifications
    const notifResult = await db.collection('notificacoes').deleteMany({});
    console.log(`Deleted ${notifResult.deletedCount} notifications.`);

    // 5. Delete Reposts
    const repostResult = await db.collection('reposts').deleteMany({});
    console.log(`Deleted ${repostResult.deletedCount || 0} reposts.`);

    // 6. Delete Reports
    const reportResult = await db.collection('denuncias').deleteMany({});
    console.log(`Deleted ${reportResult.deletedCount || 0} reports.`);

    // 7. Clean followers/following for kept users
    await db.collection('usuarios').updateMany(
      { _id: { $in: keepIds } },
      { 
        $set: { 
          seguidores: [], 
          seguindo: [],
          'stats.total_seguidores': 0,
          'stats.total_postagens': 0
        } 
      }
    );
    console.log('Cleaned followers/following data for kept users.');

    console.log('Database cleaned successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanDB();
