import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { register } from "../../services/authService";
import loginImg from "../../assets/logo-sample.png";
import PasswordGuidelines from "../../components/PasswordGuidelines";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../styles/custom.css";

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordGuidelines, setShowPasswordGuidelines] = useState(false);
  const [passwordGuidelines, setPasswordGuidelines] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const navigate = useNavigate();

  const checkPasswordGuidelines = (password) => {
    const guidelines = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@#$%^&*]/.test(password)
    };
    setPasswordGuidelines(guidelines);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (formData.phoneNumber.length < 10) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one lowercase letter";
      } else if (!/\d/.test(formData.password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/[@#$%^&*]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one special character (@#$%^&*)";
      }
    }

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
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    if (name === 'password') {
      if (value.length > 0) {
        setShowPasswordGuidelines(true);
      }
      checkPasswordGuidelines(value);
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
    const response = await register(formData);
    if (response.isSuccess) {
      navigate("/verification-email-sent");
    } else {
      toast.error(response.msg || "Registration failed!");
    }
  } catch (err) {
    toast.error(err.message || "Registration failed!");
    console.error("Registration error:", err);
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
                  <label className="label-text">First Name</label>
                  <div className="input-group">
                    <div className="user-icon">
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <input
                      name="firstName"
                      type="text"
                      className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                      placeholder="First Name"
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
                      placeholder="Last Name"
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

                <div className="form-group">
                  <label className="label-text">Phone Number</label>
                  <PhoneInput
                    country={'us'}
                    value={formData.phoneNumber}
                    onChange={(phone) => {
                      setFormData({ ...formData, phoneNumber: `+${phone}` });
                      if (errors.phoneNumber) {
                        setErrors({ ...errors, phoneNumber: "" });
                      }
                    }}
                    inputClass={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                    containerClass="phone-input-container"
                    buttonClass="phone-input-button"
                    dropdownClass="phone-input-dropdown"
                    inputStyle={{
                      width: '100%',
                      height: '48px',
                      fontSize: '16px',
                      paddingLeft: '48px',
                      borderRadius: '8px',
                      border: errors.phoneNumber ? '1px solid #dc3545' : '1px solid #ced4da'
                    }}
                    buttonStyle={{
                      borderRadius: '8px 0 0 8px',
                      border: errors.phoneNumber ? '1px solid #dc3545' : '1px solid #ced4da',
                      borderRight: 'none',
                      backgroundColor: '#fff'
                    }}
                    containerStyle={{
                      width: '100%'
                    }}
                  />
                  {errors.phoneNumber && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.phoneNumber}</small>
                    </div>
                  )}
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
                      onFocus={() => setShowPasswordGuidelines(true)}
                      onBlur={() => setShowPasswordGuidelines(false)}
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
                    {/* Password Guidelines Tooltip */}
                    <PasswordGuidelines 
                      showGuidelines={showPasswordGuidelines}
                      passwordGuidelines={passwordGuidelines}
                    />
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