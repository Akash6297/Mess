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

// 🎙️ Mic Button
const micBtn = document.createElement('button');
micBtn.textContent = '🎙️';
micBtn.type = 'button';
micBtn.style.marginLeft = '5px';
micBtn.style.padding = '5px';
micBtn.style.fontSize = '1.5rem';
micBtn.style.cursor = 'pointer';
micBtn.style.backgroundColor = '#8e44ad';
micBtn.style.border = 'none';
micBtn.style.borderRadius = '50%';
noteInput.parentNode.insertBefore(micBtn, noteInput.nextSibling);

// 🔊 Voice Recognition
let recognition;
if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onstart = () => {
    micBtn.textContent = '🔴 Listening...';
    micBtn.style.backgroundColor = '#e74c3c';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    noteInput.value = transcript;
  };

  recognition.onerror = (event) => {
    alert('Speech recognition error: ' + event.error);
  };

  recognition.onend = () => {
    micBtn.textContent = '🎙️';
    micBtn.style.backgroundColor = '#8e44ad';
  };

  micBtn.addEventListener('click', () => recognition.start());
} else {
  micBtn.disabled = true;
  micBtn.title = 'Speech recognition not supported in this browser.';
}

let currentData = [];

// 📊 Chart Instances
let barChart, doughnutChart;

// Fetch and render entries
async function fetchEntries() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Failed to fetch entries: ${res.statusText}`);
        const data = await res.json();
        currentData = data;
        renderEntries(data);
        renderCharts(data);
    } catch (error) {
        console.error(error);
        alert('Error fetching entries. Please try again later.');
    }
}

// Example: Dynamic Chart Colors
const generateColors = (count) => Array.from({ length: count }, () => `#${Math.floor(Math.random() * 16777215).toString(16)}`);

// Speech Recognition Fix
if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    micBtn.disabled = true;
    micBtn.title = 'Speech recognition not supported in this browser.';
} else {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
}

// Attach Event Listeners Dynamically
function renderEntries(data) {
    entryList.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.type}</td>
            <td>₹${item.amount}</td>
            <td><a href="#" data-person="${item.byWhom}">${item.byWhom}</a></td>
            <td>${new Date(item.date).toLocaleDateString()}</td>
            <td>${item.note || ''}</td>
            <td class="actions">
                <button class="edit">Edit</button>
                <button class="delete">Delete</button>
                <button class="download">📥</button>
            </td>
        `;
        row.querySelector('.edit').addEventListener('click', () => editEntry(item._id));
        row.querySelector('.delete').addEventListener('click', () => deleteEntry(item._id));
        row.querySelector('.download').addEventListener('click', () => downloadSingleReport(item.byWhom));
        entryList.appendChild(row);
    });
}

// Render Charts
function renderCharts(data) {
  const ctx1 = document.getElementById('overallChart').getContext('2d');
  const ctx2 = document.getElementById('personChart').getContext('2d');

  const totalExpense = data.filter(d => d.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalDeposit = data.filter(d => d.type === 'deposit').reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Destroy previous charts to avoid duplication
  if (barChart) barChart.destroy();
  if (doughnutChart) doughnutChart.destroy();

  barChart = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['Expense', 'Deposit'],
      datasets: [{
        label: 'Total Amount',
        data: [totalExpense, totalDeposit],
        backgroundColor: ['#e74c3c', '#2ecc71']
      }]
    }
  });

  // Doughnut Chart by Person
  const personTotals = {};
  data.forEach(entry => {
    const name = entry.byWhom;
    personTotals[name] = (personTotals[name] || 0) + parseFloat(entry.amount);
  });

  doughnutChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: Object.keys(personTotals),
      datasets: [{
        data: Object.values(personTotals),
        backgroundColor: ['#f39c12', '#8e44ad', '#3498db', '#1abc9c', '#e67e22', '#2c3e50']
      }]
    }
  });
}
// Event Listeners for Chart Type Changes
overallChartType.addEventListener('change', () => renderCharts(currentData));
personChartType.addEventListener('change', () => renderCharts(currentData));

// Add entry
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
      body: JSON.stringify({ type: newType, amount: newAmount, byWhom: newByWhom, date: newDate, note: newNote }),
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

// Filter
function filterByPerson(name) {
  filterPerson.value = name;
  fetchEntries();
}

downloadExcel.addEventListener('click', () => downloadReport(currentData, 'Full Report'));

function downloadSingleReport(name) {
  const filtered = currentData.filter(d => d.byWhom === name);
  downloadReport(filtered, `${name}_Report`);
}

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

filterType.addEventListener('change', fetchEntries);
filterPerson.addEventListener('change', fetchEntries);
window.addEventListener('DOMContentLoaded', fetchEntries);
