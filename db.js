import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: {
        ca: fs.readFileSync(process.env.DB_SSL_CA),
        key: fs.readFileSync(process.env.DB_SSL_KEY),
        cert: fs.readFileSync(process.env.DB_SSL_CERT),
    },
});

export const dbController = {
    pool: pool,
};

export const query = async (text, params = []) => {
    const client = await dbController.pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
};
