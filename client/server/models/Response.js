const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  questionId: {
    type: String,
    required: true
  },
  categoryIndex: {
    type: Number,
    required: true
  },
  subcategoryIndex: {
    type: Number,
    required: true
  },
  topicIndex: {
    type: Number,
    required: true
  },
  questionIndex: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 5000
  },
  culturalCommonsense: {
    type: Boolean,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  isAttentionCheck: {
    type: Boolean,
    default: false
  },
  attentionCheckCorrect: {
    type: Boolean,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
responseSchema.index({ 
  sessionId: 1, 
  categoryIndex: 1, 
  subcategoryIndex: 1, 
  topicIndex: 1, 
  questionIndex: 1 
});

// Prevent duplicate responses
responseSchema.index({ 
  sessionId: 1, 
  questionId: 1 
}, { unique: true });

module.exports = mongoose.model('Response', responseSchema);