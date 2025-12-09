## Available Scripts

In the project directory, you can run:

### `node app`

Runs starts the backend server at [http://localhost:5000]

## Vendor side api's:

http://localhost:5000/api/vendors/request
# Use this api to send vendor request to a particular rfp from client as no frontend is developed for this. Use [676aa2d99b1234c0f8e2a4bb,64fe8cd21a93ff0012bcab44,5f7c1e3bd2a4c60019ff88e2] any of these vendor_id, also choose a valid rfp_id after submitting a request in frontend.


## Sample body for vendor api 
{
  "text": "Thank you for the RFP. We can provide 500 units of M12 x 100mm stainless steel bolts (Grade 8.8) at $45 per unit, totaling $22,500. We offer FOB shipping with delivery within 7 business days. All bolts come with our standard 2-year defect warranty and material certification. Payment terms: Net 30.",
  "client_email": "procurement@techcorp.com",
  "vendor_email": "sales@steelsupply.com",
  "rfp_id": "507f1f77bcf86cd799439011",
  "vendor_id": "676aa2d99b1234c0f8e2a4bb"
}

give a valid email id to recieve email

