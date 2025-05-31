# Customer Summary Cloud Function

This cloud function provides a summary of customer data by querying BigQuery. It's designed to be deployed as a Google Cloud Function that accepts HTTP POST requests.

## Function Details

### Endpoint
- **Method**: POST
- **Path**: `/customerSummary`

### Request Format
```json
{
  "customer_id": 123  // Positive integer (minimum value: 1)
}
```

### Response Format
```json
{
  "total_revenue": number,
  "number_of_sales": number,
  "last_sale_date": string,
  "open_ticket_count": number,
  "most_frequent_category": string
}
```

### Validation Rules
- `customer_id` must be a positive integer (minimum value: 1)
- No additional properties are allowed in the request body
- The request must use POST method

### Error Responses
- `400 Bad Request`: Invalid request payload (validation errors)
- `404 Not Found`: Customer not found in the database
- `405 Method Not Allowed`: Request method other than POST
- `500 Internal Server Error`: Server-side errors

## Security
- SQL injection protection through parameterized queries
- Table reference stored in Secret Manager
- Input validation using JSON Schema (Ajv)

## Environment Variables
- `GCP_PROJECT` or `GOOGLE_CLOUD_PROJECT`: Google Cloud project ID

## Required Secrets
- `BQ_TABLE_REF`: Secret containing the BigQuery table reference (format: `dataset.table`)

## Testing

### Manual Testing
You can test the function using curl:

```bash
# Valid request
curl -X POST https://your-function-url/customerSummary \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 123}'

# Invalid request (negative customer_id)
curl -X POST https://your-function-url/customerSummary \
  -H "Content-Type: application/json" \
  -d '{"customer_id": -1}'

# Invalid request (non-integer customer_id)
curl -X POST https://your-function-url/customerSummary \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "123"}'
```

### Expected Test Cases
1. **Valid Requests**
   - Customer exists in database
   - Customer does not exist in database (should return 404)

2. **Invalid Requests**
   - Negative customer_id
   - Zero customer_id
   - Non-integer customer_id
   - Missing customer_id
   - Additional properties in request body
   - GET request (should return 405)
   - Malformed JSON

3. **Error Cases**
   - Missing or invalid table reference in Secret Manager
   - BigQuery connection issues
   - Invalid project ID

## Development

### Prerequisites
- Node.js
- Google Cloud SDK
- Access to Google Cloud project
- Required IAM permissions for BigQuery and Secret Manager

### Local Development
1. Set up environment variables:
   ```bash
   export GCP_PROJECT="your-project-id"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy the function:
   ```bash
   gcloud functions deploy customerSummary \
     --runtime nodejs18 \
     --trigger-http \
     --allow-unauthenticated
   ```

## Dependencies
- `@google-cloud/bigquery`: BigQuery client
- `@google-cloud/secret-manager`: Secret Manager client
- `express`: HTTP server framework
- `ajv`: JSON Schema validator 