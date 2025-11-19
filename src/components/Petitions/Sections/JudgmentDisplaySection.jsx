import React from "react";

const JudgmentDisplaySection = ({
  SectionHeader,
  formData,
  getJudgmentTypes,
  findOptionByValue,
  formatDate,
  formatCurrency,
}) => {
  // Check if judgment data exists and has meaningful content
  const hasJudgmentData = () => {
    const judgment = formData?.judgment;
    if (!judgment) return false;
    
    // Check if at least one field has a meaningful value
    // judgmentDate: null means no date
    const hasDate = judgment.judgmentDate !== null && 
                    judgment.judgmentDate !== undefined &&
                    ((typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.trim() !== '') ||
                     (typeof judgment.judgmentDate !== 'string'));
    
    // judgmentAmount: 0 means no amount
    const hasAmount = judgment.judgmentAmount !== null && 
                      judgment.judgmentAmount !== undefined && 
                      judgment.judgmentAmount !== 0;
    
    // judgmentType: 0 means no type selected
    const hasType = judgment.judgmentType !== null && 
                    judgment.judgmentType !== undefined && 
                    judgment.judgmentType !== 0 &&
                    judgment.judgmentType !== '';
    
    // courtInformation: empty string means no info
    const hasCourtInfo = judgment.courtInformation !== null &&
                         judgment.courtInformation !== undefined &&
                         typeof judgment.courtInformation === 'string' && 
                         judgment.courtInformation.trim() !== '';
    
    // docketNumbers: empty string means no docket numbers
    const hasDocket = judgment.docketNumbers !== null &&
                      judgment.docketNumbers !== undefined &&
                      typeof judgment.docketNumbers === 'string' && 
                      judgment.docketNumbers.trim() !== '';
    
    return hasDate || hasAmount || hasType || hasCourtInfo || hasDocket;
  };

  if (!hasJudgmentData()) {
    return null;
  }

  const judgment = formData.judgment;
  
  // Get judgment type name
  const getJudgmentTypeName = () => {
    if (judgment.judgmentType === null || judgment.judgmentType === undefined) {
      return "N/A";
    }
    const judgmentTypes = getJudgmentTypes ? getJudgmentTypes() : [];
    const selectedType = findOptionByValue
      ? findOptionByValue(judgmentTypes, judgment.judgmentType)
      : null;
    return selectedType
      ? selectedType.description || selectedType.name || "N/A"
      : "N/A";
  };

  // Format judgment date
  const formatJudgmentDate = () => {
    if (!judgment.judgmentDate) return "N/A";
    // If formatDate function is provided, use it (it expects a date string)
    if (formatDate) {
      return formatDate(judgment.judgmentDate);
    }
    // Otherwise, format manually
    const dateStr = typeof judgment.judgmentDate === 'string' && judgment.judgmentDate.includes("T")
      ? judgment.judgmentDate.split("T")[0]
      : judgment.judgmentDate;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Format judgment amount
  const formatJudgmentAmount = () => {
    if (
      judgment.judgmentAmount === null ||
      judgment.judgmentAmount === undefined
    ) {
      return "N/A";
    }
    return formatCurrency
      ? formatCurrency(judgment.judgmentAmount)
      : `$${judgment.judgmentAmount.toLocaleString()}`;
  };

  return (
    <div className="card mb-4">
      <SectionHeader title="Judgment" />
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Judgment Date</label>
              <input
                type="text"
                className="form-control"
                value={formatJudgmentDate()}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Judgment Amount</label>
              <input
                type="text"
                className="form-control"
                value={formatJudgmentAmount()}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Judgment Type</label>
              <input
                type="text"
                className="form-control"
                value={getJudgmentTypeName()}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Court Information</label>
              <input
                type="text"
                className="form-control"
                value={judgment.courtInformation || "N/A"}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group mb-3">
              <label className="form-label">Docket Numbers</label>
              <input
                type="text"
                className="form-control"
                value={judgment.docketNumbers || "N/A"}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgmentDisplaySection;

