import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import axios from "axios";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const BookingCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const token = localStorage.getItem("token");
  const BOOKINGS_API_URL = import.meta.env.VITE_BOOKINGS_API_URL;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${BOOKINGS_API_URL}/my-hotel`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const bookings = response.data.map((booking) => ({
          title: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName} - ${booking.roomDetails.roomType}`,
          start: new Date(booking.bookingDetails.checkIn),
          end: new Date(booking.bookingDetails.checkOut),
          allDay: true,
          resource: booking,
          status: booking.paymentDetails.paymentStatus // Add status for styling
        }));
        setEvents(bookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();

    // Auto-refresh every 5 minutes to keep calendar up-to-date
    const interval = setInterval(fetchBookings, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  const handleSelectEvent = (event) => {
    setSelectedBooking(event.resource);
  };

  // Navigation handlers
  const handleNavigate = (action) => {
    let newDate = new Date(currentDate);

    switch (action) {
      case 'TODAY':
        setCurrentDate(new Date());
        return;
      case 'PREVIOUS':
        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() - 1);
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() - 7);
        } else if (currentView === 'day') {
          newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
        return;
      case 'NEXT':
        if (currentView === 'month') {
          newDate.setMonth(newDate.getMonth() + 1);
        } else if (currentView === 'week') {
          newDate.setDate(newDate.getDate() + 7);
        } else if (currentView === 'day') {
          newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
        return;
      default:
        break;
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3788d8'; // Default blue

    if (event.status === 'completed') {
      backgroundColor = '#198754'; // Green for completed
    } else if (event.status === 'pending') {
      backgroundColor = '#ffc107'; // Yellow for pending
    } else if (event.status === 'failed') {
      backgroundColor = '#dc3545'; // Red for failed
    } else if (event.status === 'cancelled') {
      backgroundColor = '#6c757d'; // Gray for cancelled
    }

    return {
      style: {
        backgroundColor,
        color: '#ffffff',
        borderRadius: '4px',
        border: '1px solid rgba(0,0,0,0.1)',
        fontSize: '0.85em'
      }
    };
  };

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold mb-0">Booking Calendar</h1>
        <div className="text-muted small">
          Bookings are auto-refreshed every 5 minutes
        </div>
      </div>

      {/* Current Date Header */}
      <div className="text-center mb-3">
        <h4 className="fw-bold text-primary mb-0">
          {format(currentDate, currentView === 'day' ? 'EEEE, MMMM d, yyyy' :
                           currentView === 'week' ? `'Week of 'MMM d, yyyy` :
                           'MMMM yyyy')}
        </h4>
        {currentView === 'week' && (
          <small className="text-muted">
            {format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d')} - {' '}
            {format(new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
          </small>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-3">
        <div className="btn-group">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => handleNavigate('PREVIOUS')}
            title="Previous Month/Week/Day"
          >
            ← Back
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => handleNavigate('TODAY')}
            title="Go to Today"
          >
            Today
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => handleNavigate('NEXT')}
            title="Next Month/Week/Day"
          >
            Next →
          </button>
        </div>

        <div className="btn-group">
          <button
            className={`btn btn-sm ${currentView === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleViewChange('month')}
          >
            Month
          </button>
          <button
            className={`btn btn-sm ${currentView === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleViewChange('week')}
          >
            Week
          </button>
          <button
            className={`btn btn-sm ${currentView === 'day' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleViewChange('day')}
          >
            Day
          </button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading bookings...</span>
              </div>
              <p className="mt-3">Loading your bookings...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3" role="alert">
              {error}
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              date={currentDate}
              view={currentView}
              onNavigate={(date) => setCurrentDate(date)}
              onView={(view) => handleViewChange(view)}
              views={['month', 'week', 'day']}
              popup
              selectable
              showAllEvents
              toolbar={false} // Hide default toolbar since we have custom controls
            />
          )}
        </div>
      </div>

      {/* Legend */}
      {!loading && !error && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="d-flex justify-content-center gap-3 small">
              <div className="d-flex align-items-center">
                <div className="badge bg-success me-2">&nbsp;</div>
                <span>Completed</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="badge bg-warning me-2">&nbsp;</div>
                <span>Pending</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="badge bg-danger me-2">&nbsp;</div>
                <span>Failed</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="badge bg-secondary me-2">&nbsp;</div>
                <span>Cancelled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="modal show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Booking Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedBooking(null)}
                ></button>
              </div>
              <div className="modal-body">
                <h6>Guest Information</h6>
                <p>
                  <strong>Name:</strong> {selectedBooking.guestDetails.firstName}{" "}
                  {selectedBooking.guestDetails.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {selectedBooking.guestDetails.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedBooking.guestDetails.phone}
                </p>
                <hr />
                <h6>Booking Information</h6>
                <p>
                  <strong>Room Type:</strong> {selectedBooking.roomDetails.roomType}
                </p>
                <p>
                  <strong>Check-in:</strong>{" "}
                  {new Date(
                    selectedBooking.bookingDetails.checkIn
                  ).toLocaleDateString()}
                </p>
                <p>
                  <strong>Check-out:</strong>{" "}
                  {new Date(
                    selectedBooking.bookingDetails.checkOut
                  ).toLocaleDateString()}
                </p>
                <p>
                  <strong>Total Amount:</strong> ₹
                  {selectedBooking.amountDetails.grandTotal.toLocaleString()}
                </p>
                <p>
                  <strong>Payment Status:</strong>{" "}
                  <span
                    className={`badge ${
                      selectedBooking.paymentDetails.paymentStatus === "completed"
                        ? "bg-success"
                        : "bg-warning"
                    }`}
                  >
                    {selectedBooking.paymentDetails.paymentStatus}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
