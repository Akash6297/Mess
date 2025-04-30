const form = document.getElementById('entryForm');
const entryList = document.getElementById('entryList');
const filterType = document.getElementById('filterType');
const filterPerson = document.getElementById('filterPerson');
const downloadExcel = document.getElementById('downloadExcel');
const API_URL = 'https://mess-server-sygz.onrender.com/api/entries';

const typeInput = document.getElementById('type');
const amountInput = document.getElementById('amount');
const byWhomInput = document.getElementById('byWhom');
const dateInput = document.getElementById('date');
const noteInput = document.getElementById('note');

// 🎙️ Create mic button for note field
const micBtn = document.createElement('button');
micBtn.textContent = '🎙️';
micBtn.type = 'button';
micBtn.style.marginLeft = '5px';
noteInput.parentNode.insertBefore(micBtn, noteInput.nextSibling);

// 🔊 Voice Recognition for Note Field
let recognition;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    noteInput.value = transcript;
  };

  recognition.onerror = (event) => {
    alert('Speech recognition error: ' + event.error);
  };

  micBtn.addEventListener('click', () => {
    recognition.start();
  });
} else {
  micBtn.disabled = true;
  micBtn.title = 'Speech recognition not supported in this browser.';
}

let currentData = [];

// Fetch and render entries
async function fetchEntries() {
  const res = await fetch(API_URL);
  const data = await res.json();
  currentData = data;
  renderEntries(data);
}

// Render entries to table
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
      <td><a href="#" onclick="filterByPerson('${item.byWhom}')">${item.byWhom}</a></td>
      <td>${new Date(item.date).toLocaleDateString()}</td>
      <td>${item.note || ''}</td>
      <td class="actions">
        <button class="edit" onclick="editEntry('${item._id}')">Edit</button>
        <button class="delete" onclick="deleteEntry('${item._id}')">Delete</button>
        <button class="download" onclick="downloadSingleReport('${item.byWhom}')">📥</button>
      </td>
    `;
    entryList.appendChild(row);
  });
}

// Add new entry
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const entry = {
    type: typeInput.value,
    amount: amountInput.value,
    byWhom: byWhomInput.value,
    date: dateInput.value,
    note: noteInput.value,
  };

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });

  form.reset();
  fetchEntries();
});

// Edit entry
async function editEntry(id) {
  const item = currentData.find(i => i._id === id);
  if (!item) return;

  const newType = prompt("Type (expense/deposit):", item.type);
  const newAmount = prompt("Amount:", item.amount);
  const newByWhom = prompt("By Whom:", item.byWhom);
  const newDate = prompt("Date (YYYY-MM-DD):", item.date.slice(0, 10));
  const newNote = prompt("Note:", item.note);

  if (newType && newAmount && newByWhom && newDate) {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: newType,
        amount: newAmount,
        byWhom: newByWhom,
        date: newDate,
        note: newNote
      }),
    });
    fetchEntries();
  } else {
    alert("All fields except note are required to update.");
  }
}

// Delete entry
async function deleteEntry(id) {
  if (confirm("Are you sure you want to delete this entry?")) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchEntries();
  }
}

// Filter by person (clickable name)
function filterByPerson(name) {
  filterPerson.value = name;
  fetchEntries();
}

// Download entire report
downloadExcel.addEventListener('click', () => {
  downloadReport(currentData, 'Full Report');
});

// Download report for individual
function downloadSingleReport(name) {
  const filtered = currentData.filter(d => d.byWhom === name);
  downloadReport(filtered, `${name}_Report`);
}

// Create and download Excel report
function downloadReport(data, filename) {
  const sheet = XLSX.utils.json_to_sheet(data.map(d => ({
    Type: d.type,
    Amount: d.amount,
    By: d.byWhom,
    Date: new Date(d.date).toLocaleDateString(),
    Note: d.note
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Filter change listeners
filterType.addEventListener('change', fetchEntries);
filterPerson.addEventListener('change', fetchEntries);

// Load data initially
window.addEventListener('DOMContentLoaded', fetchEntries);
