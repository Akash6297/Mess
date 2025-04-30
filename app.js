const form = document.getElementById('entryForm');
const entryList = document.getElementById('entryList');
const filterType = document.getElementById('filterType');
const filterPerson = document.getElementById('filterPerson');
const downloadExcel = document.getElementById('downloadExcel');

const API_URL = 'https://mess-server-sygz.onrender.com/api/entries'; // Replace with your backend URL

// Fetch and render data
async function fetchEntries() {
  const res = await fetch(API_URL);
  const data = await res.json();
  renderEntries(data);
}

// Render entries
function renderEntries(data) {
  const type = filterType.value;
  const person = filterPerson.value;
  const filtered = data.filter(item =>
    (type === 'all' || item.type === type) &&
    (person === 'all' || item.byWhom === person)
  );

  entryList.innerHTML = '';
  filtered.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.type}</td>
      <td>₹${item.amount}</td>
      <td>${item.byWhom}</td>
      <td>${new Date(item.date).toLocaleDateString()}</td>
      <td>${item.note || ''}</td>
      <td class="actions">
        <button class="edit" onclick="editEntry('${item._id}')">Edit</button>
        <button class="delete" onclick="deleteEntry('${item._id}')">Delete</button>
      </td>
    `;
    entryList.appendChild(row);
  });
}

// Add new entry
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const entry = {
    type: document.getElementById('type').value,
    amount: document.getElementById('amount').value,
    byWhom: document.getElementById('byWhom').value,
    date: document.getElementById('date').value,
    note: document.getElementById('note').value,
  };

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });

  form.reset();
  fetchEntries();
});

// Delete entry
async function deleteEntry(id) {
  if (confirm("Are you sure you want to delete this entry?")) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchEntries();
  }
}

// Edit entry
async function editEntry(id) {
  const newNote = prompt("Enter new note:");
  if (newNote !== null) {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote }),
    });
    fetchEntries();
  }
}

// Export to Excel
downloadExcel.addEventListener('click', async () => {
  const res = await fetch(API_URL);
  const data = await res.json();
  const ws = XLSX.utils.json_to_sheet(data.map(d => ({
    Type: d.type,
    Amount: d.amount,
    By: d.byWhom,
    Date: new Date(d.date).toLocaleDateString(),
    Note: d.note
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, 'expense_report.xlsx');
});

// Listen to filters
filterType.addEventListener('change', fetchEntries);
filterPerson.addEventListener('change', fetchEntries);

// Initial load
fetchEntries();
