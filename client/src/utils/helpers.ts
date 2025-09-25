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
// NEW: Improved attention check validation
export const validateAttentionCheck = (userAnswer: string, expectedAnswers: string[]): boolean => {
  if (!userAnswer || typeof userAnswer !== 'string') {
    console.log('Attention check failed: Empty or invalid answer');
    return false;
  }

  // Clean and normalize the user's answer - handle multi-line input
  const cleanAnswer = userAnswer
    .toLowerCase()
    .replace(/\r\n/g, ' ') // Replace Windows line breaks with space
    .replace(/\n/g, ' ')   // Replace Unix line breaks with space
    .replace(/\r/g, ' ')   // Replace old Mac line breaks with space
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize all whitespace to single spaces

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
  
  // More lenient "none" patterns - only flag obviously lazy responses
  const nonePatterns = [
    /^(none|n\/a|na|nothing|no|idk|dk)$/i,
    /^(same|normal|usual|regular|typical)$/i,
  ];

  // More specific legitimate none responses (don't penalize these)
  const legitimateNonePatterns = [
    /^(none that i know|nothing that i know|not in my region|not applicable here)/i,
    /^(we don't have|not common here|not practiced in)/i,
  ];

  // Check for none responses - but be more lenient
  const hasNoneResponse = nonePatterns.some(pattern => pattern.test(text)) && 
                         !legitimateNonePatterns.some(pattern => pattern.test(text));
  
  if (hasNoneResponse && text.length < 8) { // Only flag very short "none" responses
    isNoneResponse = true;
    issues.push('Very brief response - consider adding more detail if possible');
    score -= 25; // Reduced penalty
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

  if (responses.length < 3) { // Increased minimum threshold
    return { 
      suspiciousPattern: false, // Don't flag with too few responses
      warnings, 
      noneResponseRate: 0,
      gibberishResponseRate: 0,
      fastResponseRate: 0,
      issueType: null
    };
  }

  // Rest of the function stays the same but with higher thresholds
  let noneCount = 0;
  let gibberishCount = 0;
  let fastResponseCount = 0;

  responses.forEach(response => {
    const analysis = analyzeResponseQuality(response.answer);
    
    if (analysis.isNoneResponse) noneCount++;
    if (analysis.isGibberish) gibberishCount++;
    if (response.timeSpent < 5) fastResponseCount++; // Reduced threshold
  });

  const noneResponseRate = (noneCount / responses.length) * 100;
  const gibberishResponseRate = (gibberishCount / responses.length) * 100;
  const fastResponseRate = (fastResponseCount / responses.length) * 100;

  let primaryIssue: string | null = null;

  // Higher thresholds for flagging patterns
  if (noneResponseRate >= 30) { // Increased from 30%
    warnings.push(`High rate of "none" responses (${noneResponseRate.toFixed(1)}%)`);
    suspiciousPattern = true;
    primaryIssue = 'none';
  }

  if (gibberishResponseRate >= 40) { // Increased from 30%
    warnings.push(`High rate of gibberish responses (${gibberishResponseRate.toFixed(1)}%)`);
    suspiciousPattern = true;
    if (!primaryIssue) primaryIssue = 'gibberish';
  }

  if (fastResponseRate >= 30) { // Increased from 30%
    warnings.push(`High rate of very quick responses (${fastResponseRate.toFixed(1)}%)`);
    suspiciousPattern = true;
    if (!primaryIssue) primaryIssue = 'speed';
  }

  return { 
    suspiciousPattern, 
    warnings, 
    noneResponseRate,
    gibberishResponseRate,
    fastResponseRate,
    issueType: primaryIssue
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
      question: 'This survey is about cultural practices in which country? Please type the country name.',
      correctAnswers: ['india', 'bharat'],
      type: 'basic'
    },
   
  ];

  // Add personal verification if userInfo available
  if (userInfo) {
    checks.push({
      question: `What region of India did you specify at the beginning of this survey? Please write the name of the region (North, South, East, West, or Central).`,
      correctAnswers: [userInfo.region.toLowerCase()],
      type: 'personal'
    });
  }

  
  
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