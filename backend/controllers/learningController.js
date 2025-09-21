// backend/controllers/learningController.js
import { sql } from "../config/db.js";
import { body, validationResult } from "express-validator";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the main project directory (two levels up from controllers)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

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

    // For culture subcategories, get user's university information and check for user-specific content
    let universityInfo = null;
    let content = [];
    
    if (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms') {
      // Get user's university information
      const userInfo = await sql`
        SELECT university FROM users WHERE id = ${userId}
      `;
      universityInfo = userInfo.length > 0 ? userInfo[0].university : null;
      console.log('University info for culture content:', universityInfo);
      
      // For culture subcategories, check if user-specific content exists
      content = await sql`
        SELECT content_id, title, content, difficulty, created_at
        FROM learning_content 
        WHERE subcategory_id = ${subcategoryId} AND user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    } else {
      // For non-culture subcategories, use global content
      content = await sql`
        SELECT content_id, title, content, difficulty, created_at
        FROM learning_content 
        WHERE subcategory_id = ${subcategoryId} AND user_id IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `;
    }

    // If no content exists, generate new content using LLM
    if (content.length === 0) {
      console.log('No content found, generating new content with university info:', universityInfo);
      try {
        const generatedContent = await generateLearningContent(subcategoryId, universityInfo);
        
        const newContent = await sql`
          INSERT INTO learning_content (subcategory_id, title, content, difficulty, user_id)
          VALUES (${subcategoryId}, ${generatedContent.title}, ${generatedContent.content}, ${generatedContent.difficulty}, ${subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms' ? userId : null})
          RETURNING content_id, title, content, difficulty, created_at
        `;
        
        content = newContent;
      } catch (error) {
        console.error('Error generating content:', error);
        throw error;
      }
    } else if (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms') {
      // For culture subcategories, check if we need to generate new university-specific content
      // Only regenerate if user has a university set and we want fresh content
      const shouldRegenerate = universityInfo && true; // Only regenerate if university is set
      
      if (shouldRegenerate) {
        console.log('Regenerating university-specific content for culture subcategory with university:', universityInfo);
        try {
          const generatedContent = await generateLearningContent(subcategoryId, universityInfo);
          
          const newContent = await sql`
            INSERT INTO learning_content (subcategory_id, title, content, difficulty, user_id)
            VALUES (${subcategoryId}, ${generatedContent.title}, ${generatedContent.content}, ${generatedContent.difficulty}, ${userId})
            RETURNING content_id, title, content, difficulty, created_at
          `;
          
          content = newContent;
        } catch (error) {
          console.error('Error regenerating content:', error);
          throw error;
        }
      } else {
        console.log('No university set for user, using existing content');
      }
    }

    // Record that user accessed this content
    // For culture subcategories, update existing learning progress to point to new content
    if (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms') {
      await sql`
        INSERT INTO user_learning_progress (user_id, subcategory_id, content_id)
        VALUES (${userId}, ${subcategoryId}, ${content[0].content_id})
        ON CONFLICT (user_id, content_id) DO UPDATE SET content_id = ${content[0].content_id}
      `;
    } else {
      await sql`
        INSERT INTO user_learning_progress (user_id, subcategory_id, content_id)
        VALUES (${userId}, ${subcategoryId}, ${content[0].content_id})
        ON CONFLICT (user_id, content_id) DO NOTHING
      `;
    }

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
    console.log('=== QUIZ GENERATION STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Environment check
    console.log('=== ENVIRONMENT CHECK ===');
    console.log('GEMINI_KEY exists:', !!process.env.GEMINI_KEY);
    console.log('GEMINI_KEY length:', process.env.GEMINI_KEY ? process.env.GEMINI_KEY.length : 0);
    console.log('GEMINI_KEY first 10 chars:', process.env.GEMINI_KEY ? process.env.GEMINI_KEY.substring(0, 10) + '...' : 'undefined');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PGHOST exists:', !!process.env.PGHOST);
    console.log('PGDATABASE exists:', !!process.env.PGDATABASE);
    
    if (!process.env.GEMINI_KEY) {
      console.error('❌ GEMINI_KEY environment variable is not set');
      return res.status(500).json({ 
        success: false, 
        message: "LLM service not configured. Please set GEMINI_KEY environment variable." 
      });
    }
    console.log('✅ Environment variables check passed');
    
    // Validation check
    console.log('=== VALIDATION CHECK ===');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }
    console.log('✅ Validation passed');

    const { subcategoryId, userId } = req.body;
    console.log('=== REQUEST PARAMETERS ===');
    console.log('Subcategory ID:', subcategoryId);
    console.log('User ID:', userId);
    console.log('Subcategory ID type:', typeof subcategoryId);
    console.log('User ID type:', typeof userId);

    // Get user's university information for culture subcategories
    let universityInfo = null;
    if (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms') {
      const userInfo = await sql`
        SELECT university FROM users WHERE id = ${userId}
      `;
      universityInfo = userInfo.length > 0 ? userInfo[0].university : null;
      console.log('University info for quiz generation:', universityInfo);
    }

    // Check learning progress
    console.log('=== DATABASE QUERY - LEARNING PROGRESS ===');
    console.log('Querying learning progress for user:', userId, 'subcategory:', subcategoryId);
    
    // For culture subcategories, clear old learning progress to force use of new university-specific content
    // Only clear if user has a university set
    if (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms') {
      if (universityInfo) {
        console.log('Clearing old learning progress for culture subcategory with university:', universityInfo);
        await sql`
          DELETE FROM user_learning_progress 
          WHERE user_id = ${userId} AND subcategory_id = ${subcategoryId}
        `;
      } else {
        console.log('No university set for user, using existing learning progress');
      }
    }
    
    const learningProgress = await sql`
      SELECT ulp.*, lc.content
      FROM user_learning_progress ulp
      JOIN learning_content lc ON ulp.content_id = lc.content_id
      WHERE ulp.user_id = ${userId} AND ulp.subcategory_id = ${subcategoryId}
      AND (lc.user_id = ${userId} OR lc.user_id IS NULL)
    `;

    console.log('Learning progress query result:');
    console.log('- Number of records found:', learningProgress.length);
    console.log('- Records:', JSON.stringify(learningProgress, null, 2));

    if (learningProgress.length > 0) {
      console.log('✅ User has learning progress, will generate questions from content');
      console.log('Content length:', learningProgress[0].content ? learningProgress[0].content.length : 'No content');
    } else {
      console.log('ℹ️ No learning progress found, will generate general questions');
    }

    let questions = [];
    let attempts = 0;
    const maxAttempts = 5;
    
    console.log('=== QUESTION GENERATION LOOP ===');
    console.log('Starting retry loop with max attempts:', maxAttempts);
    
    // Retry loop with exponential backoff
    while (questions.length < 5 && attempts < maxAttempts) {
      attempts++;
      console.log(`\n🔄 ATTEMPT ${attempts}/${maxAttempts} - Generating questions...`);
      console.log('Current valid questions count:', questions.length);
      
      try {
        let generatedQuestions;
        
        if (learningProgress.length > 0) {
          console.log('📚 Generating questions from learning content...');
          console.log('Content preview:', learningProgress[0].content ? learningProgress[0].content.substring(0, 200) + '...' : 'No content');
          generatedQuestions = await generateQuestionsFromContent(subcategoryId, learningProgress[0].content, universityInfo);
        } else {
          console.log('🌐 Generating general questions...');
          generatedQuestions = await generateGeneralQuestions(subcategoryId, universityInfo);
        }
        
        console.log('Generated questions count:', generatedQuestions ? generatedQuestions.length : 0);
        console.log('Generated questions:', JSON.stringify(generatedQuestions, null, 2));
        
        // Basic validation without overly strict semantic checking
        console.log('🔍 Validating questions...');
        questions = generatedQuestions.filter(q => {
          const isValid = validateQuestionStructure(q);
          console.log(`Question validation result: ${isValid ? '✅' : '❌'} - "${q.question ? q.question.substring(0, 50) + '...' : 'No question'}"`);
          return isValid;
        });
        
        console.log('Valid questions after filtering:', questions.length);
        
        if (questions.length >= 5) {
          questions = questions.slice(0, 5);
          console.log('✅ Sufficient questions generated, breaking loop');
          break;
        }
        
        console.warn(`⚠️ Only ${questions.length} valid questions generated, retrying...`);
        
        // Add delay before retry (exponential backoff)
        if (attempts < maxAttempts) {
          const delay = 1000 * attempts;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed with error:`, error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's a quota exceeded error
        if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('Too Many Requests')) {
          console.log('🔄 API quota exceeded in main retry loop');
          console.log('❌ Quota exceeded - cannot generate questions at this time');
          throw new Error('API quota exceeded. Please try again later or contact support.');
        }
        
        if (attempts === maxAttempts) {
          console.error('🚫 Max attempts reached, throwing error');
          throw new Error('Unable to generate valid quiz questions. Please try again.');
        }
      }
    }
    
    if (questions.length < 5) {
      console.error('🚫 Insufficient valid questions generated:', questions.length);
      throw new Error('Unable to generate sufficient valid questions. Please try again.');
    }
    
    console.log('✅ Sufficient questions generated, proceeding to database storage');
    console.log('Final questions to store:', JSON.stringify(questions, null, 2));
    
    // Clear existing questions
    console.log('=== DATABASE CLEANUP ===');
    console.log('Clearing existing questions for subcategory:', subcategoryId);
    await sql`DELETE FROM quiz_questions WHERE subcategory_id = ${subcategoryId}`;
    console.log('✅ Existing questions cleared');
    
    // Store validated questions
    console.log('=== DATABASE STORAGE ===');
    const storedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`\n📝 Storing question ${i + 1}/${questions.length}:`);
      console.log('- Question:', question.question);
      console.log('- Options:', question.options);
      console.log('- Correct Answer:', question.correctAnswer);
      console.log('- Explanation:', question.explanation);
      console.log('- Difficulty:', question.difficulty);
      
      try {
        const stored = await sql`
          INSERT INTO quiz_questions (
            subcategory_id, content_id, question, options, 
            correct_answer, explanation, difficulty
          )
          VALUES (
            ${subcategoryId}, ${question.contentId || null}, ${question.question}, 
            ${JSON.stringify(question.options)}, ${question.correctAnswer}, 
            ${question.explanation || null}, ${question.difficulty || 'Beginner'}
          )
          RETURNING question_id, question, options, correct_answer, explanation, difficulty
        `;
        storedQuestions.push(stored[0]);
        console.log(`✅ Question ${i + 1} stored successfully with ID:`, stored[0].question_id);
      } catch (dbError) {
        console.error(`❌ Failed to store question ${i + 1}:`, dbError.message);
        console.error('Database error details:', dbError);
        throw dbError;
      }
    }
    
    console.log('=== QUIZ GENERATION COMPLETED ===');
    console.log('Successfully stored', storedQuestions.length, 'questions');
    console.log('Final response questions:', JSON.stringify(storedQuestions, null, 2));
    
    return res.status(200).json({
      success: true,
      questions: storedQuestions
    });
    
  } catch (error) {
    console.error("=== QUIZ GENERATION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Internal server error"
    });
  }
};

// Basic structure validation without overly strict semantic checking
function validateQuestionStructure(question) {
  console.log('🔍 Validating question structure...');
  console.log('Question object:', JSON.stringify(question, null, 2));
  
  // Check basic structure
  if (!question.question || !question.options || !Array.isArray(question.options) || 
      question.options.length !== 4 || !question.correctAnswer) {
    console.warn('❌ Question failed basic structure validation');
    console.warn('- Has question:', !!question.question);
    console.warn('- Has options:', !!question.options);
    console.warn('- Options is array:', Array.isArray(question.options));
    console.warn('- Options length:', question.options ? question.options.length : 'N/A');
    console.warn('- Has correct answer:', !!question.correctAnswer);
    return false;
  }
  console.log('✅ Basic structure validation passed');
  
  // Check question length
  if (question.question.length < 10 || question.question.length > 300) {
    console.warn('❌ Question length out of acceptable range:', question.question.length);
    return false;
  }
  console.log('✅ Question length validation passed');
  
  // Check that options are distinct
  const uniqueOptions = new Set(question.options.map(o => o.toLowerCase().trim()));
  if (uniqueOptions.size !== 4) {
    console.warn('❌ Duplicate options detected');
    console.warn('Unique options count:', uniqueOptions.size);
    console.warn('Options:', question.options);
    return false;
  }
  console.log('✅ Options distinctness validation passed');
  
  // Check that options have reasonable length
  for (let i = 0; i < question.options.length; i++) {
    const option = question.options[i];
    if (!option || option.length < 2 || option.length > 200) {
      console.warn(`❌ Option ${i + 1} length out of acceptable range:`, option);
      console.warn('Option length:', option ? option.length : 'N/A');
      return false;
    }
  }
  console.log('✅ Options length validation passed');
  
  // Ensure correct answer is in options (with flexible matching)
  const normalizedCorrectAnswer = question.correctAnswer.toLowerCase().trim();
  const normalizedOptions = question.options.map(o => o.toLowerCase().trim());
  
  console.log('🔍 Checking correct answer alignment...');
  console.log('Normalized correct answer:', normalizedCorrectAnswer);
  console.log('Normalized options:', normalizedOptions);
  
  if (!normalizedOptions.includes(normalizedCorrectAnswer)) {
    console.log('⚠️ Direct match not found, trying to clean answer...');
    // Try removing letter prefixes
    const cleanAnswer = question.correctAnswer.replace(/^[a-dA-D][\.\)]\s*/i, '').trim();
    console.log('Cleaned answer:', cleanAnswer);
    
    const matchingOption = question.options.find(o => 
      o.replace(/^[a-dA-D][\.\)]\s*/i, '').trim().toLowerCase() === cleanAnswer.toLowerCase()
    );
    
    if (matchingOption) {
      console.log('✅ Found matching option after cleaning:', matchingOption);
      question.correctAnswer = matchingOption;
    } else {
      console.warn('❌ Correct answer not found in options after cleaning');
      console.warn('Original answer:', question.correctAnswer);
      console.warn('Cleaned answer:', cleanAnswer);
      console.warn('Options:', question.options);
      return false;
    }
  } else {
    console.log('✅ Direct match found for correct answer');
  }
  
  // Reject "all/none of the above" style answers
  const invalidPhrases = ['all of the above', 'none of the above', 'both a and b', 'a and b', 'all of these', 'none of these'];
  if (invalidPhrases.some(phrase => normalizedCorrectAnswer.includes(phrase))) {
    console.warn('❌ Invalid answer type detected:', question.correctAnswer);
    return false;
  }
  console.log('✅ Invalid answer type validation passed');
  
  console.log('✅ Question validation completed successfully');
  return true;
}

// Submit quiz answers and get results
export const submitQuiz = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    const { subcategoryId, userId, answers } = req.body;

    // Get the correct answers for the questions (only the most recent 5 questions)
    const questions = await sql`
      SELECT question_id, correct_answer, explanation
      FROM quiz_questions 
      WHERE subcategory_id = ${subcategoryId}
      ORDER BY created_at ASC
      LIMIT 5
    `;

    // Validate that we have the right number of answers
    if (!answers || answers.length !== questions.length) {
      return res.status(400).json({ 
        success: false, 
        message: `Expected ${questions.length} answers but received ${answers ? answers.length : 0}` 
      });
    }

    let score = 0;
    const results = [];

    questions.forEach((q, index) => {
      const userAnswer = answers[index];
      // Normalize answers for comparison (trim whitespace and handle case sensitivity)
      const normalizedUserAnswer = userAnswer ? userAnswer.trim() : '';
      const normalizedCorrectAnswer = q.correct_answer ? q.correct_answer.trim() : '';
      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      if (isCorrect) score++;
      
      // Debug logging
      console.log(`Question ${index + 1}: User: "${normalizedUserAnswer}" | Correct: "${normalizedCorrectAnswer}" | Match: ${isCorrect}`);
      
      results.push({
        questionId: q.question_id,
        userAnswer: normalizedUserAnswer,
        correctAnswer: normalizedCorrectAnswer,
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
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
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
async function generateLearningContent(subcategoryId, universityInfo = null) {
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

    let topic = subcategoryMap[subcategoryId] || 'General international student guidance';
    
    // Add university-specific information for culture subcategories
    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      topic += ` at ${universityInfo}`;
    }
    
    let prompt = `Create comprehensive learning content for international students about: ${topic}

REQUIREMENTS:
- Write 800-1200 words of educational content
- Make it practical and actionable for international students
- Include specific facts, procedures, and requirements
- Use clear, simple language
- Include real-world examples and scenarios
- Cover common challenges and solutions
- Provide cultural context and considerations`;

    // Add university-specific requirements for culture subcategories
    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      prompt += `

UNIVERSITY-SPECIFIC REQUIREMENTS:
- Focus on cultural norms and practices specific to ${universityInfo}
- Include campus-specific traditions, events, and social customs
- Mention university-specific resources, organizations, and support services
- Include examples of how social interactions work at ${universityInfo}
- Cover any unique cultural aspects or expectations at this university
- Include information about campus life, student organizations, and social activities specific to ${universityInfo}`;
    }

    prompt += `

CONTENT STRUCTURE:
1. Introduction to the topic
2. Key concepts and important information
3. Step-by-step procedures or guidelines
4. Common challenges and how to overcome them
5. Cultural considerations and best practices
6. Practical tips and real-world examples
7. Important requirements or regulations (if applicable)

FORMAT: Return as JSON with these exact keys:
{
  "title": "Clear, engaging title here",
  "content": "Detailed educational content here (800-1200 words)",
  "difficulty": "Beginner"
}

Make the content specific, factual, and directly applicable to international students' experiences.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      // Clean the response text to extract JSON from markdown code blocks
      let cleanText = text.trim();
      
      // Remove markdown code block markers if present
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanText);
      
      // Validate required fields
      if (!parsed.title || !parsed.content) {
        throw new Error('Missing required fields in LLM response');
      }
      
      return {
        title: parsed.title,
        content: parsed.content,
        difficulty: parsed.difficulty || 'Beginner'
      };
    } catch (parseError) {
      console.error('Error parsing learning content JSON:', parseError);
      console.error('Raw LLM response:', text);
      
      // Try to extract content from the response even if JSON parsing fails
      const titleMatch = text.match(/"title":\s*"([^"]+)"/);
      const contentMatch = text.match(/"content":\s*"([^"]+)"/);
      
      if (titleMatch && contentMatch) {
        return {
          title: titleMatch[1],
          content: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
          difficulty: 'Beginner'
        };
      }
      
      // If all else fails, return the raw text
      return {
        title: `${topic} - Learning Guide`,
        content: text,
        difficulty: 'Beginner'
      };
    }
  } catch (error) {
    console.error('Error generating learning content with Gemini:', error);
    
    // Check if it's a quota exceeded error
    if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('Too Many Requests')) {
      console.log('🔄 API quota exceeded in generateLearningContent');
      console.log('❌ Quota exceeded - cannot generate content at this time');
      throw new Error('API quota exceeded. Please try again later or contact support.');
    }
    
    // Fallback content for other errors
    return {
      title: 'Learning Content',
      content: 'Content for this topic is being generated. Please try again in a moment.',
      difficulty: 'Beginner'
    };
  }
}

// Generate questions based on learned content using Gemini
async function generateQuestionsFromContent(subcategoryId, content, universityInfo = null) {
  try {
    console.log('=== GENERATING QUESTIONS FROM CONTENT ===');
    console.log('Subcategory:', subcategoryId);
    console.log('Content length:', content ? content.length : 'No content');
    console.log('Content preview:', content ? content.substring(0, 500) + '...' : 'No content');
    console.log('University info:', universityInfo);
    console.log('Gemini model initialized:', !!model);
    
    let prompt = `Based on the following learning content, generate exactly 5 multiple-choice quiz questions.

CONTENT TO BASE QUESTIONS ON:
${content}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 5 questions
2. Each question MUST have EXACTLY 4 answer options
3. The correct answer MUST be one of the 4 options
4. Questions must be directly based on information from the content
5. Each correct answer must logically answer its question`;

    // Add university-specific requirements for culture subcategories
    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      prompt += `

UNIVERSITY-SPECIFIC REQUIREMENTS:
- Focus on cultural aspects and practices specific to ${universityInfo}
- Include questions about campus-specific traditions, events, and social customs
- Mention university-specific resources, organizations, and support services
- Include examples of how social interactions work at ${universityInfo}
- Cover any unique cultural aspects or expectations at this university
- Include information about campus life, student organizations, and social activities specific to ${universityInfo}`;
    }

    prompt += `

IMPORTANT: Make sure that each question and its correct answer are semantically aligned. The correct answer should directly answer what the question is asking.

EXAMPLES OF GOOD ALIGNMENT:
- Question: "What is the minimum GPA requirement?" → Answer: "3.0"
- Question: "How do you apply for a work permit?" → Answer: "Submit Form I-765 to USCIS"
- Question: "When should you arrive for orientation?" → Answer: "One week before classes start"

FORMAT YOUR RESPONSE EXACTLY AS JSON:
{
  "questions": [
    {
      "question": "Your question here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact text of the correct option",
      "explanation": "Brief explanation of why this is correct",
      "difficulty": "Beginner"
    }
  ]
}

IMPORTANT: The correctAnswer field must contain the EXACT text of one of the options, not a letter or number reference.`;

    console.log('📤 Sending prompt to Gemini...');
    console.log('Prompt length:', prompt.length);
    console.log('Prompt preview:', prompt.substring(0, 200) + '...');
    
    const result = await model.generateContent(prompt);
    console.log('📥 Received response from Gemini');
    
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw Gemini response length:', text.length);
    console.log('Raw Gemini response preview:', text.substring(0, 300) + '...');
    
    try {
      // Clean the response text
      console.log('🧹 Cleaning response text...');
      let cleanText = text.trim();
      console.log('Original text starts with:', cleanText.substring(0, 50));
      
      if (cleanText.startsWith('```json')) {
        console.log('Removing ```json markers');
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        console.log('Removing ``` markers');
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Cleaned text starts with:', cleanText.substring(0, 50));
      console.log('Cleaned text length:', cleanText.length);
      
      console.log('🔍 Parsing JSON...');
      const parsed = JSON.parse(cleanText);
      console.log('✅ JSON parsing successful');
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        console.error('❌ Invalid response structure: questions array not found');
        console.error('Parsed object keys:', Object.keys(parsed));
        throw new Error('Invalid response structure: questions array not found');
      }
      
      console.log('Parsed', parsed.questions.length, 'questions from LLM');
      console.log('Questions array:', JSON.stringify(parsed.questions, null, 2));
      
      // Process and fix correct answers if needed
      const processedQuestions = parsed.questions.map(q => {
        // Ensure explanation exists
        if (!q.explanation) {
          q.explanation = "This is the correct answer based on the learning content.";
        }
        
        // Ensure difficulty exists
        if (!q.difficulty) {
          q.difficulty = "Beginner";
        }
        
        return q;
      });
      
      return processedQuestions;
      
    } catch (parseError) {
      console.error('❌ Error parsing response:', parseError.message);
      console.error('Parse error stack:', parseError.stack);
      console.error('Raw text that failed to parse:', text);
      throw new Error('Failed to parse LLM response. Retrying...');
    }
  } catch (error) {
    console.error('❌ Error generating questions from content:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Check if it's a quota exceeded error
    if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('Too Many Requests')) {
      console.log('🔄 API quota exceeded in generateQuestionsFromContent');
      console.log('❌ Quota exceeded - cannot generate questions at this time');
      throw new Error('API quota exceeded. Please try again later or contact support.');
    }
    
    throw error;
  }
}

// Generate general questions for subcategory (when user skips learning)
async function generateGeneralQuestions(subcategoryId, universityInfo = null) {
  try {
    console.log('=== GENERATING GENERAL QUESTIONS ===');
    console.log('Subcategory:', subcategoryId);
    console.log('University info:', universityInfo);
    
    const subcategoryMap = {
      'campus-life': 'Campus Life and Social Norms for international students',
      'general-mannerisms': 'General Mannerisms and Social Etiquette in North America',
      'banking': 'Banking and Financial Management for students',
      'transportation': 'Transportation Systems and getting around campus/city',
      'housing': 'Housing and Accommodation for international students',
      'healthcare': 'Healthcare and Insurance systems for students',
      'terminology': 'Modern Terminology, Slang, and Academic Language',
      'visa-status': 'Maintaining Visa Status and immigration compliance',
      'campus-jobs': 'Campus Employment and work authorization',
      'laws': 'Important Laws and Regulations for international students',
      'student-office': 'International Student Office procedures and requirements'
    };

    let topic = subcategoryMap[subcategoryId] || 'General international student guidance';
    
    // Add university-specific information for culture subcategories
    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      topic += ` at ${universityInfo}`;
    }
    
    console.log('Topic:', topic);
    
    let prompt = `Generate exactly 5 multiple-choice quiz questions about "${topic}".

REQUIREMENTS:
1. Generate EXACTLY 5 questions
2. Each question MUST have EXACTLY 4 answer options
3. Questions should test practical knowledge that international students need
4. Each correct answer must directly answer its question
5. Base questions on common knowledge about this topic`;

    // Add university-specific requirements for culture subcategories
    if (universityInfo && (subcategoryId === 'campus-life' || subcategoryId === 'general-mannerisms')) {
      prompt += `

UNIVERSITY-SPECIFIC REQUIREMENTS:
- Focus on cultural aspects and practices specific to ${universityInfo}
- Include questions about campus-specific traditions, events, and social customs
- Mention university-specific resources, organizations, and support services
- Include examples of how social interactions work at ${universityInfo}
- Cover any unique cultural aspects or expectations at this university
- Include information about campus life, student organizations, and social activities specific to ${universityInfo}`;
    }

    prompt += `

FORMAT YOUR RESPONSE EXACTLY AS JSON:
{
  "questions": [
    {
      "question": "Your question here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact text of the correct option",
      "explanation": "Brief explanation",
      "difficulty": "Beginner"
    }
  ]
}

IMPORTANT: 
- The correctAnswer must be the EXACT text of one of the options
- Do NOT use "All of the above" or "None of the above" as options
- Make questions specific and factual`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw Gemini response length:', text.length);
    
    try {
      // Clean the response text
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsed = JSON.parse(cleanText);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid response structure');
      }
      
      console.log('Parsed', parsed.questions.length, 'general questions');
      
      // Process questions
      const processedQuestions = parsed.questions.map(q => {
        if (!q.explanation) {
          q.explanation = "This is the correct answer for this topic.";
        }
        if (!q.difficulty) {
          q.difficulty = "Beginner";
        }
        return q;
      });
      
      return processedQuestions;
      
    } catch (parseError) {
      console.error('Error parsing general questions:', parseError);
      throw new Error('Failed to parse LLM response');
    }
  } catch (error) {
    console.error('Error generating general questions:', error);
    
    // Check if it's a quota exceeded error
    if (error.message.includes('quota') || error.message.includes('429') || error.message.includes('Too Many Requests')) {
      console.log('🔄 API quota exceeded in generateGeneralQuestions');
      console.log('❌ Quota exceeded - cannot generate questions at this time');
      throw new Error('API quota exceeded. Please try again later or contact support.');
    }
    
    throw error;
  }
}

// Helper function to extract retry delay from quota error
function extractRetryDelay(error) {
  try {
    if (error.errorDetails && error.errorDetails.length > 0) {
      const retryInfo = error.errorDetails.find(detail => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
      if (retryInfo && retryInfo.retryDelay) {
        return Math.ceil(parseFloat(retryInfo.retryDelay.replace('s', '')) * 1000);
      }
    }
  } catch (e) {
    console.log('Could not extract retry delay from error');
  }
  return 60000; // Default to 1 minute if we can't extract the delay
}