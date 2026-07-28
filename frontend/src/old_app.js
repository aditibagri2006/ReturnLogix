import { useState } from "react";

function App() {

  const [uname, setUname] = useState("");
  const [uemail, setUemail] = useState("");
  const [upassword, setUpassword] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [itemId, setItemId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnStatus, setReturnStatus] = useState("");
  const [reverseLogisticsCost, setReverseLogisticsCost] = useState("");
  const [pickupPincode, setPickupPincode] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  const signup = async () => {

    const response = await fetch("http://127.0.0.1:5000/user/signup", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        uname: uname,
        uemail: uemail,
        upassword: upassword
      })

    });

    const data = await response.json();

    setMessage(data.message);
  };


  const signin = async () => {

    const response = await fetch("http://127.0.0.1:5000/user/signin", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        uemail: uemail,
        upassword: upassword
      })

    });

    const data = await response.json();

    setMessage(data.message);
  };
  const submitReturn = async () => {

    const response = await fetch("http://127.0.0.1:5000/user", {

     method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        customer_name: customerName,
        customer_email: customerEmail,
        product_name: productName,
        item_id: itemId,
        seller_id: sellerId,
        dispatch_date: dispatchDate,
        delivery_date: deliveryDate,
        return_reason: returnReason,
        return_status: returnStatus,
        reverse_logistics_cost: reverseLogisticsCost,
        pickup_pincode: pickupPincode

      })

    });

    const data = await response.json();

    setMessage(data.message);
}
  const fetchUsers = async () => {

    const response = await fetch("http://127.0.0.1:5000/read");

    const data = await response.json();

    setUsers(data);
  }



  return (

    <div style={{padding:"20px"}}>

      <h1>Authentication System</h1>
      <h3>Sign Up</h3>
      <input
        type="text"
        placeholder="Enter Username"
        value={uname}
        onChange={(e) => setUname(e.target.value)}
      />


      <br /><br />

      <input
        type="email"
        placeholder="Enter Email"
        value={uemail}
        onChange={(e) => setUemail(e.target.value)}
        required
      />

      <br /><br />

      <input
        type="password"
        placeholder="Enter Password"
        value={upassword}
        onChange={(e) => setUpassword(e.target.value)}
      />

      <br /><br />

      <button onClick={signup}>
        Sign Up
      </button>

      <button onClick={signin} style={{marginLeft:"10px"}}>
        Sign In
      </button>
      <h3>Return Form</h3>

      <input
        type="text"
        placeholder="Customer Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />

      <br /><br />

      <input
        type="email"
        placeholder="Customer Email"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Product Name"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Item ID"
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Seller ID"
        value={sellerId}
        onChange={(e) => setSellerId(e.target.value)}
      />

      <br /><br />
      <p>Dispatch Date</p>
      <input
        type="date"
        value={dispatchDate}
        onChange={(e) => setDispatchDate(e.target.value)}
      />

      <br /><br />
      <p>Delivery Date</p>
      <input
        type="date"
        value={deliveryDate}
        onChange={(e) => setDeliveryDate(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Return Reason"
        value={returnReason}
        onChange={(e) => setReturnReason(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Return Status"
        value={returnStatus}
        onChange={(e) => setReturnStatus(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Reverse Logistics Cost"
        value={reverseLogisticsCost}
        onChange={(e) => setReverseLogisticsCost(e.target.value)}
      />

      <br /><br />

      <input
        type="text"
        placeholder="Pickup Pincode"
        value={pickupPincode}
        onChange={(e) => setPickupPincode(e.target.value)}
      />

      <br /><br />

      <button onClick={submitReturn}>
        Submit Return
      </button>

      <br /><br />

            <p>{message}</p>
            <button onClick={fetchUsers}>
              show Users
            </button>
            <table border="1" cellPadding="10" 
            style={{marginTop:"20px"}}>

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

            {users.map((user, index) => (

                <tr key={index}>
                    <td>{user[0]}</td>
                    <td>{user[1]}</td>
                    <td>{user[2]}</td>
                    <td
                        style={{
                        color:
                            user[3] === "Approved"
                            ? "green"
                            : user[3] === "Rejected"
                            ? "red"
                            : "orange"
                        }}
                    >
                        {user[3]}
                    </td>
                    <td>{user[4]}</td>
                </tr>

            ))}

            </tbody>

            </table>

    </div>
  );
}

export default App;