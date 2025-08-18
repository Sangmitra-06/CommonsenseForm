const mongoose = require('mongoose');
const questionsService = require('../services/questionsService');

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
    totalQuestions: { 
      type: Number, 
      default: function() {
        return questionsService.getTotalQuestions();
      }
    },
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

// Update lastActiveAt and ensure totalQuestions is current on save
userSchema.pre('save', function(next) {
  this.lastActiveAt = new Date();
  
  // Always update totalQuestions to current value
  this.progress.totalQuestions = questionsService.getTotalQuestions();
  
  next();
});

// Static method to get current total questions
userSchema.statics.getCurrentTotalQuestions = function() {
  return questionsService.getTotalQuestions();
};

module.exports = mongoose.model('User', userSchema);