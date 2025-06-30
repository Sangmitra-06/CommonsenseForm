const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userInfo: {
    region: {
      type: String,
      required: true,
      enum: ['North', 'South', 'East', 'West', 'Central']
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120
    },
    yearsInRegion: {
      type: Number,
      required: true,
      min: 0
    }
  },
  progress: {
    currentCategory: { type: Number, default: 0 },
    currentSubcategory: { type: Number, default: 0 },
    currentTopic: { type: Number, default: 0 },
    currentQuestion: { type: Number, default: 0 },
    completedQuestions: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 585 }, // 39 topics × 15 questions
    completedTopics: [String],
    attentionChecksPassed: { type: Number, default: 0 },
    attentionChecksFailed: { type: Number, default: 0 }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ sessionId: 1, lastActiveAt: -1 });

// Update lastActiveAt on save
userSchema.pre('save', function(next) {
  this.lastActiveAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);