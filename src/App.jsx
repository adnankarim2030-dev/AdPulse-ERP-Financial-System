import React, { useState, useMemo, useRef } from "react";
import {
  LayoutDashboard, FileText, Receipt, BookOpenText, BarChart3,
  Plus, X, CheckCircle2, Clock, AlertCircle, Wallet, Landmark,
  TrendingUp, TrendingDown, ScrollText, Building2, ClipboardList,
  UploadCloud, Printer, MapPin, Ruler, Loader2, FileCheck2,
  Briefcase, Video, PartyPopper, Megaphone, Users, Newspaper,
  ChevronRight, Coins, Menu, UserPlus, UserCheck, UserX, CalendarCheck,
  CalendarX, Banknote, Contact, Phone, Mail, Edit, Trash2, Settings,
  Lock, KeyRound, ShieldCheck, LogOut, User, Check, Eye, EyeOff
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";

/* ---------- HELPERS & FORMATTERS ---------- */

function groupIndian(numStr) {
  if (numStr.length <= 3) return numStr;
  const last3 = numStr.slice(-3);
  const rest = numStr.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
}

function pkr(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rs 0";
  const neg = amount < 0;
  const whole = Math.round(Math.abs(amount)).toString();
  return (neg ? "-Rs " : "Rs ") + groupIndian(whole);
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const TODAY = new Date("2026-07-21");
const uid = (() => { let n = 1000; return () => (n++).toString(36); })();

const ACCOUNTS = {
  cash: { name: "Cash Account", type: "asset" },
  bank: { name: "Bank Account (HBL/MCB)", type: "asset" },
  ar: { name: "Accounts Receivable", type: "asset" },
  revenue: { name: "Service Revenue", type: "revenue" },
  expense: { name: "Operating Expenses", type: "expense" },
  equity: { name: "Owner's Equity", type: "equity" },
};

const VOUCHER_TYPES = {
  JV: "Journal Voucher",
  PV: "Payment Voucher",
  RV: "Receipt Voucher",
  SV: "Sales Voucher",
};

const PAGE_SIZES = {
  A4: "210mm 297mm",
  A5: "148mm 210mm",
  Letter: "8.5in 11in",
  Legal: "8.5in 14in",
};

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}

function threeDigitWords(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let s = h ? ONES[h] + " Hundred" : "";
  if (rest) s += (s ? " " : "") + twoDigitWords(rest);
  return s;
}

function amountInWords(num) {
  num = Math.round(num);
  if (num === 0) return "Zero Rupees Only";
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  const parts = [];
  if (crore) parts.push(threeDigitWords(crore) + " Crore");
  if (lakh) parts.push(threeDigitWords(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitWords(thousand) + " Thousand");
  if (hundred) parts.push(threeDigitWords(hundred));
  return parts.join(" ") + " Rupees Only";
}

const EXPENSE_CATEGORIES = ["Ad Spend", "Software", "Rent", "Contractor", "Utilities", "Payroll", "Production Vendor", "Other"];

/* ---------- HR & Payroll ---------- */
const HR_DEPARTMENTS = ["Creative", "Digital Marketing", "OOH Operations", "Client Servicing", "Production", "Accounts & Finance", "HR & Admin"];
const LEAVE_TYPES = ["Casual", "Sick", "Annual", "Unpaid"];
const EMP_STATUSES = ["Active", "On Leave", "Terminated"];
function empCode(n) { return "EMP-" + String(n).padStart(3, "0"); }

const PROJECT_TYPES = [
  { key: "TVC Production", label: "TVC Production", icon: Video, color: "#B8860B" },
  { key: "Events", label: "Events", icon: PartyPopper, color: "#E11D48" },
  { key: "OOH Advertising", label: "OOH Advertising", icon: Building2, color: "#059669" },
  { key: "Digital Marketing", label: "Digital Marketing", icon: Megaphone, color: "#0284C7" },
  { key: "BTL Marketing", label: "BTL Marketing", icon: Users, color: "#D97706" },
  { key: "Print Media", label: "Print Media", icon: Newspaper, color: "#7C3AED" },
];

const PROJECT_STATUSES = ["Planning", "Ongoing", "Completed", "On Hold"];

function projectTypeMeta(key) {
  return PROJECT_TYPES.find(t => t.key === key) || PROJECT_TYPES[0];
}

const ALL_MODULE_TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "projects", label: "Projects" },
  { key: "invoices", label: "Invoices" },
  { key: "expenses", label: "Expenses" },
  { key: "ooh", label: "OOH Advertising" },
  { key: "hr", label: "HR & Payroll" },
  { key: "vouchers", label: "Vouchers" },
  { key: "documents", label: "Documents" },
  { key: "ledger", label: "Ledger" },
  { key: "reports", label: "Reports" },
];

/* ---------- SEED USERS ---------- */
const SEED_USERS = [
  {
    id: "u-admin",
    name: "AdPulse Admin",
    email: "admin@adpulse.pk",
    password: "admin123",
    role: "Admin",
    department: "Executive Management",
    allowedTabs: ALL_MODULE_TABS.map(t => t.key),
  },
  {
    id: "u-staff",
    name: "Digital Team Staff",
    email: "staff@adpulse.pk",
    password: "staff123",
    role: "Staff",
    department: "Digital Marketing",
    allowedTabs: ["dashboard", "projects", "invoices", "ooh", "documents"],
  },
];

/* ---------- SEED FINANCIAL DATA ---------- */

function seedJournal() {
  const entries = [];
  const add = (date, description, lines, ref) => {
    entries.push({ id: uid(), date, description, reference: ref, lines });
  };

  add("2026-07-01", "Opening Balances Capital Contribution", [
    { account: "cash", debit: 500000, credit: 0 },
    { account: "bank", debit: 2500000, credit: 0 },
    { account: "equity", debit: 0, credit: 3000000 },
  ], "OB-001");

  return entries;
}

function seedInvoices() {
  return [
    { id: uid(), client: "Prime Estate Enterprises", description: "Website + Proposal Package", amount: 450000, issueDate: "2026-07-05", dueDate: "2026-07-20", paid: true, paidVia: "Bank" },
    { id: uid(), client: "Imtiaz Retail", description: "Q3 Campaign Strategy Retainer", amount: 1250000, issueDate: "2026-07-10", dueDate: "2026-07-25", paid: false, paidVia: null },
    { id: uid(), client: "Kinza Beverages", description: "Website + Brand Package", amount: 680000, issueDate: "2026-06-15", dueDate: "2026-06-30", paid: false, paidVia: null },
    { id: uid(), client: "North Town Residency", description: "FB/Insta Campaign - Commercial Units", amount: 320000, issueDate: "2026-07-15", dueDate: "2026-07-30", paid: false, paidVia: null },
    { id: uid(), client: "Magnitude", description: "Logo Design Package", amount: 85000, issueDate: "2026-06-20", dueDate: "2026-07-05", paid: true, paidVia: "Cash" },
  ];
}

function seedExpenses() {
  return [
    { id: uid(), vendor: "Meta Ads", category: "Ad Spend", amount: 210000, date: "2026-07-08", paidVia: "Bank" },
    { id: uid(), vendor: "Midjourney & Creative Suite", category: "Software", amount: 45000, date: "2026-07-01", paidVia: "Bank" },
    { id: uid(), vendor: "Shahrah-e-Faisal Office Rent", category: "Rent", amount: 180000, date: "2026-07-01", paidVia: "Bank" },
    { id: uid(), vendor: "Freelance 3D Animator", category: "Contractor", amount: 65000, date: "2026-07-12", paidVia: "Cash" },
    { id: uid(), vendor: "K-Electric & High-Speed Fiber", category: "Utilities", amount: 28000, date: "2026-07-03", paidVia: "Cash" },
  ];
}

function seedHoardings() {
  return [
    { id: uid(), name: "Shahrah-e-Faisal Site 1", area: "Shahrah-e-Faisal", size: "20x40 ft", pricePerMonth: 150000, status: "Available", project: "", client: "" },
    { id: uid(), name: "Tariq Road Junction", area: "Tariq Road", size: "10x20 ft", pricePerMonth: 60000, status: "Booked", project: "Ramzan Drive", client: "Imtiaz Retail", bookedFrom: "2026-07-01", bookedTo: "2026-08-31" },
    { id: uid(), name: "Clifton Beach View Billboard", area: "Clifton", size: "30x60 ft", pricePerMonth: 280000, status: "Available", project: "", client: "" },
    { id: uid(), name: "North Nazimabad Chowrangi", area: "North Nazimabad", size: "15x30 ft", pricePerMonth: 95000, status: "Maintenance", project: "", client: "" },
    { id: uid(), name: "II Chundrigar Financial Hub", area: "II Chundrigar", size: "25x50 ft", pricePerMonth: 200000, status: "Booked", project: "Launch Campaign", client: "Prime Estate Enterprises", bookedFrom: "2026-07-05", bookedTo: "2026-09-05" },
    { id: uid(), name: "Gulshan-e-Iqbal Flyover", area: "Gulshan-e-Iqbal", size: "12x24 ft", pricePerMonth: 70000, status: "Available", project: "", client: "" },
  ];
}

function seedEmployees() {
  return [
    { id: uid(), code: empCode(1), name: "Ayesha Farooq", department: "Creative", designation: "Creative Director", email: "ayesha.farooq@adpulse.pk", phone: "0300-1234567", joinDate: "2022-03-01", status: "Active", salary: 285000, cnic: "42101-1234567-1", bankAccount: "PK-HBL-00112233", leaveBalance: 16 },
    { id: uid(), code: empCode(2), name: "Bilal Sheikh", department: "Digital Marketing", designation: "Digital Marketing Manager", email: "bilal.sheikh@adpulse.pk", phone: "0301-2345678", joinDate: "2022-08-15", status: "Active", salary: 220000, cnic: "42101-2345678-2", bankAccount: "PK-UBL-00223344", leaveBalance: 12 },
    { id: uid(), code: empCode(3), name: "Zainab Hussain", department: "Client Servicing", designation: "Account Manager", email: "zainab.hussain@adpulse.pk", phone: "0302-3456789", joinDate: "2023-01-10", status: "Active", salary: 165000, cnic: "42101-3456789-3", bankAccount: "PK-MCB-00334455", leaveBalance: 18 },
    { id: uid(), code: empCode(4), name: "Hamza Qureshi", department: "OOH Operations", designation: "Operations Executive", email: "hamza.qureshi@adpulse.pk", phone: "0303-4567890", joinDate: "2021-11-20", status: "On Leave", salary: 140000, cnic: "42101-4567890-4", bankAccount: "PK-ABL-00445566", leaveBalance: 6 },
    { id: uid(), code: empCode(5), name: "Sana Malik", department: "Production", designation: "Production Coordinator", email: "sana.malik@adpulse.pk", phone: "0304-5678901", joinDate: "2023-06-05", status: "Active", salary: 130000, cnic: "42101-5678901-5", bankAccount: "PK-HBL-00556677", leaveBalance: 20 },
    { id: uid(), code: empCode(6), name: "Faisal Ahmed", department: "Accounts & Finance", designation: "Accounts Officer", email: "faisal.ahmed@adpulse.pk", phone: "0305-6789012", joinDate: "2020-04-12", status: "Active", salary: 155000, cnic: "42101-6789012-6", bankAccount: "PK-UBL-00667788", leaveBalance: 9 },
    { id: uid(), code: empCode(7), name: "Mehak Raza", department: "HR & Admin", designation: "HR Executive", email: "mehak.raza@adpulse.pk", phone: "0306-7890123", joinDate: "2024-02-18", status: "Active", salary: 120000, cnic: "42101-7890123-7", bankAccount: "PK-MCB-00778899", leaveBalance: 19 },
    { id: uid(), code: empCode(8), name: "Usman Tariq", department: "Digital Marketing", designation: "Graphic Designer", email: "usman.tariq@adpulse.pk", phone: "0307-8901234", joinDate: "2023-09-01", status: "Terminated", salary: 95000, cnic: "42101-8901234-8", bankAccount: "PK-ABL-00889900", leaveBalance: 0 },
  ];
}

function seedLeaveRequests(employees) {
  const byName = n => employees.find(e => e.name === n);
  return [
    { id: uid(), employeeId: byName("Hamza Qureshi")?.id || "e4", employeeName: "Hamza Qureshi", type: "Sick", fromDate: "2026-07-18", toDate: "2026-07-22", days: 5, reason: "Recovering from fever", status: "Approved", appliedOn: "2026-07-16" },
    { id: uid(), employeeId: byName("Zainab Hussain")?.id || "e3", employeeName: "Zainab Hussain", type: "Casual", fromDate: "2026-07-28", toDate: "2026-07-29", days: 2, reason: "Family function", status: "Pending", appliedOn: "2026-07-20" },
    { id: uid(), employeeId: byName("Sana Malik")?.id || "e5", employeeName: "Sana Malik", type: "Annual", fromDate: "2026-08-03", toDate: "2026-08-07", days: 5, reason: "Travelling out of city", status: "Pending", appliedOn: "2026-07-19" },
    { id: uid(), employeeId: byName("Faisal Ahmed")?.id || "e6", employeeName: "Faisal Ahmed", type: "Casual", fromDate: "2026-07-10", toDate: "2026-07-10", days: 1, reason: "Personal errand", status: "Rejected", appliedOn: "2026-07-08" },
  ];
}

function seedPayrollRun(employees) {
  const active = employees.filter(e => e.status !== "Terminated");
  const entries = active.map(e => ({ employeeId: e.id, name: e.name, department: e.department, gross: e.salary, deduction: 0, net: e.salary }));
  const totalNet = entries.reduce((s, e) => s + e.net, 0);
  const run = { id: uid(), month: "June 2026", runDate: "2026-06-30", employeeCount: entries.length, totalGross: totalNet, totalDeductions: 0, totalNet, entries };
  const exp = { id: uid(), vendor: "Payroll — June 2026", category: "Payroll", description: `Salaries for ${entries.length} employees`, amount: totalNet, date: run.runDate, paidVia: "Bank" };
  return { run, expense: exp };
}

function buildInitialJournal(invoices, expenses) {
  const entries = seedJournal();

  invoices.forEach(inv => {
    entries.push({
      id: uid(), date: inv.issueDate, reference: "INV-" + inv.id.toUpperCase(),
      description: `Invoice - ${inv.client} (${inv.description})`,
      lines: [
        { account: "ar", debit: inv.amount, credit: 0 },
        { account: "revenue", debit: 0, credit: inv.amount },
      ],
    });
    if (inv.paid) {
      entries.push({
        id: uid(), date: inv.dueDate, reference: "PMT-" + inv.id.toUpperCase(),
        description: `Payment received - ${inv.client}`,
        lines: [
          { account: inv.paidVia === "Cash" ? "cash" : "bank", debit: inv.amount, credit: 0 },
          { account: "ar", debit: 0, credit: inv.amount },
        ],
      });
    }
  });

  expenses.forEach(exp => {
    entries.push({
      id: uid(), date: exp.date, reference: "EXP-" + exp.id.toUpperCase(),
      description: `${exp.vendor} (${exp.category})`,
      lines: [
        { account: "expense", debit: exp.amount, credit: 0, memo: exp.category },
        { account: exp.paidVia === "Cash" ? "cash" : "bank", debit: 0, credit: exp.amount },
      ],
    });
  });

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  return entries;
}

function seedProjects() {
  return [
    { id: uid(), client: "Kinza Beverages", type: "TVC Production", name: "Summer Refresh TVC", description: "30-sec TV commercial: script, shoot & post-production edit", startDate: "2026-06-10", endDate: "2026-07-15", status: "Completed" },
    { id: uid(), client: "Prime Estate Enterprises", type: "Events", name: "Project Launch Event", description: "Site launch event management & stage production", startDate: "2026-07-01", endDate: "2026-07-05", status: "Completed" },
    { id: uid(), client: "Imtiaz Retail", type: "OOH Advertising", name: "Ramzan Drive Billboards", description: "City-wide hoarding & billboard campaign — multiple prime sites", startDate: "2026-07-01", endDate: "2026-08-31", status: "Ongoing" },
    { id: uid(), client: "Prime Estate Enterprises", type: "OOH Advertising", name: "Launch Campaign Billboards", description: "Site-launch hoarding campaign around II Chundrigar", startDate: "2026-07-05", endDate: "2026-09-05", status: "Ongoing" },
    { id: uid(), client: "North Town Residency", type: "Digital Marketing", name: "Commercial Units Digital Push", description: "FB/Insta lead generation campaign & ad management", startDate: "2026-07-15", endDate: "2026-08-15", status: "Ongoing" },
    { id: uid(), client: "Magnitude", type: "BTL Marketing", name: "Retail Activation Drive", description: "In-store BTL brand activation & promotional sampling", startDate: "2026-06-20", endDate: "2026-07-10", status: "Completed" },
    { id: uid(), client: "Kinza Beverages", type: "Print Media", name: "Newspaper Insert Campaign", description: "Print ad insertions - Dawn & Jang Sunday editions", startDate: "2026-07-05", endDate: "2026-07-25", status: "Planning" },
  ];
}

function seedProjectInvoices(projects) {
  const billAmount = {
    "TVC Production": 480000, "Events": 350000, "OOH Advertising": 600000,
    "Digital Marketing": 300000, "BTL Marketing": 220000, "Print Media": 150000,
  };
  return projects.map(p => ({
    id: uid(), client: p.client, description: `${p.type} — ${p.name}`, amount: billAmount[p.type],
    issueDate: p.startDate, dueDate: p.endDate,
    paid: p.status === "Completed", paidVia: p.status === "Completed" ? "Bank" : null,
    projectId: p.id,
  }));
}

function seedProjectExpenses(projects) {
  const costAmount = {
    "TVC Production": 220000, "Events": 180000, "OOH Advertising": 210000,
    "Digital Marketing": 90000, "BTL Marketing": 95000,
  };
  return projects.filter(p => costAmount[p.type]).map(p => ({
    id: uid(), vendor: `${p.type} — Production Vendor`, description: `Cost for ${p.name}`,
    category: p.type, amount: costAmount[p.type], date: p.startDate, paidVia: "Bank",
    projectId: p.id,
  }));
}

function buildInitialData() {
  const projects = seedProjects();
  const hoardings = seedHoardings();

  const ramzan = projects.find(p => p.name === "Ramzan Drive Billboards");
  const launch = projects.find(p => p.name === "Launch Campaign Billboards");
  const hoardingInvoices = [];

  const linkSite = (siteName, proj, bookedFrom, bookedTo) => {
    const h = hoardings.find(x => x.name === siteName);
    if (!h || !proj) return;
    h.status = "Booked"; h.client = proj.client; h.project = proj.name; h.projectId = proj.id;
    h.bookedFrom = bookedFrom; h.bookedTo = bookedTo;
    hoardingInvoices.push({
      id: uid(), client: proj.client, description: `OOH Advertising — ${proj.name}: ${h.name} rental`,
      amount: h.pricePerMonth, issueDate: bookedFrom, dueDate: bookedTo,
      paid: false, paidVia: null, projectId: proj.id,
    });
  };

  linkSite("Tariq Road Junction", ramzan, "2026-07-01", "2026-08-31");
  linkSite("Gulshan-e-Iqbal Flyover", ramzan, "2026-07-10", "2026-08-31");
  linkSite("II Chundrigar Financial Hub", launch, "2026-07-05", "2026-09-05");

  const employees = seedEmployees();
  const leaveRequests = seedLeaveRequests(employees);
  const { run: payrollRun, expense: payrollExpense } = seedPayrollRun(employees);

  const invoices = [...seedInvoices(), ...seedProjectInvoices(projects), ...hoardingInvoices];
  const expenses = [...seedExpenses(), ...seedProjectExpenses(projects), payrollExpense];
  const journal = buildInitialJournal(invoices, expenses);
  return { projects, invoices, expenses, journal, hoardings, employees, leaveRequests, payrollRuns: [payrollRun] };
}

/* ---------- SMALL UI COMPONENTS ---------- */

function StatusBadge({ status }) {
  const map = {
    Paid: { color: "var(--jade)", bg: "var(--jade-glow)", icon: CheckCircle2 },
    Unpaid: { color: "var(--amber)", bg: "var(--amber-glow)", icon: Clock },
    Overdue: { color: "var(--rose)", bg: "var(--rose-glow)", icon: AlertCircle },
  };
  const s = map[status] || map.Unpaid;
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      color: s.color, background: s.bg, padding: "4px 10px",
      borderRadius: 20, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2, whiteSpace: "nowrap",
    }}>
      <Icon size={12} /> {status}
    </span>
  );
}

function ProjectTypeBadge({ type }) {
  const m = projectTypeMeta(type);
  const Icon = m.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      color: m.color, background: m.color + "1A", padding: "4px 10px",
      borderRadius: 20, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2, whiteSpace: "nowrap",
    }}>
      <Icon size={11.5} /> {m.label}
    </span>
  );
}

function ProjectStatusBadge({ status }) {
  const map = {
    Planning: { color: "var(--amber)", bg: "var(--amber-glow)", icon: Clock },
    Ongoing: { color: "var(--gold)", bg: "var(--gold-glow)", icon: TrendingUp },
    Completed: { color: "var(--jade)", bg: "var(--jade-glow)", icon: CheckCircle2 },
    "On Hold": { color: "var(--rose)", bg: "var(--rose-glow)", icon: AlertCircle },
  };
  const s = map[status] || map.Planning;
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      color: s.color, background: s.bg, padding: "4px 10px",
      borderRadius: 20, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2, whiteSpace: "nowrap",
    }}>
      <Icon size={12} /> {status}
    </span>
  );
}

function EmployeeStatusBadge({ status }) {
  const map = {
    Active: { color: "var(--jade)", bg: "var(--jade-glow)", icon: UserCheck },
    "On Leave": { color: "var(--amber)", bg: "var(--amber-glow)", icon: Clock },
    Terminated: { color: "var(--rose)", bg: "var(--rose-glow)", icon: UserX },
  };
  const s = map[status] || map.Active;
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      color: s.color, background: s.bg, padding: "4px 10px",
      borderRadius: 20, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2, whiteSpace: "nowrap",
    }}>
      <Icon size={12} /> {status}
    </span>
  );
}

function LeaveStatusBadge({ status }) {
  const map = {
    Pending: { color: "var(--amber)", bg: "var(--amber-glow)", icon: Clock },
    Approved: { color: "var(--jade)", bg: "var(--jade-glow)", icon: CalendarCheck },
    Rejected: { color: "var(--rose)", bg: "var(--rose-glow)", icon: CalendarX },
  };
  const s = map[status] || map.Pending;
  const Icon = s.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      color: s.color, background: s.bg, padding: "4px 10px",
      borderRadius: 20, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.2, whiteSpace: "nowrap",
    }}>
      <Icon size={12} /> {status}
    </span>
  );
}

function DepartmentBadge({ department }) {
  return <span className="badge-mini">{department}</span>;
}

function KpiCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--ink-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--ink)" }}>{value}</div>
          {sub && <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 4, fontWeight: 500 }}>{sub}</div>}
        </div>
        <div style={{ background: accent + "1A", color: accent, borderRadius: 9, padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function LedgerStrip({ rows, showAccounts }) {
  return (
    <div className="ledger-strip">
      <div className="ledger-margin" />
      <div className="ledger-rows">
        <div className="ledger-row ledger-head">
          <span className="col-date">Date</span>
          <span className="col-desc">Particulars</span>
          {showAccounts && <span className="col-acct">Account</span>}
          <span className="col-amt">Debit</span>
          <span className="col-amt">Credit</span>
        </div>
        {rows.map((r, i) => (
          <div className="ledger-row" key={i}>
            <span className="col-date">{fmtDate(r.date)}</span>
            <span className="col-desc">{r.description}</span>
            {showAccounts && <span className="col-acct">{ACCOUNTS[r.account]?.name || r.account}</span>}
            <span className="col-amt mono">{r.debit ? pkr(r.debit) : ""}</span>
            <span className="col-amt mono">{r.credit ? pkr(r.credit) : ""}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", color: "var(--ink-muted)" }}>No ledger entries found.</div>
        )}
      </div>
    </div>
  );
}

/* ---------- MAIN APPLICATION ---------- */

export default function App() {
  /* Authentication & Session state */
  const [currentUser, setCurrentUser] = useState(null); // null = Welcome Gateway Screen
  const [usersList, setUsersList] = useState(SEED_USERS);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  /* Tab Navigation state */
  const [tab, setTab] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* Financial & Operations state */
  const [seedData] = useState(buildInitialData);
  const [journal, setJournal] = useState(seedData.journal);
  const [invoices, setInvoices] = useState(seedData.invoices);
  const [expenses, setExpenses] = useState(seedData.expenses);
  const [projects, setProjects] = useState(seedData.projects);

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [voucherDefaultType, setVoucherDefaultType] = useState("JV");

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [billingModalProject, setBillingModalProject] = useState(null);
  const [costModalProject, setCostModalProject] = useState(null);
  const [projectFilters, setProjectFilters] = useState({ type: "All", status: "All", client: "" });

  const [hoardings, setHoardings] = useState(seedData.hoardings);
  const [showHoardingForm, setShowHoardingForm] = useState(false);
  const [editingHoarding, setEditingHoarding] = useState(null);

  const [vouchers, setVouchers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bookingHoarding, setBookingHoarding] = useState(null);
  const [sitePickerProject, setSitePickerProject] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [clientStatementClient, setClientStatementClient] = useState(null);
  const [projectStatementId, setProjectStatementId] = useState(null);
  const [oohFilters, setOohFilters] = useState({ area: "All", size: "All", status: "All", maxPrice: "" });

  const [employees, setEmployees] = useState(seedData.employees);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState(seedData.leaveRequests);
  const [payrollRuns, setPayrollRuns] = useState(seedData.payrollRuns);
  const [attendanceToday, setAttendanceToday] = useState(() => {
    const onLeaveIds = new Set(seedData.leaveRequests
      .filter(l => l.status === "Approved" && l.fromDate <= "2026-07-21" && l.toDate >= "2026-07-21")
      .map(l => l.employeeId));
    const m = {};
    seedData.employees.forEach(e => {
      m[e.id] = e.status === "Terminated" ? "N/A" : onLeaveIds.has(e.id) ? "Leave" : "Present";
    });
    return m;
  });
  const [hrView, setHrView] = useState("directory");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [employeeDetail, setEmployeeDetail] = useState(null);
  const [payrollConfirm, setPayrollConfirm] = useState(false);

  /* User Management state for Admin Settings */
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const voucherCounters = useRef({ JV: 0, PV: 0, RV: 0, SV: 0 });

  const postEntry = (date, description, lines, ref) => {
    setJournal(j => [...j, { id: uid(), date, description, reference: ref, lines }].sort((a, b) => new Date(a.date) - new Date(b.date)));
  };

  /* derived: account balances */
  const balances = useMemo(() => {
    const b = {};
    Object.keys(ACCOUNTS).forEach(k => (b[k] = { debit: 0, credit: 0 }));
    journal.forEach(e => e.lines.forEach(l => {
      if (b[l.account]) {
        b[l.account].debit += l.debit;
        b[l.account].credit += l.credit;
      }
    }));
    const net = {};
    Object.keys(ACCOUNTS).forEach(k => {
      const t = ACCOUNTS[k].type;
      net[k] = (t === "asset" || t === "expense")
        ? b[k].debit - b[k].credit
        : b[k].credit - b[k].debit;
    });
    return { raw: b, net };
  }, [journal]);

  const totalDebit = journal.reduce((s, e) => s + e.lines.reduce((s2, l) => s2 + l.debit, 0), 0);
  const totalCredit = journal.reduce((s, e) => s + e.lines.reduce((s2, l) => s2 + l.credit, 0), 0);
  const isBalanced = totalDebit === totalCredit;

  const invoicesWithStatus = invoices.map(inv => ({
    ...inv,
    status: inv.paid ? "Paid" : (new Date(inv.dueDate) < TODAY ? "Overdue" : "Unpaid"),
  }));

  const cashBalance = balances.net.cash + balances.net.bank;
  const arBalance = balances.net.ar;
  const revenueBalance = balances.net.revenue;
  const expenseBalance = balances.net.expense;
  const netProfit = revenueBalance - expenseBalance;

  const overdueTotal = invoicesWithStatus.filter(i => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const unpaidTotal = invoicesWithStatus.filter(i => i.status !== "Paid").reduce((s, i) => s + i.amount, 0);

  const cashSeries = useMemo(() => {
    const cashLines = [];
    journal.forEach(e => e.lines.forEach(l => {
      if (l.account === "cash" || l.account === "bank") {
        cashLines.push({ date: e.date, delta: l.debit - l.credit });
      }
    }));
    cashLines.sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    const byDate = {};
    cashLines.forEach(l => {
      running += l.delta;
      byDate[l.date] = running;
    });
    return Object.entries(byDate).map(([date, balance]) => ({
      date: fmtDate(date), balance,
    }));
  }, [journal]);

  const expenseByCategory = useMemo(() => {
    const m = {};
    expenses.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return Object.entries(m).map(([category, amount]) => ({ category, amount }));
  }, [expenses]);

  const projectStats = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.id] = { billed: 0, received: 0, cost: 0 }; });
    invoices.forEach(inv => {
      if (inv.projectId && map[inv.projectId]) {
        map[inv.projectId].billed += inv.amount;
        if (inv.paid) map[inv.projectId].received += inv.amount;
      }
    });
    expenses.forEach(exp => {
      if (exp.projectId && map[exp.projectId]) map[exp.projectId].cost += exp.amount;
    });
    return map;
  }, [projects, invoices, expenses]);

  const projectsWithStats = useMemo(() => projects.map(p => {
    const s = projectStats[p.id] || { billed: 0, received: 0, cost: 0 };
    return { ...p, ...s, outstanding: s.billed - s.received, margin: s.billed - s.cost };
  }), [projects, projectStats]);

  const projectTypeSummary = useMemo(() => {
    const m = {};
    PROJECT_TYPES.forEach(t => { m[t.key] = { type: t.label, revenue: 0, cost: 0 }; });
    const typeOf = {};
    projects.forEach(p => { typeOf[p.id] = p.type; });
    invoices.forEach(inv => {
      const t = typeOf[inv.projectId];
      if (t && m[t]) m[t].revenue += inv.amount;
    });
    expenses.forEach(exp => {
      const t = typeOf[exp.projectId];
      if (t && m[t]) m[t].cost += exp.amount;
    });
    return Object.values(m).filter(r => r.revenue || r.cost);
  }, [projects, invoices, expenses]);

  const recentEntries = useMemo(() => {
    const flat = [];
    [...journal].reverse().forEach(e => {
      e.lines.forEach(l => flat.push({ date: e.date, description: e.description, account: l.account, debit: l.debit, credit: l.credit }));
    });
    return flat.slice(0, 8);
  }, [journal]);

  const hrStats = useMemo(() => {
    const active = employees.filter(e => e.status !== "Terminated");
    const onLeave = employees.filter(e => e.status === "On Leave");
    const monthlyPayrollCost = active.reduce((s, e) => s + e.salary, 0);
    const pendingLeaves = leaveRequests.filter(l => l.status === "Pending").length;
    const presentToday = Object.values(attendanceToday).filter(v => v === "Present").length;
    const absentToday = Object.values(attendanceToday).filter(v => v === "Absent").length;
    const leaveToday = Object.values(attendanceToday).filter(v => v === "Leave").length;
    return { total: employees.length, active: active.length, onLeave: onLeave.length, monthlyPayrollCost, pendingLeaves, presentToday, absentToday, leaveToday };
  }, [employees, leaveRequests, attendanceToday]);

  /* User & Password Actions */
  function handleLogin(userObj) {
    setCurrentUser(userObj);
    const firstAllowed = userObj.allowedTabs?.[0] || "dashboard";
    setTab(firstAllowed);
  }

  function handleLogout() {
    setCurrentUser(null);
  }

  function handleResetPassword(email, newPass) {
    setUsersList(list => list.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPass } : u));
  }

  function handleAddUser(newUser) {
    setUsersList(list => [newUser, ...list]);
    setShowAddUserForm(false);
  }

  function handleUpdateUser(updated) {
    setUsersList(list => list.map(u => u.id === updated.id ? updated : u));
    setEditingUser(null);
  }

  function handleDeleteUser(id) {
    if (window.confirm("Are you sure you want to remove this staff user account?")) {
      setUsersList(list => list.filter(u => u.id !== id));
    }
  }

  /* Financial Actions */
  function addInvoice({ client, description, amount, issueDate, dueDate }) {
    const inv = { id: uid(), client, description, amount, issueDate, dueDate, paid: false, paidVia: null };
    setInvoices(list => [inv, ...list]);
    postEntry(issueDate, `Invoice - ${client} (${description})`, [
      { account: "ar", debit: amount, credit: 0 },
      { account: "revenue", debit: 0, credit: amount },
    ], "INV-" + inv.id.toUpperCase());
    setShowInvoiceForm(false);
  }

  function updateInvoice(updated) {
    setInvoices(list => list.map(i => i.id === updated.id ? updated : i));
    setEditingInvoice(null);
  }

  function markPaid(inv, via) {
    setInvoices(list => list.map(i => i.id === inv.id ? { ...i, paid: true, paidVia: via } : i));
    postEntry(TODAY.toISOString().slice(0, 10), `Payment received - ${inv.client}`, [
      { account: via === "Cash" ? "cash" : "bank", debit: inv.amount, credit: 0 },
      { account: "ar", debit: 0, credit: inv.amount },
    ], "PMT-" + inv.id.toUpperCase());
  }

  function addExpense({ vendor, category, amount, date, paidVia }) {
    const exp = { id: uid(), vendor, category, amount, date, paidVia };
    setExpenses(list => [exp, ...list]);
    postEntry(date, `${vendor} (${category})`, [
      { account: "expense", debit: amount, credit: 0, memo: category },
      { account: paidVia === "Cash" ? "cash" : "bank", debit: 0, credit: amount },
    ], "EXP-" + exp.id.toUpperCase());
    setShowExpenseForm(false);
  }

  function updateExpense(updated) {
    setExpenses(list => list.map(e => e.id === updated.id ? updated : e));
    setEditingExpense(null);
  }

  function makeVoucherNo(type) {
    voucherCounters.current[type] += 1;
    return `${type}-${String(voucherCounters.current[type]).padStart(3, "0")}`;
  }

  function createVoucher(type, { date, party, description, amount, category, via, settleAR, lines }) {
    const voucherNo = makeVoucherNo(type);
    let journalLines = lines;
    if (type === "PV") {
      journalLines = [
        { account: "expense", debit: amount, credit: 0, memo: category },
        { account: via === "Cash" ? "cash" : "bank", debit: 0, credit: amount },
      ];
    } else if (type === "RV") {
      journalLines = settleAR
        ? [
            { account: via === "Cash" ? "cash" : "bank", debit: amount, credit: 0 },
            { account: "ar", debit: 0, credit: amount },
          ]
        : [
            { account: via === "Cash" ? "cash" : "bank", debit: amount, credit: 0 },
            { account: "revenue", debit: 0, credit: amount },
          ];
    } else if (type === "SV") {
      journalLines = [
        { account: "ar", debit: amount, credit: 0 },
        { account: "revenue", debit: 0, credit: amount },
      ];
    }
    postEntry(date, description, journalLines, voucherNo);
    setVouchers(v => [{ id: uid(), voucherNo, type, date, party, description, amount }, ...v]);
    setShowVoucherForm(false);
    return voucherNo;
  }

  function addHoarding(siteData) {
    const newSite = { id: uid(), status: "Available", project: "", client: "", ...siteData };
    setHoardings(list => [newSite, ...list]);
    setShowHoardingForm(false);
  }

  function updateHoarding(updated) {
    setHoardings(list => list.map(h => h.id === updated.id ? updated : h));
    setEditingHoarding(null);
  }

  function removeHoarding(id) {
    if (window.confirm("Are you sure you want to remove this billboard site from inventory?")) {
      setHoardings(list => list.filter(h => h.id !== id));
    }
  }

  function bookHoarding(hoarding, { mode, projectId, client, projectName, startDate, endDate, rent }) {
    let targetProjectId = projectId;
    let targetClient = client;
    let targetProjectName = projectName;

    if (mode === "new") {
      const proj = {
        id: uid(), client, type: "OOH Advertising", name: projectName,
        description: `OOH hoarding campaign — ${projectName}`, startDate, endDate, status: "Ongoing",
      };
      setProjects(list => [proj, ...list]);
      targetProjectId = proj.id;
    } else {
      const proj = projects.find(p => p.id === projectId);
      targetClient = proj ? proj.client : client;
      targetProjectName = proj ? proj.name : projectName;
    }

    setHoardings(list => list.map(h => h.id === hoarding.id
      ? { ...h, status: "Booked", client: targetClient, project: targetProjectName, projectId: targetProjectId, bookedFrom: startDate, bookedTo: endDate }
      : h));

    const inv = {
      id: uid(), client: targetClient,
      description: `OOH Advertising — ${targetProjectName}: ${hoarding.name} rental`,
      amount: rent, issueDate: startDate, dueDate: endDate, paid: false, paidVia: null, projectId: targetProjectId,
    };
    setInvoices(list => [inv, ...list]);
    postEntry(startDate, `OOH Rental - ${hoarding.name} (${targetClient})`, [
      { account: "ar", debit: rent, credit: 0 },
      { account: "revenue", debit: 0, credit: rent },
    ], "INV-" + inv.id.toUpperCase());

    setBookingHoarding(null);
    setSitePickerProject(null);
  }

  function releaseHoarding(hoarding) {
    setHoardings(list => list.map(h => h.id === hoarding.id
      ? { ...h, status: "Available", client: "", project: "", projectId: null, bookedFrom: null, bookedTo: null }
      : h));
  }

  function createProject({ client, type, name, description, startDate, endDate }) {
    const proj = { id: uid(), client, type, name, description, startDate, endDate, status: "Planning" };
    setProjects(list => [proj, ...list]);
    setShowProjectForm(false);
    setSelectedProjectId(proj.id);
    return proj;
  }

  function updateProject(updated) {
    setProjects(list => list.map(p => p.id === updated.id ? updated : p));
    setEditingProject(null);
  }

  function updateProjectStatus(projectId, status) {
    setProjects(list => list.map(p => p.id === projectId ? { ...p, status } : p));
  }

  function addProjectBilling(project, { description, amount, issueDate, dueDate }) {
    const inv = {
      id: uid(), client: project.client,
      description: `${project.type} — ${project.name}${description ? ": " + description : ""}`,
      amount, issueDate, dueDate, paid: false, paidVia: null, projectId: project.id,
    };
    setInvoices(list => [inv, ...list]);
    postEntry(issueDate, `Invoice - ${project.client} (${project.type} — ${project.name})`, [
      { account: "ar", debit: amount, credit: 0 },
      { account: "revenue", debit: 0, credit: amount },
    ], "INV-" + inv.id.toUpperCase());
    setBillingModalProject(null);
  }

  function addProjectCost(project, { vendor, description, amount, date, paidVia }) {
    const exp = {
      id: uid(), vendor, description, category: project.type, amount, date, paidVia, projectId: project.id,
    };
    setExpenses(list => [exp, ...list]);
    postEntry(date, `${vendor} (${project.type} — ${project.name})`, [
      { account: "expense", debit: amount, credit: 0, memo: project.type },
      { account: paidVia === "Cash" ? "cash" : "bank", debit: 0, credit: amount },
    ], "EXP-" + exp.id.toUpperCase());
    setCostModalProject(null);
  }

  function addEmployee({ name, department, designation, email, phone, joinDate, salary, cnic, bankAccount }) {
    const emp = {
      id: uid(), code: empCode(employees.length + 1), name, department, designation, email, phone,
      joinDate, status: "Active", salary: Number(salary), cnic, bankAccount, leaveBalance: 20,
    };
    setEmployees(list => [emp, ...list]);
    setAttendanceToday(a => ({ ...a, [emp.id]: "Present" }));
    setShowEmployeeForm(false);
  }

  function updateEmployee(updated) {
    setEmployees(list => list.map(e => e.id === updated.id ? updated : e));
    setEditingEmployee(null);
  }

  function setEmployeeStatus(emp, status) {
    setEmployees(list => list.map(e => e.id === emp.id ? { ...e, status } : e));
    if (status === "Terminated") setAttendanceToday(a => ({ ...a, [emp.id]: "N/A" }));
  }

  function markAttendance(empId, value) {
    setAttendanceToday(a => ({ ...a, [empId]: value }));
  }

  function applyLeave({ employeeId, type, fromDate, toDate, reason }) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const days = Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1);
    const req = {
      id: uid(), employeeId, employeeName: emp.name, type, fromDate, toDate, days, reason,
      status: "Pending", appliedOn: TODAY.toISOString().slice(0, 10),
    };
    setLeaveRequests(list => [req, ...list]);
    setShowLeaveForm(false);
  }

  function decideLeaveRequest(req, decision) {
    setLeaveRequests(list => list.map(l => l.id === req.id ? { ...l, status: decision } : l));
    if (decision === "Approved") {
      if (req.type !== "Unpaid") {
        setEmployees(list => list.map(e => e.id === req.employeeId
          ? { ...e, leaveBalance: Math.max(0, e.leaveBalance - req.days) }
          : e));
      }
      const coversToday = req.fromDate <= "2026-07-21" && req.toDate >= "2026-07-21";
      if (coversToday) {
        setEmployees(list => list.map(e => e.id === req.employeeId ? { ...e, status: "On Leave" } : e));
        setAttendanceToday(a => ({ ...a, [req.employeeId]: "Leave" }));
      }
    }
  }

  function runPayroll() {
    const month = TODAY.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const runDate = TODAY.toISOString().slice(0, 10);
    const unpaidDaysByEmp = {};
    leaveRequests.forEach(l => {
      if (l.status === "Approved" && l.type === "Unpaid") {
        unpaidDaysByEmp[l.employeeId] = (unpaidDaysByEmp[l.employeeId] || 0) + l.days;
      }
    });
    const active = employees.filter(e => e.status !== "Terminated");
    const entries = active.map(e => {
      const unpaidDays = unpaidDaysByEmp[e.id] || 0;
      const deduction = Math.round((e.salary / 30) * unpaidDays);
      return { employeeId: e.id, name: e.name, department: e.department, gross: e.salary, deduction, net: e.salary - deduction };
    });
    const totalGross = entries.reduce((s, e) => s + e.gross, 0);
    const totalDeductions = entries.reduce((s, e) => s + e.deduction, 0);
    const totalNet = entries.reduce((s, e) => s + e.net, 0);
    const run = { id: uid(), month, runDate, employeeCount: entries.length, totalGross, totalDeductions, totalNet, entries };
    setPayrollRuns(list => [run, ...list]);

    const exp = { id: uid(), vendor: `Payroll — ${month}`, category: "Payroll", description: `Salaries for ${entries.length} employees`, amount: totalNet, date: runDate, paidVia: "Bank" };
    setExpenses(list => [exp, ...list]);
    postEntry(runDate, `Payroll — ${month} (${entries.length} employees)`, [
      { account: "expense", debit: totalNet, credit: 0, memo: "Payroll" },
      { account: "bank", debit: 0, credit: totalNet },
    ], "PR-" + exp.id.toUpperCase());
    setPayrollConfirm(false);
  }

  async function handleFileUpload(file) {
    const docId = uid();
    setDocuments(d => [{ id: docId, fileName: file.name, status: "processing" }, ...d]);
    try {
      await new Promise(r => setTimeout(r, 1200));
      const filenameLower = file.name.toLowerCase();
      let extractedData = {
        documentType: filenameLower.includes("quote") ? "Quotation" : "Invoice",
        party: filenameLower.includes("meta") ? "Meta Platforms Inc" : (filenameLower.includes("dawn") ? "Pakistan Herald Publications" : "Vendor / Client Partner"),
        amount: Math.floor(Math.random() * 250000) + 45000,
        date: TODAY.toISOString().slice(0, 10),
        description: "Media Production & Placement Billing",
      };
      setDocuments(d => d.map(doc => doc.id === docId
        ? { ...doc, status: "extracted", extracted: extractedData, direction: "received" }
        : doc));
    } catch (err) {
      setDocuments(d => d.map(doc => doc.id === docId ? { ...doc, status: "error" } : doc));
    }
  }

  function updateDocField(docId, field, value) {
    setDocuments(d => d.map(doc => doc.id === docId ? { ...doc, extracted: { ...doc.extracted, [field]: value } } : doc));
  }
  function setDocDirection(docId, direction) {
    setDocuments(d => d.map(doc => doc.id === docId ? { ...doc, direction } : doc));
  }

  function postDocumentToLedger(doc) {
    const { extracted, direction } = doc;
    const amount = Number(extracted.amount) || 0;
    if (direction === "received") {
      const exp = { id: uid(), vendor: extracted.party, category: "Uploaded Document", amount, date: extracted.date, paidVia: "Bank" };
      setExpenses(list => [exp, ...list]);
      postEntry(extracted.date, `${extracted.party} (${extracted.description})`, [
        { account: "expense", debit: amount, credit: 0, memo: "Uploaded Document" },
        { account: "bank", debit: 0, credit: amount },
      ], "DOC-" + doc.id.toUpperCase());
    } else if (extracted.documentType === "Quotation") {
      // quotations saved for reference
    } else {
      createVoucher("SV", { date: extracted.date, party: extracted.party, description: extracted.description, amount });
    }
    setDocuments(d => d.map(x => x.id === doc.id ? { ...x, status: "posted" } : x));
  }

  /* Build Navigation items filtered by currentUser permissions */
  const ALL_NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "projects", label: "Projects", icon: Briefcase },
    { key: "invoices", label: "Invoices", icon: FileText },
    { key: "expenses", label: "Expenses", icon: Receipt },
    { key: "ooh", label: "OOH Advertising", icon: Building2 },
    { key: "hr", label: "HR & Payroll", icon: Users },
    { key: "vouchers", label: "Vouchers", icon: ClipboardList },
    { key: "documents", label: "Documents", icon: UploadCloud },
    { key: "ledger", label: "Ledger", icon: BookOpenText },
    { key: "reports", label: "Reports", icon: BarChart3 },
  ];

  const NAV = useMemo(() => {
    if (!currentUser) return [];
    let items = ALL_NAV_ITEMS.filter(n => currentUser.allowedTabs.includes(n.key));
    if (currentUser.role === "Admin") {
      items.push({ key: "settings", label: "Admin Settings", icon: Settings });
    }
    return items;
  }, [currentUser]);

  /* UNAUTHENTICATED GATEWAY SCREEN */
  if (!currentUser) {
    return (
      <WelcomeGateway
        usersList={usersList}
        onLogin={handleLogin}
        onOpenForgot={() => setShowForgotPassword(true)}
      >
        {showForgotPassword && (
          <ForgotPasswordModal
            usersList={usersList}
            onClose={() => setShowForgotPassword(false)}
            onResetPassword={handleResetPassword}
          />
        )}
      </WelcomeGateway>
    );
  }

  return (
    <div className="erp-root">
      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <img src="./logo.png" alt="AdPulse Logo" className="brand-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
          <div>
            <div className="brand-name">AdPulse ERP</div>
            <div className="brand-sub">IMC PVT LTD</div>
          </div>
        </div>
        {NAV.map(n => (
          <button key={n.key} className={"nav-item" + (tab === n.key ? " active" : "")} onClick={() => { setTab(n.key); setMobileNavOpen(false); }}>
            <n.icon size={17} /> {n.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "14px 10px", borderTop: "1px solid var(--rule)", fontSize: 12, color: "var(--ink-muted)" }}>
          AdPulse IMC &middot; {hrStats.active} Staff Active
        </div>
      </aside>

      <main className="main">
        {/* TOPBAR WITH USER PROFILE BADGE & ACTIONS */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="mobile-toggle" onClick={() => setMobileNavOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <h1>{ALL_MODULE_TABS.find(t => t.key === tab)?.label || (tab === "settings" ? "Admin Settings" : "AdPulse ERP")}</h1>
              <p>AdPulse IMC PVT LTD &middot; System Date: {fmtDate(TODAY)}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* User Profile Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F1F5F9", padding: "6px 12px", borderRadius: 10, border: "1px solid #CBD5E1" }}>
              <div style={{ background: currentUser.role === "Admin" ? "#B8860B" : "#0284C7", color: "#FFFFFF", width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyCenter: "center", fontWeight: 700, fontSize: 13 }}>
                {currentUser.name.charAt(0)}
              </div>
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{currentUser.role} &middot; {currentUser.department}</div>
              </div>
            </div>

            <button className="btn" style={{ padding: "7px 11px", fontSize: 13 }} onClick={() => setShowChangePassword(true)} title="Change Password">
              <Lock size={14} /> Password
            </button>

            <button className="btn" style={{ padding: "7px 11px", fontSize: 13, color: "var(--rose)", borderColor: "#FCA5A5" }} onClick={handleLogout} title="Sign Out">
              <LogOut size={14} /> Exit
            </button>
          </div>
        </div>

        <div className="content">
          {tab === "dashboard" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-title" style={{ margin: 0 }}>Agency Quick Actions</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={() => setShowExpenseForm(true)}><Plus size={14} /> Expense</button>
                  <button className="btn" onClick={() => setShowInvoiceForm(true)}><Plus size={14} /> Invoice</button>
                  <button className="btn btn-primary" onClick={() => setShowProjectForm(true)}><Plus size={14} /> Project</button>
                </div>
              </div>

              <div className="grid-kpi">
                <KpiCard label="Cash + Bank" value={pkr(cashBalance)} sub="Available Liquidity" icon={Wallet} accent="var(--jade)" />
                <KpiCard label="Accounts Receivable" value={pkr(arBalance)} sub={`${pkr(overdueTotal)} overdue`} icon={Landmark} accent="var(--amber)" />
                <KpiCard label="Revenue (Period)" value={pkr(revenueBalance)} sub="Posted Invoices & Billings" icon={TrendingUp} accent="var(--jade)" />
                <KpiCard label="Net Profit (Period)" value={pkr(netProfit)} sub={`Operating Costs ${pkr(expenseBalance)}`} icon={netProfit >= 0 ? TrendingUp : TrendingDown} accent={netProfit >= 0 ? "var(--jade)" : "var(--rose)"} />
              </div>

              <div className="card" style={{ padding: 18, marginBottom: 18 }}>
                <div className="section-title"><TrendingUp size={16} color="var(--gold)" /> Cash &amp; Liquidity Position Trend</div>
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={cashSeries}>
                    <defs>
                      <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => (v / 1000) + "k"} />
                    <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={v => pkr(v)} />
                    <Area type="monotone" dataKey="balance" stroke="#059669" strokeWidth={2.5} fill="url(#cashFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: 18 }}>
                <div className="section-title"><ScrollText size={16} color="var(--gold)" /> Recent Double-Entry Ledger Postings</div>
                <LedgerStrip rows={recentEntries} showAccounts />
              </div>
            </>
          )}

          {tab === "projects" && (
            <>
              <div className="grid-kpi">
                <KpiCard label="Active Projects" value={projectsWithStats.filter(p => p.status !== "Completed").length} sub={`${projects.length} total across agency`} icon={Briefcase} accent="var(--gold)" />
                <KpiCard label="Total Billed" value={pkr(projectsWithStats.reduce((s, p) => s + p.billed, 0))} sub="Total Client Invoices" icon={FileText} accent="var(--jade)" />
                <KpiCard label="Total Production Cost" value={pkr(projectsWithStats.reduce((s, p) => s + p.cost, 0))} sub="Vendor Outlays" icon={Coins} accent="var(--rose)" />
                <KpiCard label="Agency Net Margin" value={pkr(projectsWithStats.reduce((s, p) => s + p.margin, 0))} sub="Billed Less Costs" icon={TrendingUp} accent="var(--jade)" />
              </div>

              <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div className="field" style={{ margin: 0, flex: 1, minWidth: 140 }}>
                  <label>Service Line</label>
                  <select value={projectFilters.type} onChange={e => setProjectFilters(f => ({ ...f, type: e.target.value }))}>
                    <option>All</option>
                    {PROJECT_TYPES.map(t => <option key={t.key}>{t.key}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0, flex: 1, minWidth: 120 }}>
                  <label>Status</label>
                  <select value={projectFilters.status} onChange={e => setProjectFilters(f => ({ ...f, status: e.target.value }))}>
                    <option>All</option>
                    {PROJECT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0, flex: 2, minWidth: 180 }}>
                  <label>Search Client / Project</label>
                  <input value={projectFilters.client} onChange={e => setProjectFilters(f => ({ ...f, client: e.target.value }))} placeholder="Search name or client…" />
                </div>
                <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setShowProjectForm(true)}><Plus size={14} /> New Project</button>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Project</th><th>Client</th><th>Service Line</th><th>Timeline</th><th>Status</th>
                        <th style={{ textAlign: "right" }}>Billed</th><th style={{ textAlign: "right" }}>Cost</th>
                        <th style={{ textAlign: "right" }}>Margin</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectsWithStats
                        .filter(p => projectFilters.type === "All" || p.type === projectFilters.type)
                        .filter(p => projectFilters.status === "All" || p.status === projectFilters.status)
                        .filter(p => !projectFilters.client || p.client.toLowerCase().includes(projectFilters.client.toLowerCase()) || p.name.toLowerCase().includes(projectFilters.client.toLowerCase()))
                        .map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.name}</td>
                            <td style={{ color: "var(--ink-muted)" }}>{p.client}</td>
                            <td><ProjectTypeBadge type={p.type} /></td>
                            <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(p.startDate)} – {fmtDate(p.endDate)}</td>
                            <td><ProjectStatusBadge status={p.status} /></td>
                            <td className="mono" style={{ textAlign: "right" }}>{pkr(p.billed)}</td>
                            <td className="mono" style={{ textAlign: "right", color: "var(--rose)" }}>{pkr(p.cost)}</td>
                            <td className="mono" style={{ textAlign: "right", fontWeight: 600, color: p.margin >= 0 ? "var(--jade)" : "var(--rose)" }}>{pkr(p.margin)}</td>
                            <td style={{ display: "flex", gap: 5 }}>
                              <button className="btn" style={{ padding: "4px 8px", fontSize: 12.5 }} onClick={() => setSelectedProjectId(p.id)}>
                                Manage <ChevronRight size={12} />
                              </button>
                              <button className="btn" style={{ padding: "4px 6px", fontSize: 12.5 }} onClick={() => setProjectStatementId(p.id)} title="Print Statement">
                                <Printer size={13} />
                              </button>
                              <button className="btn" style={{ padding: "4px 6px", fontSize: 12.5 }} onClick={() => setEditingProject(p)} title="Edit Project">
                                <Edit size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {projectsWithStats.length === 0 && (
                        <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 24 }}>No projects found matching criteria.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "invoices" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-title" style={{ margin: 0 }}>Client Invoices</div>
                <button className="btn btn-primary" onClick={() => setShowInvoiceForm(true)}><Plus size={14} /> New Invoice</button>
              </div>

              <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div className="field" style={{ margin: 0, flex: 1, minWidth: 200 }}>
                  <label>Select Client to Print Statement</label>
                  <select value="" onChange={e => {
                    if (e.target.value) setClientStatementClient(e.target.value);
                  }}>
                    <option value="" disabled>-- Select Client --</option>
                    {[...new Set(invoices.map(i => i.client))].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Client Name</th><th>Description</th><th>Service Project</th><th>Issue Date</th><th>Due Date</th>
                        <th style={{ textAlign: "right" }}>Amount</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicesWithStatus.map(inv => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 600 }}>{inv.client}</td>
                          <td style={{ color: "var(--ink-muted)" }}>{inv.description}</td>
                          <td>{inv.projectId ? <ProjectTypeBadge type={projects.find(p => p.id === inv.projectId)?.type} /> : <span style={{ color: "var(--ink-muted)" }}>—</span>}</td>
                          <td className="mono">{fmtDate(inv.issueDate)}</td>
                          <td className="mono">{fmtDate(inv.dueDate)}</td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{pkr(inv.amount)}</td>
                          <td><StatusBadge status={inv.status} /></td>
                          <td style={{ display: "flex", gap: 4 }}>
                            {!inv.paid && (
                              <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => markPaid(inv, "Bank")}>
                                Mark Paid
                              </button>
                            )}
                            <button className="btn" style={{ padding: "4px 6px", fontSize: 12 }} onClick={() => setEditingInvoice(inv)}>
                              <Edit size={13} />
                            </button>
                            <button className="btn" style={{ padding: "4px 7px", fontSize: 12 }}
                              onClick={() => setPrintDoc({ voucherNo: "INV-" + inv.id.toUpperCase(), type: "Invoice", date: inv.issueDate, party: inv.client, description: inv.description, amount: inv.amount })}>
                              <Printer size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "expenses" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-title" style={{ margin: 0 }}>Operating Expenses</div>
                <button className="btn btn-primary" onClick={() => setShowExpenseForm(true)}><Plus size={14} /> New Expense</button>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Vendor / Payee</th><th>Category</th><th>Associated Project</th><th>Date</th><th>Paid Via</th>
                        <th style={{ textAlign: "right" }}>Amount</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(exp => (
                        <tr key={exp.id}>
                          <td style={{ fontWeight: 600 }}>{exp.vendor}</td>
                          <td><span className="badge-mini">{exp.category}</span></td>
                          <td>{exp.projectId ? (projects.find(p => p.id === exp.projectId)?.name || "—") : <span style={{ color: "var(--ink-muted)" }}>—</span>}</td>
                          <td className="mono">{fmtDate(exp.date)}</td>
                          <td>{exp.paidVia}</td>
                          <td className="mono" style={{ textAlign: "right", color: "var(--rose)", fontWeight: 600 }}>{pkr(exp.amount)}</td>
                          <td>
                            <button className="btn" style={{ padding: "4px 6px", fontSize: 12 }} onClick={() => setEditingExpense(exp)}>
                              <Edit size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "ooh" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-title" style={{ margin: 0 }}>Outdoor Billboard Inventory</div>
                <button className="btn btn-primary" onClick={() => setShowHoardingForm(true)}><Plus size={14} /> Add New Site</button>
              </div>

              <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div className="field" style={{ margin: 0, flex: 1, minWidth: 120 }}>
                  <label>Area</label>
                  <select value={oohFilters.area} onChange={e => setOohFilters(f => ({ ...f, area: e.target.value }))}>
                    <option>All</option>
                    {[...new Set(hoardings.map(h => h.area))].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0, flex: 1, minWidth: 110 }}>
                  <label>Size</label>
                  <select value={oohFilters.size} onChange={e => setOohFilters(f => ({ ...f, size: e.target.value }))}>
                    <option>All</option>
                    {[...new Set(hoardings.map(h => h.size))].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0, flex: 1, minWidth: 120 }}>
                  <label>Availability</label>
                  <select value={oohFilters.status} onChange={e => setOohFilters(f => ({ ...f, status: e.target.value }))}>
                    <option>All</option><option>Available</option><option>Booked</option><option>Maintenance</option>
                  </select>
                </div>
                <div className="field" style={{ margin: 0, flex: 1, minWidth: 130 }}>
                  <label>Max Monthly Rent</label>
                  <input type="number" placeholder="No Limit" value={oohFilters.maxPrice} onChange={e => setOohFilters(f => ({ ...f, maxPrice: e.target.value }))} />
                </div>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Site Identifier</th><th>Area</th><th>Size</th><th style={{ textAlign: "right" }}>Monthly Rate</th>
                        <th>Status</th><th>Assigned Client / Campaign</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hoardings
                        .filter(h => oohFilters.area === "All" || h.area === oohFilters.area)
                        .filter(h => oohFilters.size === "All" || h.size === oohFilters.size)
                        .filter(h => oohFilters.status === "All" || h.status === oohFilters.status)
                        .filter(h => !oohFilters.maxPrice || h.pricePerMonth <= Number(oohFilters.maxPrice))
                        .map(h => (
                          <tr key={h.id}>
                            <td style={{ fontWeight: 600 }}>{h.name}</td>
                            <td><span className="badge-mini"><MapPin size={10} style={{ verticalAlign: -1 }} /> {h.area}</span></td>
                            <td><span className="badge-mini"><Ruler size={10} style={{ verticalAlign: -1 }} /> {h.size}</span></td>
                            <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{pkr(h.pricePerMonth)}</td>
                            <td><StatusBadge status={h.status === "Available" ? "Paid" : h.status === "Booked" ? "Unpaid" : "Overdue"} />
                              <span style={{ marginLeft: 5, fontSize: 12, color: "var(--ink-muted)" }}>{h.status}</span>
                            </td>
                            <td>
                              {h.client
                                ? <button className="btn" style={{ padding: "3px 8px", fontSize: 12, background: "transparent" }}
                                    onClick={() => h.projectId && setSelectedProjectId(h.projectId)}>
                                    {h.client} — {h.project} {h.projectId && <ChevronRight size={11} />}
                                  </button>
                                : <span style={{ color: "var(--ink-muted)" }}>—</span>}
                            </td>
                            <td style={{ display: "flex", gap: 4 }}>
                              {h.status === "Available"
                                ? <button className="btn btn-primary" style={{ padding: "4px 9px", fontSize: 12 }} onClick={() => setBookingHoarding(h)}>Book</button>
                                : h.status === "Booked"
                                  ? <button className="btn" style={{ padding: "4px 7px", fontSize: 12 }} onClick={() => releaseHoarding(h)}>Release</button>
                                  : null}
                              <button className="btn" style={{ padding: "4px 6px", fontSize: 12 }} onClick={() => setEditingHoarding(h)} title="Edit Site">
                                <Edit size={13} />
                              </button>
                              <button className="btn" style={{ padding: "4px 6px", fontSize: 12, color: "var(--rose)" }} onClick={() => removeHoarding(h.id)} title="Remove Site">
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "hr" && (
            <>
              <div className="grid-kpi">
                <KpiCard label="Total Staff" value={hrStats.total} sub={`${hrStats.active} active staff`} icon={Users} accent="var(--gold)" />
                <KpiCard label="On Leave" value={hrStats.onLeave} sub={`${hrStats.pendingLeaves} pending approvals`} icon={CalendarX} accent="var(--amber)" />
                <KpiCard label="Present Today" value={hrStats.presentToday} sub={`${hrStats.absentToday} absent, ${hrStats.leaveToday} leave`} icon={UserCheck} accent="var(--jade)" />
                <KpiCard label="Monthly Salary Cost" value={pkr(hrStats.monthlyPayrollCost)} sub="Gross Active Staff Payroll" icon={Wallet} accent="var(--jade)" />
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { key: "directory", label: "Directory", icon: Contact },
                    { key: "attendance", label: "Attendance", icon: CalendarCheck },
                    { key: "leaves", label: "Leave Requests", icon: CalendarX },
                    { key: "payroll", label: "Payroll Runs", icon: Banknote },
                  ].map(v => (
                    <button key={v.key} className="btn" style={{
                      fontSize: 13, padding: "7px 14px",
                      background: hrView === v.key ? "#B8860B" : "#FFFFFF",
                      color: hrView === v.key ? "#FFFFFF" : "#0F172A",
                      borderColor: hrView === v.key ? "#B8860B" : "#CBD5E1",
                    }} onClick={() => setHrView(v.key)}>
                      <v.icon size={14} /> {v.label}
                    </button>
                  ))}
                </div>

                <div>
                  {hrView === "leaves" && <button className="btn" onClick={() => setShowLeaveForm(true)}><Plus size={14} /> Apply Leave</button>}
                  {hrView === "directory" && <button className="btn btn-primary" onClick={() => setShowEmployeeForm(true)}><UserPlus size={14} /> New Employee</button>}
                  {hrView === "payroll" && <button className="btn btn-primary" onClick={() => setPayrollConfirm(true)}><Banknote size={14} /> Run Monthly Payroll</button>}
                </div>
              </div>

              {hrView === "directory" && (
                <div className="card">
                  <div className="table-responsive">
                    <table>
                      <thead><tr>
                        <th>Emp Code</th><th>Employee Name</th><th>Department</th><th>Designation</th>
                        <th style={{ textAlign: "right" }}>Monthly Salary</th><th>Status</th><th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {employees.map(e => (
                          <tr key={e.id}>
                            <td className="mono" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>{e.code}</td>
                            <td style={{ fontWeight: 600, cursor: "pointer" }} onClick={() => setEmployeeDetail(e)}>{e.name}</td>
                            <td><DepartmentBadge department={e.department} /></td>
                            <td style={{ color: "var(--ink-muted)" }}>{e.designation}</td>
                            <td className="mono" style={{ textAlign: "right" }}>{pkr(e.salary)}</td>
                            <td><EmployeeStatusBadge status={e.status} /></td>
                            <td style={{ display: "flex", gap: 4 }}>
                              <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setEmployeeDetail(e)}>Profile</button>
                              <button className="btn" style={{ padding: "4px 6px", fontSize: 12 }} onClick={() => setEditingEmployee(e)}>
                                <Edit size={13} />
                              </button>
                              {e.status !== "Terminated" && (
                                <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setEmployeeStatus(e, "Terminated")}>Terminate</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {hrView === "attendance" && (
                <div className="card">
                  <div className="table-responsive">
                    <table>
                      <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Today Status</th><th>Quick Toggle</th></tr></thead>
                      <tbody>
                        {employees.filter(e => e.status !== "Terminated").map(e => (
                          <tr key={e.id}>
                            <td className="mono" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>{e.code}</td>
                            <td style={{ fontWeight: 600 }}>{e.name}</td>
                            <td><DepartmentBadge department={e.department} /></td>
                            <td>
                              <span className="badge-mini" style={{
                                color: attendanceToday[e.id] === "Present" ? "var(--jade)" : attendanceToday[e.id] === "Absent" ? "var(--rose)" : "var(--amber)",
                                background: "transparent", fontWeight: 700
                              }}>{attendanceToday[e.id]}</span>
                            </td>
                            <td style={{ display: "flex", gap: 6 }}>
                              <button className="btn" style={{ padding: "4px 9px", fontSize: 12 }} onClick={() => markAttendance(e.id, "Present")}>Present</button>
                              <button className="btn" style={{ padding: "4px 9px", fontSize: 12 }} onClick={() => markAttendance(e.id, "Absent")}>Absent</button>
                              <button className="btn" style={{ padding: "4px 9px", fontSize: 12 }} onClick={() => markAttendance(e.id, "Leave")}>Leave</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {hrView === "leaves" && (
                <div className="card">
                  <div className="table-responsive">
                    <table>
                      <thead><tr>
                        <th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th>
                        <th>Reason</th><th>Status</th><th>Actions</th>
                      </tr></thead>
                      <tbody>
                        {leaveRequests.map(l => (
                          <tr key={l.id}>
                            <td style={{ fontWeight: 600 }}>{l.employeeName}</td>
                            <td>{l.type}</td>
                            <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(l.fromDate)}</td>
                            <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(l.toDate)}</td>
                            <td className="mono">{l.days}</td>
                            <td style={{ color: "var(--ink-muted)" }}>{l.reason}</td>
                            <td><LeaveStatusBadge status={l.status} /></td>
                            <td style={{ display: "flex", gap: 6 }}>
                              {l.status === "Pending" && (
                                <>
                                  <button className="btn btn-primary" style={{ padding: "4px 9px", fontSize: 12 }} onClick={() => decideLeaveRequest(l, "Approved")}>Approve</button>
                                  <button className="btn" style={{ padding: "4px 9px", fontSize: 12 }} onClick={() => decideLeaveRequest(l, "Rejected")}>Reject</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {hrView === "payroll" && (
                <>
                  <div className="card" style={{ marginBottom: 18 }}>
                    <div className="table-responsive">
                      <table>
                        <thead><tr>
                          <th>Month</th><th>Run Date</th><th>Employees</th>
                          <th style={{ textAlign: "right" }}>Gross Total</th><th style={{ textAlign: "right" }}>Deductions</th><th style={{ textAlign: "right" }}>Net Disbursed</th>
                        </tr></thead>
                        <tbody>
                          {payrollRuns.map(r => (
                            <tr key={r.id}>
                              <td style={{ fontWeight: 600 }}>{r.month}</td>
                              <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(r.runDate)}</td>
                              <td className="mono">{r.employeeCount}</td>
                              <td className="mono" style={{ textAlign: "right" }}>{pkr(r.totalGross)}</td>
                              <td className="mono" style={{ textAlign: "right", color: r.totalDeductions ? "var(--rose)" : "var(--ink-muted)" }}>{pkr(r.totalDeductions)}</td>
                              <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--jade)" }}>{pkr(r.totalNet)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

        {tab === "vouchers" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="section-title" style={{ margin: 0 }}>Voucher Engine</div>
              <button className="btn btn-primary" onClick={() => { setVoucherDefaultType("JV"); setShowVoucherForm(true); }}><Plus size={14} /> New Voucher</button>
            </div>

            <div className="card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Voucher #</th><th>Voucher Type</th><th>Date</th><th>Party / Payee</th><th>Description</th>
                      <th style={{ textAlign: "right" }}>Amount</th><th>Print</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map(v => (
                      <tr key={v.id}>
                        <td className="mono" style={{ fontWeight: 700, color: "var(--gold)" }}>{v.voucherNo}</td>
                        <td><span className="badge-mini">{VOUCHER_TYPES[v.type]}</span></td>
                        <td className="mono">{fmtDate(v.date)}</td>
                        <td>{v.party || "—"}</td>
                        <td style={{ color: "var(--ink-muted)" }}>{v.description}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{pkr(v.amount)}</td>
                        <td>
                          <button className="btn" style={{ padding: "4px 7px", fontSize: 12 }} onClick={() => setPrintDoc(v)}>
                            <Printer size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "documents" && (
          <>
            <div className="card" style={{ padding: 24, marginBottom: 18, textAlign: "center", border: "2px dashed var(--rule)" }}>
              <UploadCloud size={32} color="var(--gold)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Upload Invoice, Quotation, or Receipt</div>
              <div style={{ fontSize: 13, marginBottom: 14, color: "var(--ink-muted)" }}>
                Upload an image or PDF. The extraction parser automatically drafts ledger entries for confirmation.
              </div>
              <label className="btn btn-primary" style={{ display: "inline-flex", cursor: "pointer" }}>
                <Plus size={14} /> Upload File
                <input type="file" accept="image/*,.pdf" style={{ display: "none" }}
                  onChange={e => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = ""; }} />
              </label>
            </div>

            {documents.map(doc => (
              <div className="card" key={doc.id} style={{ padding: 18, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", gap: 8 }}>
                    <FileCheck2 size={16} color="var(--gold)" /> {doc.fileName}
                  </div>
                  {doc.status === "processing" && <span style={{ fontSize: 13, color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={14} className="spin" /> Reading document…</span>}
                  {doc.status === "error" && <span style={{ fontSize: 13, color: "var(--rose)" }}>Error reading document — try another photo.</span>}
                  {doc.status === "posted" && <StatusBadge status="Paid" />}
                </div>

                {doc.extracted && doc.status !== "posted" && (
                  <>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                      <button className={"btn" + (doc.direction === "received" ? " btn-primary" : "")} style={{ fontSize: 12.5, padding: "6px 12px" }}
                        onClick={() => setDocDirection(doc.id, "received")}>Vendor Bill</button>
                      <button className={"btn" + (doc.direction === "issued" ? " btn-primary" : "")} style={{ fontSize: 12.5, padding: "6px 12px" }}
                        onClick={() => setDocDirection(doc.id, "issued")}>Client Invoice / Quote</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div className="field" style={{ margin: 0 }}><label>Party Name</label>
                        <input value={doc.extracted.party || ""} onChange={e => updateDocField(doc.id, "party", e.target.value)} /></div>
                      <div className="field" style={{ margin: 0 }}><label>Amount (PKR)</label>
                        <input type="number" value={doc.extracted.amount || ""} onChange={e => updateDocField(doc.id, "amount", e.target.value)} /></div>
                      <div className="field" style={{ margin: 0 }}><label>Date</label>
                        <input type="date" value={doc.extracted.date || ""} onChange={e => updateDocField(doc.id, "date", e.target.value)} /></div>
                      <div className="field" style={{ margin: 0 }}><label>Class</label>
                        <select value={doc.extracted.documentType || "Invoice"} onChange={e => updateDocField(doc.id, "documentType", e.target.value)}>
                          <option>Invoice</option><option>Quotation</option><option>Receipt</option><option>Other</option>
                        </select></div>
                      <div className="field" style={{ margin: 0, gridColumn: "1 / -1" }}><label>Particulars</label>
                        <input value={doc.extracted.description || ""} onChange={e => updateDocField(doc.id, "description", e.target.value)} /></div>
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => postDocumentToLedger(doc)}>
                      Confirm &amp; Post to General Ledger
                    </button>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {tab === "ledger" && (
          <>
            <div className="card" style={{ padding: 18, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div className="section-title" style={{ margin: 0 }}>
                <BookOpenText size={18} color="var(--gold)" /> Double-Entry Trial Balance Verification
              </div>
              <div className="mono" style={{ fontSize: 14 }}>
                Debits {pkr(totalDebit)} &nbsp;=&nbsp; Credits {pkr(totalCredit)} &nbsp;&mdash;&nbsp;
                <span className={isBalanced ? "trial-ok" : "trial-bad"} style={{ fontWeight: 700 }}>
                  {isBalanced ? "✓ Balanced" : "Out of Balance"}
                </span>
              </div>
            </div>

            {journal.map(e => (
              <div className="card" key={e.id} style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{e.description}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-muted)" }} className="mono">{e.reference} &middot; {fmtDate(e.date)}</div>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead><tr><th>Account</th><th style={{ textAlign: "right" }}>Debit</th><th style={{ textAlign: "right" }}>Credit</th></tr></thead>
                    <tbody>
                      {e.lines.map((l, i) => (
                        <tr key={i}>
                          <td>{ACCOUNTS[l.account]?.name || l.account}{l.memo ? ` (${l.memo})` : ""}</td>
                          <td className="mono" style={{ textAlign: "right" }}>{l.debit ? pkr(l.debit) : "—"}</td>
                          <td className="mono" style={{ textAlign: "right" }}>{l.credit ? pkr(l.credit) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "reports" && (
          <>
            <div className="card" style={{ padding: 20, marginBottom: 18 }}>
              <div className="section-title"><BarChart3 size={18} color="var(--gold)" /> Statement of Profit &amp; Loss</div>
              <div className="table-responsive">
                <table>
                  <tbody>
                    <tr><td style={{ fontWeight: 600 }}>Service Revenue Billed</td><td className="mono" style={{ textAlign: "right", color: "var(--jade)", fontWeight: 700 }}>{pkr(revenueBalance)}</td></tr>
                    <tr><td style={{ fontWeight: 600 }}>Operating &amp; Payroll Expenses</td><td className="mono" style={{ textAlign: "right", color: "var(--rose)", fontWeight: 700 }}>({pkr(expenseBalance)})</td></tr>
                    <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                      <td style={{ fontWeight: 700, fontSize: 16 }}>Net Operating Profit</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, fontSize: 17, color: netProfit >= 0 ? "var(--jade)" : "var(--rose)" }}>{pkr(netProfit)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ padding: 20, marginBottom: 18 }}>
              <div className="section-title"><Receipt size={18} color="var(--gold)" /> Operating Expenses Breakdown</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={expenseByCategory}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" stroke="#64748B" fontSize={11.5} />
                  <YAxis stroke="#64748B" fontSize={12} tickFormatter={v => (v / 1000) + "k"} />
                  <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={v => pkr(v)} />
                  <Bar dataKey="amount" fill="#B8860B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* SETTINGS & ADMIN DASHBOARD MODULE */}
        {tab === "settings" && currentUser.role === "Admin" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div className="section-title" style={{ margin: 0 }}><Settings size={20} color="var(--gold)" /> Admin Settings &amp; Staff User Management</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-muted)", marginTop: 2 }}>Create staff user credentials and assign granular module permissions</div>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAddUserForm(true)}>
                <UserPlus size={15} /> Create Staff Login
              </button>
            </div>

            <div className="card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Full Name</th><th>Email / Username</th><th>Role</th><th>Department</th><th>Module Access</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <User size={16} color="var(--gold)" /> {u.name}
                          </div>
                        </td>
                        <td className="mono" style={{ fontSize: 13.5 }}>{u.email}</td>
                        <td>
                          <span className="badge-mini" style={{ background: u.role === "Admin" ? "#FEF3C7" : "#E0F2FE", color: u.role === "Admin" ? "#78350F" : "#0369A1", fontWeight: 700 }}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.department}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 300 }}>
                            {u.allowedTabs.map(t => (
                              <span key={t} style={{ fontSize: 11, background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, color: "#475569" }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="btn" style={{ padding: "4px 8px", fontSize: 12.5 }} onClick={() => setEditingUser(u)} title="Edit User">
                            <Edit size={13} /> Edit
                          </button>
                          {u.email !== "admin@adpulse.pk" && (
                            <button className="btn" style={{ padding: "4px 8px", fontSize: 12.5, color: "var(--rose)" }} onClick={() => handleDeleteUser(u.id)} title="Remove Account">
                              <Trash2 size={13} /> Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        </div>
      </main>

      {/* ALL SYSTEM MODALS */}
      {showForgotPassword && <ForgotPasswordModal usersList={usersList} onClose={() => setShowForgotPassword(false)} onResetPassword={handleResetPassword} />}
      {showChangePassword && <ChangePasswordModal currentUser={currentUser} onClose={() => setShowChangePassword(false)} onUpdatePassword={(newP) => handleResetPassword(currentUser.email, newP)} />}

      {showAddUserForm && <UserModal onClose={() => setShowAddUserForm(false)} onSubmit={handleAddUser} />}
      {editingUser && <UserModal initialData={editingUser} onClose={() => setEditingUser(null)} onSubmit={handleUpdateUser} />}

      {showInvoiceForm && <InvoiceModal onClose={() => setShowInvoiceForm(false)} onSubmit={addInvoice} />}
      {editingInvoice && <InvoiceModal initialData={editingInvoice} onClose={() => setEditingInvoice(null)} onSubmit={updateInvoice} />}

      {showExpenseForm && <ExpenseModal onClose={() => setShowExpenseForm(false)} onSubmit={addExpense} />}
      {editingExpense && <ExpenseModal initialData={editingExpense} onClose={() => setEditingExpense(null)} onSubmit={updateExpense} />}

      {showVoucherForm && <VoucherModal defaultType={voucherDefaultType} onClose={() => setShowVoucherForm(false)} onSubmit={createVoucher} />}
      
      {showHoardingForm && <HoardingModal onClose={() => setShowHoardingForm(false)} onSubmit={addHoarding} />}
      {editingHoarding && <HoardingModal initialData={editingHoarding} onClose={() => setEditingHoarding(null)} onSubmit={updateHoarding} />}

      {bookingHoarding && (
        <BookHoardingModal
          hoarding={bookingHoarding}
          projects={projects.filter(p => p.type === "OOH Advertising")}
          onClose={() => setBookingHoarding(null)}
          onSubmit={bookHoarding}
        />
      )}
      {sitePickerProject && (
        <AddSiteModal
          project={sitePickerProject}
          hoardings={hoardings.filter(h => h.status === "Available")}
          onClose={() => setSitePickerProject(null)}
          onSubmit={bookHoarding}
        />
      )}
      {printDoc && <PrintPreviewModal doc={printDoc} onClose={() => setPrintDoc(null)} />}
      {clientStatementClient && (
        <ClientStatementPrintModal
          clientName={clientStatementClient}
          invoices={invoices}
          projects={projects}
          onClose={() => setClientStatementClient(null)}
        />
      )}
      {projectStatementId && (
        <ProjectStatementPrintModal
          project={projects.find(p => p.id === projectStatementId)}
          invoices={invoices}
          expenses={expenses}
          onClose={() => setProjectStatementId(null)}
        />
      )}
      {showProjectForm && <ProjectModal onClose={() => setShowProjectForm(false)} onSubmit={createProject} />}
      {editingProject && <ProjectModal initialData={editingProject} onClose={() => setEditingProject(null)} onSubmit={updateProject} />}

      {billingModalProject && <ProjectBillingModal project={billingModalProject} onClose={() => setBillingModalProject(null)} onSubmit={addProjectBilling} />}
      {costModalProject && <ProjectCostModal project={costModalProject} onClose={() => setCostModalProject(null)} onSubmit={addProjectCost} />}
      {selectedProjectId && (() => {
        const project = projectsWithStats.find(p => p.id === selectedProjectId);
        if (!project) return null;
        return (
          <ProjectDetailModal
            project={project}
            invoices={invoices.filter(i => i.projectId === project.id)}
            expenses={expenses.filter(e => e.projectId === project.id)}
            sites={hoardings.filter(h => h.projectId === project.id)}
            onClose={() => setSelectedProjectId(null)}
            onStatusChange={status => updateProjectStatus(project.id, status)}
            onAddBilling={() => setBillingModalProject(project)}
            onAddCost={() => setCostModalProject(project)}
            onAddSite={() => setSitePickerProject(project)}
            onReleaseSite={releaseHoarding}
            onMarkPaid={inv => markPaid(inv, "Bank")}
            onPrint={doc => setPrintDoc(doc)}
            onPrintProject={() => setProjectStatementId(project.id)}
          />
        );
      })()}
      {showEmployeeForm && <EmployeeModal onClose={() => setShowEmployeeForm(false)} onSubmit={addEmployee} />}
      {editingEmployee && <EmployeeModal initialData={editingEmployee} onClose={() => setEditingEmployee(null)} onSubmit={updateEmployee} />}

      {showLeaveForm && <LeaveModal employees={employees.filter(e => e.status !== "Terminated")} onClose={() => setShowLeaveForm(false)} onSubmit={applyLeave} />}
      {employeeDetail && (
        <EmployeeDetailModal
          employee={employees.find(e => e.id === employeeDetail.id) || employeeDetail}
          leaveHistory={leaveRequests.filter(l => l.employeeId === employeeDetail.id)}
          onClose={() => setEmployeeDetail(null)}
          onStatusChange={status => setEmployeeStatus(employeeDetail, status)}
        />
      )}
      {payrollConfirm && (
        <PayrollConfirmModal
          activeCount={employees.filter(e => e.status !== "Terminated").length}
          totalCost={hrStats.monthlyPayrollCost}
          onClose={() => setPayrollConfirm(false)}
          onConfirm={runPayroll}
        />
      )}
    </div>
  );
}

/* ---------- WELCOME GATEWAY & AUTHENTICATION COMPONENTS ---------- */

function WelcomeGateway({ usersList, onLogin, onOpenForgot, children }) {
  const [activeTab, setActiveTab] = useState("admin"); // 'admin' | 'staff'
  const [email, setEmail] = useState("admin@adpulse.pk");
  const [password, setPassword] = useState("admin123");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPass, setShowPass] = useState(false);

  function switchTab(mode) {
    setActiveTab(mode);
    setErrorMsg("");
    if (mode === "admin") {
      setEmail("admin@adpulse.pk");
      setPassword("admin123");
    } else {
      setEmail("staff@adpulse.pk");
      setPassword("staff123");
    }
  }

  function submitLogin(e) {
    e.preventDefault();
    const found = usersList.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!found) {
      setErrorMsg("Invalid email or password. Please try again.");
      return;
    }
    if (activeTab === "admin" && found.role !== "Admin") {
      setErrorMsg("Access Denied. This account does not have Admin privileges.");
      return;
    }
    setErrorMsg("");
    onLogin(found);
  }

  return (
    <div className="gateway-backdrop">
      <div className="gateway-card">
        <img src="./logo.png" alt="AdPulse Logo" className="gateway-logo" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="gateway-title">AdPulse IMC PVT LTD</div>
        <div className="gateway-subtitle">Enterprise ERP &amp; Financial Gateway</div>

        <div className="gateway-tabs">
          <button className={"gateway-tab-btn" + (activeTab === "admin" ? " active" : "")} onClick={() => switchTab("admin")}>
            <ShieldCheck size={17} color={activeTab === "admin" ? "#B8860B" : "#475569"} /> Admin Portal
          </button>
          <button className={"gateway-tab-btn" + (activeTab === "staff" ? " active" : "")} onClick={() => switchTab("staff")}>
            <User size={17} color={activeTab === "staff" ? "#0284C7" : "#475569"} /> Staff Portal
          </button>
        </div>

        <form onSubmit={submitLogin}>
          {errorMsg && (
            <div style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 9, padding: "8px 12px", fontSize: 13, marginBottom: 14 }}>
              {errorMsg}
            </div>
          )}

          <div className="field" style={{ textAlign: "left" }}>
            <label>Email Address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@adpulse.pk" />
          </div>

          <div className="field" style={{ textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Password</label>
              <button type="button" onClick={onOpenForgot} style={{ background: "none", border: "none", color: "#B8860B", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Forgot Password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ paddingRight: 38 }} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15.5, marginTop: 8 }}>
            Sign In to {activeTab === "admin" ? "Admin Portal" : "Staff Portal"}
          </button>
        </form>

        <div style={{ marginTop: 22, fontSize: 12.5, color: "#64748B", borderTop: "1px solid #E2E8F0", paddingTop: 14 }}>
          Karachi Agency Hub &middot; Secure System Access
        </div>
      </div>
      {children}
    </div>
  );
}

function ForgotPasswordModal({ usersList, onClose, onResetPassword }) {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Reset Password, 4: Done
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  function handleSendCode(e) {
    e.preventDefault();
    const found = usersList.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      setError("No registered account found with this email address.");
      return;
    }
    setError("");
    setStep(2);
  }

  function handleVerifyCode(e) {
    e.preventDefault();
    if (code.trim() !== "8899") {
      setError("Incorrect verification code. (Default Demo Code: 8899)");
      return;
    }
    setError("");
    setStep(3);
  }

  function handleReset(e) {
    e.preventDefault();
    if (newPass.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }
    onResetPassword(email, newPass);
    setStep(4);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>Password Recovery</div>
          <button className="btn" style={{ padding: 5 }} onClick={onClose}><X size={15} /></button>
        </div>

        {error && <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <div style={{ fontSize: 13.5, color: "#475569", marginBottom: 14 }}>
              Enter your registered account email to receive a password reset verification code.
            </div>
            <div className="field">
              <label>Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@adpulse.pk" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Send Verification Code</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div style={{ fontSize: 13.5, color: "#475569", marginBottom: 14 }}>
              A 4-digit verification code has been generated. <br/><b>Demo Code: 8899</b>
            </div>
            <div className="field">
              <label>Verification Code</label>
              <input required value={code} onChange={e => setCode(e.target.value)} placeholder="Enter 4-digit code (8899)" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Verify Code</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset}>
            <div className="field">
              <label>New Password</label>
              <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Re-type password" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Reset Password</button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <CheckCircle2 size={40} color="#059669" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Password Reset Successfully!</div>
            <div style={{ fontSize: 13.5, color: "#475569", marginBottom: 16 }}>You can now sign in with your new password.</div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Back to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangePasswordModal({ currentUser, onClose, onUpdatePassword }) {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (oldPass !== currentUser.password) {
      setError("Current password does not match.");
      return;
    }
    if (newPass.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      setError("New passwords do not match.");
      return;
    }
    onUpdatePassword(newPass);
    setSuccess(true);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>Change Password</div>
          <button className="btn" style={{ padding: 5 }} onClick={onClose}><X size={15} /></button>
        </div>

        {error && <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {success ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <CheckCircle2 size={38} color="#059669" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 16, fontWeight: 700 }}>Password Changed!</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4, marginBottom: 14 }}>Your account password has been updated.</div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Current Password</label>
              <input type="password" required value={oldPass} onChange={e => setOldPass(e.target.value)} />
            </div>
            <div className="field">
              <label>New Password</label>
              <input type="password" required value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="field">
              <label>Confirm New Password</label>
              <input type="password" required value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }}>
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function UserModal({ initialData, onClose, onSubmit }) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState(initialData?.password || "staff123");
  const [role, setRole] = useState(initialData?.role || "Staff");
  const [department, setDepartment] = useState(initialData?.department || HR_DEPARTMENTS[1]);
  const [allowedTabs, setAllowedTabs] = useState(initialData?.allowedTabs || ["dashboard", "projects", "invoices", "ooh"]);

  const toggleTabPermission = (key) => {
    setAllowedTabs(current =>
      current.includes(key) ? current.filter(k => k !== key) : [...current, key]
    );
  };

  const valid = name && email && password && allowedTabs.length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid) return;
    const userData = initialData
      ? { ...initialData, name, email, password, role, department, allowedTabs }
      : { id: uid(), name, email, password, role, department, allowedTabs };
    onSubmit(userData);
  }

  return (
    <ModalShell title={initialData ? "Edit Staff User Account" : "Create New Staff Account"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field"><label>Full Name</label><input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hammad Khan" /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Email Address</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@adpulse.pk" /></div>
          <div className="field" style={{ flex: 1 }}><label>Password</label><input required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" /></div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}><label>Department</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}>
              {HR_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}><label>Role Privilege</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="Staff">Staff Officer</option>
              <option value="Admin">Admin Executive</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label style={{ marginBottom: 6 }}>Module Access Permissions</label>
          <div className="checkbox-grid">
            {ALL_MODULE_TABS.map(t => (
              <label key={t.key} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={allowedTabs.includes(t.key)}
                  onChange={() => toggleTabPermission(t.key)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={!valid}>
          {initialData ? "Save User Changes" : "Create Staff Credentials"}
        </button>
      </form>
    </ModalShell>
  );
}

/* ---------- OTHER FORM MODALS ---------- */

function ModalShell({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>{title}</div>
          <button className="btn" style={{ padding: 5 }} onClick={onClose}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InvoiceModal({ initialData, onClose, onSubmit }) {
  const [client, setClient] = useState(initialData?.client || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || "2026-07-21");
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "2026-08-05");
  const valid = client && description && Number(amount) > 0;
  return (
    <ModalShell title={initialData ? "Edit Client Invoice" : "Create New Client Invoice"} onClose={onClose}>
      <div className="field"><label>Client Name</label><input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Prime Estate Enterprises" /></div>
      <div className="field"><label>Service / Scope Particulars</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. TVC Post Production" /></div>
      <div className="field"><label>Total Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Issue Date</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, client, description, amount: Number(amount), issueDate, dueDate } : { client, description, amount: Number(amount), issueDate, dueDate })}>
        {initialData ? "Save Invoice Changes" : "Generate & Post Invoice"}
      </button>
    </ModalShell>
  );
}

function ExpenseModal({ initialData, onClose, onSubmit }) {
  const [vendor, setVendor] = useState(initialData?.vendor || "");
  const [category, setCategory] = useState(initialData?.category || EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [date, setDate] = useState(initialData?.date || "2026-07-21");
  const [paidVia, setPaidVia] = useState(initialData?.paidVia || "Bank");
  const valid = vendor && Number(amount) > 0;
  return (
    <ModalShell title={initialData ? "Edit Operating Expense" : "Record Operating Expense"} onClose={onClose}>
      <div className="field"><label>Vendor / Payee</label><input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="e.g. Meta Ads / Studio Rental" /></div>
      <div className="field"><label>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field"><label>Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Paid Via</label>
          <select value={paidVia} onChange={e => setPaidVia(e.target.value)}>
            <option>Bank</option><option>Cash</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, vendor, category, amount: Number(amount), date, paidVia } : { vendor, category, amount: Number(amount), date, paidVia })}>
        {initialData ? "Save Expense Changes" : "Post Expense Entry"}
      </button>
    </ModalShell>
  );
}

function HoardingModal({ initialData, onClose, onSubmit }) {
  const [name, setName] = useState(initialData?.name || "");
  const [area, setArea] = useState(initialData?.area || "");
  const [size, setSize] = useState(initialData?.size || "");
  const [pricePerMonth, setPricePerMonth] = useState(initialData?.pricePerMonth || "");
  const [status, setStatus] = useState(initialData?.status || "Available");

  const valid = name && area && size && Number(pricePerMonth) > 0;
  return (
    <ModalShell title={initialData ? "Edit Billboard Site Inventory" : "Add New Billboard Site"} onClose={onClose}>
      <div className="field"><label>Site Identifier / Location Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shahrah-e-Faisal Site 2" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Area / Zone</label><input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. Clifton / Tariq Road" /></div>
        <div className="field" style={{ flex: 1 }}><label>Dimensions / Size</label><input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. 20x40 ft" /></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Monthly Rate (PKR)</label><input type="number" value={pricePerMonth} onChange={e => setPricePerMonth(e.target.value)} placeholder="0" /></div>
        <div className="field" style={{ flex: 1 }}><label>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option>Available</option><option>Booked</option><option>Maintenance</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, name, area, size, pricePerMonth: Number(pricePerMonth), status } : { name, area, size, pricePerMonth: Number(pricePerMonth), status })}>
        {initialData ? "Save Site Changes" : "Add to Billboard Inventory"}
      </button>
    </ModalShell>
  );
}

function VoucherModal({ defaultType, onClose, onSubmit }) {
  const [type, setType] = useState(defaultType || "JV");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("2026-07-21");
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [via, setVia] = useState("Bank");
  const [settleAR, setSettleAR] = useState(true);
  const [lines, setLines] = useState([
    { account: "cash", debit: "", credit: "" },
    { account: "revenue", debit: "", credit: "" },
  ]);

  const updateLine = (i, key, val) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  const totalD = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalC = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const jvBalanced = totalD > 0 && totalD === totalC;

  const valid = type === "JV" ? (jvBalanced && description) : (party && Number(amount) > 0 && description);

  function submit() {
    if (!valid) return;
    if (type === "JV") {
      onSubmit("JV", {
        date, party: "", description,
        lines: lines.filter(l => Number(l.debit) || Number(l.credit)).map(l => ({ account: l.account, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      });
    } else {
      onSubmit(type, { date, party, description, amount: Number(amount), category, via, settleAR });
    }
  }

  return (
    <ModalShell title="Generate Financial Voucher" onClose={onClose}>
      <div className="field">
        <label>Voucher Type</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          {Object.entries(VOUCHER_TYPES).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}
        </select>
      </div>
      <div className="field"><label>Posting Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>

      {type !== "JV" && (
        <div className="field"><label>{type === "PV" ? "Paid To (Payee)" : type === "RV" ? "Received From (Payer)" : "Client Name"}</label>
          <input value={party} onChange={e => setParty(e.target.value)} placeholder="Party Name" /></div>
      )}
      <div className="field"><label>Description / Particulars</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Media booking retainer" /></div>

      {type === "PV" && (
        <>
          <div className="field"><label>Expense Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label>Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div className="field"><label>Payment Account</label>
            <select value={via} onChange={e => setVia(e.target.value)}><option>Bank</option><option>Cash</option></select></div>
        </>
      )}
      {type === "RV" && (
        <>
          <div className="field"><label>Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div className="field"><label>Receipt Credit Account</label>
            <select value={settleAR ? "ar" : "revenue"} onChange={e => setSettleAR(e.target.value === "ar")}>
              <option value="ar">Settle Accounts Receivable</option>
              <option value="revenue">Direct Revenue (No prior invoice)</option>
            </select></div>
          <div className="field"><label>Deposit Account</label>
            <select value={via} onChange={e => setVia(e.target.value)}><option>Bank</option><option>Cash</option></select></div>
        </>
      )}
      {type === "SV" && (
        <div className="field"><label>Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
      )}

      {type === "JV" && (
        <>
          {lines.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <select value={l.account} onChange={e => updateLine(i, "account", e.target.value)} style={{ flex: 1.5, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 7, color: "#0F172A", fontSize: 13, padding: "6px 7px" }}>
                {Object.entries(ACCOUNTS).map(([k, a]) => <option key={k} value={k}>{a.name}</option>)}
              </select>
              <input type="number" placeholder="Debit" value={l.debit} onChange={e => updateLine(i, "debit", e.target.value)} style={{ width: 85, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 7, color: "#0F172A", fontSize: 13, padding: "6px 7px" }} />
              <input type="number" placeholder="Credit" value={l.credit} onChange={e => updateLine(i, "credit", e.target.value)} style={{ width: 85, background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 7, color: "#0F172A", fontSize: 13, padding: "6px 7px" }} />
            </div>
          ))}
          <button className="btn" style={{ fontSize: 12.5, marginBottom: 10 }} onClick={() => setLines(ls => [...ls, { account: "cash", debit: "", credit: "" }])}>
            <Plus size={12} /> Add Line
          </button>
          <div className="mono" style={{ fontSize: 13, marginBottom: 10 }}>
            Debit {pkr(totalD)} / Credit {pkr(totalC)} &nbsp;&mdash;&nbsp;
            <span className={jvBalanced ? "trial-ok" : "trial-bad"} style={{ fontWeight: 700 }}>{jvBalanced ? "✓ Balanced" : "Not Balanced"}</span>
          </div>
        </>
      )}

      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={!valid} onClick={submit}>
        Post Voucher Entry
      </button>
    </ModalShell>
  );
}

function BookHoardingModal({ hoarding, projects, onClose, onSubmit }) {
  const [mode, setMode] = useState(projects.length ? "existing" : "new");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [client, setClient] = useState("");
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState("2026-07-21");
  const [endDate, setEndDate] = useState("2026-08-21");
  const [rent, setRent] = useState(hoarding.pricePerMonth);

  const selectedProject = projects.find(p => p.id === projectId);
  const valid = mode === "existing"
    ? (projectId && Number(rent) > 0)
    : (client && projectName && Number(rent) > 0);

  function submit() {
    if (!valid) return;
    onSubmit(hoarding, mode === "existing"
      ? { mode, projectId, startDate, endDate, rent: Number(rent) }
      : { mode, client, projectName, startDate, endDate, rent: Number(rent) });
  }

  return (
    <ModalShell title={`Book Outdoor Site: ${hoarding.name}`} onClose={onClose}>
      <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 12 }}>
        Location: {hoarding.area} &middot; Size: {hoarding.size} &middot; List Rate: {pkr(hoarding.pricePerMonth)}/month
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={"btn" + (mode === "existing" ? " btn-primary" : "")} style={{ fontSize: 12.5, padding: "6px 10px", flex: 1, justifyContent: "center" }}
          disabled={!projects.length} onClick={() => setMode("existing")}>Existing Project</button>
        <button className={"btn" + (mode === "new" ? " btn-primary" : "")} style={{ fontSize: 12.5, padding: "6px 10px", flex: 1, justifyContent: "center" }}
          onClick={() => setMode("new")}>New Campaign</button>
      </div>

      {mode === "existing" ? (
        <>
          <div className="field"><label>Assign to Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.client} — {p.name}</option>)}
            </select>
          </div>
          {selectedProject && <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginBottom: 10 }}>Site will be grouped under <b>{selectedProject.name}</b>.</div>}
        </>
      ) : (
        <>
          <div className="field"><label>Client Name</label><input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Imtiaz Retail" /></div>
          <div className="field"><label>Campaign / Project Name</label><input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Independence Day OOH Blitz" /></div>
        </>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
      </div>
      <div className="field"><label>Agreed Monthly Rent (PKR)</label><input type="number" value={rent} onChange={e => setRent(e.target.value)} /></div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid} onClick={submit}>
        Confirm Booking &amp; Post AR
      </button>
    </ModalShell>
  );
}

function AddSiteModal({ project, hoardings, onClose, onSubmit }) {
  const [hoardingId, setHoardingId] = useState(hoardings[0]?.id || "");
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.endDate);
  const hoarding = hoardings.find(h => h.id === hoardingId);
  const [rent, setRent] = useState(hoarding?.pricePerMonth || "");

  function selectHoarding(id) {
    setHoardingId(id);
    const h = hoardings.find(x => x.id === id);
    if (h) setRent(h.pricePerMonth);
  }

  const valid = hoardingId && Number(rent) > 0;
  return (
    <ModalShell title={`Add OOH Site — ${project.name}`} onClose={onClose}>
      <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 12 }}>
        Client: {project.client} &middot; Site details roll up into this project.
      </div>
      {hoardings.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 10 }}>No unbooked sites available right now.</div>
      ) : (
        <>
          <div className="field"><label>Select Available Hoarding</label>
            <select value={hoardingId} onChange={e => selectHoarding(e.target.value)}>
              {hoardings.map(h => <option key={h.id} value={h.id}>{h.name} ({h.area}, {h.size}) — {pkr(h.pricePerMonth)}/mo</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="field" style={{ flex: 1 }}><label>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div className="field" style={{ flex: 1 }}><label>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
          <div className="field"><label>Agreed Monthly Rent (PKR)</label><input type="number" value={rent} onChange={e => setRent(e.target.value)} /></div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
            onClick={() => valid && onSubmit(hoarding, { mode: "existing", projectId: project.id, startDate, endDate, rent: Number(rent) })}>
            Add Site to Campaign
          </button>
        </>
      )}
    </ModalShell>
  );
}

function ProjectModal({ initialData, onClose, onSubmit }) {
  const [client, setClient] = useState(initialData?.client || "");
  const [type, setType] = useState(initialData?.type || PROJECT_TYPES[0].key);
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [startDate, setStartDate] = useState(initialData?.startDate || "2026-07-21");
  const [endDate, setEndDate] = useState(initialData?.endDate || "2026-08-05");
  const valid = client && name && startDate && endDate;
  return (
    <ModalShell title={initialData ? "Edit Project Details" : "Create New Agency Project"} onClose={onClose}>
      <div className="field"><label>Client Name</label><input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Imtiaz Retail" /></div>
      <div className="field"><label>Service Line Category</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          {PROJECT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>
      <div className="field"><label>Project Title</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q3 Brand Campaign" /></div>
      <div className="field"><label>Scope Note</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief summary of creative scope" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, client, type, name, description, startDate, endDate } : { client, type, name, description, startDate, endDate })}>
        {initialData ? "Save Project Changes" : "Initialize Project"}
      </button>
    </ModalShell>
  );
}

function ProjectBillingModal({ project, onClose, onSubmit }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState("2026-07-21");
  const [dueDate, setDueDate] = useState("2026-08-05");
  const valid = Number(amount) > 0;
  return (
    <ModalShell title={`Bill Client — ${project.name}`} onClose={onClose}>
      <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 12 }}>
        Client: {project.client} &middot; Service: <ProjectTypeBadge type={project.type} />
      </div>
      <div className="field"><label>Billing Milestone / Note</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 50% Milestone Advance" /></div>
      <div className="field"><label>Billing Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Issue Date</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(project, { description, amount: Number(amount), issueDate, dueDate })}>
        Post Client Billing
      </button>
    </ModalShell>
  );
}

function ProjectCostModal({ project, onClose, onSubmit }) {
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2026-07-21");
  const [paidVia, setPaidVia] = useState("Bank");
  const valid = vendor && Number(amount) > 0;
  return (
    <ModalShell title={`Record Cost — ${project.name}`} onClose={onClose}>
      <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 12 }}>
        Client: {project.client} &middot; Service: <ProjectTypeBadge type={project.type} />
      </div>
      <div className="field"><label>Vendor / Payee</label><input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="e.g. Production House / Sound Studio" /></div>
      <div className="field"><label>Cost Description</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Camera crew & editing" /></div>
      <div className="field"><label>Cost Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Paid Via</label>
          <select value={paidVia} onChange={e => setPaidVia(e.target.value)}><option>Bank</option><option>Cash</option></select>
        </div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(project, { vendor, description, amount: Number(amount), date, paidVia })}>
        Post Production Cost
      </button>
    </ModalShell>
  );
}

function ProjectDetailModal({ project, invoices, expenses, sites, onClose, onStatusChange, onAddBilling, onAddCost, onAddSite, onReleaseSite, onMarkPaid, onPrint, onPrintProject }) {
  const invoicesWithStatus = invoices.map(inv => ({
    ...inv, status: inv.paid ? "Paid" : (new Date(inv.dueDate) < TODAY ? "Overdue" : "Unpaid"),
  }));
  const isOOH = project.type === "OOH Advertising";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 700 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div className="section-title" style={{ margin: 0, fontSize: 18 }}>{project.name}</div>
            <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}>Client: {project.client} &middot; {fmtDate(project.startDate)} – {fmtDate(project.endDate)}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" style={{ padding: "5px 10px", fontSize: 12.5 }} onClick={onPrintProject}><Printer size={14} /> Print Statement</button>
            <button className="btn" style={{ padding: 5 }} onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "10px 0 14px" }}>
          <ProjectTypeBadge type={project.type} />
          <select value={project.status} onChange={e => onStatusChange(e.target.value)}
            style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 20, color: "#0F172A", fontSize: 13, padding: "5px 12px", fontWeight: 600 }}>
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {project.description && (
          <div style={{ fontSize: 13.5, color: "var(--ink-muted)", marginBottom: 14, background: "#F1F5F9", padding: "10px 14px", borderRadius: 9 }}>
            {project.description}
          </div>
        )}

        <div className="grid-kpi" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 16 }}>
          <KpiCard label="Total Billed" value={pkr(project.billed)} icon={FileText} accent="var(--jade)" />
          <KpiCard label="Outstanding" value={pkr(project.outstanding)} icon={Landmark} accent="var(--amber)" />
          <KpiCard label="Costs Out" value={pkr(project.cost)} icon={Coins} accent="var(--rose)" />
          <KpiCard label="Net Margin" value={pkr(project.margin)} icon={TrendingUp} accent={project.margin >= 0 ? "var(--jade)" : "var(--rose)"} />
        </div>

        {isOOH && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="section-title" style={{ margin: 0, fontSize: 15 }}><Building2 size={16} color="var(--gold)" /> Outdoor Sites ({sites.length})</div>
              <button className="btn" style={{ fontSize: 12.5, padding: "5px 10px" }} onClick={onAddSite}><Plus size={13} /> Add Site</button>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="table-responsive">
                <table>
                  <thead><tr><th>Site Name</th><th>Area</th><th>Size</th><th>Booked Dates</th><th style={{ textAlign: "right" }}>Rate/Mo</th><th>Action</th></tr></thead>
                  <tbody>
                    {sites.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td><span className="badge-mini"><MapPin size={10} style={{ verticalAlign: -1 }} /> {h.area}</span></td>
                        <td><span className="badge-mini"><Ruler size={10} style={{ verticalAlign: -1 }} /> {h.size}</span></td>
                        <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(h.bookedFrom)} – {fmtDate(h.bookedTo)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{pkr(h.pricePerMonth)}</td>
                        <td><button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => onReleaseSite(h)}>Release</button></td>
                      </tr>
                    ))}
                    {sites.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 14 }}>No sites assigned yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div className="section-title" style={{ margin: 0, fontSize: 15 }}><FileText size={16} color="var(--gold)" /> Client Billings</div>
          <button className="btn" style={{ fontSize: 12.5, padding: "5px 10px" }} onClick={onAddBilling}><Plus size={13} /> Add Billing</button>
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="table-responsive">
            <table>
              <thead><tr><th>Description</th><th>Issue</th><th>Due</th><th style={{ textAlign: "right" }}>Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {invoicesWithStatus.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ color: "var(--ink-muted)" }}>{inv.description}</td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(inv.issueDate)}</td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(inv.dueDate)}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{pkr(inv.amount)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td style={{ display: "flex", gap: 4 }}>
                      {!inv.paid && <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => onMarkPaid(inv)}>Mark Paid</button>}
                      <button className="btn" style={{ padding: "4px 7px", fontSize: 12 }}
                        onClick={() => onPrint({ voucherNo: "INV-" + inv.id.toUpperCase(), type: "Invoice", date: inv.issueDate, party: inv.client, description: inv.description, amount: inv.amount })}>
                        <Printer size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {invoicesWithStatus.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 14 }}>No billing invoices created yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div className="section-title" style={{ margin: 0, fontSize: 15 }}><Coins size={16} color="var(--gold)" /> Vendor Costs</div>
          <button className="btn" style={{ fontSize: 12.5, padding: "5px 10px" }} onClick={onAddCost}><Plus size={13} /> Add Cost</button>
        </div>
        <div className="card">
          <div className="table-responsive">
            <table>
              <thead><tr><th>Vendor</th><th>Description</th><th>Date</th><th>Paid Via</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td style={{ fontWeight: 600 }}>{exp.vendor}</td>
                    <td style={{ color: "var(--ink-muted)" }}>{exp.description || "—"}</td>
                    <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(exp.date)}</td>
                    <td>{exp.paidVia}</td>
                    <td className="mono" style={{ textAlign: "right", color: "var(--rose)" }}>{pkr(exp.amount)}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 14 }}>No vendor costs logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* HR MODALS */

function EmployeeModal({ initialData, onClose, onSubmit }) {
  const [name, setName] = useState(initialData?.name || "");
  const [department, setDepartment] = useState(initialData?.department || HR_DEPARTMENTS[0]);
  const [designation, setDesignation] = useState(initialData?.designation || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [joinDate, setJoinDate] = useState(initialData?.joinDate || "2026-07-21");
  const [salary, setSalary] = useState(initialData?.salary || "");
  const [cnic, setCnic] = useState(initialData?.cnic || "");
  const [bankAccount, setBankAccount] = useState(initialData?.bankAccount || "");

  const valid = name && designation && Number(salary) > 0;
  return (
    <ModalShell title={initialData ? "Edit Employee Profile" : "New Employee Registration"} onClose={onClose}>
      <div className="field"><label>Full Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tariq Jamil" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Department</label>
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            {HR_DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}><label>Designation</label><input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Sr. Designer" /></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@adpulse.pk" /></div>
        <div className="field" style={{ flex: 1 }}><label>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0300-1234567" /></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Monthly Salary (PKR)</label><input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0" /></div>
        <div className="field" style={{ flex: 1 }}><label>Joining Date</label><input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} /></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>CNIC #</label><input value={cnic} onChange={e => setCnic(e.target.value)} placeholder="42101-XXXXXXX-X" /></div>
        <div className="field" style={{ flex: 1 }}><label>Bank Account IBAN</label><input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="PK-HBL-XXXXXX" /></div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, name, department, designation, email, phone, joinDate, salary: Number(salary), cnic, bankAccount } : { name, department, designation, email, phone, joinDate, salary: Number(salary), cnic, bankAccount })}>
        {initialData ? "Save Employee Profile" : "Register Staff Member"}
      </button>
    </ModalShell>
  );
}

function LeaveModal({ employees, onClose, onSubmit }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [type, setType] = useState(LEAVE_TYPES[0]);
  const [fromDate, setFromDate] = useState("2026-07-22");
  const [toDate, setToDate] = useState("2026-07-23");
  const [reason, setReason] = useState("");

  const valid = employeeId && fromDate && toDate && reason;
  return (
    <ModalShell title="Apply Employee Leave" onClose={onClose}>
      <div className="field"><label>Employee</label>
        <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
        </select>
      </div>
      <div className="field"><label>Leave Category</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>From Date</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>To Date</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></div>
      </div>
      <div className="field"><label>Reason</label><input value={reason} onChange={e => setReason(e.target.value)} placeholder="Brief leave explanation" /></div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit({ employeeId, type, fromDate, toDate, reason })}>
        Submit Leave Request
      </button>
    </ModalShell>
  );
}

function EmployeeDetailModal({ employee, leaveHistory, onClose, onStatusChange }) {
  return (
    <ModalShell title={`Employee Profile — ${employee.name}`} onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="mono" style={{ fontSize: 13, color: "var(--ink-muted)" }}>{employee.code} &middot; <DepartmentBadge department={employee.department} /></div>
          <div style={{ fontSize: 14, color: "var(--gold)", fontWeight: 700 }}>{employee.designation}</div>
        </div>
        <select value={employee.status} onChange={e => onStatusChange(e.target.value)}
          style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 20, color: "#0F172A", fontSize: 13, padding: "5px 12px", fontWeight: 600 }}>
          {EMP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13.5, marginBottom: 14, background: "#F1F5F9", padding: 14, borderRadius: 9 }}>
        <div><span style={{ color: "var(--ink-muted)" }}>Monthly Salary:</span> <br/><b className="mono">{pkr(employee.salary)}</b></div>
        <div><span style={{ color: "var(--ink-muted)" }}>Leave Balance:</span> <br/><b>{employee.leaveBalance} days remaining</b></div>
        <div><span style={{ color: "var(--ink-muted)" }}>Joining Date:</span> <br/>{fmtDate(employee.joinDate)}</div>
        <div><span style={{ color: "var(--ink-muted)" }}>Phone:</span> <br/>{employee.phone || "—"}</div>
        <div><span style={{ color: "var(--ink-muted)" }}>CNIC #:</span> <br/><span className="mono">{employee.cnic || "—"}</span></div>
        <div><span style={{ color: "var(--ink-muted)" }}>Bank IBAN:</span> <br/><span className="mono" style={{ fontSize: 12 }}>{employee.bankAccount || "—"}</span></div>
      </div>

      <div className="section-title" style={{ fontSize: 15, marginBottom: 8 }}><CalendarCheck size={16} color="var(--gold)" /> Leave History</div>
      <div className="card" style={{ maxHeight: 160, overflowY: "auto" }}>
        <div className="table-responsive">
          <table>
            <thead><tr><th>Type</th><th>From – To</th><th>Days</th><th>Status</th></tr></thead>
            <tbody>
              {leaveHistory.map(l => (
                <tr key={l.id}>
                  <td>{l.type}</td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(l.fromDate)} – {fmtDate(l.toDate)}</td>
                  <td className="mono">{l.days}</td>
                  <td><LeaveStatusBadge status={l.status} /></td>
                </tr>
              ))}
              {leaveHistory.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 12 }}>No leave records on file.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}

function PayrollConfirmModal({ activeCount, totalCost, onClose, onConfirm }) {
  return (
    <ModalShell title="Run Monthly Payroll Disbursal" onClose={onClose}>
      <div style={{ fontSize: 14, color: "var(--ink-muted)", marginBottom: 16 }}>
        This action will generate staff payslips for <b>{activeCount} active employees</b> and automatically post the consolidated payroll expense entry (Total: <b className="mono" style={{ color: "var(--gold)" }}>{pkr(totalCost)}</b>) directly to the General Ledger &amp; P&amp;L.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1.5, justifyContent: "center" }} onClick={onConfirm}>Confirm &amp; Post Payroll</button>
      </div>
    </ModalShell>
  );
}

function PrintPreviewModal({ doc, onClose }) {
  const [pageSize, setPageSize] = useState("A4");
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style>{`@page { size: ${PAGE_SIZES[pageSize]}; margin: 14mm; }`}</style>
      <div className="modal" style={{ width: 640 }} onClick={e => e.stopPropagation()}>
        <div className="no-print-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>Print Preview</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F172A", fontSize: 13, padding: "6px 10px" }}>
              {Object.keys(PAGE_SIZES).map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => window.print()}><Printer size={14} /> Print Document</button>
            <button className="btn" style={{ padding: 5 }} onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        <div className="print-area" style={{ background: "#ffffff", color: "#0F172A", borderRadius: 10, padding: 26, fontFamily: "Georgia, serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0F172A", paddingBottom: 14, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src="./logo.png" alt="AdPulse Logo" style={{ maxHeight: 52, width: "auto" }} onError={(e) => { e.target.style.display = 'none'; }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>AdPulse IMC PVT LTD</div>
                <div style={{ fontSize: 12, color: "#475569", fontWeight: "sans-serif" }}>Integrated Media &amp; Creative Services &middot; Karachi, Pakistan</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#B8860B", textTransform: "uppercase" }}>{doc.type || VOUCHER_TYPES[doc.type] || doc.voucherNo}</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{doc.voucherNo}</div>
            </div>
          </div>
          <table style={{ width: "100%", fontSize: 13.5, marginBottom: 18, minWidth: 0 }}>
            <tbody>
              <tr><td style={{ padding: "4px 0", color: "#475569", width: 130 }}>Date</td><td className="mono">{fmtDate(doc.date)}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#475569" }}>Party / Client</td><td style={{ fontWeight: 700 }}>{doc.party || "—"}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#475569" }}>Particulars</td><td>{doc.description}</td></tr>
            </tbody>
          </table>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, minWidth: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Description / Scope</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "9px 0", fontSize: 14 }}>{doc.description}</td>
                <td className="mono" style={{ textAlign: "right", padding: "9px 0", fontWeight: 700, fontSize: 15 }}>{pkr(doc.amount)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style={{ borderTop: "2px solid #0F172A", padding: "10px 0", fontWeight: 800, fontSize: 14.5 }}>Total Net Amount</td>
                <td className="mono" style={{ borderTop: "2px solid #0F172A", textAlign: "right", padding: "10px 0", fontWeight: 800, fontSize: 16, color: "#B8860B" }}>{pkr(doc.amount)}</td>
              </tr>
            </tfoot>
          </table>
          <div style={{ fontSize: 12.5, fontStyle: "italic", color: "#334155", marginBottom: 34, background: "#F1F5F9", padding: "10px 14px", borderRadius: 7, border: "1px solid #E2E8F0" }}>
            Amount in words: <b style={{ color: "#0F172A" }}>{amountInWords(doc.amount)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", paddingTop: 12 }}>
            <div>Prepared by: ______________</div>
            <div>Checked by: ______________</div>
            <div>Approved by: ______________</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientStatementPrintModal({ clientName, invoices, projects, onClose }) {
  const [pageSize, setPageSize] = useState("A4");
  const clientInvoices = invoices.filter(i => i.client.toLowerCase() === clientName.toLowerCase());
  const clientProjects = projects.filter(p => p.client.toLowerCase() === clientName.toLowerCase());
  const totalBilled = clientInvoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = clientInvoices.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = totalBilled - totalPaid;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style>{`@page { size: ${PAGE_SIZES[pageSize]}; margin: 14mm; }`}</style>
      <div className="modal" style={{ width: 720 }} onClick={e => e.stopPropagation()}>
        <div className="no-print-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>Client Statement Preview</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F172A", fontSize: 13, padding: "6px 10px" }}>
              {Object.keys(PAGE_SIZES).map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => window.print()}><Printer size={14} /> Print Statement</button>
            <button className="btn" style={{ padding: 5 }} onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        <div className="print-area" style={{ background: "#ffffff", color: "#0F172A", borderRadius: 10, padding: 28, fontFamily: "Georgia, serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0F172A", paddingBottom: 14, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src="./logo.png" alt="AdPulse Logo" style={{ maxHeight: 52, width: "auto" }} onError={(e) => { e.target.style.display = 'none'; }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>AdPulse IMC PVT LTD</div>
                <div style={{ fontSize: 12, color: "#475569", fontWeight: "sans-serif" }}>Integrated Media &amp; Creative Services &middot; Karachi, Pakistan</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#B8860B", textTransform: "uppercase" }}>CLIENT STATEMENT</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>STMT-{clientName.replace(/\s+/g, "").toUpperCase().slice(0, 6)}</div>
            </div>
          </div>

          <table style={{ width: "100%", fontSize: 13.5, marginBottom: 18, minWidth: 0 }}>
            <tbody>
              <tr><td style={{ padding: "4px 0", color: "#475569", width: 140 }}>Client Account</td><td style={{ fontWeight: 800, fontSize: 15 }}>{clientName}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#475569" }}>Statement Date</td><td className="mono">{fmtDate(TODAY)}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#475569" }}>Active Campaigns</td><td>{clientProjects.map(p => p.name).join(", ") || "General Account"}</td></tr>
            </tbody>
          </table>

          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: "#0F172A" }}>Individual Invoice Ledger &amp; Billings</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, minWidth: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Issue Date</th>
                <th style={{ textAlign: "left", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Description / Scope</th>
                <th style={{ textAlign: "left", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Status</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Billed Amount</th>
              </tr>
            </thead>
            <tbody>
              {clientInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="mono" style={{ padding: "9px 0", fontSize: 13 }}>{fmtDate(inv.issueDate)}</td>
                  <td style={{ padding: "9px 0", fontSize: 13.5 }}>{inv.description}</td>
                  <td style={{ padding: "9px 0", fontSize: 13 }}>
                    <span style={{ color: inv.paid ? "#059669" : "#D97706", fontWeight: 700 }}>{inv.paid ? "PAID" : "UNPAID"}</span>
                  </td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", fontWeight: 700, fontSize: 14 }}>{pkr(inv.amount)}</td>
                </tr>
              ))}
              {clientInvoices.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 16, color: "#64748B" }}>No billings found for this client.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ borderTop: "1.5px solid #0F172A", padding: "8px 0", fontWeight: 700, fontSize: 13.5 }}>Total Billed</td>
                <td className="mono" style={{ borderTop: "1.5px solid #0F172A", textAlign: "right", padding: "8px 0", fontWeight: 700, fontSize: 14 }}>{pkr(totalBilled)}</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ padding: "4px 0", fontWeight: 700, fontSize: 13.5, color: "#059669" }}>Total Payments Received</td>
                <td className="mono" style={{ textAlign: "right", padding: "4px 0", fontWeight: 700, fontSize: 14, color: "#059669" }}>({pkr(totalPaid)})</td>
              </tr>
              <tr>
                <td colSpan={3} style={{ borderTop: "2px solid #0F172A", padding: "10px 0", fontWeight: 800, fontSize: 15 }}>Net Balance Payable</td>
                <td className="mono" style={{ borderTop: "2px solid #0F172A", textAlign: "right", padding: "10px 0", fontWeight: 800, fontSize: 16.5, color: "#B8860B" }}>{pkr(totalOutstanding)}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ fontSize: 12.5, fontStyle: "italic", color: "#334155", marginBottom: 34, background: "#F1F5F9", padding: "10px 14px", borderRadius: 7, border: "1px solid #E2E8F0" }}>
            Outstanding Balance in words: <b style={{ color: "#0F172A" }}>{amountInWords(totalOutstanding)}</b>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", paddingTop: 12 }}>
            <div>Prepared by: ______________</div>
            <div>Accounts Manager: ______________</div>
            <div>Authorized Signatory: ______________</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectStatementPrintModal({ project, invoices, expenses, onClose }) {
  const [pageSize, setPageSize] = useState("A4");
  const projInvoices = invoices.filter(i => i.projectId === project.id);
  const projExpenses = expenses.filter(e => e.projectId === project.id);
  const totalBilled = projInvoices.reduce((s, i) => s + i.amount, 0);
  const totalCost = projExpenses.reduce((s, e) => s + e.amount, 0);
  const netMargin = totalBilled - totalCost;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style>{`@page { size: ${PAGE_SIZES[pageSize]}; margin: 14mm; }`}</style>
      <div className="modal" style={{ width: 720 }} onClick={e => e.stopPropagation()}>
        <div className="no-print-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>Project Statement Preview</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F172A", fontSize: 13, padding: "6px 10px" }}>
              {Object.keys(PAGE_SIZES).map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => window.print()}><Printer size={14} /> Print Project Invoice</button>
            <button className="btn" style={{ padding: 5 }} onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        <div className="print-area" style={{ background: "#ffffff", color: "#0F172A", borderRadius: 10, padding: 28, fontFamily: "Georgia, serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0F172A", paddingBottom: 14, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src="./logo.png" alt="AdPulse Logo" style={{ maxHeight: 52, width: "auto" }} onError={(e) => { e.target.style.display = 'none'; }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>AdPulse IMC PVT LTD</div>
                <div style={{ fontSize: 12, color: "#475569", fontWeight: "sans-serif" }}>Integrated Media &amp; Creative Services &middot; Karachi, Pakistan</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#B8860B", textTransform: "uppercase" }}>PROJECT STATEMENT</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>PROJ-{project.name.replace(/\s+/g, "").toUpperCase().slice(0, 6)}</div>
            </div>
          </div>

          <table style={{ width: "100%", fontSize: 13.5, marginBottom: 18, minWidth: 0 }}>
            <tbody>
              <tr><td style={{ padding: "4px 0", color: "#475569", width: 140 }}>Project Title</td><td style={{ fontWeight: 800, fontSize: 15 }}>{project.name}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#475569" }}>Client Account</td><td style={{ fontWeight: 700 }}>{project.client}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#475569" }}>Service Line</td><td>{project.type}</td></tr>
              <tr><td style={{ padding: "4px 0", color: "#475569" }}>Project Timeline</td><td className="mono">{fmtDate(project.startDate)} – {fmtDate(project.endDate)}</td></tr>
            </tbody>
          </table>

          <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: "#0F172A" }}>Project Billing Milestones &amp; Deliverables</div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18, minWidth: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Date</th>
                <th style={{ textAlign: "left", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Milestone Description</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {projInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="mono" style={{ padding: "9px 0", fontSize: 13 }}>{fmtDate(inv.issueDate)}</td>
                  <td style={{ padding: "9px 0", fontSize: 13.5 }}>{inv.description}</td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", fontWeight: 700, fontSize: 14 }}>{pkr(inv.amount)}</td>
                </tr>
              ))}
              {projInvoices.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: "center", padding: 14, color: "#64748B" }}>No billings logged for this project.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ borderTop: "2px solid #0F172A", padding: "10px 0", fontWeight: 800, fontSize: 15 }}>Total Billed Project Net</td>
                <td className="mono" style={{ borderTop: "2px solid #0F172A", textAlign: "right", padding: "10px 0", fontWeight: 800, fontSize: 16.5, color: "#B8860B" }}>{pkr(totalBilled)}</td>
              </tr>
            </tfoot>
          </table>

          <div style={{ fontSize: 12.5, fontStyle: "italic", color: "#334155", marginBottom: 34, background: "#F1F5F9", padding: "10px 14px", borderRadius: 7, border: "1px solid #E2E8F0" }}>
            Project Amount in words: <b style={{ color: "#0F172A" }}>{amountInWords(totalBilled)}</b>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#475569", paddingTop: 12 }}>
            <div>Project Lead: ______________</div>
            <div>Finance Manager: ______________</div>
            <div>Approved by: ______________</div>
          </div>
        </div>
      </div>
    </div>
  );
}
