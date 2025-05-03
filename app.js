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
micBtn.className = 'mic-button';
noteInput.parentNode.appendChild(micBtn);


// Voice Recognition
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onstart = () => {
    micBtn.textContent = '🔴 Listening...';
    micBtn.classList.add('listening');
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
    micBtn.classList.remove('listening');
  };

  micBtn.addEventListener('click', () => recognition.start());
} else {
  micBtn.disabled = true;
  micBtn.title = 'Speech recognition not supported in this browser.';
}

let currentData = [];
let barChart, doughnutChart;

async function fetchEntries() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Failed to fetch entries: ${res.statusText}`);
    const data = await res.json();
    currentData = data;

    const selectedType = filterType.value;
    const selectedPerson = filterPerson.value;

    const filteredData = data.filter(entry => {
      const typeMatch = selectedType === 'all' || entry.type === selectedType;
      const personMatch = selectedPerson === 'all' || entry.byWhom === selectedPerson;
      return typeMatch && personMatch;
    });

    renderEntries(filteredData);
    renderCharts(filteredData);

    // Add event listeners for chart type changes
    document.getElementById('overallChartType').addEventListener('change', () => renderCharts(filteredData));
    document.getElementById('depositChartType').addEventListener('change', () => renderCharts(filteredData));
    document.getElementById('expenseChartType').addEventListener('change', () => renderCharts(filteredData));

  } catch (error) {
    console.error('Fetch error:', error);
    // Only show alert if fetch fails due to network/server issue
    if (!currentData.length) {
      alert('Error fetching entries. Please try again later.');
    }
  }
}

const generateColors = (count) =>
  Array.from({ length: count }, () => `#${Math.floor(Math.random() * 16777215).toString(16)}`);

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
      <td class="action-buttons">
        <button class="edit">✏️</button>
        <button class="delete">🗑️</button>
        <button class="download">📥</button>
      </td>
    `;
    row.querySelector('.edit').addEventListener('click', () => editEntry(item._id));
    row.querySelector('.delete').addEventListener('click', () => deleteEntry(item._id));
    row.querySelector('.download').addEventListener('click', () => downloadSingleReport(item.byWhom));
    row.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      filterByPerson(item.byWhom);
    });
    entryList.appendChild(row);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  fetchRequirements();

  const addButton = document.getElementById('addRequirementBtn');
  if (addButton) {
    addButton.addEventListener('click', addRequirement);
  }
});

async function fetchRequirements() {
  const res = await fetch('https://mess-server-sygz.onrender.com/api/requirements');
  const requirements = await res.json();

  const topBar = document.getElementById('requirementTopBar');
  const fulfilledList = document.getElementById('fulfilledList');
  topBar.innerHTML = '';
  fulfilledList.innerHTML = '';

  requirements.forEach(req => {
    const div = document.createElement('div');
    div.className = 'requirementItem';

    if (!req.fulfilled) {
      div.innerHTML = `
        <span>${req.text}</span>
        <button onclick="deleteRequirement('${req._id}')">Delete</button>
      `;
      topBar.appendChild(div);
    } else {
      const li = document.createElement('li');
      li.textContent = req.text;
      fulfilledList.appendChild(li);
    }
  });
}

async function addRequirement() {
  const input = document.getElementById('requirementInput');
  const text = input?.value.trim();
  if (!text) return;

  await fetch('https://mess-server-sygz.onrender.com/api/requirements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  input.value = '';
  fetchRequirements();
}

async function deleteRequirement(id) {
  await fetch(`https://mess-server-sygz.onrender.com/api/requirements/${id}`, {
    method: 'DELETE'
  });
  fetchRequirements();
}



function renderCharts(data) {
  const overallType = document.getElementById('overallChartType').value;
  const overallCtx = document.getElementById('overallChart').getContext('2d');
  const depositCtx = document.getElementById('depositChart').getContext('2d');
  const expenseCtx = document.getElementById('expenseChart').getContext('2d');

  const totalExpense = data.filter(d => d.type === 'expense').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalDeposit = data.filter(d => d.type === 'deposit').reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const personTotals = {};
  const depositTotals = {};
  const expenseTotals = {};

  data.forEach(entry => {
    const name = entry.byWhom;
    personTotals[name] = (personTotals[name] || 0) + parseFloat(entry.amount);

    if (entry.type === 'deposit') {
      depositTotals[name] = (depositTotals[name] || 0) + parseFloat(entry.amount);
    } else if (entry.type === 'expense') {
      expenseTotals[name] = (expenseTotals[name] || 0) + parseFloat(entry.amount);
    }
  });

  if (barChart) barChart.destroy();
  if (doughnutChart) doughnutChart.destroy();

  // Check and destroy the existing charts if they exist
  if (window.depositChart && window.depositChart.destroy) window.depositChart.destroy();
  if (window.expenseChart && window.expenseChart.destroy) window.expenseChart.destroy();

  // Overall Chart
  barChart = new Chart(overallCtx, {
    type: overallType,
    data: {
      labels: ['Expense', 'Deposit'],
      datasets: [{
        label: 'Total',
        data: [totalExpense, totalDeposit],
        backgroundColor: ['#e74c3c', '#2ecc71']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: overallType !== 'bar' },
        title: { display: true, text: 'Overall Summary' }
      }
    }
  });

  // Deposit Chart
  window.depositChart = new Chart(depositCtx, {
    type: overallType,
    data: {
      labels: Object.keys(depositTotals),
      datasets: [{
        data: Object.values(depositTotals),
        backgroundColor: generateColors(Object.keys(depositTotals).length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: overallType !== 'bar' },
        title: { display: true, text: 'Deposit Distribution' }
      }
    }
  });

  // Expense Chart
  window.expenseChart = new Chart(expenseCtx, {
    type: overallType,
    data: {
      labels: Object.keys(expenseTotals),
      datasets: [{
        data: Object.values(expenseTotals),
        backgroundColor: generateColors(Object.keys(expenseTotals).length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: overallType !== 'bar' },
        title: { display: true, text: 'Expense Distribution' }
      }
    }
  });
}


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

async function deleteEntry(id) {
  if (confirm("Are you sure you want to delete this entry?")) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchEntries();
  }
}

function filterByPerson(name) {
  filterPerson.value = name;
  fetchEntries();
}

downloadExcel.addEventListener('click', () => downloadReport(currentData, 'Full_Report'));

let selectedRequirementId = null;

document.addEventListener("DOMContentLoaded", () => {
  fetchRequirements();

  // Add click handler for dynamically added checkboxes
  document.getElementById("requirements-bar").addEventListener("change", function (e) {
    if (e.target.classList.contains("requirement-checkbox")) {
      const requirementId = e.target.dataset.id;
      const text = e.target.dataset.text;

      // Add requirement to note field
      document.getElementById("note").value = text;

      // Track selected requirement ID for deletion after submission
      selectedRequirementId = requirementId;
    }
  });
});


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
