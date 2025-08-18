const fs = require('fs');
const path = require('path');

class QuestionsService {
  constructor() {
    this.questionsData = null;
    this.totalQuestions = 0;
    this.loadQuestions();
  }

  loadQuestions() {
    try {
      // Load questions from the data file
      const questionsPath = path.join(__dirname, '../data/questions.json');
      
      if (fs.existsSync(questionsPath)) {
        const rawData = fs.readFileSync(questionsPath, 'utf8');
        this.questionsData = JSON.parse(rawData);
        this.calculateTotalQuestions();
        console.log(`✅ Loaded ${this.questionsData.length} categories with ${this.totalQuestions} total questions`);
      } else {
        console.warn('⚠️ Questions file not found, using fallback data');
        this.createFallbackData();
      }
    } catch (error) {
      console.error('❌ Error loading questions:', error);
      this.createFallbackData();
    }
  }

  createFallbackData() {
    // Fallback data in case questions.json is missing
    this.questionsData = [
      {
        "category": "Interpersonal Relations",
        "subcategories": [
          {
            "subcategory": "Visiting and hospitality",
            "topics": [
              {
                "topic": "Etiquette in the reception of visitors",
                "questions": [
                  "In your region, what are the typical ways people prepare their homes for the arrival of guests?",
                  "In your region, what is the first most common thing a visitor does when they enter your house?",
                  "In your region, what are some traditional gifts given to guests during their visit?",
                  "In your region, what is the common proper etiquette for sending off a guest?",
                  "In your region, what specific rituals are followed when someone visits your home for the first time?"
                ]
              }
            ]
          }
        ]
      }
    ];
    this.calculateTotalQuestions();
  }

  calculateTotalQuestions() {
    this.totalQuestions = this.questionsData.reduce((total, category) => {
      return total + category.subcategories.reduce((subTotal, subcategory) => {
        return subTotal + subcategory.topics.reduce((topicTotal, topic) => {
          return topicTotal + topic.questions.length;
        }, 0);
      }, 0);
    }, 0);
  }

  getTotalQuestions() {
    return this.totalQuestions;
  }

  getQuestionsData() {
    return this.questionsData;
  }

  // Get specific question by indices
  getQuestion(categoryIndex, subcategoryIndex, topicIndex, questionIndex) {
    try {
      return this.questionsData[categoryIndex]
        ?.subcategories[subcategoryIndex]
        ?.topics[topicIndex]
        ?.questions[questionIndex] || null;
    } catch (error) {
      return null;
    }
  }

  // Validate question indices
  isValidQuestion(categoryIndex, subcategoryIndex, topicIndex, questionIndex) {
    return this.getQuestion(categoryIndex, subcategoryIndex, topicIndex, questionIndex) !== null;
  }

  // Get topic information
  getTopic(categoryIndex, subcategoryIndex, topicIndex) {
    try {
      return this.questionsData[categoryIndex]
        ?.subcategories[subcategoryIndex]
        ?.topics[topicIndex] || null;
    } catch (error) {
      return null;
    }
  }

  // Reload questions (useful for development)
  reloadQuestions() {
    console.log('🔄 Reloading questions data...');
    this.loadQuestions();
  }
}

// Create singleton instance
const questionsService = new QuestionsService();

module.exports = questionsService;