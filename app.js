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
  const k = clampKids(kids);
  const rates = (TAX2026[ageCatKey] && TAX2026[ageCatKey][k]) ? TAX2026[ageCatKey][k] : TAX2026.over30[0];
  let remaining = Math.max(0, Number(annualIncome) || 0);
  let tax = 0;
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, TAX_BRACKETS[i]);
    tax += slice * rates[i];
    remaining -= slice;
  }
  if (remaining > 0) tax += remaining * TAX_TOP_RATE;
  return tax;
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
  const fiveDays = Number(document.getElementById('fiveDays').value||0);
  const nightHours = Number(document.getElementById('nightHours').value||0);
  const after1993 = document.getElementById('after1993').value; // after|before
  const loan = Number(document.getElementById('loanMtpy').value||0);

  const fam = familyAllowance(kids);
  const special = specialAllowance(grade3, status);
  const baseRaw = baseSalaryFromKlim(klim);
  const coef = coefFromKlim(klim);
  const base = Math.round(baseRaw * coef);

  const fiveAmt = fiveDays * 46;
  const nightAmt = nightHours * 26.5; // 26,5€ ανά νύχτα

  const grossMain = base + fam + special + border;
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

  // Σταθερές κρατήσεις
  const d5y = document.getElementById('fiveRecognize').checked ? 39.87 : 0;
  const dPouef = 4.00;

  const dedMain = dEfka + dHealth + dTpdy + dTeady + dUnempMain + dMtpyMain + d5y + dPouef + loan;
  const dedExtra = dUnempExtra + dMtpyExtra;
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
  setText('oFive', euro(fiveAmt));
  setText('oNight', euro(nightAmt));
  setText('oGross', euro(grossTotal));

  // --- Φορολογία (ενημερωτικά) ---
  // Βάση υπολογισμού: (Μεικτά - κρατήσεις) * 12
  const taxAgeKey = document.getElementById('taxAge')?.value || 'over30';
  const taxKids = Number(document.getElementById('taxKids')?.value || 0);
  const annualIncome = Math.max(0, netBeforeTax) * 12; // φορολογητέο: (μεικτά - κρατήσεις) * 12
  const annualTax = annualTax2026(annualIncome, taxAgeKey, taxKids);
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
  // setText('dTax', euro(dTax)); // αφαιρέθηκε
  setText('d5y', euro(d5y));
  setText('dPouef', euro(dPouef));
  setText('dLoan', euro(loan));
  setText('dMainTotal', euro(dedMain));

  // ΚΡΑΤΗΣΕΙΣ - extra
  setText('dUnempExtra', euro(dUnempExtra));
  setText('dMtpyExtra', euro(dMtpyExtra));
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
  const monthName = document.getElementById('payslipMonth').value;
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
    ['Αναγνώριση 5ετίας', document.getElementById('d5y').textContent],
    ['ΠΟΥΕΦ', document.getElementById('dPouef').textContent],
    ['Δάνειο ΜΤΠΥ', document.getElementById('dLoan').textContent],
    ['Σύνολο κρατήσεων κύριων', document.getElementById('dMainTotal').textContent],
  ];
  const rowsDExtra = [
    ['Ανεργία 2% (Νύχτες + Πενθήμερα)', document.getElementById('dUnempExtra').textContent],
    ['ΜΤΠΥ 2% (Νύχτες + Πενθήμερα)', document.getElementById('dMtpyExtra').textContent],
    ['Σύνολο κρατήσεων επιπλέον', document.getElementById('dExtraTotal').textContent],
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
    const ids = new Set(['appointDate','status','children','after1993','border','fiveDays','nightHours','loanMtpy','fiveRecognize','payslipMonth','payslipYear','applyTax']);
    if (e.target && ids.has(e.target.id)) calc();
  });
  document.getElementById('tabE').addEventListener('click', ()=>showTab('E'));
  document.getElementById('tabD').addEventListener('click', ()=>showTab('D'));
  document.getElementById('tabT').addEventListener('click', ()=>showTab('T'));
  document.getElementById('btnPrint').addEventListener('click', printPayslip);
}

window.addEventListener('load', init);

window.addEventListener('load', ()=>{ setTimeout(hideSplash, 2000); });

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
