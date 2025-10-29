import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PetitionSteps from './PetitionSteps';
import TabBar from './TabBar';
import PetitionTabContent from './PetitionTabContent';
import { useTabs } from '../../context/TabContext';
import { usePetitions } from '../../hooks/usePetitions';
import petitionApiService from '../../services/petitionApiService';
import './TabbedWorkspace.css';

const ViewAllPetitions = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [sortBy, setSortBy] = useState('filingDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1, // API uses 1-based indexing
    totalPages: 1,
    totalCount: 0,
    pageSize: 10
  });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPetitionSteps, setShowPetitionSteps] = useState(false);

  // Use the petitions hook for organization access
  const {
    hasOrganizationAccess,
    organization,
    organizationCheckComplete
  } = usePetitions();

  // Use the tabs context
  const { openTab, getActiveTab } = useTabs();

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setShowCustomDateRange(value === 'custom');
    if (value !== 'custom') {
      setCustomDateFrom('');
      setCustomDateTo('');
    }
  };

  // Fetch petitions using paged API
  const fetchPetitions = async (page = 1) => {
    if (!organization?.id) {
      return;
    }
    
    setLoading(true);
    try {
      const paginationParams = {
        organizationId: organization.id,
        pageNumber: page, // Use 1-based pagination as expected by API
        pageSize: 10, // 10 petitions per page
        searchText: searchQuery.trim() || "",
        status: getStatusValue(statusFilter),
        fromDate: getFromDate(),
        toDate: getToDate(),
        sortColumn: getSortColumn(sortBy),
        sortDirection: sortOrder
      };

      
      const response = await petitionApiService.getPetitionsPaged(paginationParams);
      
      if (response.success) {
        const transformedPetitions = petitionApiService.transformApiResponseToDisplayFormat(response);
        setPetitions(transformedPetitions);
        
        // Update pagination info from API response
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: Math.ceil((response.totalRecords || response.data?.length || 0) / 10),
          totalCount: response.totalRecords || response.data?.length || 0
        }));
      } else {
        toast.error(response.message || 'Failed to fetch petitions');
        setPetitions([]);
      }
    } catch (error) {
      toast.error('Failed to fetch petitions. Please try again.');
      setPetitions([]);
    } finally {
      setLoading(false);
    }
  };


  // Helper function to get status value for API
  const getStatusValue = (status) => {
    const statusMap = {
      'all': null,
      'draft': 0,
      'submitted': 1,
      'resubmitted': 3,
      'accepted': 4,
      'returned': 2,
      'closed': 5
    };
    return statusMap[status] !== undefined ? statusMap[status] : null;
  };

  // Helper function to map frontend sort fields to API sort columns
  const getSortColumn = (sortBy) => {
    const sortColumnMap = {
      'filingDate': 'CreatedDate',    // filingDate maps to CreatedDate
      'lastUpdated': 'ModifiedDate',  // lastUpdated maps to ModifiedDate
      'petitionNumber': 'PetitionNumber' // petitionNumber maps to PetitionNumber
    };
    return sortColumnMap[sortBy] || 'CreatedDate';
  };

  // Helper function to get from date
  const getFromDate = () => {
    if (dateFilter === 'custom' && customDateFrom) {
      return new Date(customDateFrom).toISOString();
    }
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo.toISOString();
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo.toISOString();
    }
    return new Date('2020-01-01').toISOString(); // Default to a very old date
  };

  // Helper function to get to date
  const getToDate = () => {
    if (dateFilter === 'custom' && customDateTo) {
      const toDate = new Date(customDateTo);
      toDate.setHours(23, 59, 59, 999);
      return toDate.toISOString();
    }
    return new Date().toISOString();
  };

  // Reset all filters and refresh data
  const handleRefresh = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setShowCustomDateRange(false);
    setSortBy('filingDate');
    setSortOrder('desc');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchPetitions(1);
  };

  // Handle export functionality
  const handleExport = async (format) => {
    setExporting(true);
    try {
      if (format === 'csv') {
        await exportToCSV();
      } else if (format === 'pdf') {
        await exportToPDF();
      }
      toast.success(`Petitions exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      toast.error('Failed to export petitions. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      // Use current petitions from server
      const allPetitions = petitions;
      const headers = ['Petition Number', 'Property Address', 'Borrower', 'Status', 'Filing Date', 'Last Updated'];
      const csvContent = [
        headers.join(','),
        ...allPetitions.map(petition => [
          petition.id,
          `"${petition.propertyAddress}"`,
          `"${petition.borrower}"`,
          petition.status,
          petition.filingDate,
          petition.lastUpdated
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `petitions_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Failed to export CSV. Please try again.');
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      // Use current petitions from server
      const allPetitions = petitions;
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Petitions Report', 14, 22);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      
      // Prepare table data
      const headers = ['Petition Number', 'Property Address', 'Borrower', 'Status', 'Filing Date', 'Last Updated'];
      const tableData = allPetitions.map(petition => [
        petition.id,
        petition.propertyAddress,
        petition.borrower,
        petition.status,
        petition.filingDate,
        petition.lastUpdated
      ]);

      // Add table using autoTable plugin
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [52, 73, 94], // Dark blue-gray color
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245], // Light gray for alternating rows
        },
        margin: { top: 40 },
        columnStyles: {
          0: { cellWidth: 25 }, // Petition Number
          1: { cellWidth: 60 }, // Property Address
          2: { cellWidth: 30 }, // Borrower
          3: { cellWidth: 20 }, // Status
          4: { cellWidth: 25 }, // Filing Date
          5: { cellWidth: 25 }, // Last Updated
        },
      });

      // Add summary at the bottom
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Total Petitions: ${allPetitions.length}`, 14, finalY);
      
      // Save the PDF
      doc.save(`petitions_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    if (organization?.id && organizationCheckComplete) {
      fetchPetitions(1);
    }
  }, [organization?.id, organizationCheckComplete]);

  // Handle filter changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (organization?.id) {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchPetitions(1);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, dateFilter, customDateFrom, customDateTo]);

  // Handle custom date range changes
  useEffect(() => {
    if (dateFilter === 'custom' && customDateFrom && customDateTo && organization?.id) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchPetitions(1);
    }
  }, [customDateFrom, customDateTo, dateFilter, organization?.id]);

  // Handle sorting changes
  useEffect(() => {
    if (organization?.id) {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchPetitions(1);
    }
  }, [sortBy, sortOrder]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.petition-action-expansion')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  const getStatusBadgeClass = (status, statusClass) => {
    // Use the statusClass from API if available, otherwise fallback to status text
    if (statusClass) {
      return `status-badge status-${statusClass}`;
    }
    
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'status-badge status-accepted';
      case 'submitted':
        return 'status-badge status-submitted';
      case 'resubmitted':
        return 'status-badge status-submitted';
      case 'returned':
        return 'status-badge status-returned';
      case 'draft':
        return 'status-badge status-draft';
      case 'under review':
        return 'status-badge status-under-review';
      case 'rejected':
        return 'status-badge status-rejected';
      case 'closed':
        return 'status-badge status-closed';
      default:
        return 'status-badge';
    }
  };

  const handlePetitionClick = (petition) => {
    openTab(petition);
  };

  const handlePetitionSubmitted = async () => {
    // Reload petitions data to show the latest submitted petition
    try {
      await fetchPetitions(pagination.currentPage);
    } catch (error) {
      // Don't show error toast here as the submission was successful
      // The user will see the success message from the submission itself
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Show loading state while checking organization access or fetching data
  if (loading || !organizationCheckComplete) {
    return (
      <div className="shadow-custom bg-white org-search-box">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading petitions...</p>
        </div>
      </div>
    );
  }

  // Organization access check is now handled at the page level

  return (
    <div className="petitions-workspace">
      {/* Tab Bar */}
      <TabBar />
      
      {/* Tab Content */}
      <div className="tab-content-area">
        {(() => {
          const activeTab = getActiveTab();
          if (!activeTab) return null;
          
          if (activeTab.type === 'all-petitions') {
            return (
              <div className="shadow-custom bg-white org-search-box">
      {/* Header Section - Responsive Layout */}
      <div className="petitions-header-section mb-4">
        {/* Desktop Layout */}
        <div className="d-none d-md-flex align-items-center justify-content-between">
          <h2 className="font-med mb-0">All Petitions</h2>
          
          <div className="d-flex gap-3 align-items-center">
            {/* Create New Petition Button */}
            <button
              className="dashboard-btn-create"
              onClick={() => setShowPetitionSteps(true)}
            >
              <i className="fa-solid fa-plus me-1"></i> Create New Petition
            </button>
            
            {/* Export Dropdown */}
            <div className="dropdown">
              <button
                className="dashboard-btn-refresh"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Export petitions"
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Exporting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-download me-2"></i>
                    Export
                  </>
                )}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                  >
                    <i className="fa-solid fa-file-csv me-2"></i>
                    Export as CSV
                  </button>
                </li>
                <li>
                  <button 
                    className="dropdown-item" 
                    onClick={() => handleExport('pdf')}
                    disabled={exporting}
                  >
                    <i className="fa-solid fa-file-pdf me-2"></i>
                    Export as PDF
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="d-md-none">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="font-med mb-0">Petitions</h2>
          </div>
          
          <div className="row g-2">
            <div className="col-7">
              <button
                className="dashboard-btn-create w-100"
                onClick={() => setShowPetitionSteps(true)}
              >
                <i className="fa-solid fa-plus me-1"></i> Create New Petition
              </button>
            </div>
            <div className="col-4">
              <div className="dropdown w-100">
                <button
                  className="dashboard-btn-refresh w-100"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  title="Export petitions"
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      <span className="d-none d-sm-inline">Exporting...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-download me-1"></i>
                      <span className="d-none d-sm-inline">Export</span>
                    </>
                  )}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleExport('csv')}
                      disabled={exporting}
                    >
                      <i className="fa-solid fa-file-csv me-2"></i>
                      Export as CSV
                    </button>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={() => handleExport('pdf')}
                      disabled={exporting}
                    >
                      <i className="fa-solid fa-file-pdf me-2"></i>
                      Export as PDF
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Search and Filter Controls */}
      <div className="row mb-4 g-3">
        <div className="col-12 col-md-4">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 shadow-none"
              placeholder="Search petitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-6 col-md-2">
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="resubmitted">Resubmitted</option>
            <option value="accepted">Accepted</option>
            <option value="returned">Returned</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select 
            className="form-select"
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div className="col-8 col-md-3">
          <select 
            className="form-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="filingDate-desc">Filing Date (Newest First)</option>
            <option value="filingDate-asc">Filing Date (Oldest First)</option>
            <option value="lastUpdated-desc">Last Updated (Most Recent)</option>
            <option value="lastUpdated-asc">Last Updated (Least Recent)</option>
            <option value="petitionNumber-asc">Petition Number (A-Z)</option>
            <option value="petitionNumber-desc">Petition Number (Z-A)</option>
          </select>
        </div>
        <div className="col-4 col-md-1">
          <button
            className="dashboard-btn-refresh w-100"
            onClick={handleRefresh}
            disabled={loading}
            title="Reset all filters and refresh"
          >
            <i
              className={`fa-solid fa-refresh ${loading ? "fa-spin" : ""}`}
            ></i>
          </button>
        </div>
      </div>

      {/* Custom Date Range */}
      {showCustomDateRange && (
        <div className="row mb-4">
          <div className="col-md-3">
            <label className="form-label">From Date</label>
            <input
              type="date"
              className="form-control"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">To Date</label>
            <input
              type="date"
              className="form-control"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
            />
          </div>
          <div className="col-md-3 d-flex align-items-end gap-2 mb-1">
            <button
              className="dashboard-btn-create"
              onClick={() => {
                setPagination(prev => ({ ...prev, currentPage: 1 }));
                fetchPetitions(1);
              }}
              disabled={!customDateFrom || !customDateTo}
            >
              Apply Filter
            </button>
            <button
              className="dashboard-btn-refresh"
              onClick={() => {
                setDateFilter('all');
                setShowCustomDateRange(false);
                setCustomDateFrom('');
                setCustomDateTo('');
                setPagination(prev => ({ ...prev, currentPage: 1 }));
                fetchPetitions(1);
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="text-muted">
            {(() => {
              const startIndex = (pagination.currentPage - 1) * pagination.pageSize + 1;
              const endIndex = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount);
              return `Showing ${startIndex}-${endIndex} of ${pagination.totalCount} petitions`;
            })()}
            {loading && <span className="ms-2">(Loading...)</span>}
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="d-none d-lg-block table-responsive petition-table-container">
        <table className="table table-hover w-100 mb-0">
          <thead className="table-light">
            <tr>
              <th 
                style={{ width: '18%', minWidth: '160px' }} 
                className="sortable-header"
                onClick={() => handleSort('id')}
              >
                Petition Number
                {sortBy === 'id' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th style={{ width: '32%', minWidth: '280px' }}>Property Address</th>
              <th 
                style={{ width: '14%', minWidth: '110px' }} 
                className="sortable-header"
                onClick={() => handleSort('borrower')}
              >
                Borrower
                {sortBy === 'borrower' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th 
                style={{ width: '11%', minWidth: '90px' }} 
                className="sortable-header"
                onClick={() => handleSort('status')}
              >
                Status
                {sortBy === 'status' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th 
                style={{ width: '13%', minWidth: '110px' }} 
                className="sortable-header"
                onClick={() => handleSort('filingDate')}
              >
                Filing Date
                {sortBy === 'filingDate' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th 
                style={{ width: '13%', minWidth: '120px' }} 
                className="sortable-header"
                onClick={() => handleSort('lastUpdated')}
              >
                Last Updated
                {sortBy === 'lastUpdated' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading petitions...</p>
                </td>
              </tr>
            ) : petitions.length > 0 ? (
              petitions.map((petition) => (
                <tr
                  key={petition.id}
                  className="petition-row"
                >
                  <td>
                    <a 
                      href={`#details-${petition.id}`}
                      className="text-decoration-none fw-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePetitionClick(petition);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {petition.petitionNumber}
                    </a>
                  </td>
                  <td>{petition.propertyAddress}</td>
                  <td>{petition.borrower}</td>
                  <td>
                    <span className={getStatusBadgeClass(petition.status, petition.statusClass)}>
                      {petition.status}
                    </span>
                  </td>
                  <td>{petition.filingDate}</td>
                  <td className="text-muted">{petition.lastUpdated}</td>
                  <td>
                    <div className="petition-action-expansion">
                      <button
                        className="btn btn-sm border-0"
                        type="button"
                        style={{ background: 'transparent', color: '#6c757d' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === petition.id ? null : petition.id);
                        }}
                        title="Actions"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {openDropdownId === petition.id && (
                        <div className="petition-action-buttons">
                          <button 
                            className="btn btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              handlePetitionClick(petition);
                            }}
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-resume"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              // TODO: Implement resume functionality
                            }}
                          >
                            Resume
                          </button>
                          <button 
                            className="btn btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              // TODO: Implement delete functionality
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <i className="fa-solid fa-search text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mb-0">No petitions found matching your criteria</p>
                  <small className="text-muted">Try adjusting your search or filter settings</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="d-lg-none">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading petitions...</p>
          </div>
        ) : petitions.length > 0 ? (
          <div className="row g-3">
            {petitions.map((petition) => (
              <div key={petition.id} className="col-12">
                <div className="petition-mobile-row">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="petition-main-info">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <a 
                          href={`#details-${petition.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePetitionClick(petition);
                          }}
                          className="text-decoration-none fw-medium petition-number"
                          style={{ cursor: 'pointer' }}
                        >
                          {petition.petitionNumber}
                        </a>
                        <span className={getStatusBadgeClass(petition.status, petition.statusClass)}>
                          {petition.status}
                        </span>
                      </div>
                      <div className="petition-details-row">
                        <span className="small text-muted">{petition.propertyAddress}</span>
                        <span className="small text-muted">• {petition.borrower}</span>
                        <span className="small text-muted">• {petition.filingDate}</span>
                      </div>
                    </div>
                    <div className="petition-action-expansion">
                      <button
                        className="btn btn-sm border-0"
                        type="button"
                        style={{ background: 'transparent', color: '#6c757d' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === petition.id ? null : petition.id);
                        }}
                        title="Actions"
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {openDropdownId === petition.id && (
                        <div className="petition-action-buttons">
                          <button 
                            className="btn btn-view"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              handlePetitionClick(petition);
                            }}
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-resume"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              // TODO: Implement resume functionality
                            }}
                          >
                            Resume
                          </button>
                          <button 
                            className="btn btn-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                              // TODO: Implement delete functionality
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <i className="fa-solid fa-search text-muted mb-3" style={{ fontSize: '2rem' }}></i>
            <p className="text-muted mb-0">No petitions found matching your criteria</p>
            <small className="text-muted">Try adjusting your search or filter settings</small>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages >= 1 && (
        <div className="d-flex justify-content-center mt-4">
          <div className="pagination-minimal">
            <button 
              className={`pagination-btn ${pagination.currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => {
                if (pagination.currentPage > 1) {
                  fetchPetitions(pagination.currentPage - 1);
                }
              }}
              disabled={pagination.currentPage === 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Previous
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                <button 
                  key={page}
                  className={`pagination-page ${page === pagination.currentPage ? 'active' : ''}`}
                    onClick={() => fetchPetitions(page)}
                >
                  {page}
                </button>
                );
              })}
            </div>
            
            <button 
              className={`pagination-btn ${pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}`}
              onClick={() => {
                if (pagination.currentPage < pagination.totalPages) {
                  fetchPetitions(pagination.currentPage + 1);
                }
              }}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

              </div>
            );
          } else if (activeTab.type === 'petition') {
            return <PetitionTabContent petition={activeTab.data} />;
          }
          
          return null;
        })()}
      </div>

      {/* Petition Steps Modal */}
      <PetitionSteps 
        isOpen={showPetitionSteps} 
        onClose={() => setShowPetitionSteps(false)}
        organization={organization}
        onPetitionSubmitted={handlePetitionSubmitted}
      />
    </div>
  );
};

export default ViewAllPetitions;
