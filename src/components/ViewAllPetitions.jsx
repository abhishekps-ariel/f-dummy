import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import petitionService from '../services/petitionService';
import PetitionDetailModal from './PetitionDetailModal';

const ViewAllPetitions = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [sortBy, setSortBy] = useState('filingDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });
  const [showPetitionDetail, setShowPetitionDetail] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setShowCustomDateRange(value === 'custom');
    if (value !== 'custom') {
      setCustomDateFrom('');
      setCustomDateTo('');
    }
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
    loadPetitions(1);
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
      // Fetch all petitions data without pagination limits
      const response = await petitionService.getPetitions({
        page: 1,
        limit: 10000, // Large number to get all records
        search: searchQuery,
        status: statusFilter,
        dateFilter: dateFilter,
        customDateFrom: dateFilter === 'custom' ? customDateFrom : '',
        customDateTo: dateFilter === 'custom' ? customDateTo : '',
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (!response.success) {
        toast.error('Failed to fetch data for export');
        return;
      }

      const allPetitions = response.data;
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
      // Fetch all petitions data without pagination limits
      const response = await petitionService.getPetitions({
        page: 1,
        limit: 10000, // Large number to get all records
        search: searchQuery,
        status: statusFilter,
        dateFilter: dateFilter,
        customDateFrom: dateFilter === 'custom' ? customDateFrom : '',
        customDateTo: dateFilter === 'custom' ? customDateTo : '',
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (!response.success) {
        toast.error('Failed to fetch data for export');
        return;
      }

      const allPetitions = response.data;
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

  // Load petitions with filters and pagination
  const loadPetitions = async (page = 1) => {
    setLoading(true);
    try {
      const response = await petitionService.getPetitions({
        page,
        limit: pagination.limit,
        search: searchQuery,
        status: statusFilter,
        dateFilter: dateFilter,
        customDateFrom: dateFilter === 'custom' ? customDateFrom : '',
        customDateTo: dateFilter === 'custom' ? customDateTo : '',
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.success) {
        setPetitions(response.data);
        setPagination(response.pagination);
      } else {
        toast.error('Failed to load petitions');
      }
    } catch (error) {
      console.error('Error loading petitions:', error);
      toast.error('Error loading petitions');
    } finally {
      setLoading(false);
    }
  };

  // Load petitions when filters or sorting change
  useEffect(() => {
    loadPetitions(1);
  }, [searchQuery, statusFilter, dateFilter, sortBy, sortOrder]);

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

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'status-badge status-Accepted';
      case 'submitted':
        return 'status-badge status-Submitted';
      case 'resubmitted':
        return 'status-badge status-Resubmitted';
      case 'returned':
        return 'status-badge status-Returned';
      case 'draft':
        return 'status-badge status-Draft';
      case 'closed':
        return 'status-badge status-Closed';
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
              onClick={() => loadPetitions(1)}
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
                loadPetitions(1);
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
            Showing {petitions.length} of {pagination.totalCount} petitions
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
                      {petition.id}
                    </a>
                  </td>
                  <td>{petition.propertyAddress}</td>
                  <td>{petition.borrower}</td>
                  <td>
                    <span className={getStatusBadgeClass(petition.status)}>
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
              className={`pagination-btn ${!pagination.hasPrevPage ? 'disabled' : ''}`}
              onClick={() => loadPetitions(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Previous
            </button>
            
            <div className="pagination-pages">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  className={`pagination-page ${page === pagination.currentPage ? 'active' : ''}`}
                  onClick={() => loadPetitions(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              className={`pagination-btn ${!pagination.hasNextPage ? 'disabled' : ''}`}
              onClick={() => loadPetitions(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
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
