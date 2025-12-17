import React from "react";
import { useTranslation } from "react-i18next";
import { useTabs } from "../../context/TabContext";

const TabBar = () => {
  const { t } = useTranslation();
  const { tabs, activeTabId, switchToTab, closeTab, loadingTabs } = useTabs();

  return (
    <div className="tab-bar-container">
      <div className="tab-bar">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? "active" : ""}`}
            onClick={() => switchToTab(tab.id)}
          >
            <div className="tab-content">
              <span className="tab-title">
                {tab.id === 'all-petitions' ? t("tabs.allPetitions") : tab.title}
                {loadingTabs.has(tab.id) && (
                  <span className="tab-loading-spinner">
                    <i className="fas fa-spinner fa-spin"></i>
                  </span>
                )}
              </span>
              {tab.isClosable && (
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  title={t("tabs.closeTab")}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabBar;
