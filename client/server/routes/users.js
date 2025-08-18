const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const questionsService = require('../services/questionsService');
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

    // Get current total questions count
    const totalQuestions = questionsService.getTotalQuestions();
    console.log('Current total questions:', totalQuestions);

    const user = new User({
      sessionId,
      userInfo: { region, age, yearsInRegion },
      progress: {
        totalQuestions // This will be set dynamically
      }
    });

    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);

    res.status(201).json({ 
      sessionId,
      totalQuestions,
      message: 'User session created successfully' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
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

    // Always return current total questions count
    const currentTotalQuestions = questionsService.getTotalQuestions();
    user.progress.totalQuestions = currentTotalQuestions;
    
    // Save the updated total if it changed
    if (user.progress.totalQuestions !== currentTotalQuestions) {
      await user.save();
    }

    console.log('User found:', user._id, 'Total questions:', currentTotalQuestions);
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

    // Ensure we always have the current total questions
    const currentTotalQuestions = questionsService.getTotalQuestions();
    progressData.totalQuestions = currentTotalQuestions;

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

// Get questions info endpoint
router.get('/info/questions', (req, res) => {
  try {
    const totalQuestions = questionsService.getTotalQuestions();
    const questionsData = questionsService.getQuestionsData();
    
    const info = {
      totalQuestions,
      totalCategories: questionsData.length,
      totalSubcategories: questionsData.reduce((sum, cat) => sum + cat.subcategories.length, 0),
      totalTopics: questionsData.reduce((sum, cat) => 
        sum + cat.subcategories.reduce((subSum, sub) => subSum + sub.topics.length, 0), 0)
    };
    
    res.json(info);
  } catch (error) {
    console.error('Error getting questions info:', error);
    res.status(500).json({ error: 'Failed to get questions info' });
  }
});

// Reload questions endpoint (useful for development)
router.post('/admin/reload-questions', (req, res) => {
  try {
    questionsService.reloadQuestions();
    const totalQuestions = questionsService.getTotalQuestions();
    res.json({ 
      message: 'Questions reloaded successfully',
      totalQuestions 
    });
  } catch (error) {
    console.error('Error reloading questions:', error);
    res.status(500).json({ error: 'Failed to reload questions' });
  }
});

module.exports = router;