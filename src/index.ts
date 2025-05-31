import { Request, Response } from 'express';
import { BigQuery } from '@google-cloud/bigquery';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import Ajv from 'ajv';

const ajv = new Ajv();
const secretClient = new SecretManagerServiceClient();
const bigquery = new BigQuery();

const schema = {
    type: 'object',
    properties: {
        customer_id: {
            type: 'integer',
            minimum: 1
        }
    },
    required: ['customer_id'],
    additionalProperties: false
};

async function getTableReference(): Promise<string> {
    const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;

    const [version] = await secretClient.accessSecretVersion({
        name: `projects/${projectId}/secrets/BQ_TABLE_REF/versions/latest`
    });
    return version.payload?.data?.toString() || '';
}

export const customerSummary = async (req: Request, res: Response) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send({ error: 'Method not allowed' });
            return;
        }

        const isValid = ajv.validate(schema, req.body);
        if (!isValid) {
            res.status(400).send({ error: 'Invalid request payload', details: ajv.errors });
            return;
        }

        const { customer_id } = req.body;
        const tableRef = await getTableReference(); // e.g. my_dataset.my_table

        const [rows] = await bigquery.query({
            query: `
        SELECT
          total_revenue,
          number_of_sales,
          last_sale_date,
          open_ticket_count,
          most_frequent_category
        FROM \`${tableRef}\`
        WHERE customer_id = @customer_id
        LIMIT 1
      `,
            params: { customer_id },
            location: 'US'
        });

        if (rows.length === 0) {
            res.status(404).send({ error: 'Customer not found' });
            return;
        }

        res.status(200).send(rows[0]);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error', details: (error as Error).message });
    }
};
