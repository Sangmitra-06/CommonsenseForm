import { Category, AttentionCheck } from '../types/index.ts';

export const loadQuestionsData = async (): Promise<Category[]> => {
  try {
    console.log('Loading questions from public/questions.json...');
    
    const response = await fetch('/questions.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.status} ${response.statusText}`);
    }
    
    const data: Category[] = await response.json();
    
    // Validate the data structure
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Questions data is not in the expected format');
    }
    
    // Calculate totals for logging
    const totalQuestions = data.reduce((sum, cat) => 
      sum + cat.subcategories.reduce((subSum, sub) => 
        subSum + sub.topics.reduce((topicSum, topic) => topicSum + topic.questions.length, 0), 0), 0);
    
    console.log('Questions loaded successfully:', {
      categories: data.length,
      totalSubcategories: data.reduce((sum, cat) => sum + cat.subcategories.length, 0),
      totalTopics: data.reduce((sum, cat) => 
        sum + cat.subcategories.reduce((subSum, sub) => subSum + sub.topics.length, 0), 0),
      totalQuestions
    });
    
    return data;
    
  } catch (error) {
    console.error('Error loading questions data:', error);
    throw new Error('Failed to load questions data');
  }
};

export const validateAnswer = (answer: string): { isValid: boolean; message?: string } => {
  if (!answer || answer.trim().length === 0) {
    return { isValid: false, message: 'Please provide an answer' };
  }
  
  if (answer.trim().length < 4) {
    return { isValid: false, message: 'Please provide a more detailed answer (at least 4 characters)' };
  }
  
  if (answer.length > 5000) {
    return { isValid: false, message: 'Answer is too long (maximum 5000 characters)' };
  }
  
  return { isValid: true };
};

export const shouldShowAttentionCheck = (questionCount: number): boolean => {
  return questionCount > 0 && questionCount % 15 === 0;
};

// Comprehensive quality analysis
export const analyzeResponseQuality = (answer: string): {
  isLowQuality: boolean;
  issues: string[];
  score: number;
  isNoneResponse: boolean;
  isGibberish: boolean;
} => {
  const issues: string[] = [];
  let score = 100;
  let isNoneResponse = false;
  let isGibberish = false;

  const text = answer.toLowerCase().trim();
  
  // Check for "none" type responses
  const nonePatterns = [
    /^(none|n\/a|na|nothing|no|idk|i don't know|dk|dunno)$/i,
    /^(none that i know|nothing that i know|no idea|not sure|dont know|don't know)$/i,
    /^(same|similar|normal|usual|regular|typical|standard|common)$/i,
    /^(not applicable|not available|no information|no data)$/i,
  ];

  nonePatterns.forEach(pattern => {
    if (pattern.test(text)) {
      isNoneResponse = true;
      issues.push('Generic "none" or non-informative response');
      score -= 40;
    }
  });

  // Check for gibberish patterns
  const gibberishPatterns = [
    /^[bcdfghjklmnpqrstvwxyz]{6,}$/i, // Too many consonants
    /^[aeiou]{6,}$/i, // Too many vowels
    /(.{3,})\1{2,}/, // Repeated patterns (abcabc)
    /^[^a-z\s]*$/i, // No letters at all
    /^[a-z]{8,}$/i, // Long strings without spaces
  ];

  // Keyboard mashing patterns
  const mashingPatterns = [
    /qwerty|asdf|zxcv|hjkl|yuiop/i,
    /abcd|1234|test|xxx|yyy|zzz/i,
    /(.)\1{4,}/, // Same character repeated 5+ times
  ];

  gibberishPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      isGibberish = true;
      issues.push('Appears to be random characters or gibberish');
      score -= 60;
    }
  });

  mashingPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      isGibberish = true;
      issues.push('Keyboard mashing or test input detected');
      score -= 50;
    }
  });

  // Check for excessive repetition of words
  const words = text.split(/\s+/).filter(word => word.length > 2);
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  const repeatedWords = Object.entries(wordCount).filter(([word, count]) => (count as number) > 3);
  if (repeatedWords.length > 0) {
    issues.push('Excessive word repetition');
    score -= 30;
  }

  // Check for lack of specificity
  const vaguePhrases = ['something', 'things', 'stuff', 'anything', 'everything'];
  const vagueCount = vaguePhrases.reduce((count, phrase) => 
    count + (text.match(new RegExp(`\\b${phrase}\\b`, 'g')) || []).length, 0
  );
  
  if (vagueCount > 3) {
    issues.push('Response lacks specific details');
    score -= 15;
  }

  // Positive indicators
  const positiveIndicators = [
    /\b(example|for instance|specifically|traditionally|commonly|usually|typically)\b/i,
    /\b(in my region|in our area|locally|here we|we usually|in our culture)\b/i,
    /\b(such as|like|including|consists of|involves|includes)\b/i,
  ];

  let positiveCount = 0;
  positiveIndicators.forEach(pattern => {
    if (pattern.test(text)) positiveCount++;
  });

  if (positiveCount > 0) {
    score += Math.min(positiveCount * 8, 20);
  }

  score = Math.max(0, Math.min(100, score));
  
  return {
    isLowQuality: score < 30,
    issues,
    score,
    isNoneResponse,
    isGibberish
  };
};

// Comprehensive pattern analysis
export const analyzeUserPattern = (responses: Array<{answer: string, timeSpent: number}>): {
  suspiciousPattern: boolean;
  warnings: string[];
  noneResponseRate: number;
  gibberishResponseRate: number;
  fastResponseRate: number;
  issueType: 'none' | 'gibberish' | 'speed' | 'repetition' | 'quality' | 'multiple' | null;
} => {
  const warnings: string[] = [];
  let suspiciousPattern = false;

  if (responses.length < 5) {
    return { 
      suspiciousPattern, 
      warnings, 
      noneResponseRate: 0,
      gibberishResponseRate: 0,
      fastResponseRate: 0,
      issueType: null
    };
  }

  // Analyze response patterns
  let noneCount = 0;
  let gibberishCount = 0;
  let fastResponseCount = 0;

  responses.forEach(response => {
    const analysis = analyzeResponseQuality(response.answer);
    
    if (analysis.isNoneResponse) noneCount++;
    if (analysis.isGibberish) gibberishCount++;
    if (response.timeSpent < 8) fastResponseCount++;
  });

  const noneResponseRate = (noneCount / responses.length) * 100;
  const gibberishResponseRate = (gibberishCount / responses.length) * 100;
  const fastResponseRate = (fastResponseCount / responses.length) * 100;

  let issueType: 'none' | 'gibberish' | 'speed' | 'repetition' | 'quality' | 'multiple' | null = null;

  // Check for problematic patterns (30% threshold for all)
  if (noneResponseRate >= 30) {
    warnings.push(`High rate of "none" responses (${noneResponseRate.toFixed(1)}%)`);
    suspiciousPattern = true;
    issueType = 'none';
  }

  if (gibberishResponseRate >= 30) {
    warnings.push(`High rate of gibberish responses (${gibberishResponseRate.toFixed(1)}%)`);
    suspiciousPattern = true;
    issueType = issueType ? 'multiple' : 'gibberish';
  }

  if (fastResponseRate >= 30) {
    warnings.push(`High rate of very fast responses (${fastResponseRate.toFixed(1)}%)`);
    suspiciousPattern = true;
    issueType = issueType ? 'multiple' : 'speed';
  }

  // Check for similar responses
  const answers = responses.map(r => r.answer.toLowerCase().trim());
  const uniqueAnswers = new Set(answers);
  if (uniqueAnswers.size < answers.length * 0.6) {
    warnings.push('Many similar or identical responses');
    suspiciousPattern = true;
    issueType = issueType ? 'multiple' : 'repetition';
  }

  // Check for overall quality decline
  const recentResponses = responses.slice(-5);
  const recentQualityScores = recentResponses.map(r => analyzeResponseQuality(r.answer).score);
  const avgRecentQuality = recentQualityScores.reduce((sum, score) => sum + score, 0) / recentQualityScores.length;
  
  if (avgRecentQuality < 25) {
    warnings.push('Overall response quality is very low');
    suspiciousPattern = true;
    issueType = issueType ? 'multiple' : 'quality';
  }

  return { 
    suspiciousPattern, 
    warnings, 
    noneResponseRate,
    gibberishResponseRate,
    fastResponseRate,
    issueType
  };
};

// Enhanced attention check questions
export const generateAttentionCheck = (
  currentCategory: string,
  currentTopic: string,
  userInfo?: { region: string; age: number }
): AttentionCheck => {
  const checks = [
    {
      question: `You are currently answering questions about "${currentCategory}". Which category are you working on?`,
      options: [currentCategory, 'Food and Cuisine', 'Religious Practices', 'Economic Activities'],
      correctAnswer: 0,
      type: 'context'
    },
    {
      question: `Within ${currentCategory}, you're focusing on "${currentTopic}". What is your current topic?`,
      options: [currentTopic, 'Traditional Ceremonies', 'Seasonal Celebrations', 'Community Gatherings'],
      correctAnswer: 0,
      type: 'context'
    },
    {
      question: 'What is the main focus of this cultural survey?',
      options: [
        'Understanding cultural practices and traditions in different regions of India',
        'Collecting political opinions about government policies',
        'Reviewing consumer products and services',
        'Gathering medical and health information'
      ],
      correctAnswer: 0,
      type: 'comprehension'
    },
    {
      question: 'When answering questions, you should base your responses on:',
      options: [
        'Your personal knowledge and experience of cultural practices in your region',
        'What you think researchers want to hear',
        'Random guesses or made-up information',
        'Practices from other countries or regions you\'ve seen in movies'
      ],
      correctAnswer: 0,
      type: 'instruction'
    },
    {
      question: 'What should you do if you encounter a question about a practice you\'re not familiar with?',
      options: [
        'Explain what you do know or indicate that the practice is uncommon in your area',
        'Just write "none" or "don\'t know"',
        'Copy your answer from a previous question',
        'Make up a detailed but false answer'
      ],
      correctAnswer: 0,
      type: 'instruction'
    },
    {
      question: 'If a cultural practice is described as "cultural commonsense," it means:',
      options: [
        'It is widely shared and considered natural within a cultural group',
        'It is a rare or unusual practice',
        'It comes from foreign cultural influence',
        'It is a personal individual preference'
      ],
      correctAnswer: 0,
      type: 'definition'
    },
    {
      question: 'Which of these would be the BEST type of answer for cultural questions?',
      options: [
        'Detailed explanations with specific examples from your region',
        'One-word answers like "yes" or "no"',
        'Identical responses copied for every question',
        'Random letters and symbols'
      ],
      correctAnswer: 0,
      type: 'instruction'
    },
    {
      question: 'This survey is about cultural practices in which country?',
      options: ['India', 'China', 'United States', 'United Kingdom'],
      correctAnswer: 0,
      type: 'basic'
    },
    {
      question: 'How many regions of India are you asked to choose from in this survey?',
      options: [
        'Five regions (North, South, East, West, Central)',
        'Three regions',
        'Ten regions',
        'Two regions'
      ],
      correctAnswer: 0,
      type: 'basic'
    },
    {
      question: 'According to the survey instructions, what should you NOT do when answering questions?',
      options: [
        'Provide random, meaningless responses or keyboard mashing',
        'Share your genuine knowledge about cultural practices',
        'Give specific examples when possible',
        'Explain regional variations you\'re aware of'
      ],
      correctAnswer: 0,
      type: 'instruction'
    }
  ];

  // Add personal verification if userInfo available
  if (userInfo) {
    checks.push({
      question: `You indicated that you are from ${userInfo.region} India. Which region did you select?`,
      options: [
        `${userInfo.region} India`,
        userInfo.region === 'North' ? 'South India' : 'North India',
        userInfo.region === 'East' ? 'West India' : 'East India',
        'I did not specify a region'
      ],
      correctAnswer: 0,
      type: 'personal'
    });
  }
  
  // Select random check and shuffle options
  const randomCheck = checks[Math.floor(Math.random() * checks.length)];
  const correctOption = randomCheck.options[randomCheck.correctAnswer];
  const shuffledOptions = [...randomCheck.options];
  
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  
  return {
    question: randomCheck.question,
    options: shuffledOptions,
    correctAnswer: shuffledOptions.indexOf(correctOption),
    currentTopic,
    currentCategory,
    type: randomCheck.type
  };
};

// Utility functions
export const generateQuestionId = (
  categoryIndex: number,
  subcategoryIndex: number,
  topicIndex: number,
  questionIndex: number
): string => {
  return `${categoryIndex}-${subcategoryIndex}-${topicIndex}-${questionIndex}`;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

export const getEstimatedTimeRemaining = (
  totalQuestions: number,
  completedQuestions: number,
  averageTimePerQuestion: number = 120
): string => {
  const remainingQuestions = totalQuestions - completedQuestions;
  const estimatedSeconds = remainingQuestions * averageTimePerQuestion;
  
  if (estimatedSeconds < 3600) {
    const minutes = Math.ceil(estimatedSeconds / 60);
    return `~${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
  } else {
    const hours = Math.ceil(estimatedSeconds / 3600);
    return `~${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  }
};