function hideSplash(){ const s = document.getElementById('splash'); if(!s) return; s.classList.add('hide'); setTimeout(()=>{s.remove();}, 400);} 

/* ΠΟΥΕΦ - Ειδικό Μισθολόγιο (offline web app)
   Σημείωση: Η φορολόγηση (κλίμακες 2026) υλοποιείται με βάση τις αναλυτικές κλίμακες ανά ηλικιακή κατηγορία/τέκνα.
*/

const TAX2026 = {
  upto25: {
    0: [0.00, 0.00, 0.26, 0.34, 0.39, 0.44],
    1: [0.00, 0.00, 0.24, 0.34, 0.39, 0.44],
    2: [0.00, 0.00, 0.22, 0.34, 0.39, 0.44],
    3: [0.00, 0.00, 0.20, 0.34, 0.39, 0.44],
    4: [0.00, 0.00, 0.18, 0.34, 0.39, 0.44]
  },
  "26to30": {
    0: [0.09, 0.09, 0.26, 0.34, 0.39, 0.44],
    1: [0.09, 0.09, 0.24, 0.34, 0.39, 0.44],
    2: [0.09, 0.09, 0.22, 0.34, 0.39, 0.44],
    3: [0.09, 0.09, 0.20, 0.34, 0.39, 0.44],
    4: [0.00, 0.00, 0.18, 0.34, 0.39, 0.44]
  },
  over30: {
    0: [0.09, 0.20, 0.26, 0.34, 0.39, 0.44],
    1: [0.09, 0.18, 0.24, 0.34, 0.39, 0.44],
    2: [0.09, 0.16, 0.22, 0.34, 0.39, 0.44],
    3: [0.09, 0.09, 0.20, 0.34, 0.39, 0.44],
    4: [0.00, 0.00, 0.18, 0.34, 0.39, 0.44]
  }
};
const TAX_BRACKETS = [10000, 10000, 10000, 10000, 20000]; // έως 60.000

function euro(n) {
  return (Number(n)||0).toLocaleString('el-GR', {minimumFractionDigits:2, maximumFractionDigits:2}) + "€";
}

function clampKids(k) {
  k = Math.max(0, Math.floor(Number(k)||0));
  return Math.min(5, k);
}

function yearsOfService(appointDate) {
  const start = appointDate ? new Date(appointDate) : new Date(2000,6,20);
  const end = new Date(); // σήμερα
  const diff = end.getTime() - start.getTime();
  const years = diff / (1000*60*60*24*365.25);
  return Math.max(0, years);
}

function adminGradeFromYears(y) {
  if (y < 8) return "Φρουρός";
  if (y < 12) return "Υπαρχιφύλακας Β'";
  if (y < 16) return "Υπαρχιφύλακας Α'";
  if (y < 30) return "Αρχιφύλακας Β'";
  return "Αρχιφύλακας Α'";
}

function grade3FromAdmin(admin) {
  if (admin.startsWith("Φρουρός")) return "Φρουρός";
  if (admin.startsWith("Υπαρχιφύλακας")) return "Υπαρχιφύλακας";
  return "Αρχιφύλακας";
}

// Κλιμάκιο: απλοποιητικός κανόνας για να μην μένει κενό (1 + floor(έτη/2) έως 20)
function klimFromYears(y) {
  const k = Math.floor((Number(y)||0)/2) + 1;
  return Math.max(1, Math.min(20, k));
}
// Πίνακας κλιμακίων: Βασικός μισθός (Κατ. Γ') & Συντελεστής (όπως ο πίνακας που έστειλες)
function baseSalaryFromKlim(klim){
  const table = {
    1:1100, 2:1160, 3:1201, 4:1243,
    5:1287, 6:1332,
    7:1380, 8:1449,
    9:1521, 10:1600, 11:1656, 12:1714, 13:1774, 14:1836, 15:1900,
    16:1967, 17:2036, 18:2107, 19:2149, 20:2192
  };
  return table[klim] || 0;
}

function coefFromKlim(klim){
  const table = {
    1:1.00, 2:1.00, 3:1.00, 4:1.00,
    5:1.01, 6:1.01,
    7:1.02, 8:1.02,
    9:1.04, 10:1.04, 11:1.04, 12:1.04, 13:1.04, 14:1.04, 15:1.04,
    16:1.08, 17:1.08, 18:1.08, 19:1.08, 20:1.08
  };
  return table[klim] || 1.00;
}

// Οικογενειακή παροχή (όπως συμφωνήθηκε)
function familyAllowance(kids) {
  const k = clampKids(kids);
  if (k === 0) return 0;
  if (k === 1) return 70;
  if (k === 2) return 120;
  if (k === 3) return 170;
  return 220; // 4+
}

// Επίδομα ιδ. συνθηκών: σταθερό ανά οικογενειακή κατάσταση & κατηγορία (3 επίπεδα)
function specialAllowance(grade3, status) {
  const map = {
    "Άγαμος": {"Φρουρός":155, "Υπαρχιφύλακας":180, "Αρχιφύλακας":190},
    "Έγγαμος": {"Φρουρός":225, "Υπαρχιφύλακας":250, "Αρχιφύλακας":260},
    "Έγγαμος με τέκνα": {"Φρουρός":285, "Υπαρχιφύλακας":310, "Αρχιφύλακας":320},
  };
  return (map[status] && map[status][grade3]) ? map[status][grade3] : 0;
}

// Φόρος (ετήσιος) με κλίμακες 2026 ανά ηλικιακή κατηγορία και τέκνα
function annualTax2026(annualIncome, ageCatKey, kids) {
  return computeTax2026(annualIncome, ageCatKey, kids);
}

// Έκπτωση φόρου (0τ..5τ +220€/παιδί πάνω από 5) με μείωση 20€/1000€ πάνω από 12.000€ (ceil)
function taxDiscountAmount(annualIncome, kids){
  const k = Math.max(0, Math.floor(Number(kids)||0));
  const base = [777,900,1120,1340,1580,1780];
  let disc = (k<=5) ? base[k] : (base[5] + (k-5)*220);
  const inc = Math.max(0, Number(annualIncome)||0);
  if(inc>12000){
    const reduction = Math.ceil((inc-12000)/1000) * 20;
    disc -= reduction;
  }
  return Math.max(0, disc);
}

function calc() {
  const appoint = document.getElementById('appointDate').value;
  const yrs = yearsOfService(appoint);
  const admin = adminGradeFromYears(yrs);
  const grade3 = grade3FromAdmin(admin);
  const klim = klimFromYears(yrs);

  document.getElementById('yearsOut').textContent = (Math.floor(yrs*10)/10).toLocaleString('el-GR', {minimumFractionDigits:1, maximumFractionDigits:1});
  document.getElementById('adminGradeOut').textContent = admin;
  document.getElementById('klimOut').textContent = String(klim);

  const status = document.getElementById('status').value;
  const kids = Number(document.getElementById('children').value||0);
  // const ageCat = document.getElementById('ageCat')?.value; // (φορολογία αφαιρέθηκε)
  const border = Number(document.getElementById('border').value||0);
  const personalDiff = parseMoney(document.getElementById('personalDiff').value||0);
  const fiveDays = Number(document.getElementById('fiveDays').value||0);
  const nightHours = Number(document.getElementById('nightHours').value||0);
  const after1993 = document.getElementById('after1993').value; // after|before
  const loan = Number(document.getElementById('loanMtpy').value||0);

  const baseRaw = baseSalaryFromKlim(klim);
  const coef = coefFromKlim(klim);
  const base = Math.round(baseRaw * coef);

  // Υπολογισμός επιδομάτων (όπως συμφωνήθηκε)
  const fam = familyAllowance(kids);
  const special = specialAllowance(grade3, status);

  // --- ΜΤΠΥ Νεοδιόριστου (1/12 βασικού, 1ο έτος) ---
  // Ενεργοποιείται μόνο αν το εκκαθαριστικό (μήνας/έτος) είναι μέσα στους 12 πρώτους μήνες από τον διορισμό
  const neoCheckEl = document.getElementById('neoMtpyEnabled');
  let dMtpyNeo = 0;

  // Ημερομηνία εκκαθαριστικού (χρησιμοποιούμε 1η του μήνα)
  const payslipMonth = Number(document.getElementById('payslipMonth')?.value || 0); // 0=Ιαν, 11=Δεκ
  const payslipYear = Number(document.getElementById('payslipYear')?.value || new Date().getFullYear());
  const payslipDate = new Date(payslipYear, payslipMonth, 1);

  const appointDateStr = document.getElementById('appointDate')?.value || '';
  const appointDate = appointDateStr ? new Date(appointDateStr) : null;

  let withinFirstYear = false;
  if (appointDate && !isNaN(appointDate.getTime())) {
    const monthsDiff = (payslipDate.getFullYear() - appointDate.getFullYear()) * 12 + (payslipDate.getMonth() - appointDate.getMonth());
    withinFirstYear = monthsDiff >= 0 && monthsDiff < 12;
  }

  if (neoCheckEl) {
    // Αν είναι εκτός 1ου έτους, δεν επιτρέπεται επιλογή
    neoCheckEl.disabled = !withinFirstYear;
    if (!withinFirstYear) neoCheckEl.checked = false;
    if (withinFirstYear && neoCheckEl.checked === false && neoCheckEl.dataset.autoinit !== '1') {
      // default ON την πρώτη φορά που μπαίνει μέσα στο 1ο έτος
      neoCheckEl.checked = true;
      neoCheckEl.dataset.autoinit = '1';
    }
  }

  const neoEnabled = withinFirstYear && (!!neoCheckEl ? neoCheckEl.checked : true);
  if (neoEnabled) {
    dMtpyNeo = base / 12;
  }

  const fiveAmt = fiveDays * 46;
  const nightAmt = nightHours * 26.5; // 26,5€ ανά νύχτα

  const grossMain = base + fam + special + border + personalDiff;
  const grossExtra = fiveAmt + nightAmt;
  const grossTotal = grossMain + grossExtra;

  // Κρατήσεις κύριων (ενδεικτικά ποσοστά όπως είχαμε): 
  const dEfka = grossMain * 0.0667;
  // Κρατήσεις επί των κύριων μικτών αποδοχών (όπως στη φωτο)
  const dHealth = grossMain * 0.0205; // Υγειονομική 2,05%
  const dTpdy = grossMain * 0.04;     // ΤΠΔΥ 4%
  const dTeady = grossMain * 0.03;    // ΤΕΑΔΥ 3%
  const dUnempMain = grossMain * 0.02; // Ανεργία 2%

  // ΜΤΠΥ (κύριες) με βάση πριν/μετά 1993
  // (mtpyRate δεν χρησιμοποιείται πλέον - βλ. dMtpyMain πιο κάτω)
  // Βασικός + (Οικογενειακή + Ιδ. συνθηκών + Παραμεθορίου)
  const dMtpyMain = (after1993 === 'after')
  ? ((base + fam + special + border) * 0.045)
  : (base * 0.045) + ((fam + special + border) * 0.01);

  // Φόρος: αφαιρέθηκε (0)
  const dTax = 0;

  // Extra κρατήσεις για νύχτες/5μερα
  const dUnempExtra = grossExtra * 0.02;
  const dMtpyExtra = grossExtra * 0.02;

  
  const dTaxExtra = grossExtra * 0.20; // Φόρος 20% (Νύχτες + Πενθήμερα)
// Σταθερές κρατήσεις
  const d5y = document.getElementById('fiveRecognize').checked ? 39.87 : 0;
  const dPouef = 4.00;

  const dedMain = dEfka + dHealth + dTpdy + dTeady + dUnempMain + dMtpyMain + dMtpyNeo + d5y + dPouef + loan;
  const dedExtra = dUnempExtra + dMtpyExtra + dTaxExtra;
  const dedTotal = dedMain + dedExtra;

  const netBeforeTax = grossTotal - dedTotal;

  // ΑΠΟΔΟΧΕΣ
  setText('oBase', euro(base));
  // Εμφάνιση αυτόματου συντελεστή προσαύξησης και ανάλυσης βασικού
  // (ώστε να φαίνεται καθαρά ότι ο βασικός = κατ. Γ' × συντελεστής).
  setText('coefDisplay', coef.toFixed(2));
  setText('basicAnalysis', `Ανάλυση βασικού ${euro(baseRaw)} × ${coef.toFixed(2)} = ${euro(base)}`);
  setText('oFam', euro(fam));
  setText('oSpecial', euro(special));
  setText('oBorder', euro(border));
  setText('oPersonalDiff', euro(personalDiff));
  setText('oFive', euro(fiveAmt));
  setText('oNight', euro(nightAmt));
  setText('oGross', euro(grossTotal));

  // --- Φορολογία (ενημερωτικά) ---
  // Βάση υπολογισμού: (Μεικτά - κρατήσεις) * 12
  const taxAgeKey = document.getElementById('taxAge')?.value || 'over30';
  const taxKids = Number(document.getElementById('taxKids')?.value || 0);
  const taxableMonthlyBase = Math.max(0, grossTotal - (dedMain + dedExtra));
  const annualIncome = taxableMonthlyBase * 12; // φορολογητέο: (μεικτά - ΟΛΕΣ οι κρατήσεις) * 12
  let annualTax = annualTax2026(annualIncome, taxAgeKey, taxKids) - taxDiscountAmount(annualIncome, taxKids);
  annualTax = Math.max(0, annualTax);
  const monthlyTax = annualTax / 12;
  setText('taxAnnualIncome', euro(annualIncome));
  setText('taxAnnual', euro(annualTax));
  setText('taxMonthly', euro(monthlyTax));

  // Αν είναι τσεκαρισμένο, αφαιρούμε τον μηνιαίο φόρο (ενδεικτικά) από το πληρωτέο
  const applyTax = document.getElementById('applyTax')?.checked;
  const net = applyTax ? Math.max(0, netBeforeTax - monthlyTax) : netBeforeTax;

  // ΚΡΑΤΗΣΕΙΣ - κύριες
  setText('dEfka', euro(dEfka));
  setText('dHealth', euro(dHealth));
  setText('dTpdy', euro(dTpdy));
  setText('dTeady', euro(dTeady));
  setText('dUnempMain', euro(dUnempMain));
  setText('dMtpyMain', euro(dMtpyMain));
  setText('dMtpyNeo', euro(dMtpyNeo));
  // setText('dTax', euro(dTax)); // αφαιρέθηκε
  setText('d5y', euro(d5y));
  setText('dPouef', euro(dPouef));
  setText('dLoan', euro(loan));
  setText('dMainTotal', euro(dedMain));

  // ΚΡΑΤΗΣΕΙΣ - extra
  setText('dUnempExtra', euro(dUnempExtra));
  setText('dMtpyExtra', euro(dMtpyExtra));
  setText('dTaxExtra', euro(dTaxExtra));
  setText('dExtraTotal', euro(dedExtra));

  // Σύνολα / καθαρά
  setText('dTotal', euro(dedTotal));
  setText('netOut', euro(net));
  setText('net15Out', euro(net/2));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showTab(which){
  document.getElementById('tabE').classList.toggle('active', which==='E');
  document.getElementById('tabD').classList.toggle('active', which==='D');
  const tabT = document.getElementById('tabT');
  if(tabT) tabT.classList.toggle('active', which==='T');

  document.getElementById('panelE').style.display = (which==='E') ? 'block' : 'none';
  document.getElementById('panelD').style.display = (which==='D') ? 'block' : 'none';
  const panelT = document.getElementById('panelT');
  if(panelT) panelT.style.display = (which==='T') ? 'block' : 'none';
}

function printPayslip(){
  // Απλό print view (χωρίς banner)
  const monthSel = document.getElementById('payslipMonth');
  const monthName = monthSel ? monthSel.options[monthSel.selectedIndex].text : '';
  const year = document.getElementById('payslipYear').value;
  const title = `ΕΚΚΑΘΑΡΙΣΤΙΚΟ ΜΙΣΘΟΔΟΣΙΑΣ – ${monthName} ${year}`;

  // συλλογή εμφανιζόμενων τιμών
  const rowsE = [
    ['Βασικός μισθός', document.getElementById('oBase').textContent],
    ['Συντελεστής προσαύξησης', document.getElementById('coefDisplay')?.textContent || ''],
    ['Ανάλυση βασικού', document.getElementById('basicAnalysis')?.textContent || ''],
    ['Οικογενειακή παροχή', document.getElementById('oFam').textContent],
    ['Επίδομα ιδ. συνθηκών', document.getElementById('oSpecial').textContent],
    ['Παραμεθόριο', document.getElementById('oBorder').textContent],
    ['Προσωπική διαφορά', document.getElementById('oPersonalDiff').textContent],
    ['Πενθήμερα', document.getElementById('oFive').textContent],
    ['Νυχτερινά', document.getElementById('oNight').textContent],
    ['Σύνολο μικτών', document.getElementById('oGross').textContent],
  ];
  const rowsDMain = [
    ['ΕΦΚΑ σύνταξη (6,67%)', document.getElementById('dEfka').textContent],
    ['Υγειονομική (2,05%)', document.getElementById('dHealth').textContent],
    ['ΤΠΔΥ (4%)', document.getElementById('dTpdy').textContent],
    ['ΤΕΑΔΥ (3%)', document.getElementById('dTeady').textContent],
    ['Ανεργία (2%)', document.getElementById('dUnempMain').textContent],
    ['ΜΤΠΥ (4,5% / 1%)', document.getElementById('dMtpyMain').textContent],
    ['ΜΤΠΥ Νεοδιόριστου (1/12 βασικού, 1ο έτος)', document.getElementById('dMtpyNeo')?.textContent || '0,00€'],
    ['Αναγνώριση 5ετίας', document.getElementById('d5y').textContent],
    ['ΠΟΥΕΦ', document.getElementById('dPouef').textContent],
    ['Δάνειο ΜΤΠΥ', document.getElementById('dLoan').textContent],
    ['Σύνολο κρατήσεων κύριων', document.getElementById('dMainTotal').textContent],
  ];
  const rowsDExtra = [
    ['Ανεργία 2% (Νύχτες + Πενθήμερα)', document.getElementById('dUnempExtra').textContent],
    ['ΜΤΠΥ 2% (Νύχτες + Πενθήμερα)', document.getElementById('dMtpyExtra').textContent],
    ['Φόρος 20% (Νύχτες + Πενθήμερα)', document.getElementById('dTaxExtra')?.textContent || '0,00€'],
    ['Σύνολο κρατήσεων νυχτερινών & πενθημέρων', document.getElementById('dExtraTotal').textContent],
  ];
  const totalD = document.getElementById('dTotal').textContent;
  const net = document.getElementById('netOut').textContent;
  const net15 = document.getElementById('net15Out').textContent;
  const applyTax = document.getElementById('applyTax')?.checked;
  const monthlyTax = document.getElementById('taxMonthly')?.textContent || '0,00€';

  const w = window.open('', '_blank');
  w.document.open();
  w.document.write(`<!doctype html>
  <html lang="el"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#000;}
    h1{font-size:16px;text-align:center;margin:0 0 8px;}
    h2{font-size:14px;margin:18px 0 6px;}
    table{width:100%;border-collapse:collapse;font-size:13px;}
    td{padding:6px 8px;border-bottom:1px solid #ddd;}
    td:last-child{text-align:right;font-weight:700;}
    .tot{font-weight:900;}
    .pay{margin-top:18px;font-size:18px;font-weight:900;text-align:right;}
    .subpay{margin-top:6px;font-size:14px;font-weight:700;text-align:right;}
  </style></head><body>
  <h1>ΕΙΔΙΚΟ ΜΙΣΘΟΛΟΓΙΟ ΥΠΑΛΛΗΛΩΝ ΕΞΩΤΕΡΙΚΗΣ ΦΡΟΥΡΗΣΗΣ</h1>
  <h1>${title}</h1>

  <h2>ΑΠΟΔΟΧΕΣ</h2>
  <table>${rowsE.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>

  <h2>ΚΡΑΤΗΣΕΙΣ (Κύριες αποδοχές)</h2>
  <table>${rowsDMain.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>

  <h2>ΚΡΑΤΗΣΕΙΣ (Νύχτες / Πενθήμερα)</h2>
  <table>${rowsDExtra.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>

  <table style="margin-top:10px;">
    <tr><td class="tot">Σύνολο κρατήσεων</td><td class="tot">${totalD}</td></tr>
  </table>

  ${applyTax ? `<div class="subpay">Μηνιαίος φόρος (ενδεικτικά): ${monthlyTax}</div>` : ''}
  <div class="pay">ΠΛΗΡΩΤΕΟ (Μήνας): ${net}</div>
  <div class="subpay">ΠΛΗΡΩΤΕΟ (15ήμερο): ${net15}</div>

  <script>window.onload=()=>{window.print();};</script>
  </body></html>`);
  w.document.close();
}

function init(){
  // default appoint date if empty
  const a = document.getElementById('appointDate');
  if (!a.value) a.value = '2000-07-20';
  showTab('E');
  calc();
  document.addEventListener('input', (e)=>{
    const ids = new Set(['appointDate','status','children','after1993','border','fiveDays','nightHours','loanMtpy','fiveRecognize','payslipMonth','payslipYear','applyTax','neoMtpyEnabled','taxAge','taxKids']);
    if (e.target && ids.has(e.target.id)) calc();
  });
  document.getElementById('tabE').addEventListener('click', ()=>showTab('E'));
  document.getElementById('tabD').addEventListener('click', ()=>showTab('D'));
  document.getElementById('tabT').addEventListener('click', ()=>showTab('T'));
  document.getElementById('btnPrint').addEventListener('click', printPayslip);
}

window.addEventListener('load', init);

function computeTax2026(annualIncome, ageCat, kids){
  const k = Math.min(4, Math.max(0, Math.floor(Number(kids)||0)));
  const rates = TAX2026[ageCat] ? TAX2026[ageCat][k] : TAX2026.over30[k];
  let remaining = Math.max(0, Number(annualIncome)||0);
  let tax = 0;
  for(let i=0;i<TAX_BRACKETS.length;i++){
    const band = TAX_BRACKETS[i];
    const take = Math.min(remaining, band);
    tax += take * rates[i];
    remaining -= take;
    if(remaining<=0) break;
  }
  if(remaining>0){
    tax += remaining * rates[5];
  }
  return tax;
}

document.addEventListener('change', (e)=>{
  if(e.target && (e.target.id==='taxAge' || e.target.id==='taxKids' || e.target.id==='border' || e.target.id==='applyTax')){
    calc();
  }
});


function getRankCoefficient(rank){
  const map = {
    "ΑΡΧΙΦΥΛΑΚΑΣ Α'":1.08,
    "ΑΡΧΙΦΥΛΑΚΑΣ Β'":1.04,
    "ΥΠΑΡΧΙΦΥΛΑΚΑΣ Α'":1.02,
    "ΥΠΑΡΧΙΦΥΛΑΚΑΣ Β'":1.01,
    "ΦΡΟΥΡΟΣ":1.00
  };
  return map[rank] || 1.00;
}

document.addEventListener("change", function(e){
  if(e.target && e.target.id === "rank"){
    const coef = getRankCoefficient(e.target.value);
    const coefEl = document.getElementById("coefDisplay");
    if(coefEl) coefEl.textContent = coef.toFixed(2);
  }
});




function updateBasicAnalysis(){
  const rankSelect = document.getElementById("rank");
  const coef = getRankCoefficient(rankSelect?.value || "");
  
  // Βρίσκουμε το ποσό βασικού από το πεδίο που ήδη εμφανίζει το τελικό ποσό
  const basicRow = document.querySelector("#basicAmount, .basic-amount, [data-basic]");
  if(!basicRow) return;
  
  const clean = basicRow.textContent.replace(/[^0-9,]/g,"").replace(",", ".");
  const finalBasic = parseFloat(clean) || 0;
  
  const originalBase = coef ? finalBasic / coef : finalBasic;
  
  const analysisEl = document.getElementById("basicAnalysis");
  if(analysisEl){
    analysisEl.textContent =
      originalBase.toLocaleString("el-GR",{minimumFractionDigits:2}) + "€ × " +
      coef.toFixed(2) + " = " +
      finalBasic.toLocaleString("el-GR",{minimumFractionDigits:2}) + "€";
  }
}

document.addEventListener("change", function(e){
  if(e.target && e.target.id === "rank"){
    updateBasicAnalysis();
  }
});

document.addEventListener("DOMContentLoaded", function(){
  setTimeout(updateBasicAnalysis,300);
});


document.addEventListener("DOMContentLoaded", function(){
  updateBasicAnalysis();
});



/* =========================
   Ημερολόγιο Βαρδιών (ενσωματωμένο)
   ========================= */
(function(){
  const btnCalc = document.getElementById("tabBtnCalc");
  const btnCal  = document.getElementById("tabBtnCal");
  const tabCalc = document.getElementById("tabCalc");
  const tabCal  = document.getElementById("tabCal");
  if(!btnCalc || !btnCal || !tabCalc || !tabCal) return;

  const mainTabSelect = document.getElementById("mainTabSelect");

  function setActiveTabs(isCal){
    btnCal.classList.toggle("tabActive", isCal);
    btnCalc.classList.toggle("tabActive", !isCal);
    if(mainTabSelect){ mainTabSelect.value = isCal ? "cal" : "calc"; }
  }

  btnCalc.addEventListener("click", ()=>{
    tabCal.style.display="none";
    tabCalc.style.display="block";
    setActiveTabs(false);
  });

  btnCal.addEventListener("click", ()=>{
    tabCalc.style.display="none";
    tabCal.style.display="block";
    setActiveTabs(true);
    renderCal();
  });

  if(mainTabSelect){
    mainTabSelect.addEventListener("change", ()=>{
      if(mainTabSelect.value === "cal") btnCal.click();
      else btnCalc.click();
    });
  }

  const calGrid = document.getElementById("calGrid");
  const calLabel = document.getElementById("calLabel");
  const calPrev = document.getElementById("calPrev");
  const calNext = document.getElementById("calNext");
  const outNights = document.getElementById("calNights");
  const outFives = document.getElementById("calFives");
  const applyBtn = document.getElementById("applyToCalc");
  const clearBtn = document.getElementById("clearMonth");
  const cycleStart = document.getElementById("cycleStart");
  const cycleLength = document.getElementById("cycleLength");
  const cycleMonths = document.getElementById("cycleMonths");
  const fillCycleBtn = document.getElementById("fillCycle");

  let view = new Date(); view.setDate(1);
  let activeShift = "PR";

  const shiftBtns = Array.from(document.querySelectorAll(".shiftBtn[data-shift]"));
  function setActiveShift(s){
    activeShift = s;
    shiftBtns.forEach(b=>b.classList.toggle("active", b.dataset.shift===s));
  }
  shiftBtns.forEach(b=>{
    b.addEventListener("click", ()=>{
      const s=b.dataset.shift;
      setActiveShift(s);
    });
  });
  setActiveShift("PR");

  const storeKey = (y,m)=>`poyef_cal_${y}-${String(m+1).padStart(2,"0")}`;
  function loadMonth(y,m){
    try{
      const raw = localStorage.getItem(storeKey(y,m));
      if(!raw) return {};
      const obj = JSON.parse(raw);
      return (obj && typeof obj==="object") ? obj : {};
    }catch(e){ return {}; }
  }
  function saveMonth(y,m,obj){
    try{ localStorage.setItem(storeKey(y,m), JSON.stringify(obj||{})); }catch(e){}
  }
  function keyOf(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }
  function parseKey(k){
    const [y,m,d]=k.split("-").map(Number);
    return new Date(y, m-1, d);
  }

  function normalizeShifts(type){
    if(!type) return [];
    const mapTok = (t)=>{
      if(!t) return "";
      // normalize greek labels from older versions
      const s = String(t).trim();
      if(s==="ΠΡ") return "PR";
      if(s==="ΑΠ") return "AP";
      if(s==="ΝΥ" || s==="ΝΥΧ") return "NY";
      if(s==="ΑΔ") return "AD";
      if(s==="Ρ") return "RP";
      return s;
    };
    const arr = Array.isArray(type)
      ? type
      : (typeof type === "string" ? (type.includes(",") ? type.split(",") : [type]) : []);
    return arr.map(mapTok).filter(Boolean);
  }

  function hasService(type){
    const arr = normalizeShifts(type);
    return arr.includes("PR") || arr.includes("AP") || arr.includes("NY");
  }

  function nightPaid(k,type){
    const arr = normalizeShifts(type);
    const hasNY = arr.includes("NY");
    const hasPR = arr.includes("PR");
    if(!hasNY) return false;

    const d=parseKey(k);
    const dow=d.getDay(); // 0 Sun,5 Fri,6 Sat
    const isFri = dow===5;
    const isSat = dow===6;

    // Παρασκευή ΝΥ -> 5Μ (όχι νυχτερινό)
    if(isFri) return false;

    // Σάββατο ΝΥ -> 5Μ (εκτός αν έχει και ΠΡ: τότε μετρά και νύχτα)
    if(isSat && !hasPR) return false;

    return true;
  }

  function fiveCountFor(k,type){
    const arr = normalizeShifts(type);
    const hasNY = arr.includes("NY");
    const hasPR = arr.includes("PR");
    const hasAP = arr.includes("AP");
    const service = hasPR || hasAP || hasNY;

    const d=parseKey(k);
    const dow=d.getDay(); // 0 Sun,5 Fri,6 Sat

    // Παρασκευή ΝΥ -> 5Μ
    if(dow===5 && hasNY) return 1;

    // Σάββατο/Κυριακή με υπηρεσία -> 5Μ
    if((dow===6 || dow===0) && service) return 1;

    return 0;
  }

  function calcCounts(y,m,data){
    let nights=0;
    let fives=0;
    Object.keys(data).forEach(k=>{
      const d=parseKey(k);
      if(d.getFullYear()!==y || d.getMonth()!==m) return;
      const type=data[k]||"";
      if(nightPaid(k,type)) nights++;
      fives += fiveCountFor(k,type);
    });
    return {nights,fives};
  }

  function renderCal(){
    if(!calGrid) return;
    const y=view.getFullYear(), m=view.getMonth();
    const monthNames=["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"];
    if(calLabel) calLabel.textContent = `${monthNames[m]} ${y}`;

    const data = loadMonth(y,m);
    if(cycleStart){ cycleStart.value = `${y}-${String(m+1).padStart(2,"0")}-01`; }

    // Build grid: Monday-first
    const first=new Date(y,m,1);
    const dow = (first.getDay()===0)?7:first.getDay(); // 1..7
    const start=new Date(y,m,1-(dow-1));
    const dows=["Δε","Τρ","Τε","Πε","Πα","Σα","Κυ"];

    let html = `<div class="calRow">` + dows.map(d=>`<div class="calDow">${d}</div>`).join("") + `</div>`;
    for(let r=0;r<6;r++){
      html += `<div class="calRow">`;
      for(let c=0;c<7;c++){
        const d=new Date(start); d.setDate(start.getDate()+r*7+c);
        const inMonth=d.getMonth()===m;
        const wk=(d.getDay()===6 || d.getDay()===0);
        const k=keyOf(d);
        const type=data[k]||"";
        let cls="calCell";
        if(!inMonth) cls+=" out";
        else if(wk) cls+=" wk";
        const arrShifts = normalizeShifts(type);
        const labelOf = (t)=> (t==="PR")?"ΠΡ":(t==="AP")?"ΑΠ":(t==="NY")?"ΝΥ":(t==="AD")?"ΑΔ":(t==="RP")?"Ρ":"";
        const two = arrShifts.slice(0,2);
        let badgesHtml = "";
        if(two.length===1){
          badgesHtml = `<div class="shiftSingle"><div class="shiftBlock ${two[0]}">${labelOf(two[0])}</div></div>`;
        } else if(two.length===2){
          badgesHtml = `<div class="shiftStack"><div class="shiftBlock ${two[0]}">${labelOf(two[0])}</div><div class="shiftBlock ${two[1]}">${labelOf(two[1])}</div></div>`;
        }
        html += `<div class="${cls}" data-key="${k}" data-inmonth="${inMonth?1:0}">
          <div class="dnum">${d.getDate()}</div>
          ${badgesHtml||""}
        </div>`;
      }
      html += `</div>`;
    }
    calGrid.innerHTML = html;

    Array.from(calGrid.querySelectorAll(".calCell[data-key]")).forEach(cell=>{
      cell.addEventListener("click", ()=>{
        const inMonth = cell.getAttribute("data-inmonth")==="1";
        if(!inMonth) return;
        const k = (cell.getAttribute("data-key")||cell.getAttribute("data-date")||cell.getAttribute("data-k"));
        const cur = data[k]||"";
        const arr = normalizeShifts(cur);

        const isExclusive = (s)=> (s==="AD" || s==="RP");
        const allowedDouble = (a,b)=> ((a==="PR" && b==="NY") || (a==="NY" && b==="PR"));

        // toggle
        const idx = arr.indexOf(activeShift);
        if(idx>=0){
          arr.splice(idx,1);
        } else {
          if(isExclusive(activeShift)){
            arr.length = 0;
            arr.push(activeShift);
          } else {
            // remove exclusive if present
            for(let i=arr.length-1;i>=0;i--){
              if(isExclusive(arr[i])) arr.splice(i,1);
            }
            if(arr.length===0){
              arr.push(activeShift);
            } else if(arr.length===1){
              if(allowedDouble(arr[0], activeShift)){
                arr.push(activeShift);
              } else {
                // αντικατάσταση (δεν επιτρέπεται άλλο ζευγάρι)
                arr.length = 0;
                arr.push(activeShift);
              }
            } else {
              // ήδη 2 -> αντικατάσταση
              arr.length = 0;
              arr.push(activeShift);
            }
          }
        }

        if(arr.length===0) delete data[k];
        else data[k] = arr;
        saveMonth(y,m,data);
        renderCal();
      });
    });

    const {nights,fives}=calcCounts(y,m,data);
    if(outNights) outNights.textContent = String(nights);
    if(outFives) outFives.textContent = String(fives);
  }


  // Αντιγραφή κύκλου 5 ή 10 ημερών (δεν αλλάζει μέρες που ήδη έχουν βάρδια)
  function fillCycle(){
    if(!cycleStart) return;
    const startStr = cycleStart.value;
    if(!startStr) return alert("Βάλε ημερομηνία έναρξης κύκλου.");
    const months = Number(cycleMonths ? cycleMonths.value : 1) || 1;
    const len = Number(cycleLength ? cycleLength.value : 5) || 5;

    const startDate = parseKey(startStr);

    // pattern από τις πρώτες len ημέρες (πρέπει να είναι ήδη συμπληρωμένες)
    const pattern = [];
    for(let i=0;i<len;i++){
      const d = new Date(startDate); d.setDate(d.getDate()+i);
      const y=d.getFullYear(), m=d.getMonth();
      const data = loadMonth(y,m);
    if(cycleStart){ cycleStart.value = `${y}-${String(m+1).padStart(2,"0")}-01`; }
      const k = keyOf(d);
      const type = data[k] || "";
      if(!type){
        return alert(`Ο κύκλος πρέπει να είναι ήδη συμπληρωμένος για ${len} συνεχόμενες ημέρες (έναρξη + ${len-1}).`);
      }
      pattern.push(type);
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    // cache ανά μήνα για να μην κάνουμε load/save συνέχεια
    const cache = new Map(); // 'YYYY-MM' -> object
    const cacheKey = (y,m)=>`${y}-${String(m+1).padStart(2,"0")}`;
    const getMonthObj = (y,m)=>{
      const ck = cacheKey(y,m);
      if(cache.has(ck)) return cache.get(ck);
      const obj = loadMonth(y,m);
      cache.set(ck, obj);
      return obj;
    };

    let cursor = new Date(startDate);
    cursor.setDate(cursor.getDate() + len);

    while(cursor < endDate){
      const diffDays = Math.floor((cursor - startDate) / (1000*60*60*24));
      const idx = ((diffDays % len) + len) % len;
      const y=cursor.getFullYear(), m=cursor.getMonth();
      const obj = getMonthObj(y,m);
      const k = keyOf(cursor);
      if(!obj[k]) obj[k] = pattern[idx];
      cursor.setDate(cursor.getDate()+1);
    }

    // save όλα τα months που άλλαξαν
    for(const [ck,obj] of cache.entries()){
      const [yy,mm] = ck.split("-");
      saveMonth(Number(yy), Number(mm)-1, obj);
    }
    renderCal();
    alert("Έτοιμο! Γέμισε ο κύκλος.");
  }

  if(calPrev) calPrev.addEventListener("click", ()=>{ view.setMonth(view.getMonth()-1); view.setDate(1); renderCal(); });
  if(calNext) calNext.addEventListener("click", ()=>{ view.setMonth(view.getMonth()+1); view.setDate(1); renderCal(); });

  if(fillCycleBtn) fillCycleBtn.addEventListener("click", fillCycle);

  if(clearBtn) clearBtn.addEventListener("click", ()=>{
    if(!confirm("Να καθαρίσουν ΟΛΕΣ οι βάρδιες (όλοι οι μήνες);")) return;

    // remove all calendar keys
    try{
      const prefix = "poyef_cal_";
      const toRemove = [];
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(k && k.startsWith(prefix)) toRemove.push(k);
      }
      toRemove.forEach(k=>localStorage.removeItem(k));
    }catch(e){}

    renderCal();
  });

  if(applyBtn) applyBtn.addEventListener("click", ()=>{
    const y=view.getFullYear(), m=view.getMonth();
    const data=loadMonth(y,m);
    const {nights,fives}=calcCounts(y,m,data);
    const inpNight = document.getElementById("nightHours");
    const inpFive  = document.getElementById("fiveDays");
    if(inpNight) inpNight.value = nights;
    if(inpFive) inpFive.value = fives;
    // trigger recalculation (existing app.js has updateAll)
    if(typeof calc==="function") calc();
    else if(typeof updateAll==="function") updateAll();
    tabCal.style.display="none";
    tabCalc.style.display="block";
    setActiveTabs(false);
    (inpNight||inpFive)?.scrollIntoView({behavior:"smooth", block:"center"});
  });

  // Start on calendar by default
  tabCalc.style.display="none";
  tabCal.style.display="block";
  try{ mainSelect.value="cal"; }catch(e){}
  setActiveTabs(true);
})();


// Auto-init
if (typeof init === 'function') {
  document.addEventListener('DOMContentLoaded', init);
}






// ===== Calendar day click (single handler): toggle + PR+NY double =====
(function(){
  const calGrid = document.getElementById("calGrid");
  if(!calGrid) return;
  if(calGrid.dataset && calGrid.dataset.dayHandler==="1") return;
  if(calGrid.dataset) calGrid.dataset.dayHandler="1";

  const getStore = () => (typeof data !== "undefined" ? data : (typeof schedule !== "undefined" ? schedule : null));
  const doSave = () => { try{ if(typeof save==="function") save(); }catch(e){} };
  const doRender = () => { try{ if(typeof renderCalendar==="function") renderCalendar(); else if(typeof renderCal==="function") renderCal(); }catch(e){} };

  const norm = (v)=>{
    if(!v) return [];
    if(Array.isArray(v)) return v.filter(Boolean);
    if(typeof normalizeShifts==="function") return normalizeShifts(v);
    return (typeof v==="string" && v) ? [v] : [];
  };

  const isExclusive = (s)=> (s==="AD" || s==="RP");
  const allowedDouble = (a,b)=> ((a==="PR" && b==="NY") || (a==="NY" && b==="PR"));

  calGrid.addEventListener("click", (ev)=>{
    const cell = ev.target.closest("[data-key],[data-date],[data-k]");
    if(!cell) return;
    const k = (cell.getAttribute("data-key")||cell.getAttribute("data-date")||cell.getAttribute("data-k"));
    const store = getStore();
    if(!store || !k) return;
    if(typeof activeShift==="undefined" || !activeShift) return;

    const cur = store[k] || "";
    const arr = norm(cur);

    // Toggle: if already present, remove it (second tap deletes)
    const idx = arr.indexOf(activeShift);
    if(idx >= 0){
      arr.splice(idx,1);
    } else {
      if(isExclusive(activeShift)){
        arr.length = 0;
        arr.push(activeShift);
      } else {
        // remove exclusives
        for(let i=arr.length-1;i>=0;i--){
          if(isExclusive(arr[i])) arr.splice(i,1);
        }
        if(arr.length===0){
          arr.push(activeShift);
        } else if(arr.length===1){
          if(allowedDouble(arr[0], activeShift)){
            arr.push(activeShift);
          } else {
            // replace single with new
            arr.length=0;
            arr.push(activeShift);
          }
        } else {
          // already 2: replace with new single
          arr.length=0;
          arr.push(activeShift);
        }
      }
    }

    if(arr.length===0) delete store[k];
    else store[k]=arr;

    doSave();
    doRender();
  }, {passive:true});
})();

