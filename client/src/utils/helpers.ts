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
    
    // Validate that each category has the required structure
    for (const category of data) {
      if (!category.category || !Array.isArray(category.subcategories)) {
        throw new Error(`Invalid category structure: ${JSON.stringify(category)}`);
      }
      
      for (const subcategory of category.subcategories) {
        if (!subcategory.subcategory || !Array.isArray(subcategory.topics)) {
          throw new Error(`Invalid subcategory structure: ${JSON.stringify(subcategory)}`);
        }
        
        for (const topic of subcategory.topics) {
          if (!topic.topic || !Array.isArray(topic.questions)) {
            throw new Error(`Invalid topic structure: ${JSON.stringify(topic)}`);
          }
          
          if (topic.questions.length === 0) {
            console.warn(`Topic "${topic.topic}" has no questions`);
          }
        }
      }
    }
    
    console.log('Questions loaded successfully:', {
      categories: data.length,
      totalSubcategories: data.reduce((sum, cat) => sum + cat.subcategories.length, 0),
      totalTopics: data.reduce((sum, cat) => 
        sum + cat.subcategories.reduce((subSum, sub) => subSum + sub.topics.length, 0), 0),
      totalQuestions: data.reduce((sum, cat) => 
        sum + cat.subcategories.reduce((subSum, sub) => 
          subSum + sub.topics.reduce((topicSum, topic) => topicSum + topic.questions.length, 0), 0), 0)
    });
    
    return data;
    
  } catch (error) {
    console.error('Error loading questions data:', error);
    
    // Fallback to test data if loading fails
    console.log('Falling back to test data...');
    const fallbackData: Category[] = [
      {
        "category": "Interpersonal Relations",
        "subcategories": [
          {
            "subcategory": "Visiting and hospitality",
            "topics": [
              {
                "topic": "Etiquette in the reception of visitors",
                "questions": [
                  "In your region, what are the typical ways people prepare their homes for the arrival of guests? Describe three common preparations that are usually done, such as cleaning, decorating, arranging guest rooms, or any traditional practices.",
                  "In your region, what is the first most common thing a visitor does when they enter your house? Focus on actions and not greetings and provide two most common ones.",
                  "In your region, if applicable, what are some traditional gifts or souvenirs given to guests during their visit? Specify two most common ones.",
                  "In your region, what is the common proper etiquette for sending off a guest who is visiting from another city?",
                  "In your region, what specific rituals or traditions are followed when someone visits your home for the first time? Specify two most common."
                ]
              }
            ]
          }
        ]
      }
    ];
    
    return fallbackData;
  }
};

// Rest of your helper functions remain the same...
export const generateQuestionId = (
  categoryIndex: number,
  subcategoryIndex: number,
  topicIndex: number,
  questionIndex: number
): string => {
  return `${categoryIndex}-${subcategoryIndex}-${topicIndex}-${questionIndex}`;
};

export const parseQuestionId = (questionId: string) => {
  const [categoryIndex, subcategoryIndex, topicIndex, questionIndex] = questionId.split('-').map(Number);
  return { categoryIndex, subcategoryIndex, topicIndex, questionIndex };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  // Re-enable attention checks every 15 questions
  return questionCount > 0 && questionCount % 5 === 0;
};

export const generateAttentionCheck = (
  currentCategory: string,
  currentTopic: string
): AttentionCheck => {
  const checks = [
    {
      question: `What category are you currently answering questions about?`,
      options: [
        currentCategory,
        'Food and Cuisine',
        'Religious Practices',
        'Economic Activities'
      ],
      correctAnswer: 0
    },
    {
      question: `What topic within ${currentCategory} are you currently focusing on?`,
      options: [
        currentTopic,
        'Traditional Ceremonies',
        'Seasonal Celebrations',
        'Community Gatherings'
      ],
      correctAnswer: 0
    },
    {
      question: 'What type of questions are you answering in this survey?',
      options: [
        'Cultural practices and commonsense in your region',
        'Personal preferences and opinions',
        'Historical facts and dates',
        'Mathematical problems'
      ],
      correctAnswer: 0
    }
  ];
  
  const randomCheck = checks[Math.floor(Math.random() * checks.length)];
  
  // Shuffle options
  const shuffledOptions = [...randomCheck.options];
  const correctOption = shuffledOptions[randomCheck.correctAnswer];
  
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }
  
  const newCorrectAnswer = shuffledOptions.indexOf(correctOption);
  
  return {
    question: randomCheck.question,
    options: shuffledOptions,
    correctAnswer: newCorrectAnswer,
    currentTopic,
    currentCategory
  };
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