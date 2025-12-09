import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PAGINATION } from "../../constants/appConstants";
import { useNavigate, useLocation } from "react-router-dom";
import HomeHeader from "../../components/Home/HomeHeader";
import HomeFooter from "../../components/Home/HomeFooter";
import { ROUTES } from "../../constants/routerConstants";
import petitionApiService from "../../services/petitionApiService";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ScrollToTop from "../../components/shared/ScrollToTop";
import { formatDateForInput } from "../../utils/dateUtils";

function PublicPetitions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCity, setSearchCity] = useState("");
  const [searchZipCode, setSearchZipCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  const [exporting, setExporting] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

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
        setError(response.message || t("publicPetitions.failedFetchPetitions"));
        setPetitions([]);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || t("publicPetitions.failedFetchPetitionsTryAgain");
      setError(errorMessage);
      setPetitions([]);
      toast.error(t("publicPetitions.failedLoadPetitions"));
    } finally {
      setLoading(false);
    }
  };

  // Disable browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Scroll to top when component mounts or location changes
  useEffect(() => {
    // Function to scroll all possible containers to top
    const scrollToTop = () => {
      // Try multiple approaches to ensure scroll works
      if (window) {
        window.scrollTo(0, 0);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      // Try scrolling the main content container if it exists
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
        mainContent.scrollLeft = 0;
      }
    };

    // Scroll immediately
    scrollToTop();
    
    // Use requestAnimationFrame for immediate DOM-aware scroll
    requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
    });
    
    // Multiple delays to catch async content loading
    const timer1 = setTimeout(scrollToTop, 0);
    const timer2 = setTimeout(scrollToTop, 50);
    const timer3 = setTimeout(scrollToTop, 100);
    const timer4 = setTimeout(scrollToTop, 200);
    const timer5 = setTimeout(scrollToTop, 300);
    const timer6 = setTimeout(scrollToTop, 500);
    const timer7 = setTimeout(scrollToTop, 750);
    const timer8 = setTimeout(scrollToTop, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      clearTimeout(timer7);
      clearTimeout(timer8);
    };
  }, [location.pathname]);

  // Also scroll to top after data loads
  useEffect(() => {
    if (!loading) {
      // Data has finished loading, ensure scroll to top
      const scrollToTop = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      
      // Scroll after data loads
      requestAnimationFrame(() => {
        scrollToTop();
        setTimeout(scrollToTop, 100);
        setTimeout(scrollToTop, 300);
      });
    }
  }, [loading]);

  // Fetch petitions on mount and when filters/page change
  useEffect(() => {
    fetchPetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchCity, searchZipCode]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.dropdown')) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

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
    if (!dateString) return t("common.nA");
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

  // Handle export functionality
  const handleExport = async (format) => {
    setExporting(true);
    try {
      // Fetch all petitions for export (not just current page)
      const response = await petitionApiService.getPublicPetitionsPaged({
        city: searchCity,
        zipCode: searchZipCode,
        pageNumber: 1,
        pageSize: totalRecords || PAGINATION.MAX_PAGE_SIZE, // Get all records
        sortColumn: "",
        sortDirection: "",
      });

      const allPetitions = response.success && response.data ? response.data : petitions;

      if (format === "csv") {
        await exportToCSV(allPetitions);
      } else if (format === "pdf") {
        await exportToPDF(allPetitions);
      }
      toast.success(
        t("publicPetitions.exportSuccess", { format: format.toUpperCase() })
      );
    } catch (err) {
      toast.error(err?.message || t("publicPetitions.failedExport"));
    } finally {
      setExporting(false);
    }
  };

  // Export to CSV
  const exportToCSV = async (allPetitions) => {
    try {
      const headers = [
        t("publicPetitions.city"),
        t("publicPetitions.zipCode"),
        t("publicPetitions.saleAmount"),
        t("publicPetitions.saleDate"),
      ];
      const csvContent = [
        headers.join(","),
        ...allPetitions.map((petition) =>
          [
            `"${petition.city || t("common.nA")}"`,
            `"${petition.zipCode || t("common.nA")}"`,
            formatCurrency(petition.saleAmount),
            formatDate(petition.saleDate),
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `public_petitions_${formatDateForInput(new Date())}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error(err?.message || t("publicPetitions.failedExportCSV"));
    }
  };

  // Export to PDF
  const exportToPDF = async (allPetitions) => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text(t("publicPetitions.reportTitle"), 14, 22);

      // Add date
      doc.setFontSize(10);
      doc.text(`${t("publicPetitions.generatedOn")}: ${new Date().toLocaleDateString()}`, 14, 32);

      // Prepare table data
      const headers = [
        t("publicPetitions.city"),
        t("publicPetitions.zipCode"),
        t("publicPetitions.saleAmount"),
        t("publicPetitions.saleDate"),
      ];
      const tableData = allPetitions.map((petition) => [
        petition.city || t("common.nA"),
        petition.zipCode || t("common.nA"),
        formatCurrency(petition.saleAmount),
        formatDate(petition.saleDate),
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
          fillColor: [52, 73, 94],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 40 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 },
        },
      });

      // Add summary at the bottom
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(t("publicPetitions.totalPetitions", { count: allPetitions.length }), 14, finalY);

      // Save the PDF
      doc.save(`public_petitions_${formatDateForInput(new Date())}.pdf`);
    } catch (err) {
      toast.error(err?.message || t("publicPetitions.failedExportPDF"));
    }
  };

  return (
    <div>
      <ScrollToTop />
      <HomeHeader
        featureRef={null}
        contactRef={null}
        whoWeServeRef={null}
        actionsRef={null}
        newsRef={null}
        eventsRef={null}
        hideNavigation={true}
      />

      {/* Page Header */}
      <section className="py-4 bg-light">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="font-xl-med mb-2 fw-medium">{t("publicPetitions.title")}</h1>
              <p className="text-muted mb-0">
                {t("publicPetitions.subtitle")}
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap ms-auto">
              <div className="dropdown" style={{ position: "relative" }}>
                <button
                  className={`dashboard-btn-create ${exporting ? 'disabled' : ''} ${showExportDropdown ? 'active' : ''}`}
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={exporting}
                  title={t("publicPetitions.exportPetitions")}
                >
                  {exporting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {t("publicPetitions.exporting")}
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-download me-2"></i>
                      {t("publicPetitions.export")}
                      <i className={`fas fa-chevron-down ms-2 transition-icon ${showExportDropdown ? 'rotate' : ''}`} style={{ fontSize: "0.7rem" }}></i>
                    </>
                  )}
                </button>
                {showExportDropdown && (
                  <div className="edit-options-menu" style={{ right: 0, left: 'auto' }}>
                    <button
                      className="edit-option-item"
                      onClick={() => {
                        handleExport("csv");
                        setShowExportDropdown(false);
                      }}
                      disabled={exporting}
                    >
                      <i className="fas fa-file-csv edit-option-icon"></i>
                      <span>{t("publicPetitions.exportAsCSV")}</span>
                    </button>
                    <button
                      className="edit-option-item"
                      onClick={() => {
                        handleExport("pdf");
                        setShowExportDropdown(false);
                      }}
                      disabled={exporting}
                    >
                      <i className="fas fa-file-pdf edit-option-icon"></i>
                      <span>{t("publicPetitions.exportAsPDF")}</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                className="dashboard-btn-refresh"
                onClick={() => navigate(ROUTES.HOME)}
              >
                <i className="fas fa-arrow-left me-2"></i>
                {t("publicPetitions.backToHome")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Petitions Table */}
      <section className="py-4 py-lg-5">
        <div className="container">
          {/* Search Section */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-city"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("publicPetitions.searchByCity")}
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
                  placeholder={t("publicPetitions.searchByZipCode")}
                  value={searchZipCode}
                  onChange={(e) => handleZipCodeSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">{t("common.loading")}</span>
              </div>
              <p className="text-muted">{t("publicPetitions.loadingPetitions")}</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
              <h4 className="text-muted">{t("publicPetitions.errorLoadingPetitions")}</h4>
              <p className="text-muted">{error}</p>
              <button
                className="btn btn-primary mt-3"
                onClick={fetchPetitions}
              >
                <i className="fas fa-redo me-2"></i>
                {t("publicPetitions.tryAgain")}
              </button>
            </div>
          ) : petitions.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
              <h4 className="text-muted">{t("publicPetitions.noPetitionsFound")}</h4>
              <p className="text-muted">
                {searchCity || searchZipCode
                  ? t("publicPetitions.tryAdjustingSearch")
                  : t("publicPetitions.noPetitionsAvailable")}
              </p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-2">
                <p className="text-muted mb-0 small">
                  {loading ? (
                    t("publicPetitions.loadingPetitions")
                  ) : (
                    <>
                      {(() => {
                        const startIndex = (currentPage - 1) * pageSize + 1;
                        const endIndex = Math.min(currentPage * pageSize, totalRecords);
                        return t("publicPetitions.showingResults", { 
                          showing: endIndex - startIndex + 1, 
                          total: totalRecords, 
                          count: totalRecords
                        });
                      })()}
                    </>
                  )}
                </p>
              </div>

              {/* Desktop Table View */}
              <div className="d-none d-lg-block table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>{t("publicPetitions.city")}</th>
                      <th>{t("publicPetitions.zipCode")}</th>
                      <th>{t("publicPetitions.saleAmount")}</th>
                      <th>{t("publicPetitions.saleDate")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petitions.map((petition, index) => (
                      <tr key={index}>
                        <td>{petition.city || t("common.nA")}</td>
                        <td>{petition.zipCode || t("common.nA")}</td>
                        <td>{formatCurrency(petition.saleAmount)}</td>
                        <td>{formatDate(petition.saleDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="d-lg-none">
                {petitions.length > 0 ? (
                  <div className="row g-3">
                    {petitions.map((petition, index) => (
                      <div key={index} className="col-12">
                        <div className="petition-mobile-card">
                          <div className="petition-card-body">
                            <div className="petition-card-detail">
                              <i className="fas fa-city text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                              <span className="small">
                                <strong>{t("publicPetitions.city")}:</strong> {petition.city || t("common.nA")}
                              </span>
                            </div>
                            <div className="petition-card-detail">
                              <i className="fas fa-map-marker-alt text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                              <span className="small">
                                <strong>{t("publicPetitions.zipCode")}:</strong> {petition.zipCode || t("common.nA")}
                              </span>
                            </div>
                            <div className="petition-card-detail">
                              <i className="fas fa-dollar-sign text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                              <span className="small">
                                <strong>{t("publicPetitions.saleAmount")}:</strong> {formatCurrency(petition.saleAmount)}
                              </span>
                            </div>
                            <div className="petition-card-detail">
                              <i className="fas fa-calendar text-muted me-2" style={{ fontSize: "0.75rem" }}></i>
                              <span className="small">
                                <strong>{t("publicPetitions.saleDate")}:</strong> {formatDate(petition.saleDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
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
                      <span className="pagination-btn-text d-none d-md-inline">
                        {t("common.previous")}
                      </span>
                    </button>

                    <div className="pagination-pages">
                      {(() => {
                        const maxVisiblePages = 5;
                        
                        if (totalPages <= maxVisiblePages) {
                          // If total pages is 5 or less, show all pages
                          return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              className={`pagination-page ${
                                page === currentPage ? "active" : ""
                              }`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          ));
                        }
                        
                        // For many pages, show exactly 5 page numbers with ellipsis
                        const pages = [];
                        
                        if (currentPage <= 3) {
                          // Near the beginning: show 1, 2, 3, 4, ... last
                          for (let i = 1; i <= 4; i++) {
                            pages.push(i);
                          }
                          pages.push('ellipsis-end');
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          // Near the end: show 1, ... , last-3, last-2, last-1, last
                          pages.push(1);
                          pages.push('ellipsis-start');
                          for (let i = totalPages - 3; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // In the middle: show 1, ... , current-1, current, current+1, ... last
                          pages.push(1);
                          pages.push('ellipsis-start');
                          // Show current page and 1 page on each side (total 3 pages) to keep total at 5
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                            pages.push(i);
                          }
                          pages.push('ellipsis-end');
                          pages.push(totalPages);
                        }
                        
                        return pages.map((page, index) => {
                          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                            return (
                              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                                ...
                              </span>
                            );
                          }
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
                        });
                      })()}
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
                      <span className="pagination-btn-text d-none d-md-inline">
                        {t("common.next")}
                      </span>
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
            {t("publicPetitions.aboutTitle")}
          </h2>
          <div className="row">
            <div className="col-md-6">
              <p className="font-base-med">
                {t("publicPetitions.aboutDescription1")}
              </p>
              <p className="font-base-med">
                {t("publicPetitions.aboutDescription2")}
              </p>
            </div>
            <div className="col-md-6">
              <h5 className="fw-semibold mb-3">{t("publicPetitions.searchInformation")}</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-city me-2 text-primary"></i>
                  {t("publicPetitions.searchByCityInfo")}
                </li>
                <li className="mb-2">
                  <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                  {t("publicPetitions.searchByZipCodeInfo")}
                </li>
                <li className="mb-2">
                  <i className="fas fa-dollar-sign me-2 text-primary"></i>
                  {t("publicPetitions.saleAmountInfo")}
                </li>
                <li className="mb-2">
                  <i className="fas fa-calendar me-2 text-primary"></i>
                  {t("publicPetitions.saleDateInfo")}
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

