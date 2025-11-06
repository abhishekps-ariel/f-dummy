import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserById } from '../services/authService';
import { getAllOrganizationJoinRequests } from '../services/organizationService';

const JoinRequestTabContext = createContext();

export const useJoinRequestTabs = () => {
  const context = useContext(JoinRequestTabContext);
  if (!context) {
    throw new Error('useJoinRequestTabs must be used within a JoinRequestTabProvider');
  }
  return context;
};

// Helper function to load initial state from localStorage
const loadInitialState = () => {
  try {
    const savedTabs = localStorage.getItem('joinRequestTabs');
    const savedActiveTab = localStorage.getItem('activeJoinRequestTab');
    
    if (savedTabs) {
      const parsedTabs = JSON.parse(savedTabs);
      // Restore tabs with their stored data
      const restoredTabs = parsedTabs.map(tab => ({
        ...tab,
        isLoading: false
      }));
      
      let activeId = null;
      if (savedActiveTab && parsedTabs.some(tab => tab.id === savedActiveTab)) {
        activeId = savedActiveTab;
      } else if (parsedTabs.length > 0) {
        activeId = parsedTabs[0].id;
      }
      
      return { tabs: restoredTabs, activeTabId: activeId };
    } else {
      // Initialize with default "All Join Requests" tab
      const defaultTabs = [{
        id: 'all-join-requests',
        title: 'All Join Requests',
        type: 'all-join-requests',
        data: null,
        isClosable: false
      }];
      localStorage.setItem('joinRequestTabs', JSON.stringify(defaultTabs));
      localStorage.setItem('activeJoinRequestTab', 'all-join-requests');
      return { tabs: defaultTabs, activeTabId: 'all-join-requests' };
    }
  } catch (error) {
    // Fallback to default tab
    const defaultTabs = [{
      id: 'all-join-requests',
      title: 'All Join Requests',
      type: 'all-join-requests',
      data: null,
      isClosable: false
    }];
    return { tabs: defaultTabs, activeTabId: 'all-join-requests' };
  }
};

export const JoinRequestTabProvider = ({ children }) => {
  const initialState = loadInitialState();
  const [tabs, setTabs] = useState(initialState.tabs);
  const [activeTabId, setActiveTabId] = useState(initialState.activeTabId);
  const [loadingTabs, setLoadingTabs] = useState(new Set());

  // Save tabs to localStorage whenever tabs change (including data)
  useEffect(() => {
    if (tabs.length > 0) {
      try {
        // Save tabs with their data to localStorage
        localStorage.setItem('joinRequestTabs', JSON.stringify(tabs));
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }, [tabs]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (activeTabId) {
      try {
        localStorage.setItem('activeJoinRequestTab', activeTabId);
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }, [activeTabId]);

  const openTab = async (request, organizationId) => {
    const tabId = `join-request-${request.id}`;
    
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.id === tabId);
    if (existingTab) {
      // Switch to existing tab
      setActiveTabId(tabId);
      return;
    }

    // Create new tab with loading state
    const newTab = {
      id: tabId,
      title: request.userEmail || request.email || 'Loading...',
      type: 'join-request',
      data: null,
      isClosable: true,
      isLoading: true,
      organizationId: organizationId,
      userId: request.userId // Store userId for future use
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(tabId);
    setLoadingTabs(prev => new Set([...prev, tabId]));

    try {
      // Fetch user details using getUserById
      let userDetails = null;
      if (request.userId) {
        try {
          const userResponse = await getUserById(request.userId);
          if (userResponse.isSuccess && userResponse.data) {
            userDetails = userResponse.data;
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }
      
      // Update tab with data (this will be saved to localStorage via useEffect)
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === tabId 
            ? {
                ...tab,
                title: userDetails?.fullName || userDetails?.email || request.email || 'Join Request',
                data: {
                  request,
                  userDetails
                },
                isLoading: false
              }
            : tab
        )
      );
    } catch (error) {
      // Update tab to show error state
      setTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === tabId 
            ? {
                ...tab,
                title: request.email || 'Error',
                data: { request, userDetails: null },
                isLoading: false,
                hasError: true
              }
            : tab
        )
      );
    } finally {
      setLoadingTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tabId);
        return newSet;
      });
    }
  };

  const closeTab = (tabId) => {
    // Don't allow closing the "All Join Requests" tab
    if (tabId === 'all-join-requests') {
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
          // Fallback to "All Join Requests" tab
          newActiveTabId = 'all-join-requests';
        }
        
        setActiveTabId(newActiveTabId);
      }
      
      return newTabs;
    });
  };

  const switchToTab = (tabId) => {
    // Simply switch to the tab - data is already stored in localStorage
    setActiveTabId(tabId);
  };

  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTabId);
  };

  // Refresh a specific tab's data by fetching updated request from list API and user details
  const refreshTab = async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tab.type !== 'join-request') return;
    
    // Get request ID and organizationId from tab
    const requestId = tab.id.replace('join-request-', '');
    const organizationId = tab.organizationId || tab.data?.request?.organizationId;
    
    if (!organizationId) {
      console.error('No organizationId found for tab:', tabId);
      return;
    }
    
    // Set loading state
    setTabs(prevTabs => 
      prevTabs.map(t => 
        t.id === tabId ? { ...t, isLoading: true } : t
      )
    );
    setLoadingTabs(prev => new Set([...prev, tabId]));
    
    try {
      // Fetch updated request from list API (same as when opening tab)
      // Use minimal filters to get all requests, then find the specific one
      const filters = {
        status: null, // Get all statuses
        searchTerm: '',
        pageNumber: 0,
        pageSize: 100, // Get enough to find our request
        startDate: '2020-01-01T00:00:00.000Z',
        endDate: new Date().toISOString(),
      };
      
      const response = await getAllOrganizationJoinRequests(organizationId, filters);
      
      if (response.isSuccess && response.data) {
        // Find the specific request by ID
        const updatedRequest = Array.isArray(response.data) 
          ? response.data.find(req => req.id === requestId)
          : null;
        
        if (!updatedRequest) {
          console.error('Request not found in list:', requestId);
          // Keep existing data but mark as error
          setTabs(prevTabs => 
            prevTabs.map(t => 
              t.id === tabId 
                ? {
                    ...t,
                    isLoading: false,
                    hasError: true
                  }
                : t
            )
          );
          return;
        }
        
        // Fetch fresh user details using getUserById
        let userDetails = null;
        if (updatedRequest.userId) {
          try {
            const userResponse = await getUserById(updatedRequest.userId);
            if (userResponse.isSuccess && userResponse.data) {
              userDetails = userResponse.data;
            }
          } catch (error) {
            console.error('Error fetching user details:', error);
            // Use existing user details if available
            userDetails = tab.data?.userDetails || null;
          }
        }
        
        // Update tab with fresh data (both request and user details)
        setTabs(prevTabs => 
          prevTabs.map(t => 
            t.id === tabId 
              ? {
                  ...t,
                  title: userDetails?.fullName || userDetails?.email || updatedRequest.email || 'Join Request',
                  data: {
                    request: updatedRequest,
                    userDetails: userDetails || tab.data?.userDetails
                  },
                  isLoading: false,
                  hasError: false
                }
              : t
          )
        );
      } else {
        console.error('Failed to fetch updated request:', response.msg);
        // Keep existing data but mark as error
        setTabs(prevTabs => 
          prevTabs.map(t => 
            t.id === tabId 
              ? {
                  ...t,
                  isLoading: false,
                  hasError: true
                }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Error refreshing join request tab:', error);
      // Keep existing data on error
      setTabs(prevTabs => 
        prevTabs.map(t => 
          t.id === tabId 
            ? {
                ...t,
                isLoading: false,
                hasError: true
              }
            : t
        )
      );
    } finally {
      setLoadingTabs(prev => {
        const newSet = new Set(prev);
        newSet.delete(tabId);
        return newSet;
      });
    }
  };

  const value = {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    switchToTab,
    getActiveTab,
    loadingTabs,
    refreshTab
  };

  return (
    <JoinRequestTabContext.Provider value={value}>
      {children}
    </JoinRequestTabContext.Provider>
  );
};

export default JoinRequestTabContext;
