import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_ROOMS_API_URL;

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    type: "",
    roomDescription: "",
    totalRooms: "",
    pricePerNight: "",
    bedType: "",
    perAdultPrice: "",
    perChildPrice: "",
    discount: "",
    taxPercentage: "",
    commission: "",
    maxGuests: "",
    roomSize: "",
    availability: "Available",
    image: "",
  });
  const [editingId, setEditingId] = useState(null);

  // const token = localStorage.getItem("adminToken");
  const token = localStorage.getItem("token");

  console.log("Admin token:", token);

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/my-rooms`, axiosConfig);
      setRooms(data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image too large! Max 5MB.");
      return;
    }
    setFormData({ ...formData, image: file }); // File object
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Admin token:", token); // <-- check if token exists

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    // Debug: Log all form data being sent
    console.log('=== ADMIN PANEL DEBUG ===');
    console.log('Form data being sent:');
    for (let [key, value] of Object.entries(formData)) {
      console.log(`${key}: ${value}`);
    }
    console.log('FormData object:', data);

    try {
      if (editingId) {
        const res = await axios.put(
          `${API_BASE_URL}/update/${editingId}`,
          data,
          {
            ...axiosConfig,
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Update response:", res.data);
      } else {
        const res = await axios.post(`${API_BASE_URL}/create`, data, {
          ...axiosConfig,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Create response:", res.data);
      }
      resetForm();
      fetchRooms();
    } catch (err) {
      console.error("Error saving room:", err.response?.data || err.message);
    }
  };

  const handleEdit = (room) => {
    setFormData({
      type: room.type,
      roomDescription: room.roomDescription,
      totalRooms: room.totalRooms,
      pricePerNight: room.pricePerNight,
      bedType: room.bedType,
      perAdultPrice: room.perAdultPrice,
      perChildPrice: room.perChildPrice,
      discount: room.discount,
      taxPercentage: room.taxPercentage || "",
      commission: room.commission || "",
      maxGuests: room.maxGuests,
      roomSize: room.roomSize,
      availability: room.availability,
      image: room.image || "",
    });
    setEditingId(room._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/delete/${id}`, axiosConfig);
      fetchRooms();
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "",
      roomDescription: "",
      totalRooms: "",
      pricePerNight: "",
      bedType: "",
      perAdultPrice: "",
      perChildPrice: "",
      discount: "",
      taxPercentage: "",
      commission: "",
      maxGuests: "",
      roomSize: "",
      availability: "Available",
      image: "",
    });
    setEditingId(null);
  };

  return (
    <div className="container mt-4">
      <h2>{editingId ? "Edit Room" : "Add New Room"}</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row">
          {[
            { name: "type", placeholder: "Room Type", type: "text" },
            { name: "totalRooms", placeholder: "Total Rooms", type: "number" },
            {
              name: "pricePerNight",
              placeholder: "Price Per Night",
              type: "number",
            },
            { name: "bedType", placeholder: "Bed Type", type: "text" },
            {
              name: "perAdultPrice",
              placeholder: "Price per Adult",
              type: "number",
            },
            {
              name: "perChildPrice",
              placeholder: "Price per Child",
              type: "number",
            },
            { name: "discount", placeholder: "Discount (%)", type: "number" },
            {
              name: "taxPercentage",
              placeholder: "Tax Percentage (%)",
              type: "number",
            },
            { name: "commission", placeholder: "Commission (%)", type: "number" },
            { name: "maxGuests", placeholder: "Max Guests", type: "number" },
            {
              name: "roomSize",
              placeholder: "Room Size (e.g. 20x15)",
              type: "text",
            },
          ].map((field) => (
            <div className="col-md-6 mb-2" key={field.name}>
              <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                className="form-control"
                value={formData[field.name]}
                onChange={handleChange}
                required={["type", "pricePerNight"].includes(field.name)}
              />
            </div>
          ))}
          <div className="col-md-12 mb-2">
            <textarea
              name="roomDescription"
              placeholder="Room Description"
              className="form-control"
              value={formData.roomDescription}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <div className="col-md-6 mb-2">
            <select
              name="availability"
              className="form-control"
              value={formData.availability}
              onChange={handleChange}
            >
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
            </select>
          </div>

          <div className="col-md-6 mb-2">
            <input
              type="file"
              className="form-control"
              onChange={handleImageChange}
            />
          </div>

          {formData.image && (
            <div className="col-md-12 mb-2">
              <img
                src={
                  formData.image instanceof File
                    ? URL.createObjectURL(formData.image)
                    : formData.image
                }
                alt="Preview"
                className="img-thumbnail"
                style={{ maxHeight: "150px", objectFit: "cover" }}
              />
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary mt-2 me-2">
          {editingId ? "Update Room" : "Add Room"}
        </button>
        {editingId && (
          <button
            type="button"
            className="btn btn-secondary mt-2"
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
      </form>

      <h3>All Rooms </h3>

      <div className="row g-4">
        {rooms.map((room) => (
          <div className="col-lg-4 col-md-6" key={room._id}>
            <div className="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">
              {room.image ? (
                <img
                  src={room.image}
                  className="card-img-top"
                  alt={room.type}
                  style={{ height: "200px", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center bg-light"
                  style={{ height: "200px" }}
                >
                  <span className="text-muted">No Image</span>
                </div>
              )}

              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{room.type}</h5>
                <p className="card-text mb-2">
                  <strong>₹{room.pricePerNight}</strong> / night <br />
                  <strong>Guests:</strong> {room.maxGuests} <br />
                  <strong>Beds:</strong> {room.bedType} <br />
                </p>
                <span
                  className={`badge mb-3 ${
                    room.availability === "Available"
                      ? "bg-success"
                      : "bg-danger"
                  }`}
                >
                  {room.availability}
                </span>

                <div className="mt-auto d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-warning flex-fill"
                    onClick={() => handleEdit(room)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger flex-fill"
                    onClick={() => handleDelete(room._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rooms;
