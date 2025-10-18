const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const questionsService = require('../services/questionsService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// REMOVED: Check Prolific ID route - no longer needed
// router.get('/check-prolific-id/:prolificId', ...) has been removed

// Create new user session
router.post('/create', [
  body('prolificId').isLength({ min: 24, max: 24 }).withMessage('Prolific ID must be exactly 24 characters')
    .matches(/^[a-zA-Z0-9]+$/).withMessage('Prolific ID can only contain letters and numbers'),
  body('region').isIn(['North', 'South', 'East', 'West', 'Central']).withMessage('Invalid region'),
  body('age').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('yearsInRegion').isInt({ min: 0 }).withMessage('Years in region must be a positive number')
], async (req, res) => {
  try {
    console.log('Received user creation request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { prolificId, region, age, yearsInRegion } = req.body;

    // REMOVED: Duplicate Prolific ID check
    // The following code has been commented out to allow duplicate Prolific IDs
    /*
    const existingUser = await User.findOne({ 'userInfo.prolificId': prolificId });
    if (existingUser) {
      console.log('Duplicate Prolific ID detected:', prolificId);
      return res.status(400).json({ 
        error: 'This Prolific ID has already been used. Each participant can only complete the survey once.' 
      });
    }
    */

    const sessionId = uuidv4();
    const startTime = new Date(); // Record start time

    console.log('Creating user with sessionId:', sessionId);
    console.log('Survey started at:', startTime.toISOString());

    // Get current total questions count
    const totalQuestions = questionsService.getTotalQuestions();
    console.log('Current total questions:', totalQuestions);

    const user = new User({
      sessionId,
      userInfo: { prolificId, region, age, yearsInRegion },
      progress: {
        totalQuestions
      },
      // Initialize timing
      timing: {
        startedAt: startTime,
        completedAt: null,
        totalTimeSeconds: null,
        totalTimeFormatted: null
      }
    });

    const savedUser = await user.save();
    console.log('User saved successfully:', savedUser._id);

    res.status(201).json({ 
      sessionId,
      userInfo: savedUser.userInfo,
      totalQuestions,
      startTime: startTime.toISOString(), // Send start time to frontend
      message: 'User session created successfully' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // MODIFIED: Removed the duplicate Prolific ID error handling
    if (error.code === 11000) {
      // Only handle other duplicate key errors (like sessionId)
      if (error.keyPattern && !error.keyPattern['userInfo.prolificId']) {
        return res.status(400).json({ error: 'Session ID already exists. Please try again.' });
      }
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
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
    const { reason } = req.body;

    console.log('Marking survey as completed for sessionId:', sessionId, 'Reason:', reason);

    // Get the user first to calculate timing
    const user = await User.findOne({ sessionId });
    if (!user) {
      return res.status(404).json({ error: 'User session not found' });
    }

    const completionTime = new Date();
    const startTime = user.timing?.startedAt || user.createdAt;
    const totalTimeMs = completionTime - startTime;
    const totalTimeSeconds = Math.floor(totalTimeMs / 1000);
    
    // Format time as human readable
    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
      
      return parts.join(' ');
    };

    const updateData = { 
      isCompleted: true,
      lastActiveAt: completionTime,
      completedAt: completionTime,
      // Update timing fields
      'timing.completedAt': completionTime,
      'timing.totalTimeSeconds': totalTimeSeconds,
      'timing.totalTimeFormatted': formatTime(totalTimeSeconds)
    };

    // Set completion reason
    if (reason && ['completed', 'attention_check_failed', 'time_expired'].includes(reason)) {
      updateData.completionReason = reason;
    } else {
      updateData.completionReason = 'completed';
    }

    const updatedUser = await User.findOneAndUpdate(
      { sessionId },
      { $set: updateData },
      { new: true }
    );

    console.log(`Survey completed in ${formatTime(totalTimeSeconds)} (${totalTimeSeconds}s) - Reason: ${updateData.completionReason}`);
    
    res.json({ 
      message: 'Survey completed successfully',
      completionReason: updateData.completionReason,
      totalTime: {
        seconds: totalTimeSeconds,
        formatted: formatTime(totalTimeSeconds)
      }
    });
  } catch (error) {
    console.error('Error completing survey:', error);
    res.status(500).json({ 
      error: 'Failed to complete survey',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get timing statistics
router.get('/admin/timing-stats', async (req, res) => {
  try {
    const completedUsers = await User.find({ 
      isCompleted: true,
      'timing.totalTimeSeconds': { $exists: true, $ne: null }
    }).select('timing completionReason userInfo.region');

    const stats = {
      totalCompleted: completedUsers.length,
      averageTimeSeconds: 0,
      averageTimeFormatted: '',
      medianTimeSeconds: 0,
      fastestTimeSeconds: null,
      slowestTimeSeconds: null,
      byCompletionReason: {},
      byRegion: {}
    };

    if (completedUsers.length > 0) {
      const times = completedUsers.map(u => u.timing.totalTimeSeconds).sort((a, b) => a - b);
      
      // Calculate average
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      stats.averageTimeSeconds = Math.floor(totalTime / times.length);
      
      // Calculate median
      const mid = Math.floor(times.length / 2);
      stats.medianTimeSeconds = times.length % 2 === 0 
        ? Math.floor((times[mid - 1] + times[mid]) / 2)
        : times[mid];
      
      stats.fastestTimeSeconds = times[0];
      stats.slowestTimeSeconds = times[times.length - 1];
      
      // Format average time
      const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
        return parts.join(' ');
      };
      
      stats.averageTimeFormatted = formatTime(stats.averageTimeSeconds);
      
      // Group by completion reason
      completedUsers.forEach(user => {
        const reason = user.completionReason || 'completed';
        if (!stats.byCompletionReason[reason]) {
          stats.byCompletionReason[reason] = {
            count: 0,
            averageTime: 0,
            times: []
          };
        }
        stats.byCompletionReason[reason].count++;
        stats.byCompletionReason[reason].times.push(user.timing.totalTimeSeconds);
      });
      
      // Calculate averages for each reason
      Object.keys(stats.byCompletionReason).forEach(reason => {
        const reasonData = stats.byCompletionReason[reason];
        const avg = Math.floor(reasonData.times.reduce((sum, time) => sum + time, 0) / reasonData.times.length);
        reasonData.averageTime = avg;
        reasonData.averageTimeFormatted = formatTime(avg);
        delete reasonData.times; // Clean up
      });
      
      // Group by region
      completedUsers.forEach(user => {
        const region = user.userInfo.region;
        if (!stats.byRegion[region]) {
          stats.byRegion[region] = {
            count: 0,
            averageTime: 0,
            times: []
          };
        }
        stats.byRegion[region].count++;
        stats.byRegion[region].times.push(user.timing.totalTimeSeconds);
      });
      
      // Calculate averages for each region
      Object.keys(stats.byRegion).forEach(region => {
        const regionData = stats.byRegion[region];
        const avg = Math.floor(regionData.times.reduce((sum, time) => sum + time, 0) / regionData.times.length);
        regionData.averageTime = avg;
        regionData.averageTimeFormatted = formatTime(avg);
        delete regionData.times; // Clean up
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting timing stats:', error);
    res.status(500).json({ error: 'Failed to get timing stats' });
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