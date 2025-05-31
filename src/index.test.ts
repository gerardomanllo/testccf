import { customerSummary } from './index';
import { Request, Response } from 'express';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { BigQuery } from '@google-cloud/bigquery';

// Mock Secret Manager
jest.mock('@google-cloud/secret-manager', () => {
  return {
    SecretManagerServiceClient: jest.fn().mockImplementation(() => {
      return {
        accessSecretVersion: jest.fn().mockResolvedValue([
          {
            payload: { data: Buffer.from('test_dataset.test_table') }
          }
        ])
      };
    })
  };
});

// Mock BigQuery
jest.mock('@google-cloud/bigquery', () => {
  return {
    BigQuery: jest.fn().mockImplementation(() => {
      return {
        query: jest.fn().mockResolvedValue([
          [{
            total_revenue: 1000,
            number_of_sales: 25,
            last_sale_date: '2024-12-31',
            open_ticket_count: 2,
            most_frequent_category: 'electronics'
          }]
        ])
      };
    })
  };
});

// Helper to simulate Express request/response
function createMockResponse() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('customerSummary', () => {
  it('returns summary for valid customer_id', async () => {
    const req = {
      method: 'POST',
      body: { customer_id: 42 }
    } as Request;

    const res = createMockResponse();

    await customerSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      total_revenue: 1000,
      number_of_sales: 25,
      last_sale_date: '2024-12-31',
      open_ticket_count: 2,
      most_frequent_category: 'electronics'
    });
  });

  it('returns 400 for invalid payload', async () => {
    const req = {
      method: 'POST',
      body: { customer: 42 } // invalid field
    } as Request;

    const res = createMockResponse();

    await customerSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid request payload' })
    );
  });

  it('returns 405 for GET request', async () => {
    const req = {
      method: 'GET',
      body: {}
    } as Request;

    const res = createMockResponse();

    await customerSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.send).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});
