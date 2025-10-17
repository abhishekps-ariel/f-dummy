import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { register } from "../../services/authService";
import { getJoinRequest, bindUserToOrganization } from "../../services/organizationService";
import { ROUTES } from "../../constants/routerConstants";
import loginImg from "../../assets/logo-sample.png";
import PasswordGuidelines from "../../components/shared/PasswordGuidelines";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../styles/custom.css";

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
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
  
  // Invite flow state
  const [inviteData, setInviteData] = useState(null);
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  const [isLoadingInvite, setIsLoadingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(null);

  // Handle invite parameters on component mount
  useEffect(() => {
    const joinRequestId = searchParams.get('joinRequestId');
    const isAdminInvite = searchParams.get('isAdminInvite') === 'true';
    
    if (joinRequestId) {
      setIsInviteFlow(true);
      setIsLoadingInvite(true);
      setInviteError(null);
      
      // Fetch invite data
      fetchInviteData(joinRequestId, isAdminInvite);
    }
  }, [searchParams]);

  const fetchInviteData = async (joinRequestId, isAdminInvite) => {
    try {
      const response = await getJoinRequest(joinRequestId);
      
      if (response.isSuccess) {
        // Access email from the nested data structure
        const email = response.data.data?.email || response.data.email;
        
        if (email) {
          setInviteData({
            joinRequestId,
            isAdminInvite,
            email: email
          });
          
          // Pre-fill email field
          setFormData(prev => ({
            ...prev,
            email: email
          }));
        } else {
          setInviteError("Email not found in invite data");
        }
      } else {
        setInviteError("Invalid or expired invite link");
      }
    } catch (error) {
      console.error("Error fetching invite data:", error);
      setInviteError("Failed to load invite details. Please check your link and try again.");
    } finally {
      setIsLoadingInvite(false);
    }
  };

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
    // For invite flow, pass invite data to registration
    const response = await register(formData, inviteData);
    
    if (response.isSuccess) {
      if (isInviteFlow) {
        // For invite flow, bind user to organization if userId is returned
        if (response.data && response.data.userId && inviteData) {
          try {
            await bindUserToOrganization(inviteData.joinRequestId, response.data.userId);
            toast.success("Account created and organization access granted! Please login to continue.");
          } catch (bindError) {
            console.error("Error binding user to organization:", bindError);
            toast.success("Account created successfully! Please login to continue.");
            // Still navigate to login even if binding fails
          }
        } else {
          toast.success("Account created successfully! Please login to continue.");
        }
        navigate(ROUTES.LOGIN);
      } else {
        // For normal registration, go to email verification
        navigate(ROUTES.VERIFICATION_EMAIL_SENT);
      }
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

  // Show loading state while fetching invite data
  if (isLoadingInvite) {
    return (
      <div className="login">
        <div className="container container-md-auto">
          <div className="row m-0">
            <div className="col-lg-5 col-md-4 px-0">
              <div className="login-right-image"></div>
            </div>
            <div className="col-lg-7 col-md-8">
              <div className="login-inner d-flex flex-column align-items-center justify-content-center register-inner">
                <div className="text-center">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h5>Loading invite details...</h5>
                  <p className="text-muted">Please wait while we verify your invite link.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if invite is invalid
  if (inviteError) {
    return (
      <div className="login">
        <div className="container container-md-auto">
          <div className="row m-0">
            <div className="col-lg-5 col-md-4 px-0">
              <div className="login-right-image"></div>
            </div>
            <div className="col-lg-7 col-md-8">
              <div className="login-inner d-flex flex-column align-items-center justify-content-center register-inner">
                <div className="text-center">
                  <div className="alert alert-danger" role="alert">
                    <i className="fa-solid fa-exclamation-triangle mb-2"></i>
                    <h5>Invalid Invite Link</h5>
                    <p>{inviteError}</p>
                    <Link to={ROUTES.REGISTER} className="btn btn-primary">
                      Try Regular Registration
                    </Link>
                  </div>
                </div>
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
                  <h2 className="font-xl-med fw-bold">
                    {isInviteFlow ? "Complete Your Registration" : "Register"}
                  </h2>
                  {isInviteFlow ? (
                    <div className="alert alert-info mb-3" role="alert">
                      <i className="fa-solid fa-info-circle me-2"></i>
                      You've been invited to join an organization. Complete your registration below.
                    </div>
                  ) : (
                    <p className="font-base">
                      Have an account?{" "}
                      <Link to="/login" className="text-dark-black fw-semibold">
                        Login{" "}
                      </Link>
                    </p>
                  )}
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
                      className={`form-control ${errors.email ? 'is-invalid' : ''} ${isInviteFlow ? 'bg-light' : ''}`}
                      placeholder="hello@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      readOnly={isInviteFlow}
                      required
                      style={isInviteFlow ? { cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  {errors.email && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.email}</small>
                    </div>
                  )}
                  {isInviteFlow && (
                    <small className="text-muted">
                      Email is pre-filled from your invite link
                    </small>
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
                      {isInviteFlow ? "Completing Registration..." : "Creating Account..."}
                    </>
                  ) : (
                    isInviteFlow ? 'Complete Registration' : 'Create Account'
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