document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("expenseForm");

  // Handle form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const type = document.getElementById("type").value;
    const amount = document.getElementById("amount").value;
    const byWhom = document.getElementById("byWhom").value;
    const date = document.getElementById("date").value;
    const note = document.getElementById("note").value;

    // Create the expense or deposit object
    const entry = {
      type,
      amount,
      byWhom,
      date,
      note,
    };

    // Send the entry to the backend API
    fetch("https://mess-server-sygz.onrender.com/api/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle successful submission
        console.log("Data saved successfully:", data);
        alert("Data saved successfully!");

        // Optionally, reset the form after submission
        form.reset();

        // Fetch the latest entries to update the UI
        fetchEntries();
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
        alert("Error saving data, please try again.");
      });
  });

  // Fetch all entries (expenses and deposits)
  function fetchEntries() {
    fetch("https://mess-server-sygz.onrender.com/api/entries")
      .then((response) => response.json())
      .then((data) => {
        // Update the dashboard or display the entries in the UI
        console.log("Fetched entries:", data);

        // Assuming you have a div with the ID 'entries' to display the entries
        const entriesDiv = document.getElementById("entries");
        entriesDiv.innerHTML = ""; // Clear previous entries

        // Loop through the entries and display them
        data.forEach((entry) => {
          const entryDiv = document.createElement("div");
          entryDiv.classList.add("entry");

          entryDiv.innerHTML = `
            <p><strong>Type:</strong> ${entry.type}</p>
            <p><strong>Amount:</strong> ${entry.amount}</p>
            <p><strong>By:</strong> ${entry.byWhom}</p>
            <p><strong>Date:</strong> ${entry.date}</p>
            <p><strong>Note:</strong> ${entry.note}</p>
            <button class="edit-btn" data-id="${entry._id}">Edit</button>
            <button class="delete-btn" data-id="${entry._id}">Delete</button>
          `;
          
          // Add entryDiv to the entriesDiv
          entriesDiv.appendChild(entryDiv);
        });
      })
      .catch((error) => {
        console.error("Error fetching entries:", error);
      });
  }

  // Fetch the entries when the page loads
  fetchEntries();
});
