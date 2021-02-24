let db;
// create a new db request for a "offlineBudgetDB" database.
const request = indexedDB.open("offlineBudgetDB", 1);

request.onerror = function (error) {
  // error creating db
  console.log("IndexedDB error:", error);
};

request.onupgradeneeded = (event) => {
  // create object store called "offline_transactions", set autoIncrement to true and add keyPath
  const db = event.target.result;
  db.createObjectStore("offline_transactions", { autoIncrement: true, keyPath: "id" });
};

request.onsuccess = (event) => {
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

function saveRecord(record) {
  // create a transaction on the offline_transactions db with readwrite access
  const transaction = db.transaction(["offline_transactions"], "readwrite");

  // access object store
  const store = transaction.objectStore("offline_transactions");

  // add record to store with add method
  store.add(record);
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["offline_transactions"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("offline_transactions");
  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["offline_transactions"], "readwrite");

          // access your pending object store
          const store = transaction.objectStore("offline_transactions");

          // clear all items in your store
          store.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
