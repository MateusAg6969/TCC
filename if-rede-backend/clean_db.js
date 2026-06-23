require('dotenv').config();
const mongoose = require('mongoose');

async function cleanDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    
    // Preservar dinamicamente usuários administradores
    const adminUsers = await db.collection('usuarios').find({
      $or: [
        { 'configuracoes.mod_voluntario': true },
        { 'perfil.nome': /admin/i },
        { 'perfil.nome': /antigravity/i }
      ]
    }).toArray();

    const keepIds = adminUsers.map(user => user._id);
    
    console.log(`Preservando ${keepIds.length} usuários (Administradores/Moderadores)`);

    // 1. Delete Users (exceto admins)
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

    // 7. Delete Followers
    const followersResult = await db.collection('seguidores').deleteMany({});
    console.log(`Deleted ${followersResult.deletedCount || 0} follower relationships.`);

    // 8. Delete Portfolio
    const portfolioResult = await db.collection('portfolioitems').deleteMany({});
    console.log(`Deleted ${portfolioResult.deletedCount || 0} portfolio items.`);

    // 9. Clean followers/following for kept users
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
