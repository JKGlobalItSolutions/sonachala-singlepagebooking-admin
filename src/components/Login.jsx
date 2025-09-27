import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {


  const API_BASE = import.meta.env.VITE_API_BASE;









  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });











  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE}/admin/login`, formData, {
        withCredentials: true,
      });

      alert(`Login Successful! Welcome ${res.data.admin?.email || "Admin"}`);
      console.log("admindata:", res.data.admin);

      // Save token/session
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("adminDetails", JSON.stringify(res.data.admin));

      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="col-md-5">
        <div className="card shadow">
          <div className="card-body">
            <h3 className="text-center mb-4">Welcome Back</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
                
              </div>

              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center mt-3">
              Don't have an account?{" "}
              <Link to="/" className="text-decoration-none">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
