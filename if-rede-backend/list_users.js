require('dotenv').config();
const mongoose = require('mongoose');

async function listUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  // We don't need the full models, we can just use connection.db
  const users = await mongoose.connection.db.collection('usuarios').find({}, { projection: { 'perfil.nome': 1, email: 1 } }).toArray();
  console.log('Users in DB:');
  users.forEach(u => console.log(`- ${u.perfil?.nome} (${u.email}) [ID: ${u._id}]`));
  
  process.exit(0);
}

listUsers().catch(console.error);
