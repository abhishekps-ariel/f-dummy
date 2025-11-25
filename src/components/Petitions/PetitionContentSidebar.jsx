import React from "react";
import { useTranslation } from "react-i18next";

const PetitionContentSidebar = ({ sections, activeSection, onSectionClick }) => {
  const { t } = useTranslation();

  return (
    <aside className="petition-content-sidebar">
      <div className="sidebar-header">
        <h6 className="sidebar-title">{t("petitionTabContent.petitionSections") || "Petition Sections"}</h6>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {sections.map((section) => (
            <li key={section.id} className="sidebar-nav-item">
              <button
                className={`sidebar-nav-link ${activeSection === section.id ? 'active' : ''}`}
                onClick={(e) => onSectionClick(section.id, e)}
                title={section.title}
                type="button"
              >
                <i className={`fas ${section.icon} sidebar-icon`}></i>
                <span className="sidebar-text">{section.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default PetitionContentSidebar;

