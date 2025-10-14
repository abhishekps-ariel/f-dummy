import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const ViewAllPetitions = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredPetitions, setFilteredPetitions] = useState([]);

  // Extended dummy data for all petitions
  const allPetitions = [
    {
      id: 'PN-1001',
      propertyAddress: '123 Main St, Anytown, MA 02101',
      status: 'Accepted',
      filingDate: '2025-09-15',
      lastUpdated: '2025-10-01 10:30 AM',
      borrower: 'John Smith'
    },
    {
      id: 'PN-1002',
      propertyAddress: '45 Baker Ln, Somewhere, MA 02102',
      status: 'Submitted',
      filingDate: '2025-10-05',
      lastUpdated: '2025-10-09 03:15 PM',
      borrower: 'Sarah Johnson'
    },
    {
      id: 'PN-1003',
      propertyAddress: '789 Oak Ave, Cityville, MA 02103',
      status: 'Returned',
      filingDate: '2025-10-08',
      lastUpdated: '2025-10-10 11:00 AM',
      borrower: 'Michael Brown'
    },
    {
      id: 'PN-1004',
      propertyAddress: '32 Pine Ct, Otherplace, MA 02104',
      status: 'Draft',
      filingDate: '2025-10-06',
      lastUpdated: '2025-09-28 09:00 AM',
      borrower: 'Emily Davis'
    },
    {
      id: 'PN-1005',
      propertyAddress: '55 River Rd, Waterton, MA 02105',
      status: 'Closed',
      filingDate: '2025-08-20',
      lastUpdated: '2025-09-15 02:45 PM',
      borrower: 'Robert Wilson'
    },
    {
      id: 'PN-1006',
      propertyAddress: '88 Elm St, Springfield, MA 01103',
      status: 'Accepted',
      filingDate: '2025-09-22',
      lastUpdated: '2025-10-02 08:45 AM',
      borrower: 'Lisa Anderson'
    },
    {
      id: 'PN-1007',
      propertyAddress: '156 Maple Dr, Worcester, MA 01602',
      status: 'Submitted',
      filingDate: '2025-10-12',
      lastUpdated: '2025-10-12 04:20 PM',
      borrower: 'David Martinez'
    },
    {
      id: 'PN-1008',
      propertyAddress: '234 Cedar Ave, Cambridge, MA 02139',
      status: 'Returned',
      filingDate: '2025-10-11',
      lastUpdated: '2025-10-11 01:30 PM',
      borrower: 'Jennifer Taylor'
    },
    {
      id: 'PN-1009',
      propertyAddress: '67 Birch Ln, Newton, MA 02458',
      status: 'Draft',
      filingDate: '2025-10-13',
      lastUpdated: '2025-10-13 10:15 AM',
      borrower: 'Christopher Lee'
    },
    {
      id: 'PN-1010',
      propertyAddress: '189 Spruce St, Quincy, MA 02169',
      status: 'Closed',
      filingDate: '2025-08-15',
      lastUpdated: '2025-09-10 03:00 PM',
      borrower: 'Amanda White'
    },
    {
      id: 'PN-1011',
      propertyAddress: '445 Walnut Rd, Framingham, MA 01701',
      status: 'Accepted',
      filingDate: '2025-09-30',
      lastUpdated: '2025-10-05 11:45 AM',
      borrower: 'Kevin Thompson'
    },
    {
      id: 'PN-1012',
      propertyAddress: '78 Cherry St, Lowell, MA 01852',
      status: 'Submitted',
      filingDate: '2025-10-14',
      lastUpdated: '2025-10-14 09:30 AM',
      borrower: 'Michelle Garcia'
    }
  ];

  // Filter petitions based on search query and status
  useEffect(() => {
    let filtered = allPetitions;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(petition =>
        petition.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        petition.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        petition.borrower.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(petition => 
        petition.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredPetitions(filtered);
  }, [searchQuery, statusFilter]);

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

  const handleExport = () => {
    toast.success('Exporting petition data...');
    // Here you would implement actual export functionality
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
        <div className="col-md-8">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 shadow-none"
              placeholder="Search by petition number, address, or borrower..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4">
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
      </div>

      {/* Results Summary */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="text-muted">
            Showing {filteredPetitions.length} of {allPetitions.length} petitions
          </span>
        </div>
      </div>

      {/* Petitions Table */}
      <div className="table-responsive petition-table-container">
        <table className="table table-striped table-hover w-100">
          <thead className="table-light">
            <tr>
              <th style={{ width: '12%' }}>Petition Number</th>
              <th style={{ width: '35%' }}>Property Address</th>
              <th style={{ width: '15%' }}>Borrower</th>
              <th style={{ width: '12%' }}>Status</th>
              <th style={{ width: '13%' }}>Filing Date</th>
              <th style={{ width: '13%' }}>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredPetitions.length > 0 ? (
              filteredPetitions.map((petition) => (
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

      {/* Pagination (if needed in the future) */}
      {filteredPetitions.length > 10 && (
        <div className="d-flex justify-content-center mt-4">
          <nav aria-label="Petitions pagination">
            <ul className="pagination">
              <li className="page-item disabled">
                <span className="page-link">Previous</span>
              </li>
              <li className="page-item active">
                <span className="page-link">1</span>
              </li>
              <li className="page-item">
                <a className="page-link" href="#">2</a>
              </li>
              <li className="page-item">
                <a className="page-link" href="#">3</a>
              </li>
              <li className="page-item">
                <a className="page-link" href="#">Next</a>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ViewAllPetitions;
