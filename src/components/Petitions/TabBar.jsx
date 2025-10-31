import React from "react";
import { useTabs } from "../../context/TabContext";

const TabBar = () => {
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
                {tab.title}
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
                  title="Close tab"
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
