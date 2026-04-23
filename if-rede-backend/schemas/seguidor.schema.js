const mongoose = require('mongoose');

const seguidorSchema = new mongoose.Schema(
  {
    seguidor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    seguido_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'seguidores',
  }
);

seguidorSchema.index({ seguidor_id: 1, seguido_id: 1 }, { unique: true });
seguidorSchema.index({ seguido_id: 1, createdAt: -1 });
seguidorSchema.index({ seguidor_id: 1, createdAt: -1 });

module.exports = seguidorSchema;
