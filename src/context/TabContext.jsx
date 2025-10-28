import React, { createContext, useContext, useState, useEffect } from 'react';

const TabContext = createContext();

export const useTabs = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabProvider');
  }
  return context;
};

export const TabProvider = ({ children }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const savedTabs = localStorage.getItem('petitionTabs');
      const savedActiveTab = localStorage.getItem('activePetitionTab');
      
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        setTabs(parsedTabs);
        
        if (savedActiveTab && parsedTabs.some(tab => tab.id === savedActiveTab)) {
          setActiveTabId(savedActiveTab);
        } else if (parsedTabs.length > 0) {
          setActiveTabId(parsedTabs[0].id);
        }
      } else {
        // Initialize with default "All Petitions" tab
        const defaultTabs = [{
          id: 'all-petitions',
          title: 'All Petitions',
          type: 'all-petitions',
          data: null,
          isClosable: false
        }];
        setTabs(defaultTabs);
        setActiveTabId('all-petitions');
        localStorage.setItem('petitionTabs', JSON.stringify(defaultTabs));
        localStorage.setItem('activePetitionTab', 'all-petitions');
      }
    } catch (error) {
      console.error('Error loading tabs from localStorage:', error);
      // Fallback to default tab
      const defaultTabs = [{
        id: 'all-petitions',
        title: 'All Petitions',
        type: 'all-petitions',
        data: null,
        isClosable: false
      }];
      setTabs(defaultTabs);
      setActiveTabId('all-petitions');
    }
  }, []);

  // Save tabs to localStorage whenever tabs change
  useEffect(() => {
    if (tabs.length > 0) {
      try {
        localStorage.setItem('petitionTabs', JSON.stringify(tabs));
      } catch (error) {
        console.error('Error saving tabs to localStorage:', error);
      }
    }
  }, [tabs]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (activeTabId) {
      try {
        localStorage.setItem('activePetitionTab', activeTabId);
      } catch (error) {
        console.error('Error saving active tab to localStorage:', error);
      }
    }
  }, [activeTabId]);

  const openTab = (petition) => {
    const tabId = `petition-${petition.id}`;
    
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.id === tabId);
    if (existingTab) {
      // Switch to existing tab
      setActiveTabId(tabId);
      return;
    }

    // Create new tab
    const newTab = {
      id: tabId,
      title: petition.petitionNumber,
      type: 'petition',
      data: petition,
      isClosable: true
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(tabId);
  };

  const closeTab = (tabId) => {
    // Don't allow closing the "All Petitions" tab
    if (tabId === 'all-petitions') {
      return;
    }

    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      
      // If we're closing the active tab, switch to another tab
      if (tabId === activeTabId) {
        const currentIndex = prevTabs.findIndex(tab => tab.id === tabId);
        let newActiveTabId;
        
        if (newTabs.length > 0) {
          // Try to switch to the next tab, or previous if at the end
          if (currentIndex < newTabs.length) {
            newActiveTabId = newTabs[currentIndex].id;
          } else {
            newActiveTabId = newTabs[newTabs.length - 1].id;
          }
        } else {
          // Fallback to "All Petitions" tab
          newActiveTabId = 'all-petitions';
        }
        
        setActiveTabId(newActiveTabId);
      }
      
      return newTabs;
    });
  };

  const switchToTab = (tabId) => {
    setActiveTabId(tabId);
  };

  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTabId);
  };

  const value = {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    switchToTab,
    getActiveTab
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
};

export default TabContext;
