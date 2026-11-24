(function () {
  const SHEET_SYNC_URL = "https://script.google.com/macros/s/AKfycbw4ultOj8ZCIyHpg-x0CQlR8S_7MqGjDIvYTPP4kBAiaW1hl1m3Q2pyyiq5iq2-g8bq/exec";
  const SYNC_INTERVAL_MS = 60000;

  let lastSyncedSnapshot = "";

  function isValidUrl(url) {
    return typeof url === "string" && url.startsWith("https://script.google.com/macros/s/") && url.endsWith("/exec");
  }

  function pushRecord(record) {
    if (!record || !isValidUrl(SHEET_SYNC_URL)) return;
    fetch(SHEET_SYNC_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "upsert", record })
    }).catch(() => {});
  }

  function syncAllRecords(force = false) {
    if (!Array.isArray(window.examRecords) || !isValidUrl(SHEET_SYNC_URL)) return;
    const currentSnapshot = JSON.stringify(window.examRecords);
    if (!force && currentSnapshot === lastSyncedSnapshot) return;
    lastSyncedSnapshot = currentSnapshot;

    window.examRecords.forEach((rec) => pushRecord(rec));
  }

  const origSubmitExam = window.submitExam;
  if (typeof origSubmitExam === "function") {
    window.submitExam = async function (...args) {
      const res = await origSubmitExam.apply(this, args);
      setTimeout(() => syncAllRecords(true), 250);
      return res;
    };
  }

  const origUpdateDecision = window.updateDoctorDecision;
  if (typeof origUpdateDecision === "function") {
    window.updateDoctorDecision = function (...args) {
      const res = origUpdateDecision.apply(this, args);
      setTimeout(() => syncAllRecords(true), 150);
      return res;
    };
  }

  setInterval(() => syncAllRecords(false), SYNC_INTERVAL_MS);
  window.addEventListener("load", () => setTimeout(() => syncAllRecords(true), 1000));
})();