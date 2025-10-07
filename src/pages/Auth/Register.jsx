import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Form validation rules
  const validateForm = () => {
    const newErrors = {};

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login">
      <div className="container container-md-auto">
        <div className="row m-0">
          <div className="col-lg-5 col-md-4 px-0">
            <div className="login-right-image">
            </div>
          </div>
          <div className="col-lg-7 col-md-8">
            <div className="login-inner d-flex flex-column align-items-center justify-content-center register-inner">
              <form className="w-100" onSubmit={handleSubmit}>
                <div className="login-header mb-5 text-center">
                  <div className="login-logo">
                    <Link to="/">
                      <img src={loginImg} alt="logo" className="w-100" />
                    </Link>
                  </div>
                  <h2 className="font-xl-med fw-bold">Register</h2>
                  <p className="font-base">
                    Have an account?{" "}
                    <Link to="/login" className="text-dark-black fw-semibold">
                      Login{" "}
                    </Link>
                  </p>
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
                  <label className="label-text">Create Password</label>
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
                      onClick={togglePasswordVisibility}
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
                      type={showPassword ? "text" : "password"}
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <span 
                      className="password-eye" 
                      onClick={togglePasswordVisibility}
                      style={{ cursor: 'pointer' }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;