const express = require('express');
const { body, validationResult } = require('express-validator');
const Response = require('../models/Response');
const User = require('../models/User');

const router = express.Router();

// Save response
router.post('/', [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('questionId').notEmpty().withMessage('Question ID is required'),
  body('answer').isLength({ min: 10, max: 5000 }).withMessage('Answer must be between 10 and 5000 characters'),
  body('culturalCommonsense').isBoolean().withMessage('Cultural commonsense must be boolean'),
  body('categoryIndex').isInt({ min: 0 }).withMessage('Category index must be a non-negative integer'),
  body('subcategoryIndex').isInt({ min: 0 }).withMessage('Subcategory index must be a non-negative integer'),
  body('topicIndex').isInt({ min: 0 }).withMessage('Topic index must be a non-negative integer'),
  body('questionIndex').isInt({ min: 0 }).withMessage('Question index must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const responseData = req.body;

    // Check if user session exists
    const user = await User.findOne({ sessionId: responseData.sessionId });
    if (!user) {
      return res.status(404).json({ error: 'User session not found' });
    }

    // Check if response already exists and update, otherwise create new
    let response = await Response.findOneAndUpdate(
      { 
        sessionId: responseData.sessionId, 
        questionId: responseData.questionId 
      },
      responseData,
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    // Update user progress
    await User.findOneAndUpdate(
      { sessionId: responseData.sessionId },
      { 
        $inc: { 'progress.completedQuestions': 1 },
        $set: { lastActiveAt: new Date() }
      }
    );

    res.status(201).json({ 
      message: 'Response saved successfully',
      responseId: response._id 
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - response already exists, just return success
      return res.status(200).json({ message: 'Response already exists' });
    }
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
});

// Get responses for a session
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const responses = await Response.find({ sessionId })
      .sort({ categoryIndex: 1, subcategoryIndex: 1, topicIndex: 1, questionIndex: 1 });

    res.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Save multiple responses (batch save)
router.post('/batch', [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('responses').isArray({ min: 1 }).withMessage('Responses array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, responses } = req.body;

    // Check if user session exists
    const user = await User.findOne({ sessionId });
    if (!user) {
      return res.status(404).json({ error: 'User session not found' });
    }

    // Validate each response
    for (let response of responses) {
      if (!response.questionId || !response.answer || response.answer.length < 10) {
        return res.status(400).json({ error: 'Invalid response data' });
      }
    }

    // Use bulk operations for better performance
    const bulkOps = responses.map(response => ({
      updateOne: {
        filter: { sessionId, questionId: response.questionId },
        update: { ...response, sessionId },
        upsert: true
      }
    }));

    await Response.bulkWrite(bulkOps);

    // Update user progress
    await User.findOneAndUpdate(
      { sessionId },
      { 
        $inc: { 'progress.completedQuestions': responses.length },
        $set: { lastActiveAt: new Date() }
      }
    );

    res.status(201).json({ message: 'Responses saved successfully' });
  } catch (error) {
    console.error('Error saving batch responses:', error);
    res.status(500).json({ error: 'Failed to save responses' });
  }
});

module.exports = router;