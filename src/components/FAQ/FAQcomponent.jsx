import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import faqService from "../../services/faqService";
import "./FAQ.css";

const FAQcomponent = () => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);

  // Get language code from i18n (default to 'en')
  const languageCode = i18n.language === 'es' ? 'es' : 'en';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await faqService.getFAQCategories(languageCode);
        
        if (response.success && response.data && response.data.length > 0) {
          setCategories(response.data);
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
  }, [languageCode, t]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedCategoryId) return;

      try {
        setLoadingQuestions(true);
        setError(null);
        const response = await faqService.getQuestionsByCategory(selectedCategoryId, languageCode);
        
        if (response.success && response.data) {
          setQuestions(response.data);
          setActiveQuestion(null);
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
  }, [selectedCategoryId, languageCode, t]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setActiveQuestion(null);
  };

  const toggleQuestion = (index) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  if (loading) {
    return (
      <div className="faq-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary">
            <span className="visually-hidden">Loading...</span>
          </div>
          <output className="mt-3 text-muted d-block">Loading</output>
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

      <div className="faq-section">
        {(() => {
          if (loadingQuestions) {
            return (
              <div className="text-center py-5">
                <div className="spinner-border text-primary">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <output className="mt-3 text-muted d-block">Loading</output>
              </div>
            );
          }
          
          if (error && questions.length === 0) {
            return (
              <div className="alert alert-warning" role="alert">
                <i className="fas fa-info-circle me-2"></i>
                {error}
              </div>
            );
          }
          
          if (questions.length === 0) {
            return (
              <div className="text-center py-5">
                <i className="fa-solid fa-question-circle fa-3x text-muted mb-3"></i>
                <p className="text-muted">{t("faq.noQNAFound") || "No QNA found for this category"}</p>
              </div>
            );
          }
          
          return questions.map((question, index) => (
            <div
              key={question.id || index}
              className={`faq-item ${
                activeQuestion === index ? "active" : ""
              }`}
            >
              <button
                type="button"
                className={`faq-question ${
                  activeQuestion === index ? "expanded" : ""
                }`}
                onClick={() => toggleQuestion(index)}
                aria-expanded={activeQuestion === index}
                aria-controls={`faq-answer-${index}`}
              >
                {question.question}
                <span className="arrow">
                  {activeQuestion === index ? "▴" : "▾"}
                </span>
              </button>

              <div className="faq-answer" id={`faq-answer-${index}`}>
                {question.answers && question.answers.length > 0 ? (
                  question.answers.map((answer, answerIndex) => (
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
          ));
        })()}
      </div>
    </div>
  );
};

export default FAQcomponent;
