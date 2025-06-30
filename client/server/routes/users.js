const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Create new user session
router.post('/create', [
  body('region').isIn(['North', 'South', 'East', 'West', 'Central']).withMessage('Invalid region'),
  body('age').isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('yearsInRegion').isInt({ min: 0 }).withMessage('Years in region must be a positive number')
], async (req, res) => {
  try {
    console.log('Received user creation request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { region, age, yearsInRegion } = req.body;
    const sessionId = uuidv4();

    console.log('Creating user with sessionId:', sessionId);

    const user = new User({
      sessionId,
      userInfo: { region, age, yearsInRegion }
    });

    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);

    res.status(201).json({ 
      sessionId,
      message: 'User session created successfully' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Session ID already exists. Please try again.' });
    }
    
    res.status(500).json({ 
      error: 'Failed to create user session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user progress
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('Fetching user with sessionId:', sessionId);
    
    const user = await User.findOne({ sessionId });
    if (!user) {
      console.log('User not found for sessionId:', sessionId);
      return res.status(404).json({ error: 'User session not found' });
    }

    console.log('User found:', user._id);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user progress
router.put('/:sessionId/progress', [
  body('currentCategory').isInt({ min: 0 }),
  body('currentSubcategory').isInt({ min: 0 }),
  body('currentTopic').isInt({ min: 0 }),
  body('currentQuestion').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;
    const progressData = req.body;

    console.log('Updating progress for sessionId:', sessionId, progressData);

    const user = await User.findOneAndUpdate(
      { sessionId },
      { 
        $set: { 
          progress: { ...progressData },
          lastActiveAt: new Date()
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User session not found' });
    }

    console.log('Progress updated successfully');
    res.json({ message: 'Progress updated successfully', progress: user.progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ 
      error: 'Failed to update progress',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mark user as completed
router.put('/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log('Marking survey as completed for sessionId:', sessionId);

    const user = await User.findOneAndUpdate(
      { sessionId },
      { 
        $set: { 
          isCompleted: true,
          lastActiveAt: new Date()
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User session not found' });
    }

    console.log('Survey marked as completed');
    res.json({ message: 'Survey completed successfully' });
  } catch (error) {
    console.error('Error completing survey:', error);
    res.status(500).json({ 
      error: 'Failed to complete survey',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;