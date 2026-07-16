import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaEye, FaDownload, FaCheck, faTimes, FaTimes, FaEllipsisV,FaSearch, FaBox, FaClock, FaCheckCircle, FaTimesCircle} from "react-icons/fa";
import { IoClose } from "react-icons/io5";

function ReturnsTable() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [dashboard, setDashboard] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
 });
  const totalPages = Math.ceil(totalRecords / 10);
  const fetchUsers = async () => {

    const response = await fetch(`http://127.0.0.1:5000/read/${page}`);

    const data = await response.json();

    setUsers(data.data);
    setTotalRecords(data.total);
  }
  useEffect(() => {
    fetchUsers();
    fetchDashboard();
  }, [page]);
  const viewProduct = async (id) => {

        const response = await fetch(
            `http://127.0.0.1:5000/product/${id}`
        );
        const data = await response.json();
        console.log(data);
        setSelectedProduct(data);
        setDescription(data.description || "");
        setImageUrl(data.image_url || "");
       

        setSelectedProduct(data);
    };
   const saveProduct = async () => {

        const formData = new FormData();
        if (description.trim().length < 10) {
           setMessage("Description must be at least 10 characters");
            setMessageType("error");
            return;
        }

        if (!imageUrl.toLowerCase().endsWith(".jpg")) {
            setMessage("Only .jpg images are allowed");
            setMessageType("error");
            return;
        }
        formData.append("description", description);
        formData.append("image_url", imageUrl);

        const response = await fetch(
            `http://127.0.0.1:5000/update-product-details/${selectedProduct.id}`,
            {
                method: "PUT",
                body: formData
            }
        );

        const data = await response.json();

        setMessage(data.message);
        setMessageType("success");

        setEditMode(false);
    };
  const saveUser = async () => {
        if (!/^[A-Za-z ]+$/.test(editData.customer_name)) {
           setMessage("Customer name should only contain letters");
            setMessageType("error");
            return;
        }

        if (!/^\d{6}$/.test(editData.pickup_pincode)) {
            setMessage("Pincode must be 6 digits");
            setMessageType("error");
            return;
        }

        if (!editData.product_name || !/^[A-Za-z0-9 ]+$/.test(editData.product_name)) {
            setMessage("Product name can contain only letters, numbers and spaces");
            setMessageType("error");
            return;
        }
        await fetch("http://127.0.0.1:5000/update-return", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    return_request_id: editId,
                    ...editData
                })
            });

            setMessage("Updated Successfully");
            setMessageType("success");

            setEditId(null);
            fetchUsers();
            fetchDashboard();
    };
  const deleteUser = async (id) => {

        await fetch(
            `http://127.0.0.1:5000/delete-return/${id}`,
            {
            method: "DELETE"
            }
        );

        fetchUsers();
        fetchDashboard();
  }
const exportCSV = () => {

        window.open(
            "http://127.0.0.1:5000/export-csv",
            "_blank"
        );
    };
  const filteredUsers = users.filter((user) => {

        const matchesSearch =
            (user[1] || "").toLowerCase().includes(search.toLowerCase()) ||
            (user[2] || "").toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "All" || user[3] === statusFilter;

        return matchesSearch && matchesStatus;
    });
    const totalReturns = users.length;

    const pendingCount = users.filter(
    (user) => user[3] === "Pending"
    ).length;

    const approvedCount = users.filter(
    (user) => user[3] === "Approved"
    ).length;

    const rejectedCount = users.filter(
    (user) => user[3] === "Rejected"
    ).length;
    const fetchDashboard = async () => {
  try {
    const response = await fetch("http://127.0.0.1:5000/dashboard");

    console.log("Response:", response);

    const data = await response.json();

    console.log("Data:", data);

    setDashboard(data);
  }
  catch(error) {
    console.log("Dashboard Error:", error);
  }
}


  return (
    <div className="page-container">
    <h1 className="page-title">Returns Table Page</h1>
    {message && (
        <div
            style={{
            padding: "10px",
            marginBottom: "15px",
            borderRadius: "5px",
            backgroundColor: messageType === "success" ? "green" : "red",
            color: "white"
            }}
        >
            {message}
        </div>
    )}
    <div className="table-controls">

        <div className="search-wrapper">
        <FaSearch className="search-icon" />

        <input
            className="search-input"
            placeholder="Search Customer or Product"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            
        />
        </div>
        <select className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            
            >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
        </select>
    </div>
    <div className="dashboard-tiles">

        <div className="tile total">
            <h3> <FaBox/> Total Returns</h3>
            <p>{dashboard.total}</p>
        </div>

        <div className="tile pending">
            <h3><FaClock/> Pending</h3>
            <p>{dashboard.pending}</p>
        </div>

        <div className="tile approved">
            <h3><FaCheckCircle/> Approved</h3>
            <p>{dashboard.approved}</p>
        </div>

        <div className="tile rejected">
            <h3><FaTimesCircle/> Rejected</h3>
            <p>{dashboard.rejected}</p>
        </div>

    </div>
    <div className="table-container">
    <table className="returns-table">

            <thead>
                <tr>
                <th>Return ID</th>
                <th>Customer Name</th>
                <th>Product Name</th>
                <th>Status</th>
                <th>Pincode</th>
                </tr>
            </thead>

            <tbody>

            {filteredUsers.map((user) => (

                <tr key={user[0]}>
                    <td>{user[0]}</td>
                    <td>
                    {
                        editId === user[0] ?
                        (
                            <input
                                value={editData.customer_name}
                                onChange={(e) =>
                                    setEditData({
                                        ...editData,
                                        customer_name: e.target.value
                                    })
                                }
                            />
                        )
                        :
                        user[1]
                    }
                    </td>
                    <td>
                    {
                        editId === user[0]
                        ? (
                            <input
                                value={editData.product_name}
                                onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    product_name: e.target.value
                                })
                                }
                            />
                            )
                        : user[2]
                    }
                    </td>
                    <td>
                    {
                        editId === user[0]
                        ? (
                            <select
                                value={editData.return_status}
                                onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    return_status: e.target.value
                                })
                                }
                            >
                                <option>Pending</option>
                                <option>Approved</option>
                                <option>Rejected</option>
                            </select>
                            )
                        : (
                            <span className={`status-badge ${user[3].toLowerCase()}`}>
                                {user[3]}
                            </span>
                            )
                    }
                    </td>
                    <td>
                    {
                        editId === user[0]
                        ? (
                            <input
                                value={editData.pickup_pincode}
                                onChange={(e) =>
                                setEditData({
                                    ...editData,
                                    pickup_pincode: e.target.value
                                })
                                }
                            />
                            )
                        : user[4]
                    }
                    </td>
                   
                    <td>
                         {editId === user[0] ? (
        <>
                                        <button onClick={saveUser}>
                                            <FaCheck />
                                        </button>

                                        <button onClick={() => setEditId(null)}>
                                            <FaTimes />
                                        </button>
                                    </>
                                ) : (

                       <details>
                          <summary
                           style={{
                             cursor: "pointer",
                             fontSize: "20px",
                             border: "none",
                             outline: "none",
                             listStyle: "none", // hides marker in some browsers
                              }}
                              >
                               <FaEllipsisV />
                             </summary>

                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    marginTop: "5px"
                                }}
                            >
                                <button
                                    title="Edit"
                                    onClick={() => {
                                        setEditId(user[0]);

                                        setEditData({
                                            customer_name: user[1],
                                            product_name: user[2],
                                            return_status: user[3],
                                            pickup_pincode: user[4]
                                        });
                                    }}
                                >
                                    <FaEdit />
                                </button>

                                <button
                                    title="Delete"
                                    onClick={() => deleteUser(user[0])}
                                >
                                    <FaTrash />
                                </button>

                                <button
                                    title="View"
                                    onClick={() => viewProduct(user[0])}
                                >
                                    <FaEye />
                                </button>
                            </div>
                        </details>
                        )}

                    </td>
                    
                    
                </tr>

            ))}

            </tbody>

    </table>
    </div>
    
    {selectedProduct && (
        <div
            style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "30px",
            border: "1px solid black",
            zIndex: 1000,
            width: "500px"
            }}
        >
            <button
                onClick={() => setSelectedProduct(null)}
                style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    border: "none",
                    background: "none",
                    fontSize: "24px",
                    cursor: "pointer"
                }}
                >
                <IoClose/>
            </button>
        
            <h2>Product Details</h2>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "30px"
                }}
            >

            <div style={{ flex: 1 }}>
                <h3>{selectedProduct.product_name}</h3>

                <img
                    src={selectedProduct.image_url}
                    alt="product"
                    width="250"
                    style={{ borderRadius: "10px" }}
                />
            </div>
            <div style={{ flex: 1 }}>
                <p>
                    <b>Status:</b> {selectedProduct.status}
                </p>

               <p>
                    <b>Description:</b>

                    {editMode ? (
                        <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        style={{
                            width: "100%",
                            marginTop: "10px"
                        }}
                        />
                    ) : (
                        selectedProduct.description
                    )}
                </p>
            </div>
            </div>
            <button title="Edit" onClick={() => setEditMode(true)}>
                <FaEdit/>
            </button>
            {editMode && (
                <>
                

                    
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Image URL"
                    />


                    <button title="Save" onClick={saveProduct}>
                        <FaCheck/>
                    </button>

                    <button title="Cancel"
                        onClick={() => setEditMode(false)}
                        style={{ marginLeft: "10px" }}
                    >
                        <FaTimes/>
                    </button>
                    </>
                )
            }

        </div>
    )}
    <button title="Download csvnpm "
        onClick={exportCSV}
        style={{ marginLeft: "10px" }}
        >
        <FaDownload/>
    </button>
    <div className="pagination">

        <button
            className="pagination-btn"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
        >
            ← Previous
        </button>

        <span className="page-info">
            Page {page} of {totalPages}
        </span>

        <button
            className="pagination-btn"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
        >
            Next →
        </button>

    </div>
    </div>
  )
}

export default ReturnsTable;