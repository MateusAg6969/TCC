const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token: { 
    type: String, 
    required: true, 
    unique: true 
  },
  expiraEm: { 
    type: Date, 
    required: true 
  }
});

// Índice TTL: o documento será excluído automaticamente após a data armazenada em expiraEm
tokenBlacklistSchema.index({ expiraEm: 1 }, { expireAfterSeconds: 0 });

module.exports = tokenBlacklistSchema;
