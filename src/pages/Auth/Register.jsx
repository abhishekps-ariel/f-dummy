import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "../../styles/custom.css";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Form validation rules
  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    // Confirm Password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
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
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    if (isSubmitting) return; 
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Registration successful! Please check your email to verify your account.");
      navigate("/login");
    } catch (error) {
      toast.error("Registration failed! Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="login">
      <div className="row m-0">
        <div className="col-lg-5 col-md-4 px-0">
          <div className="login-left-bg">
          
          </div>
        </div>
        <div className="col-lg-7 col-md-8">
          <div className="login-inner">
            <div className="login-content">
              <div className="login-header text-center mb-4">
                <h2 className="font-xl-med fw-bold">Create Account</h2>
                <p className="text-muted">Join the FILIR Portal</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="label-text">First Name</label>
                      <div className="input-group">
                        <div className="user-icon">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <input
                          name="firstName"
                          type="text"
                          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                          placeholder="Enter first name"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {errors.firstName && (
                        <div className="invalid-feedback d-block">
                          <small className="text-danger">{errors.firstName}</small>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="label-text">Last Name</label>
                      <div className="input-group">
                        <div className="user-icon">
                          <i className="fa-solid fa-user"></i>
                        </div>
                        <input
                          name="lastName"
                          type="text"
                          className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                          placeholder="Enter last name"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      {errors.lastName && (
                        <div className="invalid-feedback d-block">
                          <small className="text-danger">{errors.lastName}</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label-text">Email</label>
                  <div className="input-group">
                    <div className="user-icon">
                      <i className="fa-solid fa-envelope"></i>
                    </div>
                    <input
                      name="email"
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="hello@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.email && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.email}</small>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="label-text">Password</label>
                  <div className="input-group position-relative">
                    <div className="user-icon">
                      <i className="fa-solid fa-lock"></i>
                    </div>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <span 
                      className="password-eye" 
                      onClick={() => togglePasswordVisibility('password')}
                      style={{ cursor: 'pointer' }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </span>
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.password}</small>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="label-text">Confirm Password</label>
                  <div className="input-group position-relative">
                    <div className="user-icon">
                      <i className="fa-solid fa-lock"></i>
                    </div>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Confirm password"
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
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="login-footer text-center mt-4">
                <p className="text-muted">
                  Already have an account?{" "}
                  <Link to="/login" className="text-decoration-none fw-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;