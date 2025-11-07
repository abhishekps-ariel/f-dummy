import React from "react";

const BorrowerDetails = ({
  SectionHeader,
  isEditing,
  formData,
  fieldErrors,
  removeBorrower,
  updateBorrower,
  setPrimaryBorrower,
  handleBorrowerAddressInput,
  handleBorrowerAddressSelect,
  borrowerPredictions,
  isLoaded,
  addBorrower,
}) => {
  return (
    <>
      <div className={`card mb-4 ${isEditing ? "editing" : ""}`}>
            <SectionHeader title="Borrower Details" />
            <div className="card-body">
              {formData.borrowers && formData.borrowers.length > 0 ? (
                <>
                  {formData.borrowers.map((borrower, index) => (
                    <div
                      key={borrower.id || index}
                      className="border rounded p-3 mb-3"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0 fw-semibold">
                          Borrower {index + 1}
                        </h6>
                        {isEditing && formData.borrowers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeBorrower(borrower.id)}
                            title="Remove this borrower"
                          >
                            <i
                              className="fas fa-times"
                              style={{ fontSize: "12px" }}
                            ></i>
                          </button>
                        )}
                      </div>
                      <div className="row">
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">First Name *</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`borrower_${borrower.id}_firstName`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_firstName`}
                              value={borrower.firstName || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "firstName",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_firstName`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_firstName`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">Middle Name</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_middleName`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_middleName`}
                              value={borrower.middleName || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "middleName",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_middleName`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_middleName`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">Last Name *</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`borrower_${borrower.id}_lastName`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_lastName`}
                              value={borrower.lastName || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "lastName",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_lastName`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_lastName`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="form-group mb-3">
                            <label className="form-label">Suffix</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[`borrower_${borrower.id}_suffix`]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_suffix`}
                              value={borrower.suffix || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "suffix",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[`borrower_${borrower.id}_suffix`] && (
                              <div className="text-danger small mt-1">
                                {fieldErrors[`borrower_${borrower.id}_suffix`]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Primary Borrower
                            </label>
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={borrower.borrowerIsPrimary || false}
                                onChange={() => {
                                  if (isEditing) {
                                    setPrimaryBorrower(borrower.id);
                                  }
                                }}
                                disabled={!isEditing}
                              />
                              <label className="form-check-label">
                                {borrower.borrowerIsPrimary ? "Yes" : "No"}
                              </label>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              value={borrower.email || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "email",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">Phone</label>
                            <input
                              type="text"
                              className="form-control"
                              value={borrower.phone || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "phone",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group mb-3">
                            <label className="form-label">
                              Mailing Address
                            </label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_mailingStreet1`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_mailingStreet1`}
                              value={borrower.mailingStreet1 || ""}
                              readOnly={!isEditing}
                              autoComplete="off"
                              onChange={(e) => {
                                updateBorrower(
                                  borrower.id,
                                  "mailingStreet1",
                                  e.target.value
                                );
                                handleBorrowerAddressInput(
                                  borrower.id,
                                  e.target.value
                                );
                              }}
                            />
                            {isEditing &&
                              isLoaded &&
                              (borrowerPredictions[borrower.id] || []).length >
                                0 && (
                                <div className="list-group mt-1">
                                  {(borrowerPredictions[borrower.id] || []).map(
                                    (p) => (
                                      <button
                                        type="button"
                                        key={p.place_id}
                                        className="list-group-item list-group-item-action"
                                        onClick={() =>
                                          handleBorrowerAddressSelect(
                                            borrower.id,
                                            p
                                          )
                                        }
                                      >
                                        {p.description}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            {fieldErrors[
                              `borrower_${borrower.id}_mailingStreet1`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_mailingStreet1`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">Mailing City</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_mailingCity`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_mailingCity`}
                              value={borrower.mailingCity || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "mailingCity",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_mailingCity`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_mailingCity`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-2">
                          <div className="form-group mb-3">
                            <label className="form-label">State</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_mailingState`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_mailingState`}
                              value={borrower.mailingState || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "mailingState",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_mailingState`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_mailingState`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-group mb-3">
                            <label className="form-label">Mailing ZIP</label>
                            <input
                              type="text"
                              className={`form-control ${
                                fieldErrors[
                                  `borrower_${borrower.id}_mailingZip`
                                ]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              data-error-key={`borrower_${borrower.id}_mailingZip`}
                              value={borrower.mailingZip || ""}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                updateBorrower(
                                  borrower.id,
                                  "mailingZip",
                                  e.target.value
                                )
                              }
                            />
                            {fieldErrors[
                              `borrower_${borrower.id}_mailingZip`
                            ] && (
                              <div className="text-danger small mt-1">
                                {
                                  fieldErrors[
                                    `borrower_${borrower.id}_mailingZip`
                                  ]
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={addBorrower}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Borrower
                    </button>
                  )}
                </>
              ) : (
                <p className="text-muted">No borrower information available</p>
              )}
            </div>
          </div>
    </>
  );
};

export default BorrowerDetails;
