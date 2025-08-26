export interface Question {
  id: string;
  text: string;
}

export interface Topic {
  topic: string;
  questions: string[];
}

export interface Subcategory {
  subcategory: string;
  topics: Topic[];
}

export interface Category {
  category: string;
  subcategories: Subcategory[];
}

export interface UserInfo {
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  age: number;
  yearsInRegion: number;
}

// Create a separate type for form errors
export interface UserInfoErrors {
  region?: string;
  age?: string;
  yearsInRegion?: string;
}

export interface QuestionResponse {
  questionId: string;
  categoryIndex: number;
  subcategoryIndex: number;
  topicIndex: number;
  questionIndex: number;
  category: string;
  subcategory: string;
  topic: string;
  question: string;
  answer: string;
  timeSpent: number;
  timestamp: string;
  qualityScore?: number;
}

export interface Progress {
  currentCategory: number;
  currentSubcategory: number;
  currentTopic: number;
  currentQuestion: number;
  completedQuestions: number;
  totalQuestions: number;
  completedTopics: string[];
  attentionChecksPassed: number;
  attentionChecksFailed: number;
}

export interface FormState {
  sessionId: string | null;
  userInfo: UserInfo | null;
  currentPosition: {
    categoryIndex: number;
    subcategoryIndex: number;
    topicIndex: number;
    questionIndex: number;
  };
  responses: Map<string, QuestionResponse>;
  progress: Progress;
  isLoading: boolean;
  error: string | null;
  questionsData: Category[];
  startTime: number;
  lastSaveTime: number;
  isCompleted: boolean;
}

export interface AttentionCheck {
  question: string;
  options: string[];
  correctAnswer: number;
  expectedAnswer?: string; // Add this new field
  currentTopic: string;
  currentCategory: string;
  type?: string;
}

export const REGIONS = {
  North: [
    'Delhi', 'Punjab', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 
    'Ladakh', 'Uttarakhand', 'Uttar Pradesh', 'Rajasthan', 'Chandigarh'
  ],
  South: [
    'Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana',
    'Puducherry', 'Lakshadweep', 'Andaman and Nicobar Islands'
  ],
  East: [
    'West Bengal', 'Odisha', 'Jharkhand', 'Bihar', 'Sikkim',
    'Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura'
  ],
  West: [
    'Maharashtra', 'Gujarat', 'Rajasthan', 'Goa', 'Madhya Pradesh',
    'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu'
  ],
  Central: [
    'Madhya Pradesh', 'Chhattisgarh'
  ]
} as const;