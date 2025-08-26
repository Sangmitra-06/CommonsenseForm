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
    minlength: 4,
    maxlength: 5000
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  isAttentionCheck: {
    type: Boolean,
    default: false
  },
  attentionCheckType: {
    type: String,
    enum: ['context', 'comprehension', 'basic', 'instruction', 'personal'],
    required: false
  },
  expectedAnswer: {
    type: String,
    required: false
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

responseSchema.index({ isAttentionCheck: 1 }); // For filtering attention checks

module.exports = mongoose.model('Response', responseSchema);