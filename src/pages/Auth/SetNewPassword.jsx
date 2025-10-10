import React, { useState } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function SetNewPassword() {
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams();
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);

  // Get token from URL
  const token = pathToken || searchParams.get("token");

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // New Password validation
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters long";
    }

    // Confirm Password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call - TODO: Replace with actual API call
      // const response = await resetPasswordWithToken(token, formData.newPassword);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Password reset successfully!");
      setIsPasswordChanged(true);
    } catch (error) {
      toast.error("Failed to reset password. Please try again.");
      console.error("Reset password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'newPassword') {
      setShowNewPassword(!showNewPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Check if token exists
  if (!token) {
    return (
      <div className="login">
        <div className="container container-md-auto">
          <div className="row m-0">
            <div className="col-lg-5 col-md-4 px-0">
              <div className="login-right-image"></div>
            </div>
            <div className="col-lg-7 col-md-8">
              <div className="login-inner d-flex flex-column align-items-center justify-content-center">
                <form className="w-100">
                  <div className="login-header mb-5 text-center">
                    <div className="login-logo">
                      <Link to="/">
                        <img src={loginImg} alt="logo" className="w-100" />
                      </Link>
                    </div>
                    <div className="mb-4">
                      <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                        <i className="fa-solid fa-exclamation-circle text-warning" style={{ fontSize: '4rem' }}></i>
                      </div>
                      <h2 className="font-xl-med fw-bold text-warning">Invalid Reset Link</h2>
                      <p className="font-base text-muted">
                        The password reset link is invalid or missing. Please request a new password reset.
                      </p>
                    </div>
                    
                    <Link to="/forgot-password" className="btn custom-btn theme-btn text-center w-100">
                      <i className="fa-solid fa-envelope me-2"></i>
                      Request Password Reset
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="container container-md-auto">
        <div className="row m-0">
          <div className="col-lg-5 col-md-4 px-0">
            <div className="login-right-image"></div>
          </div>
          <div className="col-lg-7 col-md-8">
            <div className="login-inner d-flex flex-column align-items-center justify-content-center">
              <form className="w-100" onSubmit={handleSubmit}>
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <Link to="/">
                      <img src={loginImg} alt="logo" className="w-100" />
                    </Link>
                  </div>
                  
                  {!isPasswordChanged ? (
                    <>
                      <h2 className="font-xl-med fw-bold">Set New Password</h2>
                      <p className="font-base">Please enter your new password</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="verification-icon d-inline-flex align-items-center justify-content-center mb-3">
                          <i className="fa-solid fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                        </div>
                        <h2 className="font-xl-med fw-bold text-success">Password Changed!</h2>
                        <p className="font-base text-muted">
                          Your password has been successfully reset. You can now log in with your new password.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {!isPasswordChanged ? (
                  <>
                    <div className="form-group">
                      <label className="label-text">New Password</label>
                      <div className="input-group position-relative">
                        <div className="user-icon">
                          <i className="fa-solid fa-lock"></i>
                        </div>
                        <input
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                          placeholder="Enter new password"
                          value={formData.newPassword}
                          onChange={handleChange}
                          required
                        />
                        <span 
                          className="password-eye" 
                          onClick={() => togglePasswordVisibility('newPassword')}
                          style={{ cursor: 'pointer' }}
                          title={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={`fa-solid ${showNewPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        </span>
                      </div>
                      {errors.newPassword && (
                        <div className="invalid-feedback d-block">
                          <small className="text-danger">{errors.newPassword}</small>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="label-text">Confirm New Password</label>
                      <div className="input-group position-relative">
                        <div className="user-icon">
                          <i className="fa-solid fa-lock"></i>
                        </div>
                        <input
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                          placeholder="Confirm new password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        <span 
                          className="password-eye" 
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                          style={{ cursor: 'pointer' }}
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={`fa-solid ${showConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        </span>
                      </div>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback d-block">
                          <small className="text-danger">{errors.confirmPassword}</small>
                        </div>
                      )}
                    </div>

                    <button 
                      className="btn custom-btn theme-btn text-center w-100" 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating Password...
                        </>
                      ) : (
                        'Reset Password'
                      )}
                    </button>

                    <div className="text-center mt-4">
                      <Link to="/login" className="font-base fw-medium text-decoration-none">
                        <i className="fa-solid fa-chevron-left me-1"></i> Back to Login
                      </Link>
                    </div>
                  </>
                ) : (
                  <Link to="/login" className="btn custom-btn theme-btn text-center w-100">
                    <i className="fa-solid fa-sign-in-alt me-2"></i>
                    Go to Login
                  </Link>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetNewPassword;

