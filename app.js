document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const leadsContainer = document.getElementById('leadsContainer');

    // Handle Admin Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            fetchLeads();
        } else {
            document.getElementById('loginError').innerText = data.error;
        }
    });

    // Fetch and display leads
    async function fetchLeads() {
        const res = await fetch('/api/admin/leads');
        if (res.status === 401) {
            // Unauthorized, send back to login
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
            return;
        }
        const leads = await res.json();
        leadsContainer.innerHTML = '';

        if(leads.length === 0) {
            leadsContainer.innerHTML = '<p>No leads found.</p>';
            return;
        }

        leads.forEach(lead => {
            const card = document.createElement('div');
            card.className = 'lead-card';
            card.innerHTML = `
                <div class="flex-space">
                    <h3>${lead.name} (${lead.email})</h3>
                    <span class="status-badge status-${lead.status}">${lead.status}</span>
                </div>
                <p><strong>Message:</strong> ${lead.message}</p>
                <p><strong>Source:</strong> ${lead.source} | <strong>Received:</strong> ${new Date(lead.createdAt).toLocaleDateString()}</p>
                
                <label><strong>Update Status:</strong></label>
                <select onchange="updateLead('${lead._id}', this.value, document.getElementById('notes-${lead._id}').value)">
                    <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
                    <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="converted" ${lead.status === 'converted' ? 'selected' : ''}>Converted</option>
                </select>

                <label><strong>Follow-up Notes:</strong></label>
                <textarea id="notes-${lead._id}" rows="2" placeholder="Add details about your call...">${lead.notes || ''}</textarea>
                <button onclick="updateLead('${lead._id}', undefined, document.getElementById('notes-${lead._id}').value)">Save Notes</button>
            `;
            leadsContainer.appendChild(card);
        });
    }

    // Update Lead Details (Exposed to global window scope for inline HTML event triggers)
    window.updateLead = async (id, status, notes) => {
        // If status wasn't changed, look up what its current badge text says
        const bodyData = {};
        if (status) bodyData.status = status;
        bodyData.notes = notes;

        await fetch(`/api/admin/leads/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        fetchLeads(); // Refresh UI
    };

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    });
});
