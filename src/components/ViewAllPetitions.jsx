import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import petitionService from '../services/petitionService';

const ViewAllPetitions = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('filingDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });

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

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'status-badge status-Accepted';
      case 'submitted':
        return 'status-badge status-Submitted';
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

  const handlePetitionClick = (petitionId) => {
    toast.info(`Opening details for ${petitionId}`);
    // Here you would typically navigate to petition details or open a details modal
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
      <div className="d-flex align-items-center mb-4">
        <button 
          className="btn btn-link text-decoration-none me-3"
          onClick={onBack}
        >
          <i className="fa-solid fa-arrow-left me-2"></i>
          Back to Dashboard
        </button>
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
            <option value="accepted">Accepted</option>
            <option value="returned">Returned</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="col-md-2">
          <select 
            className="form-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
        </div>
        <div className="col-md-2">
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
            <option value="id-asc">Petition # (A-Z)</option>
            <option value="id-desc">Petition # (Z-A)</option>
            <option value="borrower-asc">Borrower (A-Z)</option>
            <option value="borrower-desc">Borrower (Z-A)</option>
            <option value="status-asc">Status (A-Z)</option>
            <option value="status-desc">Status (Z-A)</option>
          </select>
        </div>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
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
                  onClick={() => handlePetitionClick(petition.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <a 
                      href={`#details-${petition.id}`}
                      className="text-decoration-none fw-medium"
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4">
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
    </div>
  );
};

export default ViewAllPetitions;
