import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import faqService from "../../services/faqService";
import "./FAQ.css";

const FAQcomponent = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);

  // Fetch FAQ categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await faqService.getFAQCategories();
        
        if (response.success && response.data && response.data.length > 0) {
          setCategories(response.data);
          // Auto-select first category
          setSelectedCategoryId(response.data[0].id);
        } else {
          setError("No FAQ found");
        }
      } catch {
        setError(t("faq.errors.fetchError") || "Failed to load FAQ categories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [t]);

  // Fetch questions when a category is selected
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedCategoryId) return;

      try {
        setLoadingQuestions(true);
        setError(null);
        const response = await faqService.getQuestionsByCategory(selectedCategoryId);
        
        if (response.success && response.data) {
          setQuestions(response.data);
          setActiveQuestion(null); // Reset active question when category changes
        } else {
          setQuestions([]);
          setError(t("faq.errors.noQuestions") || "No questions available for this category");
        }
      } catch {
        setError(t("faq.errors.fetchQuestionsError") || "Failed to load questions. Please try again later.");
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [selectedCategoryId, t]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setActiveQuestion(null);
  };

  const toggleQuestion = (index) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  if (loading) {
    return (
      <div className="faq-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading</p>
        </div>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className="faq-container">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="faq-container">
      {/* Category Tabs */}
      <div className="faq-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`faq-category-btn ${
              selectedCategoryId === category.id ? "active" : ""
            }`}
            onClick={() => handleCategoryClick(category.id)}
            disabled={loadingQuestions}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        {loadingQuestions ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading</p>
          </div>
        ) : error && questions.length === 0 ? (
          <div className="alert alert-warning" role="alert">
            <i className="fas fa-info-circle me-2"></i>
            {error}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-question-circle fa-3x text-muted mb-3"></i>
            <p className="text-muted">No QNA found for this category</p>
          </div>
        ) : (
          questions.map((questionItem, index) => (
            <div
              key={questionItem.id || index}
              className={`faq-item ${
                activeQuestion === index ? "active" : ""
              }`}
            >
              <div
                className={`faq-question ${
                  activeQuestion === index ? "expanded" : ""
                }`}
                onClick={() => toggleQuestion(index)}
              >
                {questionItem.question}
                <span className="arrow">
                  {activeQuestion === index ? "▴" : "▾"}
                </span>
              </div>

              {/* Answers */}
              <div className="faq-answer">
                {questionItem.answers && questionItem.answers.length > 0 ? (
                  questionItem.answers.map((answer, answerIndex) => (
                    <div key={answer.id || answerIndex} className="faq-answer-item">
                      {answer.answerText}
                    </div>
                  ))
                ) : (
                  <div className="text-muted">
                    {t("faq.noAnswer") || "No answer available."}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FAQcomponent;
