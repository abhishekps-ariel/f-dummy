// Mock petition data - This will be replaced with actual API calls later
const mockPetitions = [
  {
    id: 'PN-1001',
    propertyAddress: '123 Main St, Anytown, MA 02101',
    status: 'Accepted',
    filingDate: '2025-09-15',
    lastUpdated: '2025-10-01 10:30 AM',
    borrower: 'John Smith',
    loanAmount: '$450,000',
    county: 'Suffolk',
    details: {
      // Step 1: Property Details
      street_address_line_1: '123 Main St',
      street_address_line_2: '',
      city: 'Anytown',
      state: 'MA',
      zip_code: '02101',
      county: 'Suffolk',
      
      // Step 2: Loan Details
      loan_account_number: 'LOAN-123456789',
      lien_position: 'First',
      loan_type_term: '30-Year Fixed',
      year_originated: '2020',
      original_amount: 450000,
      current_amount: 425000,
      original_rate: 3.5,
      current_rate: 3.5,
      
      // Step 3: Borrower Details
      borrowers: [
        {
          id: 1,
          first_name: 'John',
          middle_initial: 'A',
          last_name: 'Smith'
        }
      ],
      
      // Step 4: Filing Entity
      organization_name: 'First National Bank',
      contact_first_name: 'Sarah',
      contact_last_name: 'Johnson',
      contact_phone: '(555) 123-4567',
      contact_email: 'sarah.johnson@fnb.com',
      
      // Step 5: Right-to-Cure
      notice_date: '2025-08-15',
      days_delinquent: 90,
      amount_default: 15000,
      cure_expiration_date: '2025-09-15',
      notice_mailing_address: '123 Main St, Anytown, MA 02101',
      acceleration_date: '',
      
      // Step 6: Form 35B Compliance
      form_35b_upload: 'form_35b_pn1001.pdf',
      affiant_name: 'Michael Brown',
      affiant_title: 'Loan Officer',
      affidavit_date: '2025-08-20',
      notary_info: 'Jane Doe, Commission Expires 12/31/2026',
      
      // Step 7: Loan Assignees
      assignee_lender_name_1: 'First National Bank',
      assignee_lender_type_1: 'Commercial Bank',
      assignee_originator_name_1: 'ABC Mortgage Corp',
      assignee_license_number_1: 'MB-12345',
      assignee_license_state_1: 'MA',
      assignee_lender_address_1: '100 Financial Plaza, Boston, MA 02110',
      
      // Step 8: Petition Attestation
      attester_first_name: 'Sarah',
      attester_middle_initial: 'M',
      attester_last_name: 'Johnson',
      certification_check: true
    }
  },
  {
    id: 'PN-1002',
    propertyAddress: '45 Baker Ln, Somewhere, MA 02102',
    status: 'Resubmitted',
    filingDate: '2025-10-05',
    lastUpdated: '2025-10-09 03:15 PM',
    borrower: 'Sarah Johnson',
    loanAmount: '$320,000',
    county: 'Middlesex',
    details: {
      // Step 1: Property Details
      street_address_line_1: '45 Baker Ln',
      street_address_line_2: 'Apt 2B',
      city: 'Somewhere',
      state: 'MA',
      zip_code: '02102',
      county: 'Middlesex',
      
      // Step 2: Loan Details
      loan_account_number: 'LOAN-987654321',
      lien_position: 'First',
      loan_type_term: '15-Year Fixed',
      year_originated: '2018',
      original_amount: 320000,
      current_amount: 280000,
      original_rate: 4.2,
      current_rate: 4.2,
      
      // Step 3: Borrower Details
      borrowers: [
        {
          id: 1,
          first_name: 'Sarah',
          middle_initial: 'L',
          last_name: 'Johnson'
        }
      ],
      
      // Step 4: Filing Entity
      organization_name: 'Community Credit Union',
      contact_first_name: 'Robert',
      contact_last_name: 'Wilson',
      contact_phone: '(555) 987-6543',
      contact_email: 'robert.wilson@ccu.org',
      
      // Step 5: Right-to-Cure
      notice_date: '2025-09-20',
      days_delinquent: 75,
      amount_default: 12000,
      cure_expiration_date: '2025-10-20',
      notice_mailing_address: '45 Baker Ln, Somewhere, MA 02102',
      acceleration_date: '',
      
      // Step 6: Form 35B Compliance
      form_35b_upload: null,
      affiant_name: '',
      affiant_title: '',
      affidavit_date: '',
      notary_info: '',
      
      // Step 7: Loan Assignees
      assignee_lender_name_1: 'Community Credit Union',
      assignee_lender_type_1: 'Credit Union',
      assignee_originator_name_1: 'Local Mortgage LLC',
      assignee_license_number_1: 'MB-67890',
      assignee_license_state_1: 'MA',
      assignee_lender_address_1: '200 Community St, Cambridge, MA 02139',
      
      // Step 8: Petition Attestation
      attester_first_name: 'Robert',
      attester_middle_initial: 'K',
      attester_last_name: 'Wilson',
      certification_check: true
    }
  },
  {
    id: 'PN-1003',
    propertyAddress: '789 Oak Ave, Cityville, MA 02103',
    status: 'Returned',
    filingDate: '2025-10-08',
    lastUpdated: '2025-10-10 11:00 AM',
    borrower: 'Michael Brown',
    loanAmount: '$280,000',
    county: 'Essex',
    details: {
      // Step 1: Property Details
      street_address_line_1: '789 Oak Ave',
      street_address_line_2: '',
      city: 'Cityville',
      state: 'MA',
      zip_code: '02103',
      county: 'Essex',
      
      // Step 2: Loan Details
      loan_account_number: 'LOAN-456789123',
      lien_position: 'Second',
      loan_type_term: '20-Year ARM',
      year_originated: '2019',
      original_amount: 280000,
      current_amount: 260000,
      original_rate: 3.8,
      current_rate: 4.1,
      
      // Step 3: Borrower Details
      borrowers: [
        {
          id: 1,
          first_name: 'Michael',
          middle_initial: 'D',
          last_name: 'Brown'
        },
        {
          id: 2,
          first_name: 'Jennifer',
          middle_initial: 'S',
          last_name: 'Brown'
        }
      ],
      
      // Step 4: Filing Entity
      organization_name: 'Regional Bank Corp',
      contact_first_name: 'Lisa',
      contact_last_name: 'Anderson',
      contact_phone: '(555) 456-7890',
      contact_email: 'lisa.anderson@regionalbank.com',
      
      // Step 5: Right-to-Cure
      notice_date: '2025-09-25',
      days_delinquent: 60,
      amount_default: 8500,
      cure_expiration_date: '2025-10-25',
      notice_mailing_address: '789 Oak Ave, Cityville, MA 02103',
      acceleration_date: '',
      
      // Step 6: Form 35B Compliance
      form_35b_upload: 'form_35b_pn1003.pdf',
      affiant_name: 'David Martinez',
      affiant_title: 'Senior Loan Officer',
      affidavit_date: '2025-09-30',
      notary_info: 'John Smith, Commission Expires 06/30/2027',
      
      // Step 7: Loan Assignees
      assignee_lender_name_1: 'Regional Bank Corp',
      assignee_lender_type_1: 'Regional Bank',
      assignee_originator_name_1: 'Metro Mortgage Services',
      assignee_license_number_1: 'MB-11111',
      assignee_license_state_1: 'MA',
      assignee_lender_address_1: '300 Business Center, Salem, MA 01970',
      
      // Step 8: Petition Attestation
      attester_first_name: 'Lisa',
      attester_middle_initial: 'M',
      attester_last_name: 'Anderson',
      certification_check: true
    }
  },
  {
    id: 'PN-1004',
    propertyAddress: '32 Pine Ct, Otherplace, MA 02104',
    status: 'Draft',
    filingDate: '2025-10-06',
    lastUpdated: '2025-09-28 09:00 AM',
    borrower: 'Emily Davis',
    loanAmount: '$380,000',
    county: 'Norfolk'
  },
  {
    id: 'PN-1005',
    propertyAddress: '55 River Rd, Waterton, MA 02105',
    status: 'Closed',
    filingDate: '2025-08-20',
    lastUpdated: '2025-09-15 02:45 PM',
    borrower: 'Robert Wilson',
    loanAmount: '$520,000',
    county: 'Plymouth'
  },
  {
    id: 'PN-1006',
    propertyAddress: '88 Elm St, Springfield, MA 01103',
    status: 'Accepted',
    filingDate: '2025-09-22',
    lastUpdated: '2025-10-02 08:45 AM',
    borrower: 'Lisa Anderson',
    loanAmount: '$295,000',
    county: 'Hampden'
  },
  {
    id: 'PN-1007',
    propertyAddress: '156 Maple Dr, Worcester, MA 01602',
    status: 'Submitted',
    filingDate: '2025-10-12',
    lastUpdated: '2025-10-12 04:20 PM',
    borrower: 'David Martinez',
    loanAmount: '$410,000',
    county: 'Worcester'
  },
  {
    id: 'PN-1008',
    propertyAddress: '234 Cedar Ave, Cambridge, MA 02139',
    status: 'Returned',
    filingDate: '2025-10-11',
    lastUpdated: '2025-10-11 01:30 PM',
    borrower: 'Jennifer Taylor',
    loanAmount: '$650,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1009',
    propertyAddress: '67 Birch Ln, Newton, MA 02458',
    status: 'Draft',
    filingDate: '2025-10-13',
    lastUpdated: '2025-10-13 10:15 AM',
    borrower: 'Christopher Lee',
    loanAmount: '$480,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1010',
    propertyAddress: '189 Spruce St, Quincy, MA 02169',
    status: 'Closed',
    filingDate: '2025-08-15',
    lastUpdated: '2025-09-10 03:00 PM',
    borrower: 'Amanda White',
    loanAmount: '$350,000',
    county: 'Norfolk'
  },
  {
    id: 'PN-1011',
    propertyAddress: '445 Walnut Rd, Framingham, MA 01701',
    status: 'Accepted',
    filingDate: '2025-09-30',
    lastUpdated: '2025-10-05 11:45 AM',
    borrower: 'Kevin Thompson',
    loanAmount: '$420,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1012',
    propertyAddress: '78 Cherry St, Lowell, MA 01852',
    status: 'Submitted',
    filingDate: '2025-10-14',
    lastUpdated: '2025-10-14 09:30 AM',
    borrower: 'Michelle Garcia',
    loanAmount: '$310,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1013',
    propertyAddress: '321 Oak St, Boston, MA 02108',
    status: 'Accepted',
    filingDate: '2025-09-25',
    lastUpdated: '2025-10-03 02:15 PM',
    borrower: 'William Davis',
    loanAmount: '$580,000',
    county: 'Suffolk'
  },
  {
    id: 'PN-1014',
    propertyAddress: '654 Pine Ave, Salem, MA 01970',
    status: 'Draft',
    filingDate: '2025-10-15',
    lastUpdated: '2025-10-15 11:20 AM',
    borrower: 'Maria Rodriguez',
    loanAmount: '$340,000',
    county: 'Essex'
  },
  {
    id: 'PN-1015',
    propertyAddress: '987 Maple St, Brockton, MA 02301',
    status: 'Returned',
    filingDate: '2025-10-10',
    lastUpdated: '2025-10-10 03:45 PM',
    borrower: 'James Wilson',
    loanAmount: '$290,000',
    county: 'Plymouth'
  },
  {
    id: 'PN-1016',
    propertyAddress: '234 Washington St, New Bedford, MA 02740',
    status: 'Accepted',
    filingDate: '2025-09-18',
    lastUpdated: '2025-10-04 09:20 AM',
    borrower: 'Patricia Moore',
    loanAmount: '$275,000',
    county: 'Bristol'
  },
  {
    id: 'PN-1017',
    propertyAddress: '567 Lincoln Ave, Fall River, MA 02720',
    status: 'Resubmitted',
    filingDate: '2025-10-16',
    lastUpdated: '2025-10-16 01:15 PM',
    borrower: 'Thomas Jackson',
    loanAmount: '$195,000',
    county: 'Bristol'
  },
  {
    id: 'PN-1018',
    propertyAddress: '789 Franklin St, Lynn, MA 01901',
    status: 'Draft',
    filingDate: '2025-10-17',
    lastUpdated: '2025-10-17 10:30 AM',
    borrower: 'Jennifer White',
    loanAmount: '$320,000',
    county: 'Essex'
  },
  {
    id: 'PN-1019',
    propertyAddress: '123 Adams St, Malden, MA 02148',
    status: 'Closed',
    filingDate: '2025-08-12',
    lastUpdated: '2025-09-05 04:00 PM',
    borrower: 'Robert Taylor',
    loanAmount: '$450,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1020',
    propertyAddress: '456 Jefferson Ave, Medford, MA 02155',
    status: 'Accepted',
    filingDate: '2025-09-28',
    lastUpdated: '2025-10-06 11:45 AM',
    borrower: 'Linda Anderson',
    loanAmount: '$380,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1021',
    propertyAddress: '890 Madison Rd, Somerville, MA 02144',
    status: 'Returned',
    filingDate: '2025-10-12',
    lastUpdated: '2025-10-12 02:30 PM',
    borrower: 'William Thomas',
    loanAmount: '$520,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1022',
    propertyAddress: '321 Monroe St, Everett, MA 02149',
    status: 'Submitted',
    filingDate: '2025-10-18',
    lastUpdated: '2025-10-18 08:15 AM',
    borrower: 'Barbara Harris',
    loanAmount: '$295,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1023',
    propertyAddress: '654 Jackson Blvd, Revere, MA 02151',
    status: 'Draft',
    filingDate: '2025-10-19',
    lastUpdated: '2025-10-19 03:45 PM',
    borrower: 'Michael Martin',
    loanAmount: '$340,000',
    county: 'Suffolk'
  },
  {
    id: 'PN-1024',
    propertyAddress: '987 Harrison Ave, Chelsea, MA 02150',
    status: 'Accepted',
    filingDate: '2025-09-20',
    lastUpdated: '2025-10-03 12:20 PM',
    borrower: 'Susan Garcia',
    loanAmount: '$410,000',
    county: 'Suffolk'
  },
  {
    id: 'PN-1025',
    propertyAddress: '147 Tyler St, Winthrop, MA 02152',
    status: 'Closed',
    filingDate: '2025-08-08',
    lastUpdated: '2025-08-30 05:30 PM',
    borrower: 'David Martinez',
    loanAmount: '$365,000',
    county: 'Suffolk'
  },
  {
    id: 'PN-1026',
    propertyAddress: '258 Broadway, Arlington, MA 02474',
    status: 'Resubmitted',
    filingDate: '2025-10-14',
    lastUpdated: '2025-10-14 01:00 PM',
    borrower: 'Lisa Robinson',
    loanAmount: '$485,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1027',
    propertyAddress: '369 Massachusetts Ave, Lexington, MA 02420',
    status: 'Submitted',
    filingDate: '2025-10-20',
    lastUpdated: '2025-10-20 09:30 AM',
    borrower: 'James Clark',
    loanAmount: '$650,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1028',
    propertyAddress: '741 Concord St, Waltham, MA 02453',
    status: 'Draft',
    filingDate: '2025-10-21',
    lastUpdated: '2025-10-21 11:15 AM',
    borrower: 'Mary Rodriguez',
    loanAmount: '$425,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1029',
    propertyAddress: '852 Main St, Watertown, MA 02472',
    status: 'Accepted',
    filingDate: '2025-09-25',
    lastUpdated: '2025-10-05 02:45 PM',
    borrower: 'Charles Lewis',
    loanAmount: '$375,000',
    county: 'Middlesex'
  },
  {
    id: 'PN-1030',
    propertyAddress: '963 Belmont St, Belmont, MA 02478',
    status: 'Closed',
    filingDate: '2025-08-25',
    lastUpdated: '2025-09-12 03:20 PM',
    borrower: 'Patricia Walker',
    loanAmount: '$580,000',
    county: 'Middlesex'
  }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Petition Service Class
class PetitionService {
  constructor() {
    this.petitions = [...mockPetitions];
  }

  // Get all petitions with optional filtering and pagination
  async getPetitions(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      dateFilter = 'all',
      customDateFrom = '',
      customDateTo = '',
      sortBy = 'filingDate',
      sortOrder = 'desc'
    } = options;

    // Simulate API delay
    await delay(300);

    let filteredPetitions = [...this.petitions];

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredPetitions = filteredPetitions.filter(petition =>
        petition.id.toLowerCase().includes(searchLower) ||
        petition.propertyAddress.toLowerCase().includes(searchLower) ||
        petition.borrower.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status !== 'all') {
      filteredPetitions = filteredPetitions.filter(petition => 
        petition.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filteredPetitions = filteredPetitions.filter(petition => {
            const petitionDate = new Date(petition.filingDate);
            return petitionDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filteredPetitions = filteredPetitions.filter(petition => {
            const petitionDate = new Date(petition.filingDate);
            return petitionDate >= filterDate;
          });
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filteredPetitions = filteredPetitions.filter(petition => {
            const petitionDate = new Date(petition.filingDate);
            return petitionDate >= filterDate;
          });
          break;
        case 'quarter':
          filterDate.setMonth(today.getMonth() - 3);
          filteredPetitions = filteredPetitions.filter(petition => {
            const petitionDate = new Date(petition.filingDate);
            return petitionDate >= filterDate;
          });
          break;
        case 'year':
          filterDate.setFullYear(today.getFullYear() - 1);
          filteredPetitions = filteredPetitions.filter(petition => {
            const petitionDate = new Date(petition.filingDate);
            return petitionDate >= filterDate;
          });
          break;
        case 'custom':
          if (customDateFrom && customDateTo) {
            const fromDate = new Date(customDateFrom);
            const toDate = new Date(customDateTo);
            // Set toDate to end of day to include the entire day
            toDate.setHours(23, 59, 59, 999);
            
            filteredPetitions = filteredPetitions.filter(petition => {
              const petitionDate = new Date(petition.filingDate);
              return petitionDate >= fromDate && petitionDate <= toDate;
            });
          }
          break;
        default:
          break;
      }
    }

    // Apply sorting
    filteredPetitions.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'filingDate' || sortBy === 'lastUpdated') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Calculate pagination
    const totalCount = filteredPetitions.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPetitions = filteredPetitions.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedPetitions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  // Get dashboard petitions (5 most recently updated petitions)
  async getDashboardPetitions() {
    await delay(200);
    
    // Sort petitions by lastUpdated in descending order (most recent first)
    const sortedPetitions = [...this.petitions].sort((a, b) => {
      const dateA = new Date(a.lastUpdated);
      const dateB = new Date(b.lastUpdated);
      return dateB - dateA; // Descending order (newest first)
    });
    
    // Get the first 5 (most recently updated) petitions
    const dashboardPetitions = sortedPetitions.slice(0, 5);
    
    return {
      success: true,
      data: dashboardPetitions
    };
  }

  // Get petition by ID
  async getPetitionById(id) {
    await delay(200);
    
    const petition = this.petitions.find(p => p.id === id);
    
    if (!petition) {
      return {
        success: false,
        message: 'Petition not found'
      };
    }

    return {
      success: true,
      data: petition
    };
  }

  // Get petition statistics
  async getPetitionStats() {
    await delay(200);
    
    const stats = {
      total: this.petitions.length,
      accepted: this.petitions.filter(p => p.status === 'Accepted').length,
      submitted: this.petitions.filter(p => p.status === 'Submitted').length,
      returned: this.petitions.filter(p => p.status === 'Returned').length,
      resubmitted: this.petitions.filter(p => p.status === 'Resubmitted').length,
      draft: this.petitions.filter(p => p.status === 'Draft').length,
      closed: this.petitions.filter(p => p.status === 'Closed').length
    };

    return {
      success: true,
      data: stats
    };
  }

  // Create new petition (for future use)
  async createPetition(petitionData) {
    await delay(500);
    
    const newPetition = {
      id: `PN-${String(this.petitions.length + 1001).padStart(4, '0')}`,
      ...petitionData,
      filingDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toLocaleString()
    };

    this.petitions.unshift(newPetition);

    return {
      success: true,
      data: newPetition,
      message: 'Petition created successfully'
    };
  }

  // Update petition (for future use)
  async updatePetition(id, updateData) {
    await delay(300);
    
    const index = this.petitions.findIndex(p => p.id === id);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Petition not found'
      };
    }

    this.petitions[index] = {
      ...this.petitions[index],
      ...updateData,
      lastUpdated: new Date().toLocaleString()
    };

    return {
      success: true,
      data: this.petitions[index],
      message: 'Petition updated successfully'
    };
  }

  // Delete petition (for future use)
  async deletePetition(id) {
    await delay(300);
    
    const index = this.petitions.findIndex(p => p.id === id);
    
    if (index === -1) {
      return {
        success: false,
        message: 'Petition not found'
      };
    }

    const deletedPetition = this.petitions.splice(index, 1)[0];

    return {
      success: true,
      data: deletedPetition,
      message: 'Petition deleted successfully'
    };
  }
}

// Create and export a singleton instance
const petitionService = new PetitionService();

export default petitionService;
