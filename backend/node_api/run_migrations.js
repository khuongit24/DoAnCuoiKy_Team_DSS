const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:241104@localhost:5432/postgres' // connect to default DB first to create dss_electronics
  });

  try {
    await client.connect();
    console.log('Connected to Postgres');
    
    // Create DB
    try {
      await client.query('CREATE DATABASE dss_electronics');
      console.log('Database dss_electronics created');
    } catch (e) {
      if (e.code === '42P04') {
        console.log('Database already exists');
      } else {
        throw e;
      }
    }
    await client.end();

    // Connect to dss_electronics
    const dbClient = new Client({
      connectionString: 'postgresql://postgres:241104@localhost:5432/dss_electronics'
    });
    await dbClient.connect();
    console.log('Connected to dss_electronics');

    const schemaSql = fs.readFileSync(path.join(__dirname, 'migrations', '001_initial_schema.sql'), 'utf8');
    await dbClient.query(schemaSql);
    console.log('Schema created');

    const seedSql = fs.readFileSync(path.join(__dirname, 'migrations', '002_seed_data.sql'), 'utf8');
    await dbClient.query(seedSql);
    console.log('Data seeded');

    await dbClient.end();
    console.log('All done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
