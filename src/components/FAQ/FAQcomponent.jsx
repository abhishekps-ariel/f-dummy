import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./FAQ.css";

const FAQcomponent = () => {
  const { t } = useTranslation();
  const categories = [
    t("faq.categories.petitions"),
    t("faq.categories.notes"),
    t("faq.categories.profileSignatures"),
    t("faq.categories.messages"),
  ];

  // Static FAQ data (category-wise)
  const faqData = {
    [t("faq.categories.petitions")]: [
      {
        question: t("faq.petitions.whatIsPetition"),
        answer: t("faq.petitions.whatIsPetitionAnswer"),
      },
      {
        question: t("faq.petitions.howCreatePetition"),
        answer: t("faq.petitions.howCreatePetitionAnswer"),
      },
      {
        question: t("faq.petitions.canSaveDraft"),
        answer: t("faq.petitions.canSaveDraftAnswer"),
      },
      {
        question: t("faq.petitions.whatHappensAfterSubmit"),
        answer: t("faq.petitions.whatHappensAfterSubmitAnswer"),
      },
      {
        question: t("faq.petitions.canEditAfterSubmit"),
        answer: t("faq.petitions.canEditAfterSubmitAnswer"),
      },
    ],

    [t("faq.categories.notes")]: [
      {
        question: t("faq.notes.whatAreNotes"),
        answer: t("faq.notes.whatAreNotesAnswer"),
      },
      {
        question: t("faq.notes.howAddNote"),
        answer: t("faq.notes.howAddNoteAnswer"),
      },
      {
        question: t("faq.notes.canEditDeleteNotes"),
        answer: t("faq.notes.canEditDeleteNotesAnswer"),
      },
      {
        question: t("faq.notes.whoCanSeeNotes"),
        answer: t("faq.notes.whoCanSeeNotesAnswer"),
      },
      {
        question: t("faq.notes.areNotesRequired"),
        answer: t("faq.notes.areNotesRequiredAnswer"),
      },
    ],

    [t("faq.categories.profileSignatures")]: [
      {
        question: t("faq.profileSignatures.howSetupFilingEntity"),
        answer: t("faq.profileSignatures.howSetupFilingEntityAnswer"),
      },
      {
        question: t("faq.profileSignatures.whatIsFilingEntityType"),
        answer: t("faq.profileSignatures.whatIsFilingEntityTypeAnswer"),
      },
      {
        question: t("faq.profileSignatures.howUploadSignature"),
        answer: t("faq.profileSignatures.howUploadSignatureAnswer"),
      },
      {
        question: t("faq.profileSignatures.whatIsEsignatureConsent"),
        answer: t("faq.profileSignatures.whatIsEsignatureConsentAnswer"),
      },
      {
        question: t("faq.profileSignatures.canUseDifferentSignatures"),
        answer: t("faq.profileSignatures.canUseDifferentSignaturesAnswer"),
      },
      {
        question: t("faq.profileSignatures.doNeedVerifySignature"),
        answer: t("faq.profileSignatures.doNeedVerifySignatureAnswer"),
      },
    ],

    [t("faq.categories.messages")]: [
      {
        question: t("faq.messages.howSendMessage"),
        answer: t("faq.messages.howSendMessageAnswer"),
      },
      {
        question: t("faq.messages.canSendMultipleRecipients"),
        answer: t("faq.messages.canSendMultipleRecipientsAnswer"),
      },
      {
        question: t("faq.messages.areMessagesRealtime"),
        answer: t("faq.messages.areMessagesRealtimeAnswer"),
      },
      {
        question: t("faq.messages.canSearchMessageHistory"),
        answer: t("faq.messages.canSearchMessageHistoryAnswer"),
      },
      {
        question: t("faq.messages.howKnowMessageRead"),
        answer: t("faq.messages.howKnowMessageReadAnswer"),
      },
      {
        question: t("faq.messages.canDeleteMessages"),
        answer: t("faq.messages.canDeleteMessagesAnswer"),
      },
    ],
  };

  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [activeQuestion, setActiveQuestion] = useState(null);

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setActiveQuestion(null);
  };

  const toggleQuestion = (index) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  return (
    <div className="faq-container">
      {/* Category Tabs */}
      <div className="faq-categories">
        {categories.map((category) => (
          <button
            key={category}
            className={`faq-category-btn ${
              activeCategory === category ? "active" : ""
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="faq-section">
        {faqData[activeCategory].map((item, index) => (
          <div
            key={index}
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
              {item.question}
              <span className="arrow">
                {activeQuestion === index ? "▴" : "▾"}
              </span>
            </div>

            {/* Keep answer always rendered, but control via CSS */}
            <div className="faq-answer">{item.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQcomponent;
