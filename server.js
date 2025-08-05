const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Middleware
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./byd_lease.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the BYD lease database.');
});

// Create tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS quotations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quotation_number TEXT UNIQUE,
            date TEXT,
            expiry_date TEXT,
            vehicle TEXT,
            contract_details TEXT,
            payment TEXT,
            status TEXT,
            salesperson TEXT,
            initial_deposit TEXT,
            term TEXT,
            frequency TEXT,
            annual_mileage TEXT,
            periodic_rental TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (!err) {
            // Check if quotations table is empty and insert demo data
            db.get("SELECT COUNT(*) as count FROM quotations", (err, row) => {
                if (err) {
                    console.error("Error checking quotation count:", err.message);
                    return;
                }
                if (row.count === 0) {
                    db.run(`INSERT INTO quotations (quotation_number, date, expiry_date, vehicle, contract_details, payment, status, salesperson, initial_deposit, term, frequency, annual_mileage, periodic_rental) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            '29396187/1',
                            '2024-07-29',
                            '2024-08-28',
                            'BYD ATTO 3',
                            'Personal Contract Hire',
                            '277.58',
                            'Open',
                            'John Doe',
                            '£1,665.48',
                            '36',
                            'Monthly',
                            '10000',
                            '£277.58'
                        ],
                        (err) => {
                            if (err) {
                                console.error("Error inserting demo quote:", err.message);
                            } else {
                                console.log("Demo quote inserted.");
                            }
                        }
                    );
                }
            });
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS proposals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quotation_number TEXT,
            proposal_id TEXT UNIQUE,
            introducer_name TEXT,
            introducer_email TEXT,
            contact_name TEXT,
            tel_no TEXT,
            credit_line TEXT,
            quote_number TEXT,
            payment_profile TEXT,
            monthly_rental TEXT,
            title TEXT,
            surname TEXT,
            first_name TEXT,
            date_of_birth TEXT,
            maiden_name TEXT,
            marital_status TEXT,
            gender TEXT,
            country_of_birth TEXT,
            nationality TEXT,
            building_name TEXT,
            street_address TEXT,
            town TEXT,
            county TEXT,
            postcode TEXT,
            residential_status TEXT,
            time_at_address TEXT,
            occupation TEXT,
            employment_status TEXT,
            employers_name TEXT,
            time_with_employer TEXT,
            employer_business_activity TEXT,
            emp_building_name TEXT,
            emp_street TEXT,
            emp_town TEXT,
            emp_county TEXT,
            emp_postcode TEXT,
            account_name TEXT,
            bank_name TEXT,
            account_number TEXT,
            sort_code TEXT,
            time_at_bank TEXT,
            debit_credit_card TEXT,
            card_type TEXT,
            salary REAL,
            other_income REAL,
            mortgage_rent REAL,
            other_commitments REAL,
            supporting_comments TEXT,
            verbal_script BOOLEAN,
            face_to_face BOOLEAN,
            attached_documents BOOLEAN,
            manufacturers_support BOOLEAN,
            status TEXT DEFAULT 'Submitted',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            pdf_generated BOOLEAN DEFAULT FALSE,
            pdf_data TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proposal_id TEXT,
            decision_status TEXT DEFAULT 'Pending',
            order_status TEXT DEFAULT 'Not Started',
            delivery_status TEXT DEFAULT 'Not Started',
            lease_status TEXT DEFAULT 'Not Started',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(proposal_id) REFERENCES proposals(proposal_id)
        )
    `);
});

// API Routes

// Get all quotations
app.get('/api/quotations', (req, res) => {
    const params = req.query;
    let query = "SELECT * FROM quotations WHERE 1=1";
    let queryParams = [];

    if (params.quotation) {
        query += " AND quotation_number LIKE ?";
        queryParams.push(`%${params.quotation}%`);
    }
    if (params.salesperson) {
        query += " AND salesperson LIKE ?";
        queryParams.push(`%${params.salesperson}%`);
    }
    if (params.status) {
        query += " AND status = ?";
        queryParams.push(params.status);
    }

    db.all(query, queryParams, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Get a single quotation
app.get('/api/quotations/:quotation_number', (req, res) => {
    const { quotation_number } = req.params;
    db.get("SELECT * FROM quotations WHERE quotation_number = ?", [quotation_number], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: row });
    });
});

// Create a proposal
app.post('/api/proposals', (req, res) => {
    const proposalData = req.body;
    const insertQuery = `
        INSERT INTO proposals (
            quotation_number, proposal_id, introducer_name, introducer_email, contact_name, tel_no,
            credit_line, quote_number, payment_profile, monthly_rental, title, surname, first_name,
            date_of_birth, maiden_name, marital_status, gender, country_of_birth, nationality,
            building_name, street_address, town, county, postcode, residential_status, time_at_address,
            occupation, employment_status, employers_name, time_with_employer, employer_business_activity,
            emp_building_name, emp_street, emp_town, emp_county, emp_postcode, account_name, bank_name,
            account_number, sort_code, time_at_bank, debit_credit_card, card_type, salary, other_income,
            mortgage_rent, other_commitments, supporting_comments, verbal_script, face_to_face,
            attached_documents, manufacturers_support
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertQuery, Object.values(proposalData), function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Create submission record
        db.run(`
            INSERT INTO submissions (proposal_id, decision_status)
            VALUES (?, 'Approved')
        `, [proposalData.proposal_id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Proposal submitted successfully', proposalId: proposalData.proposal_id });
        });
    });
});

// Update proposal with PDF data
app.put('/api/proposals/:proposal_id/pdf', (req, res) => {
    const { proposal_id } = req.params;
    const { pdf_data } = req.body;

    db.run("UPDATE proposals SET pdf_generated = 1, pdf_data = ? WHERE proposal_id = ?", [pdf_data, proposal_id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'PDF data stored successfully' });
    });
});

// Get all submissions
app.get('/api/submissions', (req, res) => {
    db.all("SELECT p.proposal_id, p.title, p.first_name, p.surname, p.quotation_number, p.monthly_rental, s.created_at as submission_date, s.decision_status, p.pdf_data FROM proposals p LEFT JOIN submissions s ON p.proposal_id = s.proposal_id", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Get a single submission
app.get('/api/submissions/:proposal_id', (req, res) => {
    const { proposal_id } = req.params;
    db.get(`
        SELECT p.*, s.decision_status, s.order_status, s.delivery_status, s.lease_status, s.created_at as submission_date
        FROM proposals p 
        LEFT JOIN submissions s ON p.proposal_id = s.proposal_id 
        WHERE p.proposal_id = ?
    `, [proposal_id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: row });
    });
});

// Serve the index.html for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});