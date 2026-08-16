(function () {
  "use strict";

  var LICENSE_KEY = "thatsExtraLicense";

  function hasLicense() {
    var v = localStorage.getItem(LICENSE_KEY);
    return !!(v && String(v).trim());
  }

  (function captureLicense() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("license");
    if (q && String(q).trim()) {
      localStorage.setItem(LICENSE_KEY, String(q).trim());
    }
  })();

  (function markLicensed() {
    if (!hasLicense()) return;
    var note = document.getElementById("checkout-note");
    var btn = document.getElementById("checkout-btn");
    if (note) note.textContent = "Licensed. PDFs download without the free-version line.";
    if (btn) {
      btn.textContent = "You're in";
      btn.setAttribute("href", "#tool");
    }
  })();

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sel = btn.getAttribute("data-copy");
      var el = sel ? document.querySelector(sel) : null;
      if (!el) return;
      var text = (el.innerText || el.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
      copyText(text).then(function () {
        var old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () {
          btn.textContent = old;
        }, 1600);
      });
    });
  });

  var form = document.getElementById("cr-form");
  if (!form) return;

  var dateInput = form.elements.date;
  if (dateInput && !dateInput.value) {
    var now = new Date();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    dateInput.value = now.getFullYear() + "-" + m + "-" + d;
  }

  function money(n) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(n);
  }

  function num(name) {
    var raw = form.elements[name].value;
    if (raw === "" || raw == null) return null;
    var v = parseFloat(raw);
    return Number.isFinite(v) ? v : null;
  }

  function val(name) {
    return String(form.elements[name].value || "").trim();
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-").map(Number);
    var dt = new Date(parts[0], parts[1] - 1, parts[2]);
    return dt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function hoursLabel(hours) {
    return hours === 1 ? "1 hour" : hours + " hours";
  }

  function compute() {
    var mode = form.elements.pricingMode.value;
    var fee = null;
    var feeLabel = "";
    if (mode === "hourly") {
      var hours = num("hours");
      var rate = num("rate");
      if (hours != null && rate != null) {
        fee = hours * rate;
        feeLabel = money(fee) + " (" + hoursLabel(hours) + " at " + money(rate) + "/hr)";
      }
    } else {
      var flat = num("flatFee");
      if (flat != null) {
        fee = flat;
        feeLabel = money(fee);
      }
    }
    var original = num("originalAmount");
    var total = fee != null && original != null ? fee + original : null;
    return { mode: mode, fee: fee, feeLabel: feeLabel, original: original, total: total };
  }

  function timelineSentence(days) {
    if (days == null) return "The timeline stays the same.";
    if (days === 0) return "The timeline stays the same.";
    if (days === 1) return "This adds 1 day to the timeline.";
    return "This adds " + days + " days to the timeline.";
  }

  function timelineShort(days) {
    if (days == null || days === 0) return "No change";
    if (days === 1) return "+1 day";
    return "+" + days + " days";
  }

  function commercialBlock(feeLabel, days, original, total) {
    var lines = [];
    lines.push("Fee: " + (feeLabel || "[Fee]") + ".");
    lines.push(timelineSentence(days));
    if (original != null && total != null) {
      lines.push("Original contract: " + money(original) + ". New total: " + money(total) + ".");
    }
    return lines.join("\n");
  }

  function buildEmail() {
    var fromName = val("fromName") || "[Your name]";
    var client = val("clientName") || "[Client]";
    var project = val("projectName") || "[Project]";
    var scope = val("originalScope") || "[Original scope]";
    var ask = val("newAsk") || "[New ask]";
    var tone = form.elements.tone.value;
    var days = num("timelineDays");
    if (days == null) days = 0;
    var c = compute();
    var commercials = commercialBlock(c.feeLabel, days, c.original, c.total);
    var subject;
    var body;

    if (tone === "firm") {
      subject = "Change request for " + project;
      body = [
        "Hi " + client + ",",
        "",
        "I am sending a change request for " + project + ".",
        "",
        "Original scope:",
        scope,
        "",
        "Requested change:",
        ask,
        "",
        "This work is outside the original agreement.",
        commercials,
        "",
        "Work on this change begins only after written approval. Please reply to confirm, or sign the attached change request.",
        "",
        fromName
      ].join("\n");
    } else if (tone === "grateful") {
      subject = "Thank you, and a change request for " + project;
      body = [
        "Hi " + client + ",",
        "",
        "Thank you for the continued work on " + project + ". I want to keep the scope clear so there are no surprises.",
        "",
        "Original scope:",
        scope,
        "",
        "New request:",
        ask,
        "",
        "I can take this on.",
        commercials,
        "",
        "I will begin once I have your written okay. A reply works. The attached change request is there if you prefer a signature.",
        "",
        "Grateful for the trust,",
        fromName
      ].join("\n");
    } else {
      subject = "A change on " + project + ", with a price attached";
      body = [
        "Hi " + client + ",",
        "",
        "Quick note before I start the extra work on " + project + ".",
        "",
        "What we agreed:",
        scope,
        "",
        "What you asked for:",
        ask,
        "",
        "That sits outside the original scope. I can do it.",
        commercials,
        "",
        "I will start as soon as I have your written approval. A reply to this email is enough. You can also sign the attached change request.",
        "",
        "Thanks,",
        fromName
      ].join("\n");
    }

    return {
      subject: subject,
      body: body,
      fromName: fromName,
      client: client,
      project: project,
      scope: scope,
      ask: ask,
      tone: tone,
      days: days,
      fee: c.fee,
      feeLabel: c.feeLabel,
      original: c.original,
      total: c.total,
      date: formatDate(val("date"))
    };
  }

  function syncMode() {
    var mode = form.elements.pricingMode.value;
    form.querySelectorAll(".field-hourly").forEach(function (el) {
      el.classList.toggle("hidden", mode !== "hourly");
    });
    form.querySelectorAll(".field-flat").forEach(function (el) {
      el.classList.toggle("hidden", mode !== "flat");
    });
  }

  function render() {
    syncMode();
    var email = buildEmail();
    var c = compute();
    var feeEl = document.getElementById("fee-line");
    if (c.fee != null) {
      var t = "This change: " + c.feeLabel;
      if (c.original != null && c.total != null) {
        t += ". New project total: " + money(c.total);
      }
      feeEl.textContent = t;
    } else {
      feeEl.textContent = "Add a fee to price the extra.";
    }
    document.getElementById("preview-subject").textContent = "Subject: " + email.subject;
    document.getElementById("preview-body").textContent = email.body;
  }

  function hint(msg) {
    document.getElementById("action-hint").textContent = msg;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      ta.remove();
      resolve();
    });
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);

  document.getElementById("fill-example").addEventListener("click", function () {
    form.elements.fromName.value = "Maya Chen Studio";
    form.elements.clientName.value = "Northline Coffee";
    form.elements.projectName.value = "Website refresh";
    form.elements.originalScope.value =
      "Homepage redesign, a menu page, and a simple contact form. Three rounds of revision. Desktop and mobile.";
    form.elements.newAsk.value =
      "An online ordering page that connects to Square, plus a loyalty signup modal on every page.";
    form.querySelector('input[name="pricingMode"][value="hourly"]').checked = true;
    form.elements.hours.value = "8";
    form.elements.rate.value = "125";
    form.elements.flatFee.value = "1200";
    form.elements.originalAmount.value = "4800";
    form.elements.timelineDays.value = "5";
    form.querySelector('input[name="tone"][value="firm"]').checked = true;
    render();
    hint("Example loaded. Copy the email or download the PDF.");
  });

  document.getElementById("copy-email").addEventListener("click", function () {
    var email = buildEmail();
    var text = "Subject: " + email.subject + "\n\n" + email.body;
    copyText(text).then(function () {
      hint("Copied. Paste it into your mail app.");
    });
  });

  document.getElementById("download-pdf").addEventListener("click", function () {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      hint("PDF library did not load. Check your connection and try again.");
      return;
    }
    if (!val("fromName") || !val("clientName") || !val("projectName") || !val("originalScope") || !val("newAsk")) {
      hint("Fill name, client, project, scope, and the new ask first.");
      return;
    }
    var email = buildEmail();
    if (email.fee == null) {
      hint("Add a fee so the change request has a price.");
      return;
    }
    makePdf(email);
    hint(hasLicense() ? "PDF downloaded." : "PDF downloaded. Free version includes a small footer line.");
  });

  function makePdf(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "pt", format: "letter" });
    var pageW = 612;
    var pageH = 792;
    var margin = 54;
    var width = pageW - margin * 2;
    var y = 50;
    var ink = [27, 23, 20];
    var muted = [111, 103, 94];
    var accent = [196, 53, 30];
    var rule = [212, 203, 189];
    var footerTop = pageH - 56;
    var sigTop = pageH - 148;
    var contentBottom = sigTop - 28;

    function setInk() {
      doc.setTextColor(ink[0], ink[1], ink[2]);
    }
    function setMuted() {
      doc.setTextColor(muted[0], muted[1], muted[2]);
    }

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    setInk();
    doc.text("That's Extra", margin, y);

    y += 16;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(1.2);
    doc.line(margin, y, margin + 34, y);

    y += 28;
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text("Change Request", margin, y);

    y += 12;
    doc.setDrawColor(ink[0], ink[1], ink[2]);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin + width, y);

    y += 22;
    var meta = [
      ["Date", data.date || ""],
      ["From", data.fromName],
      ["To", data.client],
      ["Project", data.project]
    ];
    meta.forEach(function (row) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setMuted();
      doc.text(row[0].toUpperCase(), margin, y);
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      setInk();
      var lines = doc.splitTextToSize(row[1], width - 92);
      doc.text(lines, margin + 92, y);
      y += Math.max(16, lines.length * 13);
    });

    y += 6;
    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + width, y);
    y += 20;

    function section(title, text, maxLines) {
      if (y > contentBottom - 40) return;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setMuted();
      doc.text(title.toUpperCase(), margin, y);
      y += 14;
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      setInk();
      var lines = doc.splitTextToSize(text, width);
      var room = Math.floor((contentBottom - y - 90) / 14);
      var cap = Math.max(2, Math.min(maxLines, room));
      var shown = lines.slice(0, cap);
      if (lines.length > cap) {
        shown[shown.length - 1] = String(shown[shown.length - 1]).replace(/\.?$/, "") + "...";
      }
      doc.text(shown, margin, y);
      y += shown.length * 14 + 14;
    }

    section("Original scope", data.scope, 7);
    section("Requested change", data.ask, 7);

    if (y < contentBottom - 70) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setMuted();
      doc.text("COMMERCIALS", margin, y);
      y += 10;

      var rows = [
        ["Fee", data.feeLabel],
        ["Timeline impact", timelineShort(data.days)]
      ];
      if (data.original != null) {
        rows.push(["Original contract", money(data.original)]);
        rows.push(["New project total", money(data.total)]);
      }

      rows.forEach(function (r, i) {
        if (y > contentBottom - 24) return;
        doc.setDrawColor(rule[0], rule[1], rule[2]);
        doc.setLineWidth(i === 0 ? 0.7 : 0.4);
        doc.line(margin, y, margin + width, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        setMuted();
        doc.text(r[0], margin, y + 14);
        doc.setFont("times", "normal");
        setInk();
        var valLines = doc.splitTextToSize(String(r[1]), width - 168);
        doc.text(valLines, margin + 168, y + 14);
        y += Math.max(22, valLines.length * 13 + 8);
      });
      doc.setDrawColor(rule[0], rule[1], rule[2]);
      doc.line(margin, y, margin + width, y);
    }

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    setInk();
    var noticeY = Math.min(y + 22, sigTop - 28);
    doc.text("Work on this change begins only after written approval.", margin, noticeY);

    var colW = (width - 28) / 2;
    var sigY = sigTop + 28;
    doc.setDrawColor(ink[0], ink[1], ink[2]);
    doc.setLineWidth(0.6);
    doc.line(margin, sigY, margin + colW, sigY);
    doc.line(margin + colW + 28, sigY, margin + width, sigY);

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    setInk();
    doc.text(data.fromName, margin + colW + 28, sigY - 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setMuted();
    doc.text("Client approval (signature and date)", margin, sigY + 14);
    doc.text("Your name", margin + colW + 28, sigY + 14);

    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerTop, margin + width, footerTop);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setMuted();
    var footer = "Generated by That's Extra. This is a business document, not legal advice. Built by an AI agent.";
    if (!hasLicense()) {
      footer += " Created with the free version of That's Extra.";
    }
    doc.text(doc.splitTextToSize(footer, width), margin, footerTop + 14);

    var safe = String(data.project || "change-request")
      .replace(/[^\w]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "change-request";
    doc.save("change-request-" + safe + ".pdf");
  }

  render();
})();
