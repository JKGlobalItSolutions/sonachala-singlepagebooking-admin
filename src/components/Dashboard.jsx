import React, { useState, useEffect } from "react";
import axios from "axios";
import { Building2, Bed, Users, CreditCard, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import BookingCalendar from "./BookingCalendar";

export default function Dashboard() {
  const [totalRooms, setTotalRooms] = useState(0);
  const [activeBookings, setActiveBookings] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [recentBookings, setRecentBookings] = useState([]);
  const [roomStats, setRoomStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  const token = localStorage.getItem("token");

  const ROOMS_API_URL = import.meta.env.VITE_ROOMS_API_URL;
  const BOOKINGS_API_URL = import.meta.env.VITE_BOOKINGS_API_URL;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch rooms
        const roomsResponse = await axios.get(`${ROOMS_API_URL}/my-rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTotalRooms(roomsResponse.data.length);

        // Fetch room stats
        const roomStatsResponse = await axios.get(`${ROOMS_API_URL}/room-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRoomStats(roomStatsResponse.data);

        // Fetch active bookings
        const bookingsResponse = await axios.get(`${BOOKINGS_API_URL}/my-hotel`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            status: 'active'  // Add this parameter in your backend API
          }
        });
        setActiveBookings(bookingsResponse.data.length);

        // Fetch today's revenue
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

        const revenueResponse = await axios.get(`${BOOKINGS_API_URL}/revenue`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
          }
        });
        setTodayRevenue(revenueResponse.data.totalRevenue || 0);

        // Fetch recent bookings
        setBookingsLoading(true);
        setBookingsError(null);
        const recentBookingsResponse = await axios.get(`${BOOKINGS_API_URL}/my-hotel`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 5,  // Get only the 5 most recent bookings
            sort: '-createdAt'  // Sort by creation date in descending order
          }
        });
        setRecentBookings(recentBookingsResponse.data);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setBookingsError("Failed to fetch recent bookings");
      } finally {
        setLoading(false);
        setBookingsLoading(false);
      }
    };

    fetchDashboardData();

    // Set up interval for real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [token]);

  // Format currency to Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Build cards with dynamic value
  const statsCards = [
    {
      title: "Total Rooms",
      value: loading ? "Loading..." : totalRooms,
      icon: <Bed size={24} />,
      color: "text-success",
    },
    {
      title: "Active Bookings",
      value: loading ? "Loading..." : activeBookings,
      icon: <Users size={24} />,
      color: "text-warning",
    },
    {
      title: "Today Revenue",
      value: loading ? "Loading..." : formatCurrency(todayRevenue),
      icon: <CreditCard size={24} />,
      color: "text-danger",
    },
  ];

  return (
    <div className="container my-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h3 fw-bold">Dashboard</h1>
        <p className="text-muted">
          Welcome back! Here's what's happening with your hotels today.
        </p>
      </div>

      {/* View Switcher */}
      <div className="mb-4 d-flex gap-2">
        <button
          className={`btn ${activeView === "dashboard" ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-2`}
          onClick={() => setActiveView("dashboard")}
        >
          <Building2 size={16} />
          Dashboard View
        </button>
        <button
          className={`btn ${activeView === "calendar" ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-2`}
          onClick={() => setActiveView("calendar")}
        >
          <Calendar size={16} />
          Calendar View
        </button>
      </div>

      {activeView === "dashboard" && (
        <>
          {/* Stats Cards */}
          <div className="row g-4">
            {statsCards.map((card) => (
              <div className="col-md-6 col-lg-3" key={card.title}>
                <div className="card shadow-sm h-100">
                  <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="card-title text-muted">{card.title}</h6>
                      <h4 className="fw-bold">{card.value}</h4>
                    </div>
                    <div className={card.color}>{card.icon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Two column layout */}
          <div className="row g-4 mt-3">
            {/* Recent Bookings */}
            <div className="col-md-12 col-lg-12">
              <div className="card shadow-sm h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">Recent Bookings</h5>
                  <Link to="/admin/guest-details" className="btn btn-sm btn-outline-primary">
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {bookingsLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : bookingsError ? (
                    <div className="alert alert-danger" role="alert">
                      {bookingsError}
                    </div>
                  ) : recentBookings.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No recent bookings found</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Guest</th>
                            <th>Room</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentBookings.map((booking) => (
                            <tr key={booking._id}>
                              <td>
                                <p className="fw-semibold mb-0">
                                  {booking.guestDetails.firstName} {booking.guestDetails.lastName}
                                </p>
                                <small className="text-muted">{booking.guestDetails.email}</small>
                              </td>
                              <td>
                                <p className="mb-0">{booking.roomDetails.roomType}</p>
                                <small className="text-muted">
                                  {booking.bookingDetails.numberOfRooms} {booking.bookingDetails.numberOfRooms > 1 ? 'rooms' : 'room'}
                                </small>
                              </td>
                              <td>
                                <p className="mb-0">
                                  {new Date(booking.bookingDetails.checkIn).toLocaleDateString()}
                                </p>
                              </td>

                              <td>
                                <p className="mb-0">
                                  {new Date(booking.bookingDetails.checkOut).toLocaleDateString()}
                                </p>
                              </td>
                              <td>
                                <p className="fw-semibold mb-0">
                                  {formatCurrency(booking.amountDetails.grandTotal)}
                                </p>
                              </td>
                              <td>
                                <span className={`badge ${
                                  booking.paymentDetails.paymentStatus === 'completed' ? 'bg-success' :
                                  booking.paymentDetails.paymentStatus === 'pending' ? 'bg-warning' :
                                  booking.paymentDetails.paymentStatus === 'failed' ? 'bg-danger' :
                                  'bg-secondary'
                                }`}>
                                  {booking.paymentDetails.paymentStatus.charAt(0).toUpperCase() +
                                   booking.paymentDetails.paymentStatus.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Room Stats */}
          <div className="row g-4 mt-3">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header">
                  <h5 className="fw-bold mb-0">Room Availability</h5>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : roomStats.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">No room stats available</p>
                    </div>
                  ) : (
                    <div className="row">
                      {roomStats.map((stat) => (
                        <div className="col-md-6 col-lg-4 mb-3" key={stat.roomType}>
                          <div className="card h-100">
                            <div className="card-body">
                              <h5 className="card-title">{stat.roomType}</h5>
                              <hr />
                              <p className="card-text mb-1">
                                <strong>Total Rooms:</strong> {stat.totalRooms}
                              </p>
                              <p className="card-text mb-1">
                                <strong>Booked:</strong> {stat.booked}
                              </p>
                              <p className="card-text">
                                <strong>Available:</strong> {stat.available}
                              </p>
                              {
                                stat.available === 0 && (
                                  <span className="badge bg-danger">Fully Booked</span>
                                )
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === "calendar" && (
        <div className="row g-4 mt-3">
          <div className="col-12">
            <BookingCalendar />
          </div>
        </div>
      )}
    </div>
  );
}
