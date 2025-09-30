import React from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { BoxArrowRight } from "react-bootstrap-icons";
import {
  LayoutDashboard,
  Building2,
  Bed,
  Users,
  CreditCard,
  Star,
  User,
  LogOut,
} from "lucide-react";

// Navbar Items
const navbarItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Hotels", url: "/admin/hotels", icon: Building2 },
  { title: "Rooms", url: "/admin/rooms", icon: Bed },
  { title: "Guest Details", url: "/admin/guest-details", icon: Users },
];

const Navbar = () => {

  const navigate = useNavigate();



  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 shadow-sm">
      {/* Brand */}
      <NavLink className="navbar-brand fw-bold text-uppercase" to="/admin">
        SONACHALA
      </NavLink>

      {/* Toggle button (mobile view) */}
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#adminNavbar"
        aria-controls="adminNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      {/* Navbar Items */}
      <div className="collapse navbar-collapse " id="adminNavbar">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          {navbarItems.map((item) => (
            <li className="nav-item" key={item.title}>
              <NavLink
                to={item.url}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 ${
                    isActive ? "active fw-bold text-warning" : ""
                  }`
                }
              >
                <item.icon size={16} />
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right Side - Logout */}
        <button
        className="btn btn-outline-light d-flex align-items-center gap-2"
        onClick={() => navigate("/login")}
      >
        <BoxArrowRight size={18} /> Logout
      </button>
      </div>
    </nav>
  );
};

export default Navbar;
