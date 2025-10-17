const LoadingFallback = () => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="mt-3">
          <p className="text-muted">Loading page...</p>
        </div>
      </div>
    </div>
  );
};
export default LoadingFallback;
