(function(){
  const EUR = (n)=> new Intl.NumberFormat('el-GR',{minimumFractionDigits:2, maximumFractionDigits:2}).format(n) + ' €';
  const $ = (id)=> document.getElementById(id);

  // --- ΡΥΘΜΙΣΕΙΣ ---
  const NIGHT_RATE = 26.50;
  const FIVE_DAY_RATE = 46.00;

  // Ενδεικτικές κρατήσεις (ρυθμίζονται)
  const INSURANCE_RATE = 0.135;   // 13.5%
  const OTHER_DED_FIXED = 0.00;

  // Ποσά (θα “κουμπώσουν” με v81 αν θέλεις rules)
  const BORDER_AMOUNT = 0.00;
  const FIVE_YEAR_AMOUNT = 0.00;

  // Κλίμακα φόρου (όπως v81 βάση 9/22/28/36/44)
  const TAX_BRACKETS = [
    { upTo: 10000, rate: 0.09 },
    { upTo: 20000, rate: 0.22 },
    { upTo: 30000, rate: 0.28 },
    { upTo: 40000, rate: 0.36 },
    { upTo: Infinity, rate: 0.44 },
  ];

  // Έκπτωση φόρου “όπως v81 + τέκνα” (0..4+)
  const TAX_CREDIT_BY_CHILDREN = (kids)=> {
    const k = Math.max(0, Math.floor(kids||0));
    if(k<=0) return 777;
    if(k===1) return 810;
    if(k===2) return 900;
    if(k===3) return 1120;
    return 1340;
  };

  // Μείωση: 10€ / 1.000€ πάνω από 12.000€
  const creditReductionOver12k = (annualTaxable)=> {
    if(annualTaxable <= 12000) return 0;
    const excess = annualTaxable - 12000;
    return Math.floor(excess / 1000) * 10;
  };

  const calcTaxScale = (annual)=> {
    let tax = 0, prev = 0;
    for(const b of TAX_BRACKETS){
      const cap = b.upTo;
      const slice = Math.max(0, Math.min(annual, cap) - prev);
      tax += slice * b.rate;
      prev = cap;
      if(annual <= cap) break;
    }
    return tax;
  };

  const getAge = (birthYear)=> {
    const y = parseInt(birthYear,10);
    if(!y || y<1900 || y>2100) return null;
    const nowY = new Date().getFullYear();
    const a = nowY - y;
    if(a<0 || a>120) return null;
    return a;
  };

  function readNumber(id){
    const v = parseFloat($(id).value);
    return isFinite(v) ? v : 0;
  }

  function compute(){
    const base = readNumber('baseSalary');
    const coef = parseFloat($('coef').value || '1') || 1;
    const personal = readNumber('personalDiff');
    const family = readNumber('familyAllowance');
    const special = readNumber('specialAllowance');
    const other = readNumber('otherAllowance');

    const nightCount = Math.max(0, Math.floor(readNumber('nightCount')));
    const fiveCount  = Math.max(0, Math.floor(readNumber('fiveDayCount')));

    const border = $('borderArea').checked ? BORDER_AMOUNT : 0;
    const fiveY  = $('fiveYear').checked ? FIVE_YEAR_AMOUNT : 0;

    const baseCalc = base * coef;
    const nightPay = nightCount * NIGHT_RATE;
    const fivePay  = fiveCount  * FIVE_DAY_RATE;

    const gross = baseCalc + nightPay + fivePay + border + fiveY + family + special + other + personal;

    // Deductions
    const ins = gross * INSURANCE_RATE;
    const otherDed = OTHER_DED_FIXED;
    const dedTotal = ins + otherDed;

    // Tax (annual->monthly)
    const annualTaxable = gross * 12;
    const taxScale = calcTaxScale(annualTaxable);
    const kids = readNumber('children');
    const baseCredit = TAX_CREDIT_BY_CHILDREN(kids);
    const red = creditReductionOver12k(annualTaxable);
    const credit = Math.max(0, baseCredit - red);
    const annualTax = Math.max(0, taxScale - credit);
    const monthlyTax = annualTax / 12;

    const net = gross - dedTotal - monthlyTax;

    // Outputs
    const age = getAge($('birthYear').value);
    $('ageOut').textContent = age===null ? '—' : String(age);

    $('baseOut').textContent = EUR(baseCalc);
    $('nightOut').textContent = EUR(nightPay);
    $('fiveOut').textContent = EUR(fivePay);
    $('borderOut').textContent = EUR(border);
    $('fiveYearOut').textContent = EUR(fiveY);
    $('familyOut').textContent = EUR(family);
    $('specialOut').textContent = EUR(special);
    $('otherOut').textContent = EUR(other);
    $('personalOut').textContent = EUR(personal);
    $('grossOut').textContent = EUR(gross);
    $('netOut').textContent = EUR(net);

    $('insOut').textContent = EUR(ins);
    $('otherDedOut').textContent = EUR(otherDed);
    $('dedTotalOut').textContent = EUR(dedTotal);

    $('taxableAnnualOut').textContent = EUR(annualTaxable);
    $('taxScaleOut').textContent = EUR(taxScale);
    $('taxCreditOut').textContent = EUR(credit);
    $('taxReductionOut').textContent = EUR(red);
    $('taxAnnualOut').textContent = EUR(annualTax);
    $('taxMonthlyOut').textContent = EUR(monthlyTax);
  }

  // Tabs
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const panels = { earn: $('panelEarn'), ded: $('panelDed'), tax: $('panelTax') };
  tabs.forEach(t=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const key = t.dataset.tab;
      Object.entries(panels).forEach(([k,p])=> p.style.display = (k===key) ? 'block' : 'none');
    });
  });

  // Top buttons
  $('btnCalendar').addEventListener('click', ()=>{
    alert('Το ημερολόγιο (μόνο καταμέτρηση ΝΥ & 5ημέρων) θα προστεθεί στο επόμενο βήμα (v82.2).');
  });

  // Reset
  $('btnReset').addEventListener('click', ()=>{
    if(!confirm('Να γίνει καθαρισμός των πεδίων;')) return;
    $('birthYear').value = '';
    $('children').value = 0;
    $('baseSalary').value = 1774;
    $('coef').value = '1.04';
    $('personalDiff').value = 0;
    $('familyAllowance').value = 0;
    $('specialAllowance').value = 0;
    $('otherAllowance').value = 0;
    $('borderArea').checked = false;
    $('fiveYear').checked = false;
    $('nightCount').value = 0;
    $('fiveDayCount').value = 0;
    compute();
  });

  // Recompute on change
  ['birthYear','children','baseSalary','coef','personalDiff','familyAllowance','specialAllowance','otherAllowance','borderArea','fiveYear','nightCount','fiveDayCount']
    .forEach(id=>{
      const el = $(id);
      el.addEventListener('input', compute);
      el.addEventListener('change', compute);
    });

  compute();
})();