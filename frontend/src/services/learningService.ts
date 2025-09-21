// frontend/src/services/learningService.ts
const API_BASE_URL = '/api/learning';

export interface LearningContent {
  content_id: string;
  title: string;
  content: string;
  difficulty: string;
  created_at: string;
}

export interface QuizQuestion {
  question_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  results: Array<{
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export interface UserProgress {
  learningProgress: Array<{
    subcategory_id: string;
    title: string;
    completed_at: string;
    time_spent: number;
  }>;
  quizAttempts: Array<{
    subcategory_id: string;
    score: number;
    total_questions: number;
    completed_at: string;
  }>;
}

export interface RecentActivity {
  subcategory_id: string;
  subcategory_name: string;
  category_type: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

// Get learning content for a subcategory
export const getLearningContent = async (subcategoryId: string, userId: string): Promise<LearningContent> => {
  const response = await fetch(`${API_BASE_URL}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      subcategoryId,
      userId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to fetch learning content');
  }

  const data = await response.json();
  return data.content;
};

// Generate quiz questions for a subcategory
export const generateQuiz = async (subcategoryId: string, userId: string): Promise<QuizQuestion[]> => {
  const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      subcategoryId,
      userId
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate quiz');
  }

  const data = await response.json();
  return data.questions;
};

// Submit quiz answers
export const submitQuiz = async (subcategoryId: string, userId: string, answers: string[]): Promise<QuizResult> => {
  const response = await fetch(`${API_BASE_URL}/quiz/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      subcategoryId,
      userId,
      answers
    })
  });

  if (!response.ok) {
    throw new Error('Failed to submit quiz');
  }

  const data = await response.json();
  return {
    score: data.score,
    totalQuestions: data.totalQuestions,
    percentage: data.percentage,
    results: data.results
  };
};

// Get user's learning progress
export const getUserProgress = async (userId: string): Promise<UserProgress> => {
  const response = await fetch(`${API_BASE_URL}/progress/${userId}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user progress');
  }

  const data = await response.json();
  return {
    learningProgress: data.learningProgress,
    quizAttempts: data.quizAttempts
  };
};

// Get recent activity for dashboard
export const getRecentActivity = async (userId: string): Promise<RecentActivity[]> => {
  const response = await fetch(`${API_BASE_URL}/recent-activity/${userId}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }

  const data = await response.json();
  return data.recentActivity;
};
