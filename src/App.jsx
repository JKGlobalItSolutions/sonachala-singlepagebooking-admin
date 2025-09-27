import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import "bootstrap-icons/font/bootstrap-icons.css";

import Navbar from "./components/Navbar";

import Register from "./components/Register";
import Login from "./components/Login";

import Dashboard from "./components/Dashboard";
import Hotel from "./components/Hotel";
import Rooms from "./components/Rooms";
import GuestDetails from "./components/GuestDetails";

import UserProfile from "./components/UserProfile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes - No Navbar */}
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes - With Navbar */}
        <Route path="/admin" element={
          <>
            <Navbar />
            <Dashboard />
          </>
        } />
        <Route path="/admin/hotels" element={
          <>
            <Navbar />
            <Hotel />
          </>
        } />
        <Route path="/admin/rooms" element={
          <>
            <Navbar />
            <Rooms />
          </>
        } />
        <Route path="/admin/guest-details" element={
          <>
            <Navbar />
            <GuestDetails />
          </>
        } />
        <Route path="/admin/profile" element={
          <>
            <Navbar />
            <UserProfile />
          </>
        } />
      </Routes>
    </Router>
  );
}

export default App;