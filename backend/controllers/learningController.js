// backend/controllers/learningController.js
import { sql } from "../config/db.js";
import { body, validationResult } from "express-validator";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/* ========= Validation ========= */
export const validateLearningRequest = [
  body("subcategoryId").notEmpty().withMessage("Subcategory ID is required"),
  body("userId").isUUID().withMessage("Valid user ID is required"),
];

export const validateQuizRequest = [
  body("subcategoryId").notEmpty().withMessage("Subcategory ID is required"),
  body("userId").isUUID().withMessage("Valid user ID is required"),
  body("answers").isArray().withMessage("Answers must be an array"),
];

/* ========= Learning Content Controllers ========= */

// Get or generate learning content for a subcategory
export const getLearningContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { subcategoryId, userId } = req.body;

    // Check if content already exists for this subcategory
    let content = await sql`
      SELECT content_id, title, content, difficulty, created_at
      FROM learning_content 
      WHERE subcategory_id = ${subcategoryId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // If no content exists, generate new content using LLM
    if (content.length === 0) {
      const generatedContent = await generateLearningContent(subcategoryId);
      
      const newContent = await sql`
        INSERT INTO learning_content (subcategory_id, title, content, difficulty)
        VALUES (${subcategoryId}, ${generatedContent.title}, ${generatedContent.content}, ${generatedContent.difficulty})
        RETURNING content_id, title, content, difficulty, created_at
      `;
      
      content = newContent;
    }

    // Record that user accessed this content
    await sql`
      INSERT INTO user_learning_progress (user_id, subcategory_id, content_id)
      VALUES (${userId}, ${subcategoryId}, ${content[0].content_id})
      ON CONFLICT (user_id, content_id) DO NOTHING
    `;

    return res.status(200).json({
      success: true,
      content: content[0]
    });

  } catch (error) {
    console.error("Get learning content error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Generate quiz questions for a subcategory
export const generateQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { subcategoryId, userId } = req.body;

    // Check if user has completed learning content for this subcategory
    const learningProgress = await sql`
      SELECT ulp.*, lc.content
      FROM user_learning_progress ulp
      JOIN learning_content lc ON ulp.content_id = lc.content_id
      WHERE ulp.user_id = ${userId} AND ulp.subcategory_id = ${subcategoryId}
    `;

    let questions;
    
    if (learningProgress.length > 0) {
      // User has learned - generate questions based on their learning content
      questions = await generateQuestionsFromContent(subcategoryId, learningProgress[0].content);
    } else {
      // User skipped learning - generate general questions for the subcategory
      questions = await generateGeneralQuestions(subcategoryId);
    }

    // Store questions in database
    const storedQuestions = [];
    for (const question of questions) {
      const stored = await sql`
        INSERT INTO quiz_questions (subcategory_id, content_id, question, options, correct_answer, explanation, difficulty)
        VALUES (${subcategoryId}, ${question.contentId || null}, ${question.question}, ${JSON.stringify(question.options)}, ${question.correctAnswer}, ${question.explanation || null}, ${question.difficulty})
        RETURNING question_id, question, options, correct_answer, explanation, difficulty
      `;
      storedQuestions.push(stored[0]);
    }

    return res.status(200).json({
      success: true,
      questions: storedQuestions
    });

  } catch (error) {
    console.error("Generate quiz error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Submit quiz answers and get results
export const submitQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { subcategoryId, userId, answers } = req.body;

    // Get the correct answers for the questions
    const questions = await sql`
      SELECT question_id, correct_answer, explanation
      FROM quiz_questions 
      WHERE subcategory_id = ${subcategoryId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    let score = 0;
    const results = [];

    questions.forEach((q, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) score++;
      
      results.push({
        questionId: q.question_id,
        userAnswer,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation
      });
    });

    const percentage = Math.round((score / questions.length) * 100);

    // Store quiz attempt
    await sql`
      INSERT INTO user_quiz_attempts (user_id, subcategory_id, score, total_questions, answers)
      VALUES (${userId}, ${subcategoryId}, ${score}, ${questions.length}, ${JSON.stringify(answers)})
    `;

    return res.status(200).json({
      success: true,
      score,
      totalQuestions: questions.length,
      percentage,
      results
    });

  } catch (error) {
    console.error("Submit quiz error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get user's learning progress
export const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    const progress = await sql`
      SELECT 
        ulp.subcategory_id,
        lc.title,
        ulp.completed_at,
        ulp.time_spent
      FROM user_learning_progress ulp
      JOIN learning_content lc ON ulp.content_id = lc.content_id
      WHERE ulp.user_id = ${userId}
      ORDER BY ulp.completed_at DESC
    `;

    const quizAttempts = await sql`
      SELECT 
        subcategory_id,
        score,
        total_questions,
        completed_at
      FROM user_quiz_attempts
      WHERE user_id = ${userId}
      ORDER BY completed_at DESC
    `;

    return res.status(200).json({
      success: true,
      learningProgress: progress,
      quizAttempts
    });

  } catch (error) {
    console.error("Get user progress error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get recent activity for dashboard
export const getRecentActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get recent quiz attempts with subcategory names
    const recentQuizAttempts = await sql`
      SELECT 
        uqa.subcategory_id,
        uqa.score,
        uqa.total_questions,
        uqa.completed_at,
        CASE 
          WHEN uqa.subcategory_id = 'campus-life' THEN 'Campus Life'
          WHEN uqa.subcategory_id = 'general-mannerisms' THEN 'General Mannerisms'
          WHEN uqa.subcategory_id = 'banking' THEN 'Banking'
          WHEN uqa.subcategory_id = 'transportation' THEN 'Transportation'
          WHEN uqa.subcategory_id = 'housing' THEN 'Housing'
          WHEN uqa.subcategory_id = 'healthcare' THEN 'Healthcare'
          WHEN uqa.subcategory_id = 'terminology' THEN 'Terminology'
          WHEN uqa.subcategory_id = 'visa-status' THEN 'Visa Status'
          WHEN uqa.subcategory_id = 'campus-jobs' THEN 'Campus Jobs'
          WHEN uqa.subcategory_id = 'laws' THEN 'Laws'
          WHEN uqa.subcategory_id = 'student-office' THEN 'Student Office'
          ELSE uqa.subcategory_id
        END as subcategory_name,
        CASE 
          WHEN uqa.subcategory_id IN ('campus-life', 'general-mannerisms') THEN 'culture'
          WHEN uqa.subcategory_id IN ('banking', 'transportation', 'housing', 'healthcare') THEN 'practical-skills'
          WHEN uqa.subcategory_id = 'terminology' THEN 'language'
          WHEN uqa.subcategory_id IN ('visa-status', 'campus-jobs', 'laws', 'student-office') THEN 'legal-immigration'
          ELSE 'general'
        END as category_type
      FROM user_quiz_attempts uqa
      WHERE uqa.user_id = ${userId}
      ORDER BY uqa.completed_at DESC
      LIMIT 5
    `;

    return res.status(200).json({
      success: true,
      recentActivity: recentQuizAttempts
    });

  } catch (error) {
    console.error("Get recent activity error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/* ========= Helper Functions ========= */

// Generate learning content using Google Gemini
async function generateLearningContent(subcategoryId) {
  try {
    const subcategoryMap = {
      'campus-life': 'Campus Life and Social Norms - Understanding campus culture, social interactions, and general mannerisms for international students',
      'general-mannerisms': 'General Mannerisms and Social Etiquette - Understanding social norms, communication styles, cultural behaviors, and proper etiquette for international students',
      'banking': 'Banking and Financial Management - Setting up bank accounts, understanding credit, managing finances, and financial literacy',
      'transportation': 'Transportation Systems - Using public transport, campus shuttles, ride-sharing services, and getting around the city',
      'housing': 'Housing and Accommodation - Finding housing, understanding leases, roommate dynamics, and accommodation options',
      'healthcare': 'Healthcare and Insurance - Understanding health insurance, finding doctors, emergency procedures, and healthcare systems',
      'terminology': 'Modern Terminology and Slang - Gen Z slang, academic terminology, cultural references, and modern language usage',
      'visa-status': 'Maintaining Visa Status - Visa requirements, compliance, reporting obligations, and maintaining legal status',
      'campus-jobs': 'Campus Employment - Work authorization, job opportunities, tax implications, and employment regulations',
      'laws': 'Important Laws and Regulations - Legal requirements, rights and responsibilities, compliance, and legal awareness',
      'student-office': 'International Student Office Updates - Staying updated with requirements, paperwork, deadlines, and administrative processes'
    };

    const topic = subcategoryMap[subcategoryId] || 'General international student guidance';
    
    const prompt = `Create comprehensive learning content for international students about: ${topic}

Please provide:
1. A clear, engaging title
2. Detailed educational content (800-1200 words) that covers:
   - Key concepts and important information
   - Practical tips and real-world examples
   - Common challenges and how to overcome them
   - Cultural considerations and best practices
3. Appropriate difficulty level (Beginner, Intermediate, or Advanced)

Format the response as JSON with these exact keys: title, content, difficulty

The content should be educational, practical, and specifically helpful for international students.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return {
        title: parsed.title || `${topic} - Learning Guide`,
        content: parsed.content || text,
        difficulty: parsed.difficulty || 'Beginner'
      };
    } catch (parseError) {
      // If JSON parsing fails, return the raw text with a default structure
      return {
        title: `${topic} - Learning Guide`,
        content: text,
        difficulty: 'Beginner'
      };
    }
  } catch (error) {
    console.error('Error generating learning content with Gemini:', error);
    // Fallback content
    return {
      title: 'Learning Content',
      content: 'Content for this topic is being generated. Please try again in a moment.',
      difficulty: 'Beginner'
    };
  }
}

// Generate questions based on learned content using Gemini
async function generateQuestionsFromContent(subcategoryId, content) {
  try {
    const prompt = `Based on the following learning content for international students, generate exactly 5 quiz questions:

CONTENT:
${content}

Please create exactly 5 multiple-choice questions that test understanding of this content. Each question should have:
- A clear, specific question
- 4 answer options (A, B, C, D)
- One correct answer
- A brief explanation of why the answer is correct
- Appropriate difficulty level

Format the response as JSON with this exact structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Explanation here",
      "difficulty": "Beginner"
    }
  ]
}

Make the questions practical and relevant to international students' real-world experiences. Ensure you generate exactly 5 questions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      return parsed.questions || [];
    } catch (parseError) {
      console.error('Error parsing Gemini response for questions:', parseError);
      return getFallbackQuestions(subcategoryId);
    }
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    return getFallbackQuestions(subcategoryId);
  }
}

// Generate general questions for subcategory (when user skips learning) using Gemini
async function generateGeneralQuestions(subcategoryId) {
  try {
    const subcategoryMap = {
      'campus-life': 'Campus Life and Social Norms',
      'general-mannerisms': 'General Mannerisms and Social Etiquette',
      'banking': 'Banking and Financial Management',
      'transportation': 'Transportation Systems',
      'housing': 'Housing and Accommodation',
      'healthcare': 'Healthcare and Insurance',
      'terminology': 'Modern Terminology and Slang',
      'visa-status': 'Maintaining Visa Status',
      'campus-jobs': 'Campus Employment',
      'laws': 'Important Laws and Regulations',
      'student-office': 'International Student Office Updates'
    };

    const topic = subcategoryMap[subcategoryId] || 'General international student guidance';
    
    const prompt = `Generate exactly 5 multiple-choice quiz questions about ${topic} for international students.

The questions should test general knowledge about this topic without requiring specific content study. Each question should have:
- A clear, practical question
- 4 answer options (A, B, C, D)
- One correct answer
- A brief explanation of why the answer is correct
- Appropriate difficulty level

Format the response as JSON with this exact structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Explanation here",
      "difficulty": "Beginner"
    }
  ]
}

Make the questions practical and relevant to international students' experiences. Ensure you generate exactly 5 questions.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      return parsed.questions || [];
    } catch (parseError) {
      console.error('Error parsing Gemini response for general questions:', parseError);
      return getFallbackQuestions(subcategoryId);
    }
  } catch (error) {
    console.error('Error generating general questions with Gemini:', error);
    return getFallbackQuestions(subcategoryId);
  }
}

// Fallback questions when Gemini fails
function getFallbackQuestions(subcategoryId) {
  const fallbackQuestions = {
    'campus-life': [
      {
        question: "What is the most important aspect of campus life for international students?",
        options: ["Academic performance only", "Social connections and community", "Financial management", "Health maintenance"],
        correctAnswer: "Social connections and community",
        explanation: "Building social connections is crucial for international students' success and well-being.",
        difficulty: "Beginner"
      },
      {
        question: "How should you approach cultural differences on campus?",
        options: ["Avoid them", "Embrace and learn from them", "Ignore them", "Change your culture"],
        correctAnswer: "Embrace and learn from them",
        explanation: "Embracing cultural differences enriches your experience and helps you grow.",
        difficulty: "Intermediate"
      },
      {
        question: "What is the best way to get involved in campus activities?",
        options: ["Wait for invitations", "Join clubs and organizations", "Only attend academic events", "Avoid social activities"],
        correctAnswer: "Join clubs and organizations",
        explanation: "Actively joining clubs and organizations helps you meet people and integrate into campus life.",
        difficulty: "Beginner"
      },
      {
        question: "How can international students overcome homesickness?",
        options: ["Isolate themselves", "Stay connected with home culture while embracing new experiences", "Avoid making new friends", "Focus only on academics"],
        correctAnswer: "Stay connected with home culture while embracing new experiences",
        explanation: "Balancing connection to home with openness to new experiences helps manage homesickness.",
        difficulty: "Intermediate"
      },
      {
        question: "What should you do if you don't understand a cultural reference?",
        options: ["Pretend you understand", "Ask for clarification politely", "Ignore it completely", "Make up an answer"],
        correctAnswer: "Ask for clarification politely",
        explanation: "Asking for clarification shows interest in learning and helps you understand the culture better.",
        difficulty: "Beginner"
      }
    ],
    'general-mannerisms': [
      {
        question: "What is the best way to greet someone in a professional setting?",
        options: ["A firm handshake with eye contact", "A casual wave", "A bow", "Avoiding eye contact"],
        correctAnswer: "A firm handshake with eye contact",
        explanation: "A firm handshake with eye contact shows confidence and respect in professional settings.",
        difficulty: "Beginner"
      },
      {
        question: "How should you handle cultural misunderstandings?",
        options: ["Ignore them", "Ask for clarification politely", "Get defensive", "Avoid the person"],
        correctAnswer: "Ask for clarification politely",
        explanation: "Asking for clarification shows respect and helps you learn about different cultural norms.",
        difficulty: "Intermediate"
      },
      {
        question: "What is appropriate personal space in most Western cultures?",
        options: ["Very close (6 inches)", "Arm's length (2-3 feet)", "Across the room", "No personal space needed"],
        correctAnswer: "Arm's length (2-3 feet)",
        explanation: "Most Western cultures prefer an arm's length distance for comfortable conversation.",
        difficulty: "Beginner"
      },
      {
        question: "How should you respond if you don't understand a joke?",
        options: ["Laugh anyway", "Ask for explanation politely", "Ignore it", "Make fun of it"],
        correctAnswer: "Ask for explanation politely",
        explanation: "Asking for explanation shows interest in learning and helps you understand cultural humor.",
        difficulty: "Intermediate"
      },
      {
        question: "What is the best approach to making friends in a new culture?",
        options: ["Wait for others to approach you", "Be open, respectful, and show genuine interest", "Only socialize with people from your country", "Avoid social interactions"],
        correctAnswer: "Be open, respectful, and show genuine interest",
        explanation: "Being open and showing genuine interest in others helps build meaningful cross-cultural friendships.",
        difficulty: "Beginner"
      }
    ],
    'banking': [
      {
        question: "What is the first step when opening a bank account as an international student?",
        options: ["Choose any bank", "Gather required documents", "Apply for credit", "Set up online banking"],
        correctAnswer: "Gather required documents",
        explanation: "Having all required documents ready is essential for a smooth bank account opening process.",
        difficulty: "Beginner"
      },
      {
        question: "Which documents are typically required for opening a student bank account?",
        options: ["Only passport", "Passport, student ID, and proof of address", "Only student ID", "Social security number"],
        correctAnswer: "Passport, student ID, and proof of address",
        explanation: "Most banks require passport, student ID, and proof of address for international students.",
        difficulty: "Beginner"
      },
      {
        question: "What is a checking account primarily used for?",
        options: ["Long-term savings", "Daily transactions and bill payments", "Investment purposes", "Emergency funds only"],
        correctAnswer: "Daily transactions and bill payments",
        explanation: "Checking accounts are designed for frequent transactions like paying bills and making purchases.",
        difficulty: "Beginner"
      },
      {
        question: "What should you do if you notice unauthorized transactions on your account?",
        options: ["Ignore them", "Contact the bank immediately", "Wait to see if they resolve", "Change your PIN only"],
        correctAnswer: "Contact the bank immediately",
        explanation: "Immediately reporting unauthorized transactions helps protect your account and recover lost funds.",
        difficulty: "Intermediate"
      },
      {
        question: "What is the benefit of maintaining a good relationship with your bank?",
        options: ["Free money", "Better interest rates and services", "No fees ever", "Unlimited withdrawals"],
        correctAnswer: "Better interest rates and services",
        explanation: "A good banking relationship can lead to better rates, waived fees, and additional services.",
        difficulty: "Intermediate"
      }
    ],
    'transportation': [
      {
        question: "What is the most cost-effective transportation option for students?",
        options: ["Uber/Lyft", "Public transportation", "Personal car", "Taxi"],
        correctAnswer: "Public transportation",
        explanation: "Public transportation is usually the most cost-effective option for students.",
        difficulty: "Beginner"
      },
      {
        question: "What should you do if you miss your bus or train?",
        options: ["Panic and run after it", "Check the schedule for the next one", "Give up and walk home", "Call a taxi immediately"],
        correctAnswer: "Check the schedule for the next one",
        explanation: "Checking the schedule helps you plan your next move and avoid unnecessary stress.",
        difficulty: "Beginner"
      },
      {
        question: "How can you stay safe when using public transportation at night?",
        options: ["Avoid it completely", "Stay alert, sit near the driver, and let someone know your route", "Use headphones to block out noise", "Carry large amounts of cash"],
        correctAnswer: "Stay alert, sit near the driver, and let someone know your route",
        explanation: "These safety measures help protect you when using public transportation at night.",
        difficulty: "Intermediate"
      },
      {
        question: "What is the benefit of getting a student transportation pass?",
        options: ["Free rides forever", "Discounted rates for unlimited travel", "Priority seating", "Faster service"],
        correctAnswer: "Discounted rates for unlimited travel",
        explanation: "Student passes typically offer significant discounts for unlimited travel within the system.",
        difficulty: "Beginner"
      },
      {
        question: "What should you do if you feel lost while using public transportation?",
        options: ["Keep riding until you recognize something", "Ask the driver or other passengers for help", "Get off at the next stop randomly", "Use your phone to call home"],
        correctAnswer: "Ask the driver or other passengers for help",
        explanation: "Asking for help is the safest and most efficient way to get back on track.",
        difficulty: "Beginner"
      }
    ]
  };

  return fallbackQuestions[subcategoryId] || [
    {
      question: "What is the primary focus of this topic?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option B",
      explanation: "This is a general explanation for the topic.",
      difficulty: "Beginner"
    },
    {
      question: "Which of the following is most important for international students?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option B",
      explanation: "This is a general explanation for the topic.",
      difficulty: "Beginner"
    },
    {
      question: "What should international students prioritize?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option B",
      explanation: "This is a general explanation for the topic.",
      difficulty: "Beginner"
    },
    {
      question: "How can international students succeed?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option B",
      explanation: "This is a general explanation for the topic.",
      difficulty: "Beginner"
    },
    {
      question: "What is the best approach for this topic?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option B",
      explanation: "This is a general explanation for the topic.",
      difficulty: "Beginner"
    }
  ];
}
