import React, { useState } from "react";
import "./FAQ.css";

const FAQcomponent = () => {
  const categories = [
    "Petitions",
    "Notes",
    "Profile & Signatures",
    "Messages",
  ];

  // Static FAQ data (category-wise)
  const faqData = {
  "Petitions": [
    {
      question: "What is a petition?",
      answer:
        "A petition is a formal document created within the platform to file and manage legal foreclosure proceedings. It contains all necessary information about the property, loan details, borrowers, and legal requirements.",
    },
    {
      question: "How do I create a new petition?",
      answer:
        "Click the 'Create Petition' button on your dashboard or go to the Petitions section and select 'New Petition'. Fill in all required information across the multiple steps including property details, loan information, borrower details, and compliance forms.",
    },
    {
      question: "Can I save a petition as a draft?",
      answer:
        "Yes, you can save your petition as a draft at any time during the creation process. Drafts can be edited and completed later before final submission.",
    },
    {
      question: "What happens after I submit a petition?",
      answer:
        "Once submitted, the petition is processed and moves through various status stages including Submitted, Judgment Submitted, Foreclosure Sale Initiated, and eventually Accepted or Closed based on the legal process.",
    },
    {
      question: "Can I edit a petition after submission?",
      answer:
        "Petitions can be edited depending on their current status. Draft petitions can be fully edited, while submitted petitions may have limited editing capabilities based on the workflow stage.",
    },
  ],

  "Notes": [
    {
      question: "What are notes in a petition?",
      answer:
        "Notes allow you to add comments, reminders, or additional information to a petition. They are useful for tracking important details, internal communications, or documenting key events related to the petition.",
    },
    {
      question: "How do I add a note to a petition?",
      answer:
        "Open the petition and click on the 'Notes' dropdown in the options menu. Select 'Add Note' and enter your note text. Notes are saved immediately and are visible to all users with access to the petition.",
    },
    {
      question: "Can I edit or delete notes?",
      answer:
        "Yes, you can edit your own notes by clicking the edit icon next to any note you created. Notes can be modified to update information or correct any errors.",
    },
    {
      question: "Who can see the notes I add?",
      answer:
        "Notes are visible to all users who have access to view the petition. Each note shows the creator's name and timestamp, allowing for clear tracking of who added which information.",
    },
    {
      question: "Are notes required for petition submission?",
      answer:
        "No, notes are optional. They are provided as a convenience feature to help you document important information, but they are not required to complete or submit a petition.",
    },
  ],

  "Profile & Signatures": [
    {
      question: "How do I set up my filing entity information?",
      answer:
        "Go to your profile settings and navigate to the 'Filing Entity' section. Enter your legal entity name, type, address, and contact information. This information is pre-filled when creating new petitions to save time.",
    },
    {
      question: "What is a filing entity type?",
      answer:
        "A filing entity type categorizes your organization (e.g., Corporation, LLC, Partnership, Individual). Select the type that matches your legal entity structure as this information is required for petition submissions.",
    },
    {
      question: "How do I upload my signature?",
      answer:
        "Navigate to your profile settings and find the 'Signature' section. You can upload a signature image file or draw your signature using the provided tools. The signature will be used for electronic signing of petitions.",
    },
    {
      question: "What is e-signature consent?",
      answer:
        "E-signature consent confirms that you agree to use electronic signatures for legal documents. You must provide consent before signatures can be applied to petitions. This is a standard requirement for electronic document execution.",
    },
    {
      question: "Can I use different signatures for different petitions?",
      answer:
        "Your profile signature is your default signature that can be used across all petitions. If you need to use a different signature, you can update your profile signature before signing a petition.",
    },
    {
      question: "Do I need to verify my signature?",
      answer:
        "Yes, signature verification helps ensure security. You may be asked to verify your signature using a one-time password (OTP) sent to your registered email or phone number before it can be used for important documents.",
    },
  ],

  "Messages": [
    {
      question: "How do I send a message?",
      answer:
        "Navigate to the Messages section from your dashboard or navigation menu. Select a recipient or start a new conversation, type your message in the text box, and click send. You can also attach files if needed.",
    },
    {
      question: "Can I send messages to multiple recipients?",
      answer:
        "Yes, you can send messages to multiple recipients by selecting multiple users or organization members when composing a new message. Group conversations help coordinate with teams or multiple stakeholders.",
    },
    {
      question: "Are messages real-time?",
      answer:
        "Yes, the messaging system uses real-time communication technology, so you receive messages instantly when they are sent. You'll see notifications for new messages even when you're on other pages of the application.",
    },
    {
      question: "Can I search my message history?",
      answer:
        "Yes, you can search through your message history using the search function in the Messages section. You can search by sender name, message content, or date range to find specific conversations.",
    },
    {
      question: "How do I know if someone has read my message?",
      answer:
        "The messaging system shows read receipts when your message has been viewed by the recipient. Look for read indicators next to your sent messages to confirm delivery and reading status.",
    },
    {
      question: "Can I delete messages or conversations?",
      answer:
        "Yes, you can delete individual messages or entire conversations from your message list. Deleted messages are removed from your view, but may be retained in the system for record-keeping purposes as required by law.",
    },
  ],
};

  const [activeCategory, setActiveCategory] = useState("Petitions");
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
