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
    return { isValid: false, message: 'Please provide an answer or specify "none" if no answer exists' };
  }
  
  if (answer.trim().length < 4) {
    return { isValid: false, message: 'Please provide a more detailed answer (at least 4 characters) or specify "none"' };
  }
  
  if (answer.length > 5000) {
    return { isValid: false, message: 'Answer is too long (maximum 5000 characters)' };
  }
  
  return { isValid: true };
};

export const shouldShowAttentionCheck = (questionCount: number): boolean => {
  console.log('Checking if should show attention check:', {
    questionCount,
    isDivisibleBy7: questionCount > 0 && questionCount % 7 === 0,
    result: questionCount > 0 && questionCount % 7 === 0
  });
  
  return questionCount > 0 && questionCount % 7 === 0;
};

// NEW: Improved attention check validation
export const validateAttentionCheck = (userAnswer: string, expectedAnswers: string[]): boolean => {
  if (!userAnswer || typeof userAnswer !== 'string') {
    console.log('Attention check failed: Empty or invalid answer');
    return false;
  }

  // Clean and normalize the user's answer
  const cleanAnswer = userAnswer
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace

  console.log('Validating attention check:', {
    originalAnswer: userAnswer,
    cleanAnswer: cleanAnswer,
    expectedAnswers: expectedAnswers
  });

  // Check against all accepted answers
  const isValid = expectedAnswers.some(acceptedAnswer => {
    const cleanAccepted = acceptedAnswer.toLowerCase().trim();
    
    // Exact match
    if (cleanAnswer === cleanAccepted) {
      console.log('Attention check passed: Exact match');
      return true;
    }
    
    // Check if the answer contains the expected word (for cases like "the sun is yellow")
    if (cleanAnswer.includes(cleanAccepted)) {
      console.log('Attention check passed: Contains expected answer');
      return true;
    }
    
    // Check for common variations
    if (cleanAccepted === 'yellow' && (cleanAnswer.includes('gold') || cleanAnswer === 'golden')) {
      console.log('Attention check passed: Yellow variation');
      return true;
    }
    
    if (cleanAccepted === 'tuesday' && cleanAnswer === 'tue') {
      console.log('Attention check passed: Tuesday abbreviation');
      return true;
    }
    
    return false;
  });

  console.log('Attention check result:', isValid);
  return isValid;
};

// Comprehensive quality analysis
// Fixed version for helpers.ts
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

  // Check for none responses (only add message once)
  const hasNoneResponse = nonePatterns.some(pattern => pattern.test(text));
  if (hasNoneResponse) {
    isNoneResponse = true;
    issues.push('Generic "none" or non-informative response');
    score -= 40;
  }

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

  // Check for gibberish (only add message once)
  const hasGibberish = gibberishPatterns.some(pattern => pattern.test(text));
  if (hasGibberish) {
    isGibberish = true;
    issues.push('Appears to be random characters or gibberish');
    score -= 60;
  }

  // Check for keyboard mashing (only add message once)
  const hasMashing = mashingPatterns.some(pattern => pattern.test(text));
  if (hasMashing && !hasGibberish) { // Only add if not already marked as gibberish
    isGibberish = true;
    issues.push('Keyboard mashing or test input detected');
    score -= 50;
  }

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

export const analyzeUserPattern = (responses: Array<{answer: string, timeSpent: number}>): {
  suspiciousPattern: boolean;
  warnings: string[];
  noneResponseRate: number;
  gibberishResponseRate: number;
  fastResponseRate: number;
  issueType: string | null;
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
    
    console.log('Response time check:', {
      answer: response.answer.substring(0, 20) + '...',
      timeSpent: response.timeSpent,
      isFast: response.timeSpent < 8
    });
    
    if (response.timeSpent < 8) fastResponseCount++;
  });

  const noneResponseRate = (noneCount / responses.length) * 100;
  const gibberishResponseRate = (gibberishCount / responses.length) * 100;
  const fastResponseRate = (fastResponseCount / responses.length) * 100;

  console.log('Pattern analysis results:', {
    totalResponses: responses.length,
    noneCount,
    gibberishCount,
    fastResponseCount,
    noneResponseRate: noneResponseRate.toFixed(1),
    gibberishResponseRate: gibberishResponseRate.toFixed(1),
    fastResponseRate: fastResponseRate.toFixed(1)
  });

  let issueCount = 0;
  let primaryIssue: string | null = null;

  if (noneResponseRate >= 30) {
    warnings.push(`High rate of "none" responses (${noneResponseRate.toFixed(1)}%)`);
    suspiciousPattern = true;
    issueCount++;
    if (!primaryIssue) primaryIssue = 'none';
  }

  if (gibberishResponseRate >= 30) {
    warnings.push(`High rate of gibberish responses (${gibberishResponseRate.toFixed(1)}%)`);
    suspiciousPattern = true;
    issueCount++;
    if (!primaryIssue) primaryIssue = 'gibberish';
  }

  if (fastResponseRate >= 30) {
    warnings.push(`High rate of very quick responses (${fastResponseRate.toFixed(1)}% completed in under 8 seconds)`);
    suspiciousPattern = true;
    issueCount++;
    if (!primaryIssue) primaryIssue = 'speed';
  }

  // Check for similar responses
  const answers = responses.map(r => r.answer.toLowerCase().trim());
  const uniqueAnswers = new Set(answers);
  if (uniqueAnswers.size < answers.length * 0.6) {
    warnings.push('Many similar or identical responses');
    suspiciousPattern = true;
    issueCount++;
    if (!primaryIssue) primaryIssue = 'repetition';
  }

  // Check for overall quality decline
  const recentResponses = responses.slice(-5);
  const recentQualityScores = recentResponses.map(r => analyzeResponseQuality(r.answer).score);
  const avgRecentQuality = recentQualityScores.reduce((sum, score) => sum + score, 0) / recentQualityScores.length;
  
  if (avgRecentQuality < 25) {
    warnings.push('Overall response quality is very low');
    suspiciousPattern = true;
    issueCount++;
    if (!primaryIssue) primaryIssue = 'quality';
  }

  const issueType = issueCount > 1 ? 'multiple' : primaryIssue;

  return { 
    suspiciousPattern, 
    warnings, 
    noneResponseRate,
    gibberishResponseRate,
    fastResponseRate,
    issueType
  };
};

// NEW: Enhanced attention check generation with multiple correct answers
export const generateAttentionCheck = (
  currentCategory: string,
  currentTopic: string,
  userInfo?: { region: string; age: number }
): AttentionCheck => {
  const checks = [
    {
      question: 'What color is the sun? Please type exactly one color.',
      correctAnswers: ['yellow', 'gold', 'golden', 'orange'],
      type: 'basic'
    },
    {
      question: 'How many days are in one week? Please enter only the number in words.',
      correctAnswers: ['7', 'seven'],
      type: 'basic'
    },
    {
      question: 'This survey is about cultural practices in which country? Please type the country name.',
      correctAnswers: ['india', 'bharat'],
      type: 'basic'
    },
    {
      question: 'What day comes after Monday? Please type only the day name.',
      correctAnswers: ['tuesday', 'tue'],
      type: 'basic'
    },
    {
      question: 'How many fingers are on one human hand? Please enter only the number in words.',
      correctAnswers: ['5', 'five'],
      type: 'basic'
    },
    {
      question: 'How many months are in one year? Please enter only the number in words.',
      correctAnswers: ['12', 'twelve'],
      type: 'basic'
    }
  ];

  
  
  const randomCheck = checks[Math.floor(Math.random() * checks.length)];
  
  return {
    question: randomCheck.question,
    options: [], // Not used for text input
    correctAnswer: 0, // Not used for text input
    expectedAnswer: randomCheck.correctAnswers[0], // Primary expected answer for backward compatibility
    expectedAnswers: randomCheck.correctAnswers, // NEW: Array of acceptable answers
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