import { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Calendar,
  Phone,
  Envelope,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import axios from "axios";
import emailjs from "emailjs-com";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// // EmailJS Configuration from environment variables
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const GUEST_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_GUEST_TEMPLATE_ID;
const ADMIN_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID;
const USER_ID = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;



// EmailJS Configuration from environment variables
// const SERVICE_ID = "service_a8v9bjn";
// const GUEST_TEMPLATE_ID = "template_q6xdbuw";
// const ADMIN_TEMPLATE_ID = "template_dzwvyv6";
// const USER_ID = "AM_ol2tJrjvqL7iH3";




const bookingStatuses = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const GuestDetails = () => {
  const [adminDetails, setAdminDetails] = useState(null);

  useEffect(() => {
    const storedAdminDetails = localStorage.getItem("adminDetails");
    if (storedAdminDetails) {
      setAdminDetails(JSON.parse(storedAdminDetails));
    }
  }, []);

  const BOOKINGS_API_URL = import.meta.env.VITE_BOOKINGS_API_URL;

  const API_BASE = import.meta.env.VITE_API_BASE;



  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const token = localStorage.getItem("token");




  // Fetch bookings from backend (only for this admin's hotel)
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BOOKINGS_API_URL}/my-hotel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      if (err.response?.status === 404) {
        setError("No hotel found. Please create a hotel first.");
      } else {
        setError("Failed to fetch guest details");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Update payment status
  const updatePaymentStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(bookingId);
      await axios.put(
        `${BOOKINGS_API_URL}/${bookingId}`,
        {
          "paymentDetails.paymentStatus": newStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking._id === bookingId
            ? {
              ...booking,
              paymentDetails: {
                ...booking.paymentDetails,
                paymentStatus: newStatus,
              },
            }
            : booking
        )
      );

      alert(`Payment status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating payment status:", err);
      if (err.response?.status === 403) {
        alert(
          "Access denied. You can only update bookings for your own hotel."
        );
      } else if (err.response?.status === 404) {
        alert("No hotel found. Please create a hotel first.");
      } else {
        alert("Failed to update payment status");
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Delete booking
  const deleteBooking = async (bookingId) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this booking? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${BOOKINGS_API_URL}/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove booking from local state
      setBookings(bookings.filter((booking) => booking._id !== bookingId));
      alert("Booking deleted successfully");
    } catch (err) {
      console.error("Error deleting booking:", err);
      if (err.response?.status === 403) {
        alert(
          "Access denied. You can only delete bookings from your own hotel."
        );
      } else if (err.response?.status === 404) {
        alert("Booking not found or already deleted.");
      } else {
        alert("Failed to delete booking");
      }
    }
  };

  // Filter bookings based on payment status and search term
  const filteredGuests = bookings.filter((booking) => {
    const matchesFilter =
      filter === "all" || booking.paymentDetails.paymentStatus === filter;
    const matchesSearch =
      searchTerm === "" ||
      booking.guestDetails.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.guestDetails.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.guestDetails.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Send booking confirmation emails with PDF attachment to guest and admin


  const sendBookingPdfEmails = async (booking) => {
    try {
      setUpdatingStatus(booking._id);

      // Create PDF
      const cardElement = document.getElementById(`booking-card-${booking._id}`);
      const canvas = await html2canvas(cardElement);
      const imgData = canvas.toDataURL("image/jpeg", 0.5);
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      const pdfBase64 = pdf.output("datauristring").split(",")[1];

      // Guest email params
      const guestParams = {
        guest_name: `${booking.guestDetails.firstName || ""} ${
          booking.guestDetails.lastName || ""
        }`,
        hotel_name: adminDetails?.hotelName || "Your Hotel",
        confirmation_id:
          booking.confirmationId || booking._id.slice(-8).toUpperCase(),
        check_in_date: new Date(
          booking.bookingDetails.checkIn
        ).toLocaleDateString(),
        check_out_date: new Date(
          booking.bookingDetails.checkOut
        ).toLocaleDateString(),
        room_type: booking.roomDetails.roomType,
        amount: booking.amountDetails.grandTotal,
        to_email_guest: booking.guestDetails.email,
        attachment: {
          data: pdfBase64,
          name: `${booking.confirmationId || booking._id.slice(-8).toUpperCase()}-booking-details.pdf`,
          type: "application/pdf",
        },
      };

      // Admin email params
      const adminParams = {
        guest_name: `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`,
        to_guest_email: booking.guestDetails.email,
        confirmation_id:
          booking.confirmationId || booking._id.slice(-8).toUpperCase(),
        check_in_date: new Date(
          booking.bookingDetails.checkIn
        ).toLocaleDateString(),
        check_out_date: new Date(
          booking.bookingDetails.checkOut
        ).toLocaleDateString(),
        room_type: booking.roomDetails.roomType,
        amount: booking.amountDetails.grandTotal,
        to_email_admin: adminDetails?.email || "admin@example.com",
        attachment: {
          data: pdfBase64,
          name: `${booking.confirmationId || booking._id.slice(-8).toUpperCase()}-booking-details.pdf`,
          type: "application/pdf",
        },
      };

      console.log("Sending emails with attachment...");
      console.log("Guest params:", guestParams);
      console.log("Admin params:", adminParams);

      // Send emails
      await emailjs.send(SERVICE_ID, GUEST_TEMPLATE_ID, guestParams, USER_ID);
      await emailjs.send(SERVICE_ID, ADMIN_TEMPLATE_ID, adminParams, USER_ID);

      console.log("Emails sent successfully!");

      alert("✅ Emails with PDF sent to guest and admin!");
    } catch (err) {
      console.error("❌ Email sending error:", err);
      alert("Error sending emails with PDF.");
    } finally {
      setUpdatingStatus(null);
    }
  };
  

  // Send emails to all filtered guests
  const sendAllEmails = async () => {
    if (filteredGuests.length === 0) {
      alert("No bookings to send emails to.");
      return;
    }

    const confirmed = window.confirm(
      `Send confirmation emails to ${filteredGuests.length} booking(s)? This will send emails to both guests and admin.`
    );

    if (!confirmed) return;

    try {
      setUpdatingStatus("all");

      for (const booking of filteredGuests) {
        await sendBookingPdfEmails(booking);
      }

      alert(`✅ Emails sent to ${filteredGuests.length} booking(s)!`);
    } catch (err) {
      console.error("❌ Error sending all emails:", err);
      alert("Error sending emails to some bookings.");
    } finally {
      setUpdatingStatus(null);
    }
  };














  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Guest Details</h3>
          <small className="text-muted">
            Total Bookings: {bookings.length}
          </small>
          {adminDetails && (
            <p className="text-muted mb-0">
              Logged in as: {adminDetails.firstName} {adminDetails.lastName} ({adminDetails.email})
            </p>
          )}
        </div>
        <div className="d-flex gap-3">
          <button
            className="btn btn-success btn-sm"
            onClick={sendAllEmails}
            disabled={loading || updatingStatus === "all"}
          >
            {updatingStatus === "all" ? "Sending..." : "Send All Emails"}
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={fetchBookings}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Search />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by Guest Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ boxShadow: "none" }}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {bookingStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading guest details...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && filteredGuests.length === 0 && (
        <div className="text-center py-4">
          <p className="text-muted">No guest bookings found.</p>
        </div>
      )}

      {/* Guest Cards */}
      {!loading && !error && (
        <div className="row">
          {filteredGuests.map((booking) => (
            <div key={booking._id} className="col-12 mb-4">
              <div
                id={`booking-card-${booking._id}`}
                className="card shadow-sm border-1"
                style={{ borderRadius: "15px" }}
              >
                {/* Header Section */}
                <div className="card-header bg-white border-0 pb-0">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="text-warning fw-bold mb-1">
                        Previous Booking
                      </h5>
                      <h4 className="fw-bold mb-0">
                        {booking.guestDetails.firstName}{" "}
                        {booking.guestDetails.lastName}
                      </h4>
                      <small className="text-muted">
                        Confirmation ID:{" "}
                        {booking.confirmationId ||
                          booking._id.slice(-8).toUpperCase()}
                      </small>
                    </div>
                    <div className="text-end d-flex align-items-center gap-3">
                      <span
                        className={`badge fs-6 px-3 py-2 ${booking.paymentDetails.paymentStatus === "completed"
                          ? "bg-success"
                          : booking.paymentDetails.paymentStatus === "pending"
                            ? "bg-warning"
                            : booking.paymentDetails.paymentStatus === "failed"
                              ? "bg-danger"
                              : "bg-secondary"
                          }`}
                      >
                        {booking.paymentDetails.paymentStatus ===
                          "completed" && <CheckCircle className="me-1" />}
                        {booking.paymentDetails.paymentStatus === "pending" && (
                          <Clock className="me-1" />
                        )}
                        {booking.paymentDetails.paymentStatus === "failed" && (
                          <XCircle className="me-1" />
                        )}
                        {booking.paymentDetails.paymentStatus ===
                          "cancelled" && (
                            <ExclamationTriangle className="me-1" />
                          )}
                        {booking.paymentDetails.paymentStatus}
                      </span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteBooking(booking._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="card-body pt-0">
                  <div className="row">
                    {/* Left Column */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <Calendar className="me-2 text-primary" size={18} />
                          <strong>Check-In Date:</strong>
                        </div>
                        <p className="ms-4 mb-0">
                          {new Date(
                            booking.bookingDetails.checkIn
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <Calendar className="me-2 text-primary" size={18} />
                          <strong>Check-Out Date:</strong>
                        </div>
                        <p className="ms-4 mb-0">
                          {new Date(
                            booking.bookingDetails.checkOut
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <Phone className="me-2 text-primary" size={18} />
                          <strong>Phone Number:</strong>
                        </div>
                        <p className="ms-4 mb-0">
                          {booking.guestDetails.phone}
                        </p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <strong>Booking Status:</strong>
                        </div>
                        <p className="mb-0">
                          <span className="badge bg-primary">Booked</span>
                        </p>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <strong>Payment Status:</strong>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className={`badge ${booking.paymentDetails.paymentStatus ===
                              "completed"
                              ? "bg-success"
                              : booking.paymentDetails.paymentStatus ===
                                "pending"
                                ? "bg-warning"
                                : booking.paymentDetails.paymentStatus ===
                                  "failed"
                                  ? "bg-danger"
                                  : "bg-secondary"
                              }`}
                          >
                            {booking.paymentDetails.paymentStatus ===
                              "completed" && <CheckCircle className="me-1" />}
                            {booking.paymentDetails.paymentStatus}
                          </span>






                          {/* Payment Status Update Buttons */}
                          {booking.paymentDetails.paymentStatus ===
                            "pending" && (
                              <button
                                className="btn btn-success btn-sm"

                                onClick={() => {
                                  updatePaymentStatus(booking._id, "completed");

                                }}

                                disabled={updatingStatus === booking._id}
                              >
                                {updatingStatus === booking._id
                                  ? "Updating..."
                                  : "Mark as Paid"}
                              </button>
                            )}






                          {booking.paymentDetails.paymentStatus ===
                            "completed" && (
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() =>
                                  updatePaymentStatus(booking._id, "pending")
                                }
                                disabled={updatingStatus === booking._id}
                              >
                                {updatingStatus === booking._id
                                  ? "Updating..."
                                  : "Mark as Pending"}
                              </button>
                            )}







                        </div>
                      </div>




                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <Envelope className="me-2 text-primary" size={18} />
                          <strong>Email:</strong>
                        </div>
                        <div className="ms-4 d-flex align-items-center">
                          <p className="mb-0 me-2">
                            {booking.guestDetails.email}
                          </p>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => sendBookingPdfEmails(booking)}
                            disabled={updatingStatus === booking._id}
                          >
                            {updatingStatus === booking._id
                              ? "Sending..."
                              : "Send Email with PDF"}
                          </button>
                        </div>
                      </div>



                    </div>
                  </div>

                  {/* Room Details Section */}
                  <div className="mt-4">
                    <div className="card bg-light">
                      <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold">Room Details</h6>
                        <ChevronDown size={20} />
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <p className="mb-2">
                              <strong>Confirmation ID:</strong>{" "}
                              {booking.confirmationId ||
                                booking._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="mb-2">
                              <strong>Room:</strong>{" "}
                              {booking.roomDetails.roomType}
                            </p>
                            <p className="mb-2">
                              <strong>Price:</strong> ₹
                              {booking.amountDetails.grandTotal}
                            </p>
                            <p className="mb-2">
                              <strong>Rooms Count:</strong>{" "}
                              {booking.bookingDetails.numberOfRooms}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <p className="mb-2">
                              <strong>Guest Count:</strong>{" "}
                              {booking.bookingDetails.numberOfAdults} adults
                            </p>
                            <p className="mb-2">
                              <strong>Children Count:</strong>{" "}
                              {booking.bookingDetails.numberOfChildren || "N/A"}
                            </p>
                            <p className="mb-2">
                              <strong>Payment Method:</strong>{" "}
                              {booking.paymentDetails.paymentMethod}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Proof Section */}
                  {booking.paymentDetails.paymentProofImageUrl && (
                    <div className="mt-4">
                      <h6 className="fw-bold mb-3">
                        Payment Proof Screenshots
                      </h6>
                      <div className="text-center">
                        <a
                          href={booking.paymentDetails.paymentProofImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={booking.paymentDetails.paymentProofImageUrl}
                            alt="Payment Proof"
                            className="img-fluid border rounded"
                            style={{
                              maxHeight: "300px",
                              maxWidth: "100%",
                              cursor: "pointer",
                            }}
                          />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuestDetails;
