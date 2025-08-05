// BYD Lease Portal Application JavaScript

class BYDLeasePortal {
    constructor() {
        this.currentUser = null;
        this.currentQuote = null;
        this.users = {
            "User1": "password1",
            "User2": "password2", 
            "User3": "password3"
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.showPage('login-page');
    }
    
    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Search form
        document.getElementById('search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });
        
        // Proposal form
        document.getElementById('proposal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProposalSubmit();
        });
        
        // Navigation buttons
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.getElementById('back-to-search').addEventListener('click', () => this.showPage('search-page'));
        document.getElementById('back-to-results').addEventListener('click', () => this.showPage('results-page'));
        document.getElementById('back-to-summary').addEventListener('click', () => this.showPage('summary-page'));
        document.getElementById('back-to-proposal').addEventListener('click', () => this.showPage('proposal-page'));
        document.getElementById('individual-proposal-btn').addEventListener('click', () => this.showPage('proposal-page'));
        document.getElementById('submissions-btn').addEventListener('click', () => this.showSubmissionsPage());
        document.getElementById('back-to-search-from-submissions').addEventListener('click', () => this.showPage('search-page'));
        
        // Verbal script button
        document.getElementById('verbal-script-btn').addEventListener('click', () => {
            alert('Verbal Script: "I confirm that I have explained the terms and conditions of this lease agreement to the customer and they have understood and accepted them."');
        });
        
        // Auto-calculate income/expenditure totals
        this.setupIncomeCalculation();
    }
    
    setupIncomeCalculation() {
        const incomeFields = ['salary', 'other-income'];
        const expenditureFields = ['mortgage-rent', 'other-commitments'];
        
        incomeFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', this.calculateTotals.bind(this));
            }
        });
        
        expenditureFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', this.calculateTotals.bind(this));
            }
        });
    }
    
    calculateTotals() {
        const salary = parseFloat(document.getElementById('salary').value) || 0;
        const otherIncome = parseFloat(document.getElementById('other-income').value) || 0;
        const mortgageRent = parseFloat(document.getElementById('mortgage-rent').value) || 0;
        const otherCommitments = parseFloat(document.getElementById('other-commitments').value) || 0;
        
        const totalIncome = salary + otherIncome;
        const totalExpenditures = mortgageRent + otherCommitments;
        const disposableIncome = totalIncome - totalExpenditures;
        
        // You could add display elements for these totals if needed
        console.log('Total Income:', totalIncome, 'Total Expenditures:', totalExpenditures, 'Disposable:', disposableIncome);
    }
    
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        
        if (this.users[username] && this.users[username] === password) {
            this.currentUser = username;
            document.getElementById('current-user').textContent = username;
            document.getElementById('user-info').classList.remove('d-none');
            errorDiv.classList.add('d-none');
            this.showPage('search-page');
        } else {
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.classList.remove('d-none');
        }
    }
    
    handleLogout() {
        this.currentUser = null;
        document.getElementById('user-info').classList.add('d-none');
        document.getElementById('login-form').reset();
        this.showPage('login-page');
    }
    
    async handleSearch() {
        const formData = new FormData(document.getElementById('search-form'));
        const searchParams = Object.fromEntries(formData.entries());
        
        const query = new URLSearchParams(searchParams).toString();

        try {
            const response = await fetch(`/api/quotations?${query}`);
            const results = await response.json();
            this.displaySearchResults(results.data);
            this.showPage('results-page');
        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. Please try again.');
        }
    }
    
    displaySearchResults(rows) {
        const tbody = document.getElementById('results-tbody');
        tbody.innerHTML = '';
        
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No results found</td></tr>';
            return;
        }
        
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="#" class="quote-link" data-quote="${row.quotation_number}">${row.quotation_number}</a></td>
                <td>${row.date}</td>
                <td>${row.expiry_date}</td>
                <td>${row.vehicle}</td>
                <td>£${row.payment}</td>
                <td><span class="status status--${row.status.toLowerCase()}">${row.status}</span></td>
                <td>${row.salesperson}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Add click handlers for quote links
        document.querySelectorAll('.quote-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const quoteNumber = e.target.dataset.quote;
                this.showQuoteSummary(quoteNumber);
            });
        });
    }
    
    async showQuoteSummary(quoteNumber) {
        try {
            const response = await fetch(`/api/quotations/${encodeURIComponent(quoteNumber)}`);
            const result = await response.json();
            const quote = result.data;

            if (!quote) {
                alert('Quote not found');
                return;
            }
            
            this.currentQuote = quote;
            
            const summaryContent = document.getElementById('quote-summary-content');
            summaryContent.innerHTML = `
                <div class="quote-info">
                    <div class="quote-info-item">
                        <div class="quote-info-label">Quotation Number</div>
                        <div class="quote-info-value">${quote.quotation_number}</div>
                    </div>
                    <div class="quote-info-item">
                        <div class="quote-info-label">Date</div>
                        <div class="quote-info-value">${quote.date}</div>
                    </div>
                    <div class="quote-info-item">
                        <div class="quote-info-label">Expiry Date</div>
                        <div class="quote-info-value">${quote.expiry_date}</div>
                    </div>
                    <div class="quote-info-item">
                        <div class="quote-info-label">Salesperson</div>
                        <div class="quote-info-value">${quote.salesperson}</div>
                    </div>
                    <div class="quote-info-item">
                        <div class="quote-info-label">Monthly Payment</div>
                        <div class="quote-info-value">£${quote.payment}</div>
                    </div>
                    <div class="quote-info-item">
                        <div class="quote-info-label">Term</div>
                        <div class="quote-info-value">${quote.term} months</div>
                    </div>
                    <div class="quote-info-item">
                        <div class="quote-info-label">Annual Mileage</div>
                        <div class="quote-info-value">${quote.annual_mileage} miles</div>
                    </div>
                    <div class="quote-info-item">
                        <div class="quote-info-label">Status</div>
                        <div class="quote-info-value"><span class="status status--${quote.status.toLowerCase()}">${quote.status}</span></div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header section-header">
                        <h4>Vehicle Details</h4>
                    </div>
                    <div class="card-body">
                        <p><strong>Vehicle:</strong> ${quote.vehicle}</p>
                        <p><strong>Contract Details:</strong> ${quote.contract_details}</p>
                        <p><strong>Initial Deposit:</strong> ${quote.initial_deposit}</p>
                        <p><strong>Periodic Rental:</strong> ${quote.periodic_rental}</p>
                        <p><strong>Payment Frequency:</strong> ${quote.frequency}</p>
                    </div>
                </div>
            `;
            
            this.showPage('summary-page');
        } catch (error) {
            console.error('Error showing quote summary:', error);
            alert('Error loading quote summary');
        }
    }
    
    async handleProposalSubmit() {
        const form = document.getElementById('proposal-form');
        const formData = new FormData(form);
        
        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = 'var(--color-error)';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            alert('Please fill in all required fields');
            return;
        }
        
        try {
            // Generate unique proposal ID
            const proposalId = `PROP-${Date.now()}`;
            
            // Prepare data for server
            const proposalData = {
                quotation_number: this.currentQuote?.quotation_number || '',
                proposal_id: proposalId,
                introducer_name: formData.get('introducer_name'),
                introducer_email: formData.get('introducer_email'),
                contact_name: formData.get('contact_name'),
                tel_no: formData.get('tel_no'),
                credit_line: formData.get('credit_line'),
                quote_number: formData.get('quote_number'),
                payment_profile: formData.get('payment_profile'),
                monthly_rental: formData.get('monthly_rental'),
                title: formData.get('title'),
                surname: formData.get('surname'),
                first_name: formData.get('first_name'),
                date_of_birth: formData.get('date_of_birth'),
                maiden_name: formData.get('maiden_name'),
                marital_status: formData.get('marital_status'),
                gender: formData.get('gender'),
                country_of_birth: formData.get('country_of_birth'),
                nationality: formData.get('nationality'),
                building_name: formData.get('building_name'),
                street_address: formData.get('street'),
                town: formData.get('town'),
                county: formData.get('county'),
                postcode: formData.get('postcode'),
                residential_status: formData.get('residential_status'),
                time_at_address: formData.get('time_at_address'),
                occupation: formData.get('occupation'),
                employment_status: formData.get('employment_status'),
                employers_name: formData.get('employers_name'),
                time_with_employer: formData.get('time_with_employer'),
                employer_business_activity: formData.get('employer_business_activity'),
                emp_building_name: formData.get('emp_building_name'),
                emp_street: formData.get('emp_street'),
                emp_town: formData.get('emp_town'),
                emp_county: formData.get('emp_county'),
                emp_postcode: formData.get('emp_postcode'),
                account_name: formData.get('account_name'),
                bank_name: formData.get('bank_name'),
                account_number: formData.get('account_number'),
                sort_code: formData.get('sort_code'),
                time_at_bank: formData.get('time_at_bank'),
                debit_credit_card: formData.get('debit_credit_card'),
                card_type: formData.get('card_type'),
                salary: parseFloat(formData.get('salary')) || 0,
                other_income: parseFloat(formData.get('other_income')) || 0,
                mortgage_rent: parseFloat(formData.get('mortgage_rent')) || 0,
                other_commitments: parseFloat(formData.get('other_commitments')) || 0,
                supporting_comments: formData.get('supporting_comments'),
                verbal_script: formData.get('verbal_script') ? 1 : 0,
                face_to_face: formData.get('face_to_face') ? 1 : 0,
                attached_documents: formData.get('attached_documents') ? 1 : 0,
                manufacturers_support: formData.get('manufacturers_support') ? 1 : 0
            };
            
            // Send to server
            const response = await fetch('/api/proposals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proposalData)
            });

            if (!response.ok) {
                throw new Error('Server responded with an error');
            }

            // Generate PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // PDF Header
            doc.setFontSize(20);
            doc.setTextColor(220, 38, 127); // BYD Red
            doc.text('BYD LEASE', 20, 20);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.text('Individual Proposal Data', 20, 30);
            
            doc.setFontSize(10);
            doc.text(`Proposal ID: ${proposalData.proposal_id}`, 20, 40);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
            
            let yPos = 55;
            
            // Personal Details
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Personal Details', 20, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            
            doc.text(`Name: ${proposalData.title} ${proposalData.first_name} ${proposalData.surname}`, 20, yPos += 5);
            doc.text(`Date of Birth: ${proposalData.date_of_birth}`, 20, yPos += 5);
            doc.text(`Marital Status: ${proposalData.marital_status}`, 20, yPos += 5);
            doc.text(`Gender: ${proposalData.gender}`, 20, yPos += 5);
            
            // Address
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Address', 20, yPos += 10);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.text(`${proposalData.building_name} ${proposalData.street_address}`, 20, yPos += 5);
            doc.text(`${proposalData.town}, ${proposalData.county} ${proposalData.postcode}`, 20, yPos += 5);
            doc.text(`Residential Status: ${proposalData.residential_status}`, 20, yPos += 5);
            
            // Employment
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Employment', 20, yPos += 10);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.text(`Occupation: ${proposalData.occupation}`, 20, yPos += 5);
            doc.text(`Employer: ${proposalData.employers_name}`, 20, yPos += 5);
            doc.text(`Employment Status: ${proposalData.employment_status}`, 20, yPos += 5);
            
            // Financial Information
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Financial Information', 20, yPos += 10);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.text(`Monthly Salary: £${proposalData.salary}`, 20, yPos += 5);
            doc.text(`Other Income: £${proposalData.other_income}`, 20, yPos += 5);
            doc.text(`Mortgage/Rent: £${proposalData.mortgage_rent}`, 20, yPos += 5);
            doc.text(`Other Commitments: £${proposalData.other_commitments}`, 20, yPos += 5);
            
            // Vehicle Information
            if (this.currentQuote) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Vehicle Information', 20, yPos += 10);
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                doc.text(`Quote Number: ${this.currentQuote.quotation_number}`, 20, yPos += 5);
                doc.text(`Vehicle: ${this.currentQuote.vehicle}`, 20, yPos += 5);
                doc.text(`Monthly Rental: £${this.currentQuote.payment}`, 20, yPos += 5);
                doc.text(`Term: ${this.currentQuote.term} months`, 20, yPos += 5);
            }
            
            // Supporting Comments
            if (proposalData.supporting_comments) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Supporting Comments', 20, yPos += 10);
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
                const comments = doc.splitTextToSize(proposalData.supporting_comments, 170);
                doc.text(comments, 20, yPos += 5);
            }
            
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('BYD Lease Funder Portal - Confidential Document', 20, 280);
            doc.text(`Generated by: ${this.currentUser}`, 20, 285);

            const pdfBlob = doc.output('blob');
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);
            reader.onloadend = async () => {
                const base64data = reader.result;
                await fetch(`/api/proposals/${proposalId}/pdf`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ pdf_data: base64data })
                });
            };

            // Show success message and navigate to tracking
            alert(`Proposal submitted successfully!\nProposal ID: ${proposalId}\nPDF generated and stored.`);
            
            this.showOrderTracking(proposalId);
            
        } catch (error) {
            console.error('Error submitting proposal:', error);
            alert('Error submitting proposal. Please try again.');
        }
    }
    
    async showOrderTracking(proposalId) {
        try {
            const response = await fetch(`/api/submissions/${proposalId}`);
            const result = await response.json();
            const submission = result.data;

            if (!submission) {
                alert('Submission not found');
                return;
            }

            const detailsDiv = document.getElementById('submission-details');
            detailsDiv.innerHTML = `
                <div class="submission-details">
                    <div class="submission-item">
                        <span class="submission-label">Proposal ID:</span>
                        <span class="submission-value">${submission.proposal_id}</span>
                    </div>
                    <div class="submission-item">
                        <span class="submission-label">Customer Name:</span>
                        <span class="submission-value">${submission.title} ${submission.first_name} ${submission.surname}</span>
                    </div>
                    <div class="submission-item">
                        <span class="submission-label">Quote Number:</span>
                        <span class="submission-value">${submission.quotation_number}</span>
                    </div>
                    <div class="submission-item">
                        <span class="submission-label">Monthly Rental:</span>
                        <span class="submission-value">£${submission.monthly_rental}</span>
                    </div>
                    <div class="submission-item">
                        <span class="submission-label">Submission Date:</span>
                        <span class="submission-value">${new Date(submission.submission_date).toLocaleDateString()}</span>
                    </div>
                    <div class="submission-item">
                        <span class="submission-label">Decision Status:</span>
                        <span class="submission-value status status--success">${submission.decision_status}</span>
                    </div>
                    <div class="submission-item">
                        <span class="submission-label">PDF:</span>
                        <span class="submission-value"><a href="#" class="download-pdf-link" data-proposal-id="${submission.proposal_id}">Download PDF</a></span>
                    </div>
                </div>
            `;

            const downloadLink = detailsDiv.querySelector('.download-pdf-link');
            downloadLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (submission.pdf_data) {
                    const link = document.createElement('a');
                    link.href = submission.pdf_data;
                    link.download = `${submission.proposal_id}.pdf`;
                    link.click();
                } else {
                    alert('No PDF available for this proposal.');
                }
            });
        } catch (error) {
            console.error('Error loading submission details:', error);
            alert('Error loading submission details.');
        }
        
        this.showPage('tracking-page');
    }

    async showSubmissionsPage() {
        this.showPage('submissions-page');
        await this.populateSubmissionsTable();
    }

    async populateSubmissionsTable() {
        const tbody = document.getElementById('submissions-tbody');
        tbody.innerHTML = '';

        try {
            const response = await fetch('/api/submissions');
            const results = await response.json();
            const rows = results.data;

            if (rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No submissions found</td></tr>';
                return;
            }

            rows.forEach(row => {
                const tr = document.createElement('tr');
                const proposalId = row.proposal_id;
                const pdfData = row.pdf_data;
                
                const submissionDateRaw = row.submission_date;
                const submissionDate = submissionDateRaw ? new Date(submissionDateRaw).toLocaleDateString() : 'N/A';

                const decisionStatusRaw = row.decision_status;
                const decisionStatus = decisionStatusRaw ? decisionStatusRaw : 'Pending';
                const decisionStatusClass = decisionStatusRaw ? decisionStatusRaw.toLowerCase() : 'pending';

                tr.innerHTML = `
                    <td>${proposalId}</td>
                    <td>${row.title} ${row.first_name} ${row.surname}</td>
                    <td>${row.quotation_number}</td>
                    <td>£${row.monthly_rental}</td>
                    <td>${submissionDate}</td>
                    <td><span class="status status--${decisionStatusClass}">${decisionStatus}</span></td>
                    <td><button class="btn btn-sm btn-outline-primary download-pdf-btn" data-proposal-id="${proposalId}" ${!pdfData ? 'disabled' : ''}>Download PDF</button></td>
                `;
                tbody.appendChild(tr);
            });

            document.querySelectorAll('.download-pdf-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const proposalId = e.target.dataset.proposalId;
                    const response = await fetch(`/api/submissions/${proposalId}`);
                    const result = await response.json();
                    const submission = result.data;

                    if (submission && submission.pdf_data) {
                        const link = document.createElement('a');
                        link.href = submission.pdf_data;
                        link.download = `${proposalId}.pdf`;
                        link.click();
                    } else {
                        alert('No PDF available for this proposal.');
                    }
                });
            });
        } catch (error) {
            console.error('Error populating submissions table:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading submissions</td></tr>';
        }
    }
    
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.add('d-none');
        });
        
        // Show target page
        document.getElementById(pageId).classList.remove('d-none');
        
        // Update hash for navigation
        window.location.hash = pageId;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bydPortal = new BYDLeasePortal();
});

// Handle browser back/forward navigation
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        window.bydPortal.showPage(hash);
    }
});
