import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllOrganizationJoinRequests } from '../services/organizationService';
import { getUserById } from '../services/authService';

const JoinRequestTabContext = createContext();

export const useJoinRequestTabs = () => {
  const context = useContext(JoinRequestTabContext);
  if (!context) {
    throw new Error('useJoinRequestTabs must be used within a JoinRequestTabProvider');
  }
  return context;
};

export const JoinRequestTabProvider = ({ children }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [loadingTabs, setLoadingTabs] = useState(new Set());

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const savedTabs = localStorage.getItem('joinRequestTabs');
      const savedActiveTab = localStorage.getItem('activeJoinRequestTab');
      
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        // Restore tabs without data - data will be fetched when tab is activated
        const restoredTabs = parsedTabs.map(tab => ({
          ...tab,
          data: null,
          isLoading: false
        }));
        setTabs(restoredTabs);
        
        if (savedActiveTab && parsedTabs.some(tab => tab.id === savedActiveTab)) {
          setActiveTabId(savedActiveTab);
        } else if (parsedTabs.length > 0) {
          setActiveTabId(parsedTabs[0].id);
        }
      } else {
        // Initialize with default "All Join Requests" tab
        const defaultTabs = [{
          id: 'all-join-requests',
          title: 'All Join Requests',
          type: 'all-join-requests',
          data: null,
          isClosable: false
        }];
        setTabs(defaultTabs);
        setActiveTabId('all-join-requests');
        localStorage.setItem('joinRequestTabs', JSON.stringify(defaultTabs));
        localStorage.setItem('activeJoinRequestTab', 'all-join-requests');
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
      setTabs(defaultTabs);
      setActiveTabId('all-join-requests');
    }
  }, []);

  // Save tabs to localStorage whenever tabs change (without data to avoid stale data)
  useEffect(() => {
    if (tabs.length > 0) {
      try {
        // Only save tab metadata, not the data to avoid stale data issues
        const tabsToSave = tabs.map(tab => ({
          id: tab.id,
          title: tab.title,
          type: tab.type,
          isClosable: tab.isClosable,
          requestId: tab.type === 'join-request' ? tab.id.replace('join-request-', '') : null
        }));
        localStorage.setItem('joinRequestTabs', JSON.stringify(tabsToSave));
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

  // Fetch data for active tab when it changes
  useEffect(() => {
    const fetchActiveTabData = async () => {
      if (!activeTabId) return;
      
      const tab = tabs.find(t => t.id === activeTabId);
      
      // If it's a join request tab and data is missing, fetch fresh data
      if (tab && tab.type === 'join-request' && !tab.data && !tab.isLoading) {
        const requestId = tab.id.replace('join-request-', '');
        const organizationId = tab.organizationId;
        
        if (!organizationId) return;
        
        // Set loading state
        setTabs(prevTabs => 
          prevTabs.map(t => 
            t.id === activeTabId ? { ...t, isLoading: true } : t
          )
        );
        setLoadingTabs(prev => new Set([...prev, activeTabId]));
        
        try {
          // Fetch all join requests for the organization
          const response = await getAllOrganizationJoinRequests(organizationId);
          
          if (response.isSuccess && Array.isArray(response.data)) {
            // Find the specific request
            const request = response.data.find(r => r.id === requestId);
            
            if (request) {
              // Fetch user details
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
              
              // Update tab with detailed data
              setTabs(prevTabs => 
                prevTabs.map(t => 
                  t.id === activeTabId 
                    ? {
                        ...t,
                        title: userDetails?.fullName || userDetails?.email || request.email || 'Join Request',
                        data: {
                          request,
                          userDetails
                        },
                        isLoading: false
                      }
                    : t
                )
              );
            }
          }
        } catch (error) {
          // Update tab to show error state
          setTabs(prevTabs => 
            prevTabs.map(t => 
              t.id === activeTabId 
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
            newSet.delete(activeTabId);
            return newSet;
          });
        }
      }
    };
    
    fetchActiveTabData();
  }, [activeTabId, tabs]);

  const openTab = async (request, organizationId) => {
    const tabId = `join-request-${request.id}`;
    
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.id === tabId);
    if (existingTab) {
      // Switch to existing tab and refresh data
      await switchToTab(tabId);
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
      organizationId: organizationId
    };

    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(tabId);
    setLoadingTabs(prev => new Set([...prev, tabId]));

    try {
      // Fetch user details
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
      
      // Update tab with data
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

  const switchToTab = async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    
    // If it's a join request tab and data is missing, fetch fresh data
    if (tab && tab.type === 'join-request' && !tab.data && !tab.isLoading) {
      const requestId = tab.id.replace('join-request-', '');
      const organizationId = tab.organizationId;
      
      if (!organizationId) {
        setActiveTabId(tabId);
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
        // Fetch all join requests
        const response = await getAllOrganizationJoinRequests(organizationId);
        
        if (response.isSuccess && Array.isArray(response.data)) {
          const request = response.data.find(r => r.id === requestId);
          
          if (request) {
            // Fetch user details
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
            
            // Update tab with fresh data
            setTabs(prevTabs => 
              prevTabs.map(t => 
                t.id === tabId 
                  ? {
                      ...t,
                      title: userDetails?.fullName || userDetails?.email || request.email || 'Join Request',
                      data: {
                        request,
                        userDetails
                      },
                      isLoading: false
                    }
                  : t
              )
            );
          }
        }
      } catch (error) {
        // Update tab to show error state
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
    }
    
    setActiveTabId(tabId);
  };

  const getActiveTab = () => {
    return tabs.find(tab => tab.id === activeTabId);
  };

  // Refresh a specific tab's data
  const refreshTab = async (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tab.type !== 'join-request') return;
    
    const requestId = tab.id.replace('join-request-', '');
    const organizationId = tab.organizationId;
    
    if (!organizationId) return;
    
    // Set loading state
    setTabs(prevTabs => 
      prevTabs.map(t => 
        t.id === tabId ? { ...t, isLoading: true, data: null } : t
      )
    );
    setLoadingTabs(prev => new Set([...prev, tabId]));
    
    try {
      // Fetch all join requests
      const response = await getAllOrganizationJoinRequests(organizationId);
      
      if (response.isSuccess && Array.isArray(response.data)) {
        const request = response.data.find(r => r.id === requestId);
        
        if (request) {
          // Fetch user details
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
          
          // Update tab with fresh data
          setTabs(prevTabs => 
            prevTabs.map(t => 
              t.id === tabId 
                ? {
                    ...t,
                    title: userDetails?.fullName || userDetails?.email || request.email || 'Join Request',
                    data: {
                      request,
                      userDetails
                    },
                    isLoading: false
                  }
                : t
            )
          );
        }
      }
    } catch (error) {
      // Keep existing data on error
      setTabs(prevTabs => 
        prevTabs.map(t => 
          t.id === tabId 
            ? {
                ...t,
                isLoading: false
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

