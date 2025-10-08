import { useState } from "react";
import { login } from "../../services/auth.service";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import loginImg from "../../assets/logo-sample.png";
import "../../styles/custom.css";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    //email validation - only check if email is provided
    if (!formData.email.trim()) {
      newErrors.email = "This field can't be empty";
    }

    //password validation - only check if password is provided
    if (!formData.password.trim()) {
      newErrors.password = "This field can't be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // remove error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleForgetPassword = () => {
    navigate("/forgot-password");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear previous errors
    setErrors({});

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await login(formData);
      if (response.isSuccess) {
        // Navigate to Two Factor Auth page after successful login
        navigate("/two-factor-auth");
      } else {
        toast.error("The email or password you entered is incorrect. Please try again.");
      }
    } catch (error) {
      toast.error("The email or password you entered is incorrect. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login">
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
                <h2 className="font-xl-med fw-bold">Login</h2>
                <p className="font-base">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-dark-black fw-semibold">
                    Sign up{" "}
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
                      type="text"
                      className={`form-control ${
                        errors.email ? "is-invalid" : ""
                      }`}
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
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
                      className={`form-control ${
                        errors.password ? "is-invalid" : ""
                      }`}
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <span
                      className="password-eye"
                      onClick={togglePasswordVisibility}
                      style={{ cursor: "pointer" }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i
                        className={`fa-solid ${
                          showPassword ? "fa-eye" : "fa-eye-slash"
                        }`}
                      ></i>
                    </span>
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block">
                      <small className="text-danger">{errors.password}</small>
                    </div>
                  )}
                </div>
                <div className="form-group text-end">
                  <button
                    type="button"
                    onClick={handleForgetPassword}
                    className="btn btn-link font-base text-dark-black fw-medium p-0"
                  >
                    Forgot Password ?
                  </button>
                </div>

                <button
                  className="btn custom-btn theme-btn text-center w-100"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
                <div className="d-flex flex-column important-notice mt-5">
                <strong>Important Notice:</strong>
                The filer/mortgagee/loan holder can only initiate the Division's
                online registration filing process after a foreclosure petition
                (or action) has been brought by the mortgagee under the
                Soldiers' and Sailors' Civil Relief Act. Foreclosure petition
                information must be entered in this Online Foreclosure Database
                within five business days after being filed with the Land Court.
                </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
