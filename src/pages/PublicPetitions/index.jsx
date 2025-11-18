import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HomeHeader from "../../components/Home/HomeHeader";
import HomeFooter from "../../components/Home/HomeFooter";
import { ROUTES } from "../../constants/routerConstants";
import petitionApiService from "../../services/petitionApiService";
import { toast } from "react-toastify";

function PublicPetitions() {
  const navigate = useNavigate();
  
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCity, setSearchCity] = useState("");
  const [searchZipCode, setSearchZipCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(10);

  // Fetch petitions from API
  const fetchPetitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await petitionApiService.getPublicPetitionsPaged({
        city: searchCity,
        zipCode: searchZipCode,
        pageNumber: currentPage, // Send 1-based page number
        pageSize: pageSize,
        sortColumn: "",
        sortDirection: "",
      });

      if (response.success && response.data) {
        setPetitions(response.data);
        setTotalRecords(response.totalRecords || 0);
      } else {
        setError(response.message || "Failed to fetch petitions");
        setPetitions([]);
      }
    } catch (err) {
      console.error("Error fetching public petitions:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch petitions. Please try again.");
      setPetitions([]);
      toast.error("Failed to load petitions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch petitions on mount and when filters/page change
  useEffect(() => {
    fetchPetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchCity, searchZipCode]);

  // Calculate total pages
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Handle search with debounce
  const handleCitySearch = (value) => {
    setSearchCity(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleZipCodeSearch = (value) => {
    setSearchZipCode(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div>
      <HomeHeader
        featureRef={null}
        contactRef={null}
        whoWeServeRef={null}
        actionsRef={null}
        newsRef={null}
        eventsRef={null}
      />

      {/* Page Header */}
      <section className="py-4 py-lg-5 bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="font-xl-med mb-2 fw-medium">Filed Petitions</h1>
              <p className="text-muted mb-0">
                View publicly filed foreclosure petitions in Massachusetts
              </p>
            </div>
            <button
              className="dashboard-btn-create"
              onClick={() => navigate(ROUTES.HOME)}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Home
            </button>
          </div>

          {/* Search Section */}
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-city"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by city..."
                  value={searchCity}
                  onChange={(e) => handleCitySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-map-marker-alt"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by zip code..."
                  value={searchZipCode}
                  onChange={(e) => handleZipCodeSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-3">
            <p className="text-muted mb-0">
              {loading ? (
                "Loading petitions..."
              ) : (
                <>
                  Showing {petitions.length} of {totalRecords} petition{totalRecords !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Petitions Table */}
      <section className="py-4 py-lg-5">
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted">Loading petitions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <h4 className="text-muted">Error loading petitions</h4>
              <p className="text-muted">{error}</p>
              <button
                className="btn btn-primary mt-3"
                onClick={fetchPetitions}
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </button>
            </div>
          ) : petitions.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">No petitions found</h4>
              <p className="text-muted">
                {searchCity || searchZipCode
                  ? "Try adjusting your search criteria."
                  : "No petitions are currently available."}
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>City</th>
                      <th>Zip Code</th>
                      <th>Sale Amount</th>
                      <th>Sale Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petitions.map((petition, index) => (
                      <tr key={index}>
                        <td>{petition.city || "N/A"}</td>
                        <td>{petition.zipCode || "N/A"}</td>
                        <td>{formatCurrency(petition.saleAmount)}</td>
                        <td>{formatDate(petition.saleDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages >= 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <div className="pagination-minimal">
                    <button
                      className={`pagination-btn ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }}
                      disabled={currentPage === 1}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15 18L9 12L15 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Previous
                    </button>

                    <div className="pagination-pages">
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              className={`pagination-page ${
                                page === currentPage ? "active" : ""
                              }`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      className={`pagination-btn ${
                        currentPage >= totalPages ? "disabled" : ""
                      }`}
                      onClick={() => {
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 18L15 12L9 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Information Section */}
      <section className="py-4 py-lg-5 bg-mesgray">
        <div className="container">
          <h2 className="font-xl-med mb-4 fw-medium heading-divider">
            About Filed Petitions
          </h2>
          <div className="row">
            <div className="col-md-6">
              <p className="font-base-med">
                This page displays publicly filed foreclosure petitions in Massachusetts.
                All petitions listed here have been submitted to the Division of Banks
                and are part of the public record.
              </p>
              <p className="font-base-med">
                You can search for petitions by city or zip code. The table displays
                the city, zip code, sale amount, and sale date for each filed petition.
              </p>
            </div>
            <div className="col-md-6">
              <h5 className="fw-semibold mb-3">Search Information</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-city me-2 text-primary"></i>
                  Search by city name to find petitions in a specific city
                </li>
                <li className="mb-2">
                  <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                  Search by zip code to find petitions in a specific area
                </li>
                <li className="mb-2">
                  <i className="fas fa-dollar-sign me-2 text-primary"></i>
                  Sale amount represents the foreclosure sale amount
                </li>
                <li className="mb-2">
                  <i className="fas fa-calendar me-2 text-primary"></i>
                  Sale date indicates when the foreclosure sale occurred
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
    </div>
  );
}

export default PublicPetitions;

