import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PetitionDetailModal from './PetitionDetailModal';
import { usePetitions } from '../../hooks/usePetitions';
import NoOrganizationAccess from './NoOrganizationAccess';
import petitionApiService from '../../services/petitionApiService';

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
    pageSize: 5
  });
  const [showPetitionDetail, setShowPetitionDetail] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use the petitions hook for organization access
  const {
    hasOrganizationAccess,
    organization,
    organizationCheckComplete
  } = usePetitions();

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setShowCustomDateRange(value === 'custom');
    if (value !== 'custom') {
      setCustomDateFrom('');
      setCustomDateTo('');
    }
  };

  // Fetch petitions with fallback to existing endpoint
  const fetchPetitions = async (page = 1) => {
    if (!organization?.id) {
      console.log('No organization ID available');
      return;
    }
    
    console.log('Fetching petitions for organization:', organization.id, 'page:', page);
    setLoading(true);
    try {
      // Try server-side pagination first
      const paginationParams = {
        organizationId: organization.id,
        pageNumber: page, // Send current page number (1-based)
        pageSize: 5, // 5 petitions per page
        searchText: searchQuery.trim() || "",
        status: getStatusValue(statusFilter),
        fromDate: getFromDate(),
        toDate: getToDate(),
        sortBy: sortBy,
        sortOrder: sortOrder
      };

      console.log('Sending pagination params:', paginationParams);
      
      try {
        const response = await petitionApiService.getPetitionsPaged(paginationParams);
        console.log('API Response received:', response);
        
        if (response.success) {
          const transformedPetitions = petitionApiService.transformApiResponseToDisplayFormat(response);
          console.log('Transformed petitions:', transformedPetitions);
          setPetitions(transformedPetitions);
          
          // Update pagination info from API response
          setPagination(prev => ({
            ...prev,
            currentPage: page,
            totalPages: Math.ceil(response.totalRecords / 5),
            totalCount: response.totalRecords
          }));
          return;
        }
      } catch (pagedError) {
        console.log('Server-side pagination not available, falling back to client-side pagination');
        
        // Fallback to existing endpoint with client-side pagination
        const response = await petitionApiService.getPetitionsByOrganization(organization.id);
        
        if (response.isSuccess) {
          const allPetitions = petitionApiService.transformApiResponseToDisplayFormat(response);
          
          // Apply client-side filtering
          const filteredPetitions = applyClientSideFilters(allPetitions);
          
          // Apply client-side pagination
          const startIndex = (page - 1) * 5;
          const paginatedPetitions = filteredPetitions.slice(startIndex, startIndex + 5);
          
          setPetitions(paginatedPetitions);
          
          // Update pagination info
          setPagination(prev => ({
            ...prev,
            currentPage: page,
            totalPages: Math.ceil(filteredPetitions.length / 5),
            totalCount: filteredPetitions.length
          }));
        } else {
          toast.error(response.message || 'Failed to fetch petitions');
          setPetitions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching petitions:', error);
      toast.error('Failed to fetch petitions. Please try again.');
      setPetitions([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filters
  const applyClientSideFilters = (allPetitions) => {
    let filtered = [...allPetitions];

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(petition =>
        (petition.petitionNumber || '').toLowerCase().includes(searchLower) ||
        (petition.propertyAddress || '').toLowerCase().includes(searchLower) ||
        (petition.borrower || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(petition => 
        petition.statusValue === statusFilter
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(petition => {
            const petitionDate = new Date(petition.details.createdDate);
            return petitionDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(petition => {
            const petitionDate = new Date(petition.details.createdDate);
            return petitionDate >= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(petition => {
            const petitionDate = new Date(petition.details.createdDate);
            return petitionDate >= filterDate;
          });
          break;
        case 'custom':
          if (customDateFrom && customDateTo) {
            const fromDate = new Date(customDateFrom);
            const toDate = new Date(customDateTo);
            toDate.setHours(23, 59, 59, 999);
            
            filtered = filtered.filter(petition => {
              const petitionDate = new Date(petition.details.createdDate);
              return petitionDate >= fromDate && petitionDate <= toDate;
            });
          }
          break;
        default:
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'filingDate') {
        aValue = new Date(a.details.createdDate);
        bValue = new Date(b.details.createdDate);
      } else if (sortBy === 'lastUpdated') {
        aValue = new Date(a.details.modifiedDate);
        bValue = new Date(b.details.modifiedDate);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

    return filtered;
  };

  // Helper function to get status value for API
  const getStatusValue = (status) => {
    const statusMap = {
      'all': 0,
      'draft': 0,
      'submitted': 1,
      'resubmitted': 3,
      'accepted': 4,
      'returned': 2,
      'closed': 5
    };
    return statusMap[status] || 0;
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
      console.error('Export error:', error);
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
      console.error('CSV export error:', error);
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
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    console.log('Organization check:', { organization, organizationCheckComplete });
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
    setSelectedPetition(petition);
    setShowPetitionDetail(true);
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

  // Check organization access only after organization check is complete
  if (!hasOrganizationAccess) {
    return <NoOrganizationAccess />;
  }

  return (
    <div className="shadow-custom bg-white org-search-box">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <button 
          className="btn btn-link text-decoration-none me-3"
          onClick={onBack}
        >
          <i className="fa-solid fa-arrow-left me-2"></i>
          Back to Dashboard
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
      {/* Search and Filter Controls */}
      <div className="row mb-4">
        <div className="col-md-6">
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
        <div className="col-md-2">
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
        <div className="col-md-2">
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
        <div className="col-md-2">
          <div className="d-flex gap-2">
            <select 
              className="form-select"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <option value="filingDate-desc">Newest First</option>
              <option value="filingDate-asc">Oldest First</option>
              <option value="lastUpdated-desc">Recently Updated</option>
              <option value="lastUpdated-asc">Least Updated</option>
            </select>
            <button
              className="dashboard-btn-refresh"
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

      {/* Petitions Table */}
      <div className="table-responsive petition-table-container">
        <table className="table table-hover w-100">
          <thead className="table-light">
            <tr>
              <th 
                style={{ width: '12%' }} 
                className="sortable-header"
                onClick={() => handleSort('id')}
              >
                Petition Number
                {sortBy === 'id' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th style={{ width: '35%' }}>Property Address</th>
              <th 
                style={{ width: '15%' }} 
                className="sortable-header"
                onClick={() => handleSort('borrower')}
              >
                Borrower
                {sortBy === 'borrower' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th 
                style={{ width: '12%' }} 
                className="sortable-header"
                onClick={() => handleSort('status')}
              >
                Status
                {sortBy === 'status' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th 
                style={{ width: '13%' }} 
                className="sortable-header"
                onClick={() => handleSort('filingDate')}
              >
                Filing Date
                {sortBy === 'filingDate' && (
                  <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                )}
              </th>
              <th 
                style={{ width: '13%' }} 
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
                              console.log('Resume petition:', petition.id);
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
                              console.log('Delete petition:', petition.id);
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
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

      {/* Petition Detail Modal */}
      {showPetitionDetail && (
        <PetitionDetailModal 
          petition={selectedPetition}
          isOpen={showPetitionDetail} 
          onClose={() => {
            setShowPetitionDetail(false);
            setSelectedPetition(null);
          }} 
        />
      )}
    </div>
  );
};

export default ViewAllPetitions;
