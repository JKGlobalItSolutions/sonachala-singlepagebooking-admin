import { useEffect, useState } from "react";
import axios from "axios";

const Hotel = () => {


  const API_BASE = import.meta.env.VITE_API_BASE;




  const [hotel, setHotel] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact: "",
    images: []
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  // Load hotel for logged in admin
  const fetchHotel = async () => {
    try {
      const res = await axios.get(`${API_BASE}/hotel/my-hotel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHotel(res.data);
    } catch (err) {
      setHotel(null); // No hotel yet
    }
  };

  useEffect(() => {
    fetchHotel();
  }, []);

  // Populate form data when hotel is loaded
  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        address: hotel.address || '',
        contact: hotel.contact || '',
        images: hotel.images || []
      });
    }
  }, [hotel]);

  // Handle form change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      imagePreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreview]);

  // Create hotel
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('contact', formData.contact);
      
      // Append each selected image
      selectedImages.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      const res = await axios.post(`${API_BASE}/hotel/create`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      alert(res.data.message);
      setSelectedImages([]);
      setImagePreview([]);
      fetchHotel();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating hotel");
    } finally {
      setLoading(false);
    }
  };

  // Update hotel
  const handleUpdate = async () => {
    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('contact', formData.contact);
      
      // Append new images if any are selected
      selectedImages.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      const res = await axios.put(`${API_BASE}/hotel/update`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      alert(res.data.message);
      setSelectedImages([]);
      setImagePreview([]);
      fetchHotel();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating hotel");
    } finally {
      setLoading(false);
    }
  };

  // Delete hotel
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(`${API_BASE}/hotel/delete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      setHotel(null);
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting hotel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
   <h2 className="text-center mb-4">
  My Hotel {hotel ? <span className="fs-6">({hotel._id})</span> : "Loading..."}
</h2>
  

      {/* If hotel not created → show create form */}
      {!hotel ? (
        <form onSubmit={handleCreate} className="card p-4 shadow">
          <div className="mb-3">
            <label className="form-label">Hotel Name</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-control"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contact</label>
            <input
              type="text"
              className="form-control"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Hotel Images</label>
            <input
              type="file"
              className="form-control mb-2"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
            />
            {imagePreview.length > 0 && (
              <div className="d-flex gap-2 flex-wrap mt-2">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="position-relative" style={{ width: '150px', height: '150px' }}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="img-thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm position-absolute top-0 end-0"
                      onClick={() => {
                        setImagePreview(prev => prev.filter((_, i) => i !== index));
                        setSelectedImages(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Creating..." : "Create Hotel"}
          </button>
        </form>
      ) : (
        <div className="card shadow p-4">
            
          <h4>{hotel.name}</h4>
          <p><strong>Address:</strong> {hotel.address}</p>
          <p><strong>Contact:</strong> {hotel.contact}</p>
          
          {/* Hotel Images Gallery */}
          {hotel.images && hotel.images.length > 0 && (
            <div className="mb-4">
              <h5 className="mb-3">Hotel Images</h5>
              <div className="row g-3">
                {hotel.images.map((image, index) => (
                  <div key={index} className="col-md-4 col-lg-3">
                    <div className="position-relative">
                      <img
                        src={image}
                        alt={`Hotel view ${index + 1}`}
                        className="img-fluid rounded shadow-sm"
                        style={{ 
                          width: '100%', 
                          height: '100px', 
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(image, '_blank')}
                      />
                      <button
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this image?')) {
                            try {
                              setLoading(true);
                              const updatedImages = hotel.images.filter((_, i) => i !== index);
                              const formDataToSend = new FormData();
                              formDataToSend.append('name', hotel.name);
                              formDataToSend.append('address', hotel.address);
                              formDataToSend.append('contact', hotel.contact);
                              formDataToSend.append('images', JSON.stringify(updatedImages));

                              await axios.put(
                                `${API_BASE}/hotel/update`,
                                formDataToSend,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'multipart/form-data'
                                  },
                                }
                              );
                              fetchHotel();
                            } catch (err) {
                              alert('Failed to delete image');
                            } finally {
                              setLoading(false);
                            }
                          }
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Update Form */}
          <div className="mt-3">
            <h5>Update Hotel</h5>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Hotel Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
            />

            <div className="mb-3">
              <label className="form-label">Update Hotel Images</label>
              <input
                type="file"
                className="form-control mb-2"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
              />
              {imagePreview.length > 0 && (
                <div className="d-flex gap-2 flex-wrap mt-2">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="position-relative" style={{ width: '150px', height: '150px' }}>
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="img-thumbnail"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute top-0 end-0"
                        onClick={() => {
                          setImagePreview(prev => prev.filter((_, i) => i !== index));
                          setSelectedImages(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="btn btn-warning me-2" onClick={handleUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hotel;
