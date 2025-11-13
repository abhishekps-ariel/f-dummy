import React, { useState } from "react";
import "./FAQ.css";

const FAQcomponent = () => {
  const categories = [
    "Petitions",
    "Organization Users",
    "Adding Petitions",
    "Join Requests",
    "1st category",
    "2nd category",
    "3rd category",
  ];

  // Static FAQ data (category-wise)
  const faqData = {
  "Petitions": [
    {
      question: "What is a petition?",
      answer:
        "A petition is a formal request created within the platform to raise awareness or gather support for a particular cause, issue, or organizational concern.",
    },
    {
      question: "Who can create a petition?",
      answer:
        "Only verified organization users or members with appropriate permissions can create new petitions under their organization.",
    },
    {
      question: "How can I view all petitions of my organization?",
      answer:
        "Go to the 'Petitions' tab on your dashboard. There, you can view all active, pending, and closed petitions created under your organization.",
    },
    {
      question: "Can I edit a petition after publishing it?",
      answer:
        "Petitions can only be edited while they are in draft mode. Once published, only administrators can make minor corrections like title or description updates.",
    },
  ],

  "Organizations": [
    {
      question: "What is an organization in the petition system?",
      answer:
        "An organization represents a verified group or institution that manages petitions, users, and approval workflows within the platform.",
    },
    {
      question: "How do I create a new organization?",
      answer:
        "Navigate to the 'Organizations' section and click 'Create Organization'. Fill in the details such as name, description, and contact information, then submit for admin approval.",
    },
    {
      question: "Can an organization have multiple admins?",
      answer:
        "Yes. Each organization can have multiple admins who can manage petitions, users, and incoming join requests.",
    },
    {
      question: "How can I deactivate an organization?",
      answer:
        "Only super admins can deactivate an organization. Once deactivated, all petitions and users under that organization become inactive until reactivated.",
    },
  ],

  "Organization Users": [
    {
      question: "Who are organization users?",
      answer:
        "Organization users are members who belong to a specific organization. They can have roles such as Admin, Editor, or Viewer with different permission levels.",
    },
    {
      question: "How can an admin add users to their organization?",
      answer:
        "Admins can invite users by navigating to 'Organization Users' → 'Add User', entering their email address, and assigning a role. Invited users receive an email link to join.",
    },
    {
      question: "Can I change a user's role later?",
      answer:
        "Yes, organization admins can modify user roles anytime from the 'Manage Users' section in the organization's dashboard.",
    },
    {
      question: "What happens if a user leaves an organization?",
      answer:
        "When a user leaves or is removed, their access to petitions and organization data is revoked immediately, but their past contributions remain logged for recordkeeping.",
    },
  ],

  "Adding Petitions": [
    {
      question: "How do I add a new petition?",
      answer:
        "Click the 'Add Petition' button on your dashboard, fill in the required fields (title, description, category, and goal), attach relevant media if needed, and save or publish.",
    },
    {
      question: "Can I assign petitions to specific teams?",
      answer:
        "Yes. While creating a petition, you can assign it to a specific team or department under your organization to track progress and manage updates more efficiently.",
    },
    {
      question: "Are there any restrictions on petition titles or content?",
      answer:
        "Petition titles must be unique within your organization and should not contain any inappropriate or offensive content. All petitions are subject to review by moderators.",
    },
    {
      question: "What happens after a petition is submitted?",
      answer:
        "Once a petition is submitted, it moves into the review phase where admins verify the content. After approval, it becomes visible to other organization users and supporters.",
    },
  ],

  "Join Requests": [
    {
      question: "What is a join request?",
      answer:
        "A join request is a formal request sent by a user to join an existing organization on the platform.",
    },
    {
      question: "How can I send a join request?",
      answer:
        "Visit the 'Organizations' page, find the organization you want to join, and click 'Send Join Request'. You can include a short note explaining your purpose.",
    },
    {
      question: "Who approves join requests?",
      answer:
        "Join requests are reviewed and approved by organization admins. Once approved, you will receive an email confirmation and gain access to the organization's dashboard.",
    },
    {
      question: "Can I cancel my join request?",
      answer:
        "Yes, you can cancel your join request anytime before it’s approved by navigating to your ‘Pending Requests’ section and clicking ‘Cancel’.",
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
