import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Wrench,
  Languages,
  Scale,
  X,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getLearningContent,
  generateQuiz,
  submitQuiz,
  LearningContent,
  QuizQuestion,
  QuizResult,
} from "../services/learningService";

const CategoryDetail: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for learning content and quiz
  const [learningContent, setLearningContent] =
    useState<LearningContent | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "learn" | "quiz" | "result" | null
  >(null);
  const [currentSubcategory, setCurrentSubcategory] = useState<string | null>(
    null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const categoryData = {
    culture: {
      title: "Culture",
      description: "Learn about different cultures and traditions worldwide",
      icon: Globe,
      color: "text-green-600",
      bgColor: "bg-green-100",
      subcategories: [
        {
          title: "Campus Life",
          description:
            "Understanding campus culture, social norms, and student life",
          difficulty: "Beginner",
          difficultyColor: "bg-green-500",
        },
        {
          title: "General (Mannerisms)",
          description:
            "Social etiquette, communication styles, and cultural behaviors",
          difficulty: "Intermediate",
          difficultyColor: "bg-yellow-500",
        },
      ],
    },
    "practical-skills": {
      title: "Practical Skills",
      description:
        "Essential skills for daily life as an international student",
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      subcategories: [
        {
          title: "Banking",
          description:
            "Opening accounts, managing finances, and understanding banking systems",
          difficulty: "Beginner",
          difficultyColor: "bg-green-500",
        },
        {
          title: "Transportation",
          description: "Public transit, driving, and getting around the city",
          difficulty: "Beginner",
          difficultyColor: "bg-green-500",
        },
        {
          title: "Housing",
          description: "Finding accommodation, leases, and housing rights",
          difficulty: "Intermediate",
          difficultyColor: "bg-yellow-500",
        },
        {
          title: "Healthcare",
          description:
            "Health insurance, finding doctors, and medical services",
          difficulty: "Intermediate",
          difficultyColor: "bg-yellow-500",
        },
      ],
    },
    language: {
      title: "Language",
      description: "Improve your language skills and learn terminology",
      icon: Languages,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      subcategories: [
        {
          title: "Terminology (Gen Z Slang)",
          description:
            "Modern slang, internet language, and youth culture terms",
          difficulty: "Advanced",
          difficultyColor: "bg-red-500",
        },
      ],
    },
    "legal-immigration": {
      title: "Legal & Immigration",
      description:
        "Understand your legal responsibilities and visa requirements",
      icon: Scale,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      subcategories: [
        {
          title: "Maintaining Visa Status",
          description:
            "Requirements, deadlines, and compliance for student visas",
          difficulty: "Advanced",
          difficultyColor: "bg-red-500",
        },
        {
          title: "Campus Jobs",
          description:
            "Work authorization, job search, and employment regulations",
          difficulty: "Intermediate",
          difficultyColor: "bg-yellow-500",
        },
        {
          title: "Laws",
          description:
            "Important laws and regulations affecting international students",
          difficulty: "Advanced",
          difficultyColor: "bg-red-500",
        },
        {
          title: "International Student Office",
          description:
            "Paperwork, legal requirements, and staying updated with ISO",
          difficulty: "Intermediate",
          difficultyColor: "bg-yellow-500",
        },
      ],
    },
  };

  const category = categoryData[categoryId as keyof typeof categoryData];

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Category Not Found
          </h1>
          <button
            onClick={() => navigate("/quizzes")}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = category.icon;

  // Map subcategory titles to IDs for API calls
  const getSubcategoryId = (title: string, categoryId: string): string => {
    const mapping: { [key: string]: { [key: string]: string } } = {
      culture: {
        "Campus Life": "campus-life",
        "General (Mannerisms)": "general-mannerisms",
      },
      "practical-skills": {
        Banking: "banking",
        Transportation: "transportation",
        Housing: "housing",
        Healthcare: "healthcare",
      },
      language: {
        "Terminology (Gen Z Slang)": "terminology",
      },
      "legal-immigration": {
        "Maintaining Visa Status": "visa-status",
        "Campus Jobs": "campus-jobs",
        Laws: "laws",
        "International Student Office": "student-office",
      },
    };
    return mapping[categoryId]?.[title] || "general";
  };

  const handleLearn = async (subcategoryTitle: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    setCurrentSubcategory(subcategoryTitle);

    try {
      const subcategoryId = getSubcategoryId(subcategoryTitle, categoryId!);
      const content = await getLearningContent(subcategoryId, user.id);
      setLearningContent(content);
      setActiveModal("learn");
    } catch (error) {
      console.error("Error fetching learning content:", error);
      alert("Failed to load learning content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeQuiz = async (subcategoryTitle: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    setCurrentSubcategory(subcategoryTitle);
    setCurrentQuestionIndex(0);

    try {
      const subcategoryId = getSubcategoryId(subcategoryTitle, categoryId!);
      const questions = await generateQuiz(subcategoryId, user.id);

      // Ensure we have at least 5 questions
      if (questions.length < 5) {
        console.warn(
          `Only ${questions.length} questions generated, expected at least 5`
        );
      }

      setQuizQuestions(questions);
      setQuizAnswers(new Array(questions.length).fill(""));
      setActiveModal("quiz");
    } catch (error) {
      console.error("Error generating quiz:", error);

      // Check if it's a quota exceeded error
      if (error instanceof Error && error.message.includes("quota")) {
        alert("API quota exceeded. Please try again later or contact support.");
      } else {
        alert("Failed to generate quiz. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answer;
    setQuizAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!user?.id || !currentSubcategory) return;

    setIsLoading(true);

    try {
      const subcategoryId = getSubcategoryId(currentSubcategory, categoryId!);
      const result = await submitQuiz(subcategoryId, user.id, quizAnswers);
      setQuizResult(result);
      setActiveModal("result");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit quiz. Please try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setLearningContent(null);
    setQuizQuestions([]);
    setQuizAnswers([]);
    setQuizResult(null);
    setCurrentSubcategory(null);
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <button
            onClick={() => navigate("/quizzes")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quizzes
          </button>

          <div className="flex items-center">
            <div
              className={`w-12 h-12 ${category.bgColor} rounded-lg flex items-center justify-center mr-4`}
            >
              <IconComponent className={`w-6 h-6 ${category.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {category.title}
              </h1>
              <p className="text-gray-600">{category.description}</p>
            </div>
          </div>
        </div>

        {/* Subcategories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {category.subcategories.map((subcategory, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {subcategory.title}
                </h3>
                <div className="text-gray-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{subcategory.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium text-white ${subcategory.difficultyColor}`}
                >
                  {subcategory.difficulty}
                </span>
                <span className="text-sm text-gray-500"></span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleLearn(subcategory.title)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && currentSubcategory === subcategory.title
                    ? "Loading..."
                    : "Learn"}
                </button>
                <button
                  onClick={() => handleTakeQuiz(subcategory.title)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && currentSubcategory === subcategory.title
                    ? "Loading..."
                    : "Take Quiz"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Content Modal */}
      {activeModal === "learn" && learningContent && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-white w-full h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {learningContent.title}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose max-w-none prose-lg">
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      let content = learningContent.content;

                      // Try to parse as JSON first
                      try {
                        const parsed = JSON.parse(content);
                        if (parsed.content) {
                          content = parsed.content;
                        }
                      } catch (e) {
                        // If not JSON, check if it's a JSON string within the content
                        try {
                          // Look for JSON pattern in the content
                          const jsonMatch = content.match(/\{.*"content".*\}/s);
                          if (jsonMatch) {
                            const jsonContent = JSON.parse(jsonMatch[0]);
                            if (jsonContent.content) {
                              content = jsonContent.content;
                            }
                          }
                        } catch (e2) {
                          // If still not JSON, use content as is
                        }
                      }

                      // Clean up escaped characters and format the content
                      return content
                        .replace(/\\n/g, "\n") // Convert \n to actual newlines
                        .replace(/\\"/g, '"') // Convert \" to actual quotes
                        .replace(/\\'/g, "'") // Convert \' to actual quotes
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                        .replace(
                          /^## (.*$)/gim,
                          '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>'
                        )
                        .replace(
                          /^### (.*$)/gim,
                          '<h3 class="text-xl font-semibold text-gray-800 mt-6 mb-3">$1</h3>'
                        )
                        .replace(
                          /^#### (.*$)/gim,
                          '<h4 class="text-lg font-medium text-gray-800 mt-4 mb-2">$1</h4>'
                        )
                        .replace(
                          /^\* (.*$)/gim,
                          '<li class="ml-4 mb-2 list-disc">$1</li>'
                        )
                        .replace(
                          /^- (.*$)/gim,
                          '<li class="ml-4 mb-2 list-disc">$1</li>'
                        )
                        .replace(
                          /^\d+\. (.*$)/gim,
                          '<li class="ml-4 mb-2 list-decimal">$1</li>'
                        )
                        .replace(/\n\n/g, '</p><p class="mb-4">')
                        .replace(/\n/g, "<br>")
                        .replace(/^/, '<p class="mb-4">')
                        .replace(/$/, "</p>")
                        .replace(/<p class="mb-4"><\/p>/g, "") // Remove empty paragraphs
                        .replace(/<p class="mb-4"><br><\/p>/g, "") // Remove paragraphs with just breaks
                        .replace(/<br><br>/g, '</p><p class="mb-4">'); // Convert double breaks to paragraph breaks
                    })(),
                  }}
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Difficulty:{" "}
                  <span className="font-medium">
                    {learningContent.difficulty}
                  </span>
                </span>
                <button
                  onClick={closeModal}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Quiz */}
      {activeModal === "quiz" && quizQuestions.length > 0 && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 mr-4"
                >
                  <X className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  IS International Student Hub
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>
                  {Math.round(
                    ((currentQuestionIndex + 1) / quizQuestions.length) * 100
                  )}
                  % Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((currentQuestionIndex + 1) / quizQuestions.length) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quiz Content */}
          <div className="flex-1 bg-gray-100 flex items-center justify-center p-8">
            <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full p-8">
              {quizQuestions[currentQuestionIndex] && (
                <>
                  {/* Question */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                    {quizQuestions[currentQuestionIndex].question}
                  </h2>

                  {/* Answer Options */}
                  <div className="space-y-4 mb-8">
                    {quizQuestions[currentQuestionIndex].options.map(
                      (option, optionIndex) => {
                        const letter = String.fromCharCode(65 + optionIndex); // A, B, C, D
                        const isSelected =
                          quizAnswers[currentQuestionIndex] === option;

                        return (
                          <button
                            key={optionIndex}
                            onClick={() =>
                              handleQuizAnswerChange(
                                currentQuestionIndex,
                                option
                              )
                            }
                            className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                              isSelected
                                ? "border-gray-900 bg-gray-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="font-semibold text-gray-900 mr-4 min-w-[2rem]">
                                {letter}.
                              </span>
                              <span className="text-gray-700">{option}</span>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-2">
                      {quizQuestions.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                            index === currentQuestionIndex
                              ? "bg-gray-900 text-white"
                              : quizAnswers[index] !== ""
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>

                    {currentQuestionIndex === quizQuestions.length - 1 ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={
                          isLoading ||
                          quizAnswers.some((answer) => answer === "")
                        }
                        className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Submitting..." : "Submit Quiz"}
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Quiz Results */}
      {activeModal === "result" && quizResult && (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 mr-4"
                >
                  <X className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Quiz Results
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                {currentSubcategory} Quiz
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="flex-1 bg-gray-100 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8">
              {/* Score Summary */}
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <div className="text-center">
                  <div
                    className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      quizResult.percentage >= 80
                        ? "bg-green-100"
                        : quizResult.percentage >= 60
                        ? "bg-yellow-100"
                        : "bg-red-100"
                    }`}
                  >
                    <CheckCircle
                      className={`w-10 h-10 ${
                        quizResult.percentage >= 80
                          ? "text-green-600"
                          : quizResult.percentage >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                  <h2
                    className={`text-4xl font-bold mb-2 ${
                      quizResult.percentage >= 80
                        ? "text-green-600"
                        : quizResult.percentage >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {quizResult.percentage}%
                  </h2>
                  <p className="text-lg text-gray-600 mb-4">
                    You scored {quizResult.score} out of{" "}
                    {quizResult.totalQuestions} questions
                  </p>
                  <div className="text-sm text-gray-500">
                    {quizResult.percentage >= 80
                      ? "Excellent work!"
                      : quizResult.percentage >= 60
                      ? "Good job! Keep learning."
                      : "Keep studying to improve your score!"}
                  </div>
                </div>
              </div>

              {/* Question Review */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Question Review
                </h3>
                <div className="space-y-6">
                  {quizResult.results.map((result, index) => {
                    const question = quizQuestions[index];
                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Question {index + 1}
                          </h4>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              result.isCorrect
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {result.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>

                        {/* Question Text */}
                        <div className="mb-4">
                          <p className="text-gray-900 font-medium mb-3">
                            {question?.question}
                          </p>
                        </div>

                        {/* Answer Details */}
                        <div className="space-y-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Your answer:
                            </p>
                            <p className="text-gray-900">{result.userAnswer}</p>
                          </div>

                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Correct answer:
                            </p>
                            <p className="text-gray-900">
                              {result.correctAnswer}
                            </p>
                          </div>

                          {result.explanation && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Explanation:
                              </p>
                              <p className="text-gray-900">
                                {result.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-center space-x-4">
                <button
                  onClick={closeModal}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Topics
                </button>
                <button
                  onClick={() => {
                    closeModal();
                    if (currentSubcategory) {
                      handleTakeQuiz(currentSubcategory);
                    }
                  }}
                  className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Retake Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetail;
