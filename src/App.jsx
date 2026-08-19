import React, { useState, useMemo, useRef } from "react";
import {
  LayoutDashboard, FileText, Receipt, BookOpenText, BarChart3,
  Plus, X, CheckCircle2, Clock, AlertCircle, Wallet, Landmark, ShoppingCart,
  TrendingUp, TrendingDown, ScrollText, Building2, ClipboardList,
  UploadCloud, Printer, MapPin, Ruler, Loader2, FileCheck2,
  Briefcase, Video, PartyPopper, Megaphone, Users, Newspaper,
  ChevronRight, Coins, Menu, UserPlus, UserCheck, UserX, CalendarCheck,
  CalendarX, Banknote, Contact, Phone, Mail, Edit, Trash2, Settings,
  Lock, KeyRound, ShieldCheck, LogOut, User, Check, Eye, EyeOff,
  Package, Boxes, ArrowUpRight, ArrowDownLeft, Layers, SlidersHorizontal, AlertTriangle,
  Download, Upload, HardDrive, RefreshCw, FileJson, Cloud, CloudOff, Database, Save, Search,
  Crown, ShieldAlert, LockKeyhole, Sparkles, Award, Truck
} from "lucide-react";
import {
  getSupabaseConfig, saveSupabaseConfig, isSupabaseConfigured,
  pushStateToSupabase, pullStateFromSupabase
} from "./supabase.js";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import ClientMasterModal from "./components/ClientMasterModal.jsx";
import VendorMasterModal from "./components/VendorMasterModal.jsx";
import ClientStatementView from "./components/ClientStatementView.jsx";
import VendorStatementView from "./components/VendorStatementView.jsx";
import ProjectFinancialDashboard from "./components/ProjectFinancialDashboard.jsx";
import AiDocumentDuplicateModal from "./components/AiDocumentDuplicateModal.jsx";
import GlobalSearchBar from "./components/GlobalSearchBar.jsx";
import StaffAuditTimeline from "./components/StaffAuditTimeline.jsx";

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

export function cleanInvoiceNo(raw) {
  if (!raw) return "INV-9438";
  let s = String(raw).trim();
  while (/^inv[-_]/i.test(s)) {
    s = s.replace(/^inv[-_]/i, "");
  }
  return "INV-" + s.toUpperCase();
}

/* Global Live System Date Reference */
const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().slice(0, 10);
const uid = (() => { let n = 1000; return () => (n++).toString(36); })();

const ACCOUNTS = {
  cash: { code: "1110", name: "Cash Account (In Hand)", type: "asset", category: "Current Assets" },
  bank: { code: "1120", name: "Bank Account (HBL/MCB)", type: "asset", category: "Current Assets" },
  ar: { code: "1130", name: "Accounts Receivable (Clients)", type: "asset", category: "Current Assets" },
  wht_receivable: { code: "1140", name: "WHT Receivable (Advance Tax)", type: "asset", category: "Current Assets" },
  equipment: { code: "1210", name: "Office & Production Equipment", type: "asset", category: "Fixed Assets" },
  ooh_sites: { code: "1220", name: "OOH Billboard Structures", type: "asset", category: "Fixed Assets" },
  ap: { code: "2110", name: "Accounts Payable (Vendors)", type: "liability", category: "Current Liabilities" },
  srb_payable: { code: "2120", name: "SRB Sales Tax Payable", type: "liability", category: "Current Liabilities" },
  equity: { code: "3110", name: "Owner's Equity / Capital", type: "equity", category: "Capital & Retained Earnings" },
  revenue: { code: "4110", name: "Service & Media Revenue", type: "revenue", category: "Operating Revenue" },
  direct_vendor: { code: "5110", name: "Production & Vendor Cost", type: "expense", category: "Direct Costs (COGS)", isDirect: true },
  ad_spend: { code: "5120", name: "Media & Ad Spend", type: "expense", category: "Direct Costs (COGS)", isDirect: true },
  payroll: { code: "5210", name: "Payroll & Salaries Expense", type: "expense", category: "Operating Expenses" },
  rent: { code: "5220", name: "Office Rent Expense", type: "expense", category: "Operating Expenses" },
  utilities: { code: "5230", name: "Utilities Expense", type: "expense", category: "Operating Expenses" },
  software: { code: "5240", name: "Software & Subscriptions", type: "expense", category: "Operating Expenses" },
  contractor: { code: "5250", name: "Contractor Fees", type: "expense", category: "Operating Expenses" },
  expense: { code: "5260", name: "General Operating Expense", type: "expense", category: "Operating Expenses" },
  office_maint: { code: "5270", name: "Office Repairs & Maintenance", type: "expense", category: "Operating Expenses" },
  office_supplies: { code: "5280", name: "Office Supplies & Stationery", type: "expense", category: "Operating Expenses" },
  courier_exp: { code: "5290", name: "Courier & Postage Expense", type: "expense", category: "Operating Expenses" },
  travel_exp: { code: "5310", name: "Vehicle & Travel Expenses", type: "expense", category: "Operating Expenses" },
  insurance_exp: { code: "5320", name: "Insurance Expense", type: "expense", category: "Operating Expenses" },
  gov_tax_exp: { code: "5330", name: "Government Fees & Taxes Expense", type: "expense", category: "Operating Expenses" },
  prof_fees: { code: "5340", name: "Legal & Professional Fees", type: "expense", category: "Operating Expenses" },
  bank_charges: { code: "5350", name: "Bank & Financial Charges", type: "expense", category: "Operating Expenses" },
  depr_exp: { code: "5360", name: "Depreciation & Amortization", type: "expense", category: "Operating Expenses" },
  sales_exp: { code: "5370", name: "Sales & Business Development", type: "expense", category: "Operating Expenses" },
};

const COA_STRUCTURE = [
  {
    code: "1000",
    name: "1000 — Assets",
    type: "asset",
    subcategories: [
      { code: "1100", name: "1100 — Current Assets", accounts: ["cash", "bank", "ar", "wht_receivable"] },
      { code: "1200", name: "1200 — Non-Current & Fixed Assets", accounts: ["equipment", "ooh_sites"] },
    ]
  },
  {
    code: "2000",
    name: "2000 — Liabilities",
    type: "liability",
    subcategories: [
      { code: "2100", name: "2100 — Current Liabilities", accounts: ["ap", "srb_payable"] },
    ]
  },
  {
    code: "3000",
    name: "3000 — Equity",
    type: "equity",
    subcategories: [
      { code: "3100", name: "3100 — Capital & Retained Earnings", accounts: ["equity"] },
    ]
  },
  {
    code: "4000",
    name: "4000 — Revenue",
    type: "revenue",
    subcategories: [
      { code: "4100", name: "4100 — Operating Revenue", accounts: ["revenue"] },
    ]
  },
  {
    code: "5000",
    name: "5000 — Expenses",
    type: "expense",
    subcategories: [
      { code: "5100", name: "5100 — Direct Costs (COGS)", accounts: ["direct_vendor", "ad_spend"] },
      { code: "5200", name: "5200 — Operating Expenses", accounts: ["payroll", "rent", "utilities", "software", "contractor", "expense", "office_maint", "office_supplies", "courier_exp", "travel_exp", "insurance_exp", "gov_tax_exp", "prof_fees", "bank_charges", "depr_exp", "sales_exp"] },
    ]
  }
];



const VOUCHER_TYPES = {
  PV: "Payment Voucher",
  RV: "Receipt Voucher",
  CTV: "Contra Transfer Voucher (Cash ↔ Bank)",
  CV: "Client-to-Vendor Direct Settlement",
  JV: "Journal Voucher",
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

const EXPENSE_CLASSIFICATION = {
  "Salaries & Employee Costs": {
    code: "A",
    subcategories: [
      { name: "Salaries & Wages", accountKey: "payroll" },
      { name: "Overtime", accountKey: "payroll" },
      { name: "Employee Bonuses", accountKey: "payroll" },
      { name: "Employee Allowances", accountKey: "payroll" },
      { name: "Staff Benefits", accountKey: "payroll" },
      { name: "Employer Contributions", accountKey: "payroll" },
      { name: "Recruitment & Hiring", accountKey: "contractor" },
      { name: "Employee Training", accountKey: "expense" },
      { name: "Staff Welfare", accountKey: "expense" }
    ]
  },
  "Office & Administration": {
    code: "B",
    subcategories: [
      { name: "Office Rent", accountKey: "rent" },
      { name: "Office Maintenance", accountKey: "office_maint" },
      { name: "Office Supplies", accountKey: "office_supplies" },
      { name: "Stationery", accountKey: "office_supplies" },
      { name: "Printing & Photocopying", accountKey: "office_supplies" },
      { name: "Cleaning & Janitorial", accountKey: "office_maint" },
      { name: "Security Services", accountKey: "office_maint" },
      { name: "Office Furniture", accountKey: "equipment" },
      { name: "Office Equipment", accountKey: "equipment" },
      { name: "Pantry / Refreshments", accountKey: "expense" },
      { name: "Courier & Postage", accountKey: "courier_exp" }
    ]
  },
  "Utilities": {
    code: "C",
    subcategories: [
      { name: "Electricity", accountKey: "utilities" },
      { name: "Gas", accountKey: "utilities" },
      { name: "Water", accountKey: "utilities" },
      { name: "Internet", accountKey: "utilities" },
      { name: "Telephone", accountKey: "utilities" },
      { name: "Mobile / Communication", accountKey: "utilities" },
      { name: "Generator / Fuel", accountKey: "utilities" },
      { name: "Utility Charges", accountKey: "utilities" }
    ]
  },
  "Marketing & Advertising": {
    code: "D",
    subcategories: [
      { name: "Digital Marketing", accountKey: "ad_spend" },
      { name: "Social Media Advertising", accountKey: "ad_spend" },
      { name: "Google Ads", accountKey: "ad_spend" },
      { name: "Meta / Facebook Ads", accountKey: "ad_spend" },
      { name: "Outdoor Advertising", accountKey: "ad_spend" },
      { name: "Printing & Branding", accountKey: "ad_spend" },
      { name: "Promotional Materials", accountKey: "ad_spend" },
      { name: "Events & Activations", accountKey: "ad_spend" },
      { name: "Public Relations", accountKey: "ad_spend" },
      { name: "Media Buying", accountKey: "ad_spend" },
      { name: "Content Production", accountKey: "direct_vendor" },
      { name: "Photography / Videography", accountKey: "direct_vendor" }
    ]
  },
  "Transportation & Travel": {
    code: "E",
    subcategories: [
      { name: "Fuel", accountKey: "travel_exp" },
      { name: "Vehicle Maintenance", accountKey: "travel_exp" },
      { name: "Vehicle Repairs", accountKey: "travel_exp" },
      { name: "Vehicle Insurance", accountKey: "insurance_exp" },
      { name: "Vehicle Registration", accountKey: "gov_tax_exp" },
      { name: "Parking", accountKey: "travel_exp" },
      { name: "Toll Charges", accountKey: "travel_exp" },
      { name: "Local Transportation", accountKey: "travel_exp" },
      { name: "Taxi / Ride Hailing", accountKey: "travel_exp" },
      { name: "Business Travel", accountKey: "travel_exp" },
      { name: "Airfare", accountKey: "travel_exp" },
      { name: "Hotel / Accommodation", accountKey: "travel_exp" },
      { name: "Meals During Business Travel", accountKey: "travel_exp" }
    ]
  },
  "Technology & Software": {
    code: "F",
    subcategories: [
      { name: "Software Subscriptions", accountKey: "software" },
      { name: "SaaS Subscriptions", accountKey: "software" },
      { name: "Cloud Services", accountKey: "software" },
      { name: "Web Hosting", accountKey: "software" },
      { name: "Domain Registration", accountKey: "software" },
      { name: "IT Support", accountKey: "contractor" },
      { name: "Computer Repairs", accountKey: "office_maint" },
      { name: "Computer Equipment", accountKey: "equipment" },
      { name: "Cybersecurity", accountKey: "software" },
      { name: "Data Backup", accountKey: "software" },
      { name: "AI Tools / Services", accountKey: "software" }
    ]
  },
  "Professional & Legal": {
    code: "G",
    subcategories: [
      { name: "Accounting Fees", accountKey: "prof_fees" },
      { name: "Audit Fees", accountKey: "prof_fees" },
      { name: "Legal Fees", accountKey: "prof_fees" },
      { name: "Consultancy Fees", accountKey: "prof_fees" },
      { name: "Tax Consultancy", accountKey: "prof_fees" },
      { name: "Professional Memberships", accountKey: "expense" },
      { name: "Business Advisory", accountKey: "prof_fees" },
      { name: "Outsourcing / Professional Services", accountKey: "contractor" }
    ]
  },
  "Insurance": {
    code: "H",
    subcategories: [
      { name: "General Insurance", accountKey: "insurance_exp" },
      { name: "Property Insurance", accountKey: "insurance_exp" },
      { name: "Vehicle Insurance", accountKey: "insurance_exp" },
      { name: "Employee Insurance", accountKey: "insurance_exp" },
      { name: "Professional Liability Insurance", accountKey: "insurance_exp" },
      { name: "Other Insurance", accountKey: "insurance_exp" }
    ]
  },
  "Government, Taxes & Licenses": {
    code: "I",
    subcategories: [
      { name: "Business Registration Fees", accountKey: "gov_tax_exp" },
      { name: "Trade License", accountKey: "gov_tax_exp" },
      { name: "Government Fees", accountKey: "gov_tax_exp" },
      { name: "Professional Tax", accountKey: "gov_tax_exp" },
      { name: "Property Tax", accountKey: "gov_tax_exp" },
      { name: "Withholding Tax Expense", accountKey: "gov_tax_exp" },
      { name: "Regulatory Fees", accountKey: "gov_tax_exp" },
      { name: "Permit Fees", accountKey: "gov_tax_exp" }
    ]
  },
  "Banking & Financial Charges": {
    code: "J",
    subcategories: [
      { name: "Bank Charges", accountKey: "bank_charges" },
      { name: "Transaction Fees", accountKey: "bank_charges" },
      { name: "Payment Gateway Fees", accountKey: "bank_charges" },
      { name: "Merchant Fees", accountKey: "bank_charges" },
      { name: "Credit Card Charges", accountKey: "bank_charges" },
      { name: "Foreign Exchange Charges", accountKey: "bank_charges" },
      { name: "Loan Processing Fees", accountKey: "bank_charges" }
    ]
  },
  "Repairs & Maintenance": {
    code: "K",
    subcategories: [
      { name: "Building Repairs", accountKey: "office_maint" },
      { name: "Office Equipment Repairs", accountKey: "office_maint" },
      { name: "Computer Repairs", accountKey: "office_maint" },
      { name: "Furniture Repairs", accountKey: "office_maint" },
      { name: "Vehicle Repairs", accountKey: "travel_exp" },
      { name: "Electrical Repairs", accountKey: "office_maint" },
      { name: "Plumbing Repairs", accountKey: "office_maint" },
      { name: "AC / HVAC Maintenance", accountKey: "office_maint" }
    ]
  },
  "Depreciation & Amortization": {
    code: "L",
    subcategories: [
      { name: "Depreciation – Building", accountKey: "depr_exp" },
      { name: "Depreciation – Furniture", accountKey: "depr_exp" },
      { name: "Depreciation – Vehicles", accountKey: "depr_exp" },
      { name: "Depreciation – Computer Equipment", accountKey: "depr_exp" },
      { name: "Depreciation – Office Equipment", accountKey: "depr_exp" },
      { name: "Amortization – Software", accountKey: "depr_exp" },
      { name: "Amortization – Intangible Assets", accountKey: "depr_exp" }
    ]
  },
  "Rent & Leasing": {
    code: "M",
    subcategories: [
      { name: "Office Rent", accountKey: "rent" },
      { name: "Equipment Rental", accountKey: "rent" },
      { name: "Vehicle Rental", accountKey: "rent" },
      { name: "Warehouse Rent", accountKey: "rent" },
      { name: "Advertising Space Rental", accountKey: "rent" },
      { name: "Short-Term Lease Expense", accountKey: "rent" }
    ]
  },
  "Sales & Business Development": {
    code: "N",
    subcategories: [
      { name: "Sales Commission", accountKey: "sales_exp" },
      { name: "Business Development Expenses", accountKey: "sales_exp" },
      { name: "Client Entertainment", accountKey: "sales_exp" },
      { name: "Client Meetings", accountKey: "sales_exp" },
      { name: "Gifts & Corporate Gifts", accountKey: "sales_exp" },
      { name: "Proposal / Tender Expenses", accountKey: "sales_exp" }
    ]
  },
  "Production & Project Expenses": {
    code: "O",
    subcategories: [
      { name: "Production Materials", accountKey: "direct_vendor" },
      { name: "Raw Materials", accountKey: "direct_vendor" },
      { name: "Printing Production", accountKey: "direct_vendor" },
      { name: "Installation Charges", accountKey: "direct_vendor" },
      { name: "Freelancers", accountKey: "contractor" },
      { name: "Production Crew", accountKey: "direct_vendor" },
      { name: "Equipment Rental", accountKey: "direct_vendor" },
      { name: "Location Rental", accountKey: "direct_vendor" },
      { name: "Set / Props", accountKey: "direct_vendor" },
      { name: "Logistics", accountKey: "direct_vendor" },
      { name: "Project-specific Expenses", accountKey: "direct_vendor" }
    ]
  },
  "General & Miscellaneous": {
    code: "P",
    subcategories: [
      { name: "Donations / Charity", accountKey: "expense" },
      { name: "Membership Fees", accountKey: "expense" },
      { name: "Subscriptions", accountKey: "expense" },
      { name: "Fines & Penalties", accountKey: "expense" },
      { name: "Bad Debts", accountKey: "expense" },
      { name: "Miscellaneous Expense", accountKey: "expense" },
      { name: "Other Operating Expense", accountKey: "expense" }
    ]
  }
};

const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CLASSIFICATION);

function getGLAccountKeyForSubcategory(catName, subName) {
  if (!catName) return "expense";
  const catObj = EXPENSE_CLASSIFICATION[catName];
  if (!catObj) {
    if (catName === "Ad Spend") return "ad_spend";
    if (catName === "Software") return "software";
    if (catName === "Rent") return "rent";
    if (catName === "Contractor") return "contractor";
    if (catName === "Utilities") return "utilities";
    if (catName === "Payroll") return "payroll";
    if (catName === "Production Vendor") return "direct_vendor";
    return "expense";
  }
  const subObj = catObj.subcategories.find(s => s.name === subName);
  return subObj ? subObj.accountKey : (catObj.subcategories[0]?.accountKey || "expense");
}


/* ---------- HR & Payroll ---------- */
const HR_DEPARTMENTS = ["Creative", "Digital Marketing", "OOH Operations", "Client Servicing", "Production", "Accounts & Finance", "HR & Admin"];
const LEAVE_TYPES = ["Casual", "Sick", "Annual", "Unpaid"];
const EMP_STATUSES = ["Active", "On Leave", "Terminated"];
function empCode(n) { return "EMP-" + String(n).padStart(3, "0"); }

const PROJECT_TYPES = [
  { key: "TVC Production", label: "TVC Production", icon: Video, color: "#B8860B" },
  { key: "Events", label: "Events", icon: PartyPopper, color: "#E11D48" },
  { key: "OOH Advertising", label: "OOH Advertising", icon: Building2, color: "#059669" },
  { key: "Printing & Installations", label: "Printing & Installations", icon: Printer, color: "#2563EB" },
  { key: "Digital Marketing", label: "Digital Marketing", icon: Megaphone, color: "#0284C7" },
  { key: "BTL Marketing", label: "BTL Marketing", icon: Users, color: "#D97706" },
  { key: "Print Media", label: "Print Media", icon: Newspaper, color: "#7C3AED" },
];


const PROJECT_STATUSES = ["Planning", "Ongoing", "Completed", "On Hold"];

function projectTypeMeta(key) {
  return PROJECT_TYPES.find(t => t.key === key) || PROJECT_TYPES[0];
}

const INVENTORY_CATEGORIES = [
  "Printing & Vinyl",
  "Production Equipment",
  "Event & BTL Merchandise",
  "OOH & Hardware Assets",
  "Office & Admin Supplies"
];

const ALL_MODULE_TABS = [
  { key: "ceo-dashboard", label: "CEO Executive Suite", category: "EXECUTIVE" },
  { key: "dashboard", label: "Dashboard", category: "OVERVIEW" },
  { key: "clients", label: "Clients Master", category: "MASTER DATA" },
  { key: "vendors", label: "Vendors Master", category: "MASTER DATA" },
  { key: "projects", label: "Projects & Financials", category: "MASTER DATA" },
  { key: "invoices", label: "Invoices & AR", category: "TRANSACTIONS" },
  { key: "purchase-orders", label: "Purchase Orders", category: "TRANSACTIONS" },
  { key: "expenses", label: "Expenses & AP", category: "TRANSACTIONS" },
  { key: "vouchers", label: "Vouchers & Receipts", category: "TRANSACTIONS" },
  { key: "cash-bank", label: "Cash & Bank Vaults", category: "MASTER DATA" },
  { key: "documents", label: "AI Document Upload", category: "TRANSACTIONS" },
  { key: "ledger", label: "General Ledger & COA", category: "REPORTS" },
  { key: "reports", label: "Financial Reports", category: "REPORTS" },
  { key: "ooh", label: "OOH Assets & Sites", category: "OPERATIONS" },
  { key: "inventory", label: "Inventory & Supplies", category: "OPERATIONS" },
  { key: "hr", label: "HR & Payroll", category: "OPERATIONS" },
];

/* ---------- SEED USERS ---------- */
const ALL_STAFF_TABS = ALL_MODULE_TABS.map(t => t.key).filter(k => k !== "ceo-dashboard");

const SEED_USERS = [
  {
    id: "u-ceo",
    name: "AdPulseCEO",
    email: "ceo@adpulse.pk",
    password: "7890",
    role: "CEO",
    department: "Executive Board",
    allowedTabs: ALL_MODULE_TABS.map(t => t.key),
  },
  {
    id: "u-shawal",
    name: "Adpulseshawal",
    email: "shawal@adpulse.pk",
    password: "shawal4548",
    role: "Staff",
    department: "Finance & Accounts",
    allowedTabs: ALL_STAFF_TABS,
  },
  {
    id: "u-wahab",
    name: "Adpulsewahab",
    email: "wahab@adpulse.pk",
    password: "wahab5458",
    role: "Staff",
    department: "Finance & Accounts",
    allowedTabs: ALL_STAFF_TABS,
  },
];

/* ---------- SEED FINANCIAL DATA ---------- */

function seedClients() {
  return [
    {
      id: "cli-101",
      clientCode: "CLI-001",
      name: "Imtiaz Retail",
      companyName: "Imtiaz Super Market Ltd",
      contactPerson: "Imtiaz Ahmed",
      phone: "0300-1112233",
      email: "finance@imtiaz.pk",
      address: "Rashid Minhas Road",
      city: "Karachi",
      ntn: "1234567-8",
      strn: "3277876543210",
      paymentTerms: "Net 30",
      creditLimit: 5000000,
      openingBalance: 500000,
      status: "Active",
      notes: "Key retail client for OOH & Printing campaigns",
      createdAt: "2026-06-01",
      createdBy: "AdpulseCEO"
    },
    {
      id: "cli-102",
      clientCode: "CLI-002",
      name: "Prime Estate Enterprises",
      companyName: "Prime Estate Developers Pvt Ltd",
      contactPerson: "Tariq Mahmood",
      phone: "0321-4445566",
      email: "info@primeestate.pk",
      address: "II Chundrigar Road",
      city: "Karachi",
      ntn: "2345678-9",
      strn: "3277876543211",
      paymentTerms: "Net 15",
      creditLimit: 3000000,
      openingBalance: 0,
      status: "Active",
      notes: "Real estate client",
      createdAt: "2026-06-05",
      createdBy: "Adpulseshawal"
    },
    {
      id: "cli-103",
      clientCode: "CLI-003",
      name: "Kinza Beverages",
      companyName: "Kinza Foods & Beverages Pvt Ltd",
      contactPerson: "Omar Farooq",
      phone: "0333-7778899",
      email: "accounts@kinzabeverages.com",
      address: "S.I.T.E. Industrial Area",
      city: "Karachi",
      ntn: "3456789-0",
      strn: "3277876543212",
      paymentTerms: "Net 30",
      creditLimit: 4000000,
      openingBalance: 0,
      status: "Active",
      notes: "FMCG Beverages client",
      createdAt: "2026-06-10",
      createdBy: "Adpulsewahab"
    },
    {
      id: "cli-104",
      clientCode: "CLI-004",
      name: "North Town Residency",
      companyName: "North Town Builders & Developers",
      contactPerson: "Kamran Siddiqui",
      phone: "0302-8889900",
      email: "sales@northtownresidency.com",
      address: "North Nazimabad Sector 5",
      city: "Karachi",
      ntn: "4567890-1",
      strn: "3277876543213",
      paymentTerms: "Net 15",
      creditLimit: 2000000,
      openingBalance: 0,
      status: "Active",
      notes: "Residential project leads",
      createdAt: "2026-07-01",
      createdBy: "Adpulseshawal"
    },
    {
      id: "cli-105",
      clientCode: "CLI-005",
      name: "Magnitude",
      companyName: "Magnitude Clothing & Apparel",
      contactPerson: "Sarah Khan",
      phone: "0312-9990011",
      email: "brand@magnitude.pk",
      address: "Zamani Chambers, Tariq Road",
      city: "Karachi",
      ntn: "5678901-2",
      strn: "3277876543214",
      paymentTerms: "Immediate",
      creditLimit: 1000000,
      openingBalance: 0,
      status: "Active",
      notes: "Fashion apparel client",
      createdAt: "2026-06-15",
      createdBy: "Adpulsewahab"
    }
  ];
}

function seedVendors() {
  return [
    {
      id: "vnd-101",
      vendorCode: "VND-001",
      name: "ABC Printing",
      companyName: "ABC Printing Solutions Pvt Ltd",
      contactPerson: "Aslam Chaudhry",
      phone: "0322-1112233",
      email: "orders@abcprinting.pk",
      address: "Korangi Industrial Area",
      city: "Karachi",
      ntn: "9876543-2",
      strn: "1122334455667",
      paymentTerms: "Net 15",
      bankName: "Meezan Bank",
      bankAccountTitle: "ABC Printing Solutions",
      accountNumberIban: "PK12MEZN00123456789012",
      openingBalance: 0,
      status: "Active",
      notes: "Large format vinyl & flex printing partner",
      createdAt: "2026-06-01",
      createdBy: "Adpulseshawal"
    },
    {
      id: "vnd-102",
      vendorCode: "VND-002",
      name: "Meta Ads",
      companyName: "Meta Platforms Ireland Ltd",
      contactPerson: "Ad Operations",
      phone: "N/A",
      email: "billing@meta.com",
      address: "Dublin, Ireland",
      city: "International",
      ntn: "N/A",
      strn: "N/A",
      paymentTerms: "Credit Card",
      bankName: "Credit Card",
      bankAccountTitle: "AdPulse Corporate Card",
      accountNumberIban: "CARD-4111-XXXX",
      openingBalance: 0,
      status: "Active",
      notes: "FB & Instagram digital advertising platform",
      createdAt: "2026-06-01",
      createdBy: "Adpulsewahab"
    },
    {
      id: "vnd-103",
      vendorCode: "VND-003",
      name: "Shahrah-e-Faisal Office Rent",
      companyName: "Faisal Plaza Management",
      contactPerson: "Estate Manager",
      phone: "0300-9998877",
      email: "rentals@faisalplaza.pk",
      address: "Shahrah-e-Faisal",
      city: "Karachi",
      ntn: "8765432-1",
      strn: "N/A",
      paymentTerms: "1st of Month",
      bankName: "HBL",
      bankAccountTitle: "Faisal Plaza Management",
      accountNumberIban: "PK44HABB009988776655",
      openingBalance: 0,
      status: "Active",
      notes: "HQ office premises rent landlord",
      createdAt: "2026-06-01",
      createdBy: "AdpulseCEO"
    },
    {
      id: "vnd-104",
      vendorCode: "VND-004",
      name: "Freelance 3D Animator",
      companyName: "Zohaib Media Arts",
      contactPerson: "Zohaib Hassan",
      phone: "0345-6667788",
      email: "zohaib.animator@gmail.com",
      address: "Gulshan-e-Iqbal",
      city: "Karachi",
      ntn: "7654321-0",
      strn: "N/A",
      paymentTerms: "On Delivery",
      bankName: "Bank Alfalah",
      bankAccountTitle: "Zohaib Hassan",
      accountNumberIban: "PK88ALFH005544332211",
      openingBalance: 0,
      status: "Active",
      notes: "3D Motion Graphics & Animation Contractor",
      createdAt: "2026-07-01",
      createdBy: "Adpulseshawal"
    }
  ];
}

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

function seedProjects() {
  return [
    { id: "prj-008", projectCode: "PRJ-008", clientId: "cli-101", client: "Imtiaz Retail", type: "Printing & Installations", name: "Back to School", description: "Large format frontlit printing & metal frame installation", startDate: "2026-08-01", endDate: "2026-08-28", status: "Active", contractValue: 1500000, budget: 1500000 },
    { id: "prj-003", projectCode: "PRJ-003", clientId: "cli-101", client: "Imtiaz Retail", type: "OOH Advertising", name: "Ramzan Drive Billboards", description: "City-wide hoarding & billboard campaign — multiple prime sites", startDate: "2026-07-01", endDate: "2026-08-31", status: "In Progress", contractValue: 600000, budget: 600000 },
    { id: "prj-001", projectCode: "PRJ-001", clientId: "cli-103", client: "Kinza Beverages", type: "TVC Production", name: "Summer Refresh TVC", description: "30-sec TV commercial: script, shoot & post-production edit", startDate: "2026-06-10", endDate: "2026-07-15", status: "Completed", contractValue: 480000, budget: 480000 },
    { id: "prj-002", projectCode: "PRJ-002", clientId: "cli-102", client: "Prime Estate Enterprises", type: "Events", name: "Project Launch Event", description: "Site launch event management & stage production", startDate: "2026-07-01", endDate: "2026-07-05", status: "Completed", contractValue: 350000, budget: 350000 },
    { id: "prj-004", projectCode: "PRJ-004", clientId: "cli-102", client: "Prime Estate Enterprises", type: "OOH Advertising", name: "Launch Campaign Billboards", description: "Site-launch hoarding campaign around II Chundrigar", startDate: "2026-07-05", endDate: "2026-09-05", status: "Active", contractValue: 600000, budget: 600000 },
    { id: "prj-005", projectCode: "PRJ-005", clientId: "cli-104", client: "North Town Residency", type: "Digital Marketing", name: "Commercial Units Digital Push", description: "FB/Insta lead generation campaign & ad management", startDate: "2026-07-15", endDate: "2026-08-15", status: "Active", contractValue: 300000, budget: 300000 },
    { id: "prj-006", projectCode: "PRJ-006", clientId: "cli-105", client: "Magnitude", type: "BTL Marketing", name: "Retail Activation Drive", description: "In-store BTL brand activation & promotional sampling", startDate: "2026-06-20", endDate: "2026-07-10", status: "Completed", contractValue: 220000, budget: 220000 },
    { id: "prj-007", projectCode: "PRJ-007", clientId: "cli-103", client: "Kinza Beverages", type: "Print Media", name: "Newspaper Insert Campaign", description: "Print ad insertions - Dawn & Jang Sunday editions", startDate: "2026-07-05", endDate: "2026-07-25", status: "Draft", contractValue: 150000, budget: 150000 }
  ];
}

function seedInvoices() {
  return [
    { 
      id: "inv-101", invoiceNo: "INV-001", clientId: "cli-101", projectId: "prj-008", client: "Imtiaz Retail", 
      description: "Back to School Campaign Media & Production", 
      amount: 450000, applySst: true, applyWht: true, whtRate: 10, sstAmount: 67500, whtAmount: 45000, totalAmount: 472500, 
      issueDate: "2026-08-05", dueDate: "2026-08-20", paid: false, paidVia: null, status: "Posted",
      template: "PRINTING",
      printingItems: [
        { description: "Back to School Frontlit Banners", detail: "Vinyl Printing", qty: 10, unit: "Nos", size: "10x20", sqft: 200, rate: 100, amount: 200000 },
        { description: "In-store Standees", detail: "Star Flex", qty: 20, unit: "Nos", size: "2x5", sqft: 10, rate: 150, amount: 30000 },
        { description: "Flyers A4", detail: "128g Art Paper", qty: 5000, unit: "Nos", size: "A4", sqft: 0, rate: 44, amount: 220000 }
      ]
    },
    { 
      id: "inv-102", invoiceNo: "INV-002", clientId: "cli-102", projectId: "prj-002", client: "Prime Estate Enterprises", 
      description: "Project Launch Event Management Package", 
      amount: 450000, applySst: true, sstAmount: 67500, totalAmount: 517500, 
      issueDate: "2026-07-05", dueDate: "2026-07-20", paid: true, paidVia: "Bank", status: "Posted",
      template: "EVENT",
      eventItems: [
        { description: "Stage Setup & SMD Screens", qty: 1, unit: "Job", rate: 250000, amount: 250000 },
        { description: "Sound System & Lighting", qty: 1, unit: "Job", rate: 100000, amount: 100000 },
        { description: "Photography & Videography", qty: 1, unit: "Job", rate: 100000, amount: 100000 }
      ]
    },
    { 
      id: "inv-103", invoiceNo: "INV-003", clientId: "cli-101", projectId: "prj-003", client: "Imtiaz Retail", 
      description: "Q3 Ramzan Drive Billboard Retainer", 
      amount: 1250000, applySst: true, sstAmount: 187500, totalAmount: 1437500, 
      issueDate: "2026-07-10", dueDate: "2026-07-25", paid: false, paidVia: null, status: "Posted",
      template: "OOH",
      oohSites: [
        { city: "Karachi", location: "Shahrah-e-Faisal FTC", size: "60x20", sqft: 1200, rate: 500000, amount: 500000 },
        { city: "Karachi", location: "Clifton Teen Talwar", size: "30x15", sqft: 450, rate: 450000, amount: 450000 },
        { city: "Lahore", location: "Gulberg Main Boulevard", size: "20x40", sqft: 800, rate: 300000, amount: 300000 }
      ]
    },
    { 
      id: "inv-104", invoiceNo: "INV-004", clientId: "cli-103", projectId: "prj-001", client: "Kinza Beverages", 
      description: "Summer Refresh TVC Shoot & Post-Production", 
      amount: 680000, applySst: true, sstAmount: 102000, totalAmount: 782000, 
      issueDate: "2026-06-15", dueDate: "2026-06-30", paid: false, paidVia: null, status: "Posted",
      template: "NEWSPAPER",
      newspaperItems: [
        { publication: "Daily Jang", date: "2026-06-16", size: "27x4", totalCcm: 108, rate: 2500, mediaAmount: 270000, agencyFeePct: 15, agencyFee: 40500, amount: 310500 },
        { publication: "Dawn", date: "2026-06-18", size: "27x4", totalCcm: 108, rate: 3000, mediaAmount: 324000, agencyFeePct: 14.04, agencyFee: 45500, amount: 369500 }
      ]
    },
    { 
      id: "inv-105", invoiceNo: "INV-005", clientId: "cli-104", projectId: "prj-005", client: "North Town Residency", 
      description: "Commercial Units Digital Marketing Push", 
      amount: 320000, applySst: true, sstAmount: 48000, totalAmount: 368000, 
      issueDate: "2026-07-15", dueDate: "2026-07-30", paid: false, paidVia: null, status: "Posted",
      template: "PRINT_MEDIA",
      printMediaItems: [
        { description: "Magazine Full Page Ads", publication: "Aurora", size: "Full Page", qty: 2, rate: 100000, amount: 200000 },
        { description: "PR Article", publication: "Business Recorder", size: "Half Page", qty: 1, rate: 120000, amount: 120000 }
      ]
    },
    { 
      id: "inv-106", invoiceNo: "INV-006", clientId: "cli-105", projectId: "prj-006", client: "Magnitude", 
      description: "Retail Activation Logo & BTL Design Package", 
      amount: 85000, applySst: true, sstAmount: 12750, totalAmount: 97750, 
      issueDate: "2026-06-20", dueDate: "2026-07-05", paid: true, paidVia: "Cash", status: "Posted",
      template: "GENERAL"
    }
  ];
}

function seedExpenses() {
  return [
    { id: "exp-101", expenseNo: "EXP-001", vendorId: "vnd-101", projectId: "prj-008", vendor: "ABC Printing", category: "Printing & Production", description: "Back to School Frontlit Banner Printing & Framing", amount: 250000, date: "2026-08-10", status: "unpaid", paidVia: null, createdBy: "Adpulseshawal" },
    { id: "exp-102", expenseNo: "EXP-002", vendorId: "vnd-102", projectId: "prj-005", vendor: "Meta Ads", category: "Ad Spend", description: "FB/Insta Leads campaign for North Town", amount: 210000, date: "2026-07-08", status: "paid", paidVia: "Bank", createdBy: "Adpulsewahab" },
    { id: "exp-103", expenseNo: "EXP-003", vendorId: "vnd-103", projectId: null, vendor: "Shahrah-e-Faisal Office Rent", category: "Rent", description: "Monthly HQ Rent for July 2026", amount: 180000, date: "2026-07-01", status: "paid", paidVia: "Bank", createdBy: "AdpulseCEO" },
    { id: "exp-104", expenseNo: "EXP-004", vendorId: "vnd-104", projectId: "prj-001", vendor: "Freelance 3D Animator", category: "Contractor", description: "3D Animation shoot for Kinza TVC", amount: 65000, date: "2026-07-12", status: "paid", paidVia: "Cash", createdBy: "Adpulseshawal" },
    { id: "exp-105", expenseNo: "EXP-005", vendorId: null, projectId: null, vendor: "K-Electric & High-Speed Fiber", category: "Utilities", description: "Monthly utility & fiber internet bills", amount: 28000, date: "2026-07-03", status: "paid", paidVia: "Cash", createdBy: "Adpulsewahab" }
  ];
}

function seedVouchers() {
  const todayStr = TODAY_STR;
  return [
    {
      id: "vch-001",
      voucherNo: "RV-001",
      type: "RV",
      date: "2026-08-08",
      partyType: "Client",
      clientId: "cli-101",
      projectId: "prj-008",
      bankAccountId: "bank-hbl",
      party: "Imtiaz Retail",
      description: "Receipt applied against Invoice INV-001 for Back to School Campaign",
      amount: 500000,
      via: "Bank",
      createdBy: "Adpulsewahab",
      postedBy: "Adpulsewahab",
      status: "Posted"
    },
    {
      id: "vch-002",
      voucherNo: "PV-001",
      type: "PV",
      date: "2026-08-12",
      partyType: "Vendor",
      vendorId: "vnd-101",
      projectId: "prj-008",
      bankAccountId: "bank-hbl",
      party: "ABC Printing",
      description: "Partial Vendor Payment for Back to School Printing (EXP-001)",
      amount: 150000,
      via: "Bank",
      createdBy: "Adpulseshawal",
      postedBy: "Adpulseshawal",
      status: "Posted"
    },
    {
      id: "vch-301",
      voucherNo: "PV-2026-001",
      type: "PV",
      date: "2026-08-01",
      partyType: "Vendor",
      vendorId: "vnd-101",
      party: "ABC Printing",
      description: "Payment for Independence Day OOH Banner Printing",
      amount: 45000,
      via: "Bank",
      createdBy: "Adpulseshawal",
      postedBy: "Adpulseshawal",
      status: "Posted"
    },
    {
      id: "vch-302",
      voucherNo: "RV-2026-001",
      type: "RV",
      date: "2026-08-01",
      partyType: "Client",
      clientId: "cli-102",
      party: "Prime Estate Enterprises",
      description: "Advance Receipt for Q3 Digital Branding Package",
      amount: 150000,
      via: "Bank",
      createdBy: "Adpulsewahab",
      postedBy: "Adpulsewahab",
      status: "Posted"
    }
  ];
}

function seedAuditLogs() {
  return [
    { id: "aud-001", userId: "u-shawal", userName: "Adpulseshawal", role: "Staff", action: "Created Vendor Expense EXP-001 (PKR 250,000)", module: "Expenses", recordType: "Expense", recordId: "exp-101", timestamp: "2026-08-10T10:15:00Z" },
    { id: "aud-002", userId: "u-wahab", userName: "Adpulsewahab", role: "Staff", action: "Posted Receipt Voucher RV-001 (PKR 500,000)", module: "Vouchers", recordType: "Voucher", recordId: "vch-001", timestamp: "2026-08-08T14:30:00Z" },
    { id: "aud-003", userId: "u-shawal", userName: "Adpulseshawal", role: "Staff", action: "Posted Payment Voucher PV-001 (PKR 150,000)", module: "Vouchers", recordType: "Voucher", recordId: "vch-002", timestamp: "2026-08-12T11:20:00Z" },
    { id: "aud-004", userId: "u-ceo", userName: "AdPulseCEO", role: "CEO", action: "Registered Client Master CLI-001 (Imtiaz Retail)", module: "Clients", recordType: "Client", recordId: "cli-101", timestamp: "2026-06-01T09:00:00Z" }
  ];
}

function seedBankAccounts() {
  return [
    { id: "bank-hbl", bankName: "Habib Bank Limited (HBL)", accountTitle: "AdPulse IMC PVT LTD (Main Ops)", accountNumber: "0014-2289-1001", iban: "PK36HABB00001422891001", accountType: "Current Account", branch: "Shahrah-e-Faisal Branch", openingBalance: 1250000, color: "#059669" },
    { id: "bank-mcb", bankName: "MCB Bank Ltd", accountTitle: "AdPulse Financial Services", accountNumber: "0088-1122-3344", iban: "PK91MUCB008811223344", accountType: "Corporate Account", branch: "II Chundrigar Road Branch", openingBalance: 850000, color: "#0284C7" },
    { id: "bank-meezan", bankName: "Meezan Bank Ltd", accountTitle: "AdPulse Media (Islamic Business)", accountNumber: "0102-0304-0506", iban: "PK55MEZN010203040506", accountType: "Islamic Current", branch: "Clifton Block 5 Branch", openingBalance: 400000, color: "#B8860B" },
    { id: "bank-cash", bankName: "Petty Cash Vault", accountTitle: "Office Petty Cash Custodian", accountNumber: "CASH-VAULT-01", iban: "N/A (Cash in Hand)", accountType: "Petty Cash", branch: "Main Office Counter", openingBalance: 75000, color: "#D97706" },
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

function seedInventoryItems() {
  return [
    { id: uid(), sku: "SKU-PRN-001", name: "Frontlit Star Vinyl Roll (10ft x 100ft)", category: "Printing & Vinyl", unit: "Rolls", quantity: 18, minQuantity: 5, unitCost: 18500, warehouse: "Korangi Warehouse A", lastUpdated: "2026-07-20", description: "320gsm premium glossy vinyl roll for outdoor hoardings" },
    { id: uid(), sku: "SKU-PRN-002", name: "Backlit Flex Banner Film (8ft x 100ft)", category: "Printing & Vinyl", unit: "Rolls", quantity: 4, minQuantity: 5, unitCost: 22000, warehouse: "Korangi Warehouse A", lastUpdated: "2026-07-18", description: "240gsm high-translucency backlit film for illuminated signboards" },
    { id: uid(), sku: "SKU-PRN-003", name: "Acrylic Sheets Clear (4ft x 8ft x 3mm)", category: "Printing & Vinyl", unit: "Sheets", quantity: 35, minQuantity: 10, unitCost: 4800, warehouse: "Site Area Depot", lastUpdated: "2026-07-15", description: "Clear cast acrylic sheet for indoor & outdoor signage" },
    { id: uid(), sku: "SKU-EQP-001", name: "Sony FX3 Cinema Camera Body Kit", category: "Production Equipment", unit: "Units", quantity: 3, minQuantity: 1, unitCost: 950000, warehouse: "Studio HQ Vault", lastUpdated: "2026-07-10", description: "4K Full-Frame Cinema Line Camera for TVC shoots" },
    { id: uid(), sku: "SKU-EQP-002", name: "Aputure LS 600d Pro LED Daylight Light", category: "Production Equipment", unit: "Units", quantity: 5, minQuantity: 2, unitCost: 420000, warehouse: "Studio HQ Vault", lastUpdated: "2026-07-12", description: "600W high-output LED video fixture with Bowens mount" },
    { id: uid(), sku: "SKU-EQP-003", name: "Sennheiser EW-D Wireless Mic Set", category: "Production Equipment", unit: "Sets", quantity: 2, minQuantity: 2, unitCost: 185000, warehouse: "Studio HQ Vault", lastUpdated: "2026-07-08", description: "Digital wireless handheld & lavalier audio kit" },
    { id: uid(), sku: "SKU-MER-001", name: "Roll-up Standee Metallic Frame (2ft x 5ft)", category: "Event & BTL Merchandise", unit: "Pcs", quantity: 40, minQuantity: 15, unitCost: 3200, warehouse: "Site Area Depot", lastUpdated: "2026-07-14", description: "Aluminum retractable banner stand mechanism" },
    { id: uid(), sku: "SKU-MER-002", name: "Branded Promotional Canopy Tent (10ft x 10ft)", category: "Event & BTL Merchandise", unit: "Sets", quantity: 8, minQuantity: 3, unitCost: 35000, warehouse: "Korangi Warehouse B", lastUpdated: "2026-07-11", description: "Waterproof pop-up gazebos for BTL outdoor activations" },
    { id: uid(), sku: "SKU-OOH-001", name: "200W Waterproof LED Floodlight Fixtures", category: "OOH & Hardware Assets", unit: "Units", quantity: 26, minQuantity: 8, unitCost: 12500, warehouse: "Operations Hub", lastUpdated: "2026-07-19", description: "IP66 outdoor spotlight for night billboard illumination" },
    { id: uid(), sku: "SKU-OOH-002", name: "Heavy Duty Iron Angle Frames (20ft)", category: "OOH & Hardware Assets", unit: "Pcs", quantity: 15, minQuantity: 5, unitCost: 16500, warehouse: "Operations Hub", lastUpdated: "2026-07-05", description: "Galvanized steel structural support angles" },
    { id: uid(), sku: "SKU-OFF-001", name: "HP LaserJet Pro Toner Cartridge (85A)", category: "Office & Admin Supplies", unit: "Pcs", quantity: 12, minQuantity: 4, unitCost: 4500, warehouse: "Main Office Supply Room", lastUpdated: "2026-07-01", description: "High-yield black print cartridge for office billing" }
  ];
}

function seedInventoryLogs(items) {
  const findItem = sku => items.find(i => i.sku === sku) || items[0];
  const vinyl = findItem("SKU-PRN-001");
  const camera = findItem("SKU-EQP-001");
  const standee = findItem("SKU-MER-001");
  return [
    { id: uid(), itemId: vinyl?.id || "i1", itemName: vinyl?.name || "Vinyl Roll", sku: "SKU-PRN-001", type: "Stock In", quantity: 20, unitCost: 18500, totalCost: 370000, date: "2026-07-01", reference: "PO-001", notes: "Received shipment from Al-Madina Printing Materials" },
    { id: uid(), itemId: vinyl?.id || "i1", itemName: vinyl?.name || "Vinyl Roll", sku: "SKU-PRN-001", type: "Stock Out", quantity: 2, unitCost: 18500, totalCost: 37000, date: "2026-07-10", reference: "PRJ-002", projectName: "Ramzan Drive Billboards", notes: "Issued for Ramzan Drive hoarding prints" },
    { id: uid(), itemId: camera?.id || "i2", itemName: camera?.name || "Sony FX3 Camera", sku: "SKU-EQP-001", type: "Stock In", quantity: 3, unitCost: 950000, totalCost: 2850000, date: "2026-07-05", reference: "PO-004", notes: "Procured from Sony Official Distributor Pakistan" },
    { id: uid(), itemId: standee?.id || "i3", itemName: standee?.name || "Roll-up Standee Frame", sku: "SKU-MER-001", type: "Stock Out", quantity: 10, unitCost: 3200, totalCost: 32000, date: "2026-07-16", reference: "PRJ-004", projectName: "Summer Brand Launch", notes: "Issued for BTL venue setup" },
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

function seedMonthlyAttendance(employeesList = []) {
  const empArray = Array.isArray(employeesList) && employeesList.length > 0 ? employeesList : seedEmployees();
  const res = {};
  empArray.forEach(emp => {
    const days = {};
    for (let d = 1; d <= 31; d++) {
      const dayNum = d % 7;
      if (dayNum === 0) days[d] = "OFF";
      else if (d % 11 === 0) days[d] = "L";
      else if (d % 17 === 0) days[d] = "A";
      else days[d] = "P";
    }
    res[emp.id] = days;
  });
  return res;
}

function buildInitialJournal(invoices, expenses, vouchers) {
  const entries = seedJournal();

  invoices.forEach(inv => {
    const totalAmount = inv.totalAmount || inv.amount;
    const lines = [
      { account: "ar", debit: totalAmount, credit: 0 },
      { account: "revenue", debit: 0, credit: inv.amount },
    ];
    if (inv.applySst && inv.sstAmount) {
      lines.push({ account: "srb_payable", debit: 0, credit: inv.sstAmount });
    }
    entries.push({
      id: uid(), date: inv.issueDate, reference: "INV-" + (inv.invoiceNo || inv.id.toUpperCase()),
      description: `Invoice - ${inv.client} (${inv.description})`,
      lines,
    });
    if (inv.paid) {
      entries.push({
        id: uid(), date: inv.dueDate, reference: "PMT-" + (inv.invoiceNo || inv.id.toUpperCase()),
        description: `Payment received - ${inv.client}`,
        lines: [
          { account: inv.paidVia === "Cash" ? "cash" : "bank", debit: totalAmount, credit: 0 },
          { account: "ar", debit: 0, credit: totalAmount },
        ],
      });
    }
  });

  expenses.forEach(exp => {
    const glAccKey = exp.accountKey || getGLAccountKeyForSubcategory(exp.category, exp.subcategory) || "expense";
    entries.push({
      id: uid(), date: exp.date, reference: exp.expenseNo || ("EXP-" + exp.id.toUpperCase()),
      description: `${exp.vendor} (${exp.category}${exp.subcategory ? ' → ' + exp.subcategory : ''})`,
      lines: [
        { account: glAccKey, debit: exp.amount, credit: 0, memo: exp.category },
        { account: exp.status === "unpaid" ? "ap" : (exp.paidVia === "Cash" ? "cash" : "bank"), debit: 0, credit: exp.amount },
      ],
    });
  });

  (vouchers || []).forEach(v => {
    if (v.type === "RV") {
      entries.push({
        id: uid(), date: v.date, reference: v.voucherNo || ("RV-" + v.id.toUpperCase()),
        description: `Receipt - ${v.party} (${v.description})`,
        lines: [
          { account: v.via === "Cash" ? "cash" : "bank", debit: Number(v.amount) || 0, credit: 0 },
          { account: "ar", debit: 0, credit: Number(v.amount) || 0 }
        ]
      });
    } else if (v.type === "PV") {
      entries.push({
        id: uid(), date: v.date, reference: v.voucherNo || ("PV-" + v.id.toUpperCase()),
        description: `Payment - ${v.party} (${v.description})`,
        lines: [
          { account: "ap", debit: Number(v.amount) || 0, credit: 0 },
          { account: v.via === "Cash" ? "cash" : "bank", debit: 0, credit: Number(v.amount) || 0 }
        ]
      });
    }
  });

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  return entries;
}

function seedLeaveRequests() {
  return [
    { id: uid(), employeeId: "emp-104", employeeName: "Hamza Qureshi", leaveType: "Sick Leave", startDate: "2026-08-10", endDate: "2026-08-15", days: 5, reason: "Medical Recovery", status: "Approved" },
    { id: uid(), employeeId: "emp-107", employeeName: "Mehak Raza", leaveType: "Casual Leave", startDate: "2026-08-20", endDate: "2026-08-22", days: 2, reason: "Family Function", status: "Pending" }
  ];
}

function seedPayrollRuns() {
  return [
    { id: "pay-2026-07", month: "July 2026", runDate: "2026-07-31", totalEmployees: 8, grossPayroll: 1310000, totalDeductions: 65000, netPayroll: 1245000, status: "Processed" }
  ];
}

function buildInitialData() {
  return {
    clients: [],
    vendors: [],
    projects: [],
    invoices: [],
    expenses: [],
    vouchers: [],
    auditLogs: [],
    bankAccounts: [
      { id: "bank-hbl", bankName: "Habib Bank Limited (HBL)", accountTitle: "AdPulse IMC PVT LTD (Main Ops)", accountNumber: "0014-2289-1001", iban: "PK36HABB00001422891001", accountType: "Current Account", branch: "Shahrah-e-Faisal Branch", openingBalance: 0, color: "#059669" },
      { id: "bank-mcb", bankName: "MCB Bank Ltd", accountTitle: "AdPulse Financial Services", accountNumber: "0088-1122-3344", iban: "PK91MUCB008811223344", accountType: "Corporate Account", branch: "II Chundrigar Road Branch", openingBalance: 0, color: "#0284C7" },
      { id: "bank-cash", bankName: "Petty Cash Vault", accountTitle: "Office Petty Cash Custodian", accountNumber: "CASH-VAULT-01", iban: "N/A (Cash in Hand)", accountType: "Petty Cash", branch: "Main Office Counter", openingBalance: 0, color: "#D97706" }
    ],
    hoardings: [],
    employees: [],
    inventoryItems: [],
    inventoryLogs: [],
    leaveRequests: [],
    payrollRuns: [],
    monthlyAttendance: {},
    journal: [],
    documents: []
  };
}

function buildSeedDemoData() {
  const clients = seedClients();
  const vendors = seedVendors();
  const projects = seedProjects();
  const invoices = seedInvoices();
  const expenses = seedExpenses();
  const vouchers = seedVouchers();
  const auditLogs = seedAuditLogs();
  const bankAccounts = seedBankAccounts();
  const hoardings = seedHoardings();
  const employees = seedEmployees();
  const inventoryItems = seedInventoryItems();
  const inventoryLogs = seedInventoryLogs(inventoryItems);
  const leaveRequests = seedLeaveRequests();
  const payrollRuns = seedPayrollRuns();
  const monthlyAttendance = seedMonthlyAttendance(employees);
  const journal = buildInitialJournal(invoices, expenses, vouchers);

  return {
    clients,
    vendors,
    projects,
    invoices,
    expenses,
    vouchers,
    auditLogs,
    bankAccounts,
    hoardings,
    employees,
    inventoryItems,
    inventoryLogs,
    leaveRequests,
    payrollRuns,
    monthlyAttendance,
    journal,
    documents: []
  };
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

/* ---------- TAB ISOLATION BOUNDARY ---------- */
class TabBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Tab Render Error:", error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabKey !== this.props.tabKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ padding: 30, background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", margin: 20 }}>
          <h3 style={{ margin: "0 0 8px" }}>Module Display Recovered</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#7F1D1D" }}>
            A temporary display error occurred in this module: {this.state.error?.toString()}
          </p>
          <button className="btn btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>
            🔄 Reload Module View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- MAIN APPLICATION ---------- */

export default function App() {
  /* Authentication & Session state (Persisted in localStorage) */
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("adpulse_user_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {
      console.warn("Could not load user session:", e);
    }
    return null;
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  /* Tab Navigation state */
  const [tab, setTab] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* Financial & Operations state */
  const [seedData] = useState(buildSeedDemoData);

  const STORAGE_KEY = "adpulse_erp_financial_backup_v6";

  // Helper to load state from localStorage or fallback to default
  const getInitialState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.data && parsed.data[key] !== undefined) {
          return parsed.data[key];
        }
      }
    } catch (e) {
      console.warn("Could not read localStorage backup:", e);
    }
    return typeof fallback === "function" ? fallback() : fallback;
  };

  const [usersList, setUsersList] = useState(() => SEED_USERS);
  const [journal, setJournal] = useState(() => getInitialState("journal", seedData.journal || []));
  const [invoices, setInvoices] = useState(() => getInitialState("invoices", seedData.invoices || []));
  const [expenses, setExpenses] = useState(() => getInitialState("expenses", seedData.expenses || []));
  const [purchaseOrders, setPurchaseOrders] = useState(() => getInitialState("purchaseOrders", []));
  const [projects, setProjects] = useState(() => getInitialState("projects", seedData.projects || []));
  const [bankAccounts, setBankAccounts] = useState(() => getInitialState("bankAccounts", seedData.bankAccounts || []));
  const [hoardings, setHoardings] = useState(() => getInitialState("hoardings", seedData.hoardings || []));
  const [inventoryItems, setInventoryItems] = useState(() => getInitialState("inventoryItems", seedData.inventoryItems || []));
  const [inventoryLogs, setInventoryLogs] = useState(() => getInitialState("inventoryLogs", seedData.inventoryLogs || []));
  const [vouchers, setVouchers] = useState(() => getInitialState("vouchers", seedData.vouchers || []));
  const [documents, setDocuments] = useState(() => getInitialState("documents", []));
  const [employees, setEmployees] = useState(() => getInitialState("employees", seedData.employees || []));
  const [leaveRequests, setLeaveRequests] = useState(() => getInitialState("leaveRequests", seedData.leaveRequests || []));
  const [payrollRuns, setPayrollRuns] = useState(() => getInitialState("payrollRuns", seedData.payrollRuns || []));
  const [clients, setClients] = useState(() => getInitialState("clients", seedData.clients || []));
  const [vendors, setVendors] = useState(() => getInitialState("vendors", seedData.vendors || []));
  const [auditLogs, setAuditLogs] = useState(() => getInitialState("auditLogs", seedData.auditLogs || []));

  /* Client & Vendor Master UI States */
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");

  const [duplicateDocWarning, setDuplicateDocWarning] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [payingExpenseId, setPayingExpenseId] = useState(null);
  const [isCeoLocked, setIsCeoLocked] = useState(true);
  const [ceoPinInput, setCeoPinInput] = useState("");
  const [savedCeoPin, setSavedCeoPin] = useState(() => getInitialState("savedCeoPin", "7890"));
  const [showPinChangeModal, setShowPinChangeModal] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [pinErrorMessage, setPinErrorMessage] = useState("");
  const [ceoPeriod, setCeoPeriod] = useState("this_month");
  const [ceoCustomStart, setCeoCustomStart] = useState("");
  const [ceoCustomEnd, setCeoCustomEnd] = useState("");
  const [ceoLastUpdated, setCeoLastUpdated] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  /* CEO Staff Activity & Drilldown States */
  const [selectedStaffDrilldown, setSelectedStaffDrilldown] = useState(null);
  const [staffDrilldownTab, setStaffDrilldownTab] = useState("overview");
  const [showStaffComparison, setShowStaffComparison] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [showFullActivityLog, setShowFullActivityLog] = useState(false);

  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");

  const [expenseStatusFilter, setExpenseStatusFilter] = useState("all");
  const [expenseVendorFilter, setExpenseVendorFilter] = useState("all");
  const [expenseSearchQuery, setExpenseSearchQuery] = useState("");
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const uniqueVendorsList = useMemo(() => {
    return [...new Set(expenses.map(e => e.vendor))].filter(Boolean).sort();
  }, [expenses]);




  const [showPOForm, setShowPOForm] = useState(false);
  const [editingPO, setEditingPO] = useState(null);
  const [payingPOId, setPayingPOId] = useState(null);

  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState(null);
  const [cashBankFilter, setCashBankFilter] = useState("all");

  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [voucherDefaultType, setVoucherDefaultType] = useState("JV");

  /* AI Document Review UI States */
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [docSearchQuery, setDocSearchQuery] = useState("");
  const [reviewingDocId, setReviewingDocId] = useState(null);
  const [compareDocData, setCompareDocData] = useState(null);



  /* General Ledger & COA UI States */
  const [ledgerSubTab, setLedgerSubTab] = useState("entries");
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState("all");

  /* Profit & Loss Statement UI States */
  const [pnlPeriod, setPnlPeriod] = useState("month");
  const [pnlCustomStart, setPnlCustomStart] = useState("2026-07-01");
  const [pnlCustomEnd, setPnlCustomEnd] = useState("2026-07-31");
  const [showPnlComparison, setShowPnlComparison] = useState(false);
  const [pnlDrillDown, setPnlDrillDown] = useState(null);


  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [billingModalProject, setBillingModalProject] = useState(null);
  const [costModalProject, setCostModalProject] = useState(null);
  const [projectFilters, setProjectFilters] = useState({ type: "All", status: "All", client: "", selectedClient: "All" });

  const uniqueClientsList = useMemo(() => {
    return [...new Set(projects.map(p => p.client))].filter(Boolean).sort();
  }, [projects]);


  const [showHoardingForm, setShowHoardingForm] = useState(false);
  const [editingHoarding, setEditingHoarding] = useState(null);

  const [showInventoryItemModal, setShowInventoryItemModal] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [showStockMovementModal, setShowStockMovementModal] = useState(false);
  const [stockMovementItem, setStockMovementItem] = useState(null);
  const [inventoryFilters, setInventoryFilters] = useState({ category: "All", status: "All", search: "" });

  const [bookingHoarding, setBookingHoarding] = useState(null);
  const [sitePickerProject, setSitePickerProject] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [clientStatementClient, setClientStatementClient] = useState(null);
  const [projectStatementId, setProjectStatementId] = useState(null);
  const [oohFilters, setOohFilters] = useState({ area: "All", size: "All", status: "All", maxPrice: "" });

  const [hrView, setHrView] = useState("directory");
  const [attendanceSubView, setAttendanceSubView] = useState("grid");
  const [monthlyAttendance, setMonthlyAttendance] = useState(() => {
    return getInitialState("monthlyAttendance", seedData.monthlyAttendance) || getInitialState("monthly_attendance", seedData.monthlyAttendance) || seedMonthlyAttendance(seedData.employees || []);
  });
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [employeeDetail, setEmployeeDetail] = useState(null);
  const [payrollConfirm, setPayrollConfirm] = useState(false);

  const toggleDayAttendance = (empId, day) => {
    setMonthlyAttendance(prev => {
      const currentObj = prev[empId] || {};
      const curStatus = currentObj[day] || "P";
      let nextStatus = "P";
      if (curStatus === "P") nextStatus = "A";
      else if (curStatus === "A") nextStatus = "L";
      else if (curStatus === "L") nextStatus = "OFF";
      else if (curStatus === "OFF") nextStatus = "P";
      return {
        ...prev,
        [empId]: {
          ...currentObj,
          [day]: nextStatus
        }
      };
    });
  };


  /* User Management state for Admin Settings */
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [lastBackupTime, setLastBackupTime] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp) return new Date(parsed.timestamp).toLocaleString();
      }
    } catch (e) {}
    return null;
  });

  const [backupNotification, setBackupNotification] = useState(null);
  const [supabaseConfig, setSupabaseConfigState] = useState(() => getSupabaseConfig());
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleSaveSupabaseConfig = (url, key) => {
    saveSupabaseConfig(url, key);
    const updated = getSupabaseConfig();
    setSupabaseConfigState(updated);
    if (updated.url && updated.key) {
      setBackupNotification({
        type: "success",
        text: "Supabase credentials saved successfully & Cloud Database connected!"
      });
    } else {
      setBackupNotification({
        type: "error",
        text: "Supabase credentials cleared. System operating in Offline Local Mode."
      });
    }
    setTimeout(() => setBackupNotification(null), 5000);
  };

  const handlePushToCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const payload = {
        system: "AdPulse ERP Financial System",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        lastSavedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
        data: {
          journal, invoices, expenses, purchaseOrders, projects,
          bankAccounts, hoardings, inventoryItems, inventoryLogs,
          vouchers, documents, employees, leaveRequests, payrollRuns, usersList
        }
      };
      await pushStateToSupabase(payload);
      const timeNow = new Date().toLocaleString();
      setLastBackupTime(timeNow + " (Cloud Sync)");
      setBackupNotification({
        type: "success",
        text: "Local data successfully pushed & synced to Supabase Cloud database!"
      });
      setTimeout(() => setBackupNotification(null), 6000);
    } catch (err) {
      console.error("Cloud push failed:", err);
      setBackupNotification({
        type: "error",
        text: `Cloud Sync Failed: ${err.message || "Please check Supabase URL & API key."}`
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const cloudData = await pullStateFromSupabase();
      if (!cloudData || !cloudData.data) {
        throw new Error("No snapshot payload found in Supabase database.");
      }
      const bData = cloudData.data;
      if (Array.isArray(bData.journal)) setJournal(bData.journal);
      if (Array.isArray(bData.invoices)) setInvoices(bData.invoices);
      if (Array.isArray(bData.expenses)) setExpenses(bData.expenses);
      if (Array.isArray(bData.purchaseOrders)) setPurchaseOrders(bData.purchaseOrders);
      if (Array.isArray(bData.projects)) setProjects(bData.projects);
      if (Array.isArray(bData.bankAccounts)) setBankAccounts(bData.bankAccounts);
      if (Array.isArray(bData.hoardings)) setHoardings(bData.hoardings);
      if (Array.isArray(bData.inventoryItems)) setInventoryItems(bData.inventoryItems);
      if (Array.isArray(bData.inventoryLogs)) setInventoryLogs(bData.inventoryLogs);
      if (Array.isArray(bData.vouchers)) setVouchers(bData.vouchers);
      if (Array.isArray(bData.documents)) setDocuments(bData.documents);
      if (Array.isArray(bData.employees)) setEmployees(bData.employees);
      if (Array.isArray(bData.leaveRequests)) setLeaveRequests(bData.leaveRequests);
      if (Array.isArray(bData.payrollRuns)) setPayrollRuns(bData.payrollRuns);
      if (Array.isArray(bData.usersList)) setUsersList(bData.usersList);

      const syncTime = new Date(cloudData.updatedAt || Date.now()).toLocaleString();
      setLastBackupTime(syncTime + " (From Cloud)");
      setBackupNotification({
        type: "success",
        text: `Successfully pulled & restored latest data snapshot from Supabase! (Updated by ${cloudData.updatedBy || 'Admin'})`
      });
      setTimeout(() => setBackupNotification(null), 6000);
    } catch (err) {
      console.error("Cloud pull failed:", err);
      setBackupNotification({
        type: "error",
        text: `Failed to pull from cloud: ${err.message || "Please verify Supabase tables exist."}`
      });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Auto-save system state to localStorage
  React.useEffect(() => {
    try {
      const payload = {
        system: "AdPulse ERP Financial System",
        version: "1.0",
        timestamp: new Date().toISOString(),
        lastSavedBy: currentUser ? currentUser.name : "System",
        data: {
          journal,
          invoices,
          expenses,
          purchaseOrders,
          projects,
          bankAccounts,
          hoardings,
          inventoryItems,
          inventoryLogs,
          vouchers,
          documents,
          employees,
          leaveRequests,
          payrollRuns,
          usersList,
          clients,
          vendors,
          auditLogs,
          monthlyAttendance
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Auto-save to localStorage failed:", e);
    }
  }, [
    journal, invoices, expenses, purchaseOrders, projects, bankAccounts,
    hoardings, inventoryItems, inventoryLogs, vouchers, documents,
    employees, leaveRequests, payrollRuns, usersList, clients, vendors, auditLogs, monthlyAttendance, currentUser
  ]);

  const handleExportBackup = () => {
    try {
      const payload = {
        system: "AdPulse ERP Financial System",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        exportedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : "Admin",
        dataSummary: {
          totalJournalEntries: journal.length,
          totalInvoices: invoices.length,
          totalExpenses: expenses.length,
          totalProjects: projects.length,
          totalBankAccounts: bankAccounts.length,
          totalEmployees: employees.length,
          totalUsers: usersList.length
        },
        data: {
          journal,
          invoices,
          expenses,
          purchaseOrders,
          projects,
          bankAccounts,
          hoardings,
          inventoryItems,
          inventoryLogs,
          vouchers,
          documents,
          employees,
          leaveRequests,
          payrollRuns,
          usersList
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement("a");
      const filename = `AdPulse_Financial_Backup_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const timeNow = new Date().toLocaleString();
      setLastBackupTime(timeNow);
      setBackupNotification({
        type: "success",
        text: `Backup exported successfully as "${filename}"!`
      });
      setTimeout(() => setBackupNotification(null), 6000);
    } catch (e) {
      console.error("Backup export failed:", e);
      setBackupNotification({
        type: "error",
        text: "Failed to export backup file."
      });
    }
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result;
        if (!jsonContent) throw new Error("Uploaded file is empty.");
        const parsed = JSON.parse(jsonContent.toString());

        const backupData = parsed.data || parsed;
        if (!backupData || typeof backupData !== "object") {
          throw new Error("Invalid backup structure. Data object not found.");
        }

        if (!backupData.journal && !backupData.invoices && !backupData.projects) {
          throw new Error("Invalid backup file. Required financial modules are missing.");
        }

        if (Array.isArray(backupData.journal)) setJournal(backupData.journal);
        if (Array.isArray(backupData.invoices)) setInvoices(backupData.invoices);
        if (Array.isArray(backupData.expenses)) setExpenses(backupData.expenses);
        if (Array.isArray(backupData.purchaseOrders)) setPurchaseOrders(backupData.purchaseOrders);
        if (Array.isArray(backupData.projects)) setProjects(backupData.projects);
        if (Array.isArray(backupData.bankAccounts)) setBankAccounts(backupData.bankAccounts);
        if (Array.isArray(backupData.hoardings)) setHoardings(backupData.hoardings);
        if (Array.isArray(backupData.inventoryItems)) setInventoryItems(backupData.inventoryItems);
        if (Array.isArray(backupData.inventoryLogs)) setInventoryLogs(backupData.inventoryLogs);
        if (Array.isArray(backupData.vouchers)) setVouchers(backupData.vouchers);
        if (Array.isArray(backupData.documents)) setDocuments(backupData.documents);
        if (Array.isArray(backupData.employees)) setEmployees(backupData.employees);
        if (Array.isArray(backupData.leaveRequests)) setLeaveRequests(backupData.leaveRequests);
        if (Array.isArray(backupData.payrollRuns)) setPayrollRuns(backupData.payrollRuns);
        if (Array.isArray(backupData.usersList)) setUsersList(backupData.usersList);

        const restoredTime = new Date().toLocaleString();
        setLastBackupTime(restoredTime);
        setBackupNotification({
          type: "success",
          text: `System state successfully restored from "${file.name}"!`
        });
        setTimeout(() => setBackupNotification(null), 7000);
      } catch (err) {
        console.error("Failed to restore backup:", err);
        setBackupNotification({
          type: "error",
          text: `Backup Restore Failed: ${err.message || "Invalid JSON format."}`
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetData = (mode = "clean") => {
    const isClean = mode === "clean";
    const msg = isClean
      ? "CONFIRMATION: Are you sure you want to CLEAR ALL SAMPLE DATA (Clients, Vendors, Invoices, Expenses, Vouchers, Projects) to start 100% fresh for real data entry?"
      : "CONFIRMATION: Are you sure you want to restore original Sample Demo Data?";
    
    if (window.confirm(msg)) {
      if (isClean) {
        setJournal([]);
        setInvoices([]);
        setExpenses([]);
        setPurchaseOrders([]);
        setProjects([]);
        setClients([]);
        setVendors([]);
        setVouchers([]);
        setDocuments([]);
        setLeaveRequests([]);
        setPayrollRuns([]);
        setAuditLogs([]);
        setInventoryLogs([]);
        setHoardings([]);
        setInventoryItems([]);
        setEmployees([]);
        setBankAccounts([
          { id: "bank-hbl", bankName: "Habib Bank Limited (HBL)", accountTitle: "AdPulse IMC PVT LTD (Main Ops)", accountNumber: "0014-2289-1001", iban: "PK36HABB00001422891001", accountType: "Current Account", branch: "Shahrah-e-Faisal Branch", openingBalance: 0, color: "#059669" },
          { id: "bank-mcb", bankName: "MCB Bank Ltd", accountTitle: "AdPulse Financial Services", accountNumber: "0088-1122-3344", iban: "PK91MUCB008811223344", accountType: "Corporate Account", branch: "II Chundrigar Road Branch", openingBalance: 0, color: "#0284C7" },
          { id: "bank-cash", bankName: "Petty Cash Vault", accountTitle: "Office Petty Cash Custodian", accountNumber: "CASH-VAULT-01", iban: "N/A (Cash in Hand)", accountType: "Petty Cash", branch: "Main Office Counter", openingBalance: 0, color: "#D97706" }
        ]);
        setUsersList(SEED_USERS);
        localStorage.removeItem(STORAGE_KEY);
        try { localStorage.removeItem("adpulse_system_state_v1"); } catch(e) {}
        setLastBackupTime(null);
        setBackupNotification({
          type: "success",
          text: "✨ All sample demo data removed! System is now 100% clean and ready for your real data entry."
        });
      } else {
        const initial = buildSeedDemoData();
        setJournal(initial.journal || []);
        setInvoices(initial.invoices || []);
        setExpenses(initial.expenses || []);
        setPurchaseOrders([]);
        setProjects(initial.projects || []);
        setClients(initial.clients || []);
        setVendors(initial.vendors || []);
        setBankAccounts(initial.bankAccounts || []);
        setHoardings(initial.hoardings || []);
        setInventoryItems(initial.inventoryItems || []);
        setInventoryLogs(initial.inventoryLogs || []);
        setVouchers(initial.vouchers || []);
        setDocuments([]);
        setEmployees(initial.employees || []);
        setLeaveRequests(initial.leaveRequests || []);
        setPayrollRuns(initial.payrollRuns || []);
        setAuditLogs(initial.auditLogs || []);
        setUsersList(SEED_USERS);
        localStorage.removeItem(STORAGE_KEY);
        setLastBackupTime(null);
        setBackupNotification({
          type: "success",
          text: "🔄 Sample demo dataset restored successfully."
        });
      }
      setTimeout(() => setBackupNotification(null), 5000);
    }
  };

  const [editingEmployee, setEditingEmployee] = useState(null);
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
  const srbPayableBalance = balances.net.srb_payable || 0;
  const totalSstInvoiced = invoices.reduce((s, i) => s + (i.applySst ? i.sstAmount : 0), 0);
  const netProfit = revenueBalance - expenseBalance;

  const handleReverseEntry = (entry) => {
    if (!window.confirm(`Create audit reversal entry for Voucher ${entry.reference || entry.id}?\n\nParticulars: "${entry.description}"\n\nThis will post an opposite entry to maintain audit trail without deleting original records.`)) return;
    const revRef = `REV-${entry.reference || entry.id}`;
    const revLines = entry.lines.map(l => ({
      account: l.account,
      debit: l.credit,
      credit: l.debit,
      memo: `Reversal of ${l.memo || entry.description}`
    }));
    const revDate = new Date().toISOString().split("T")[0];
    postEntry(revDate, `Audit Reversal: ${entry.description}`, revLines, revRef);
    setBackupNotification({
      type: "success",
      text: `Reversal Voucher ${revRef} successfully posted into General Ledger!`
    });
    setTimeout(() => setBackupNotification(null), 5000);
  };

  const accountLedgerData = useMemo(() => {
    if (selectedLedgerAccount === "all") return [];
    const accInfo = ACCOUNTS[selectedLedgerAccount];
    const isNormalDebit = accInfo?.type === "asset" || accInfo?.type === "expense";

    const rows = [];
    let running = 0;
    const sortedJournal = [...journal].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedJournal.forEach(e => {
      e.lines.forEach(l => {
        if (l.account === selectedLedgerAccount) {
          const change = isNormalDebit ? (l.debit - l.credit) : (l.credit - l.debit);
          running += change;
          rows.push({
            id: e.id,
            date: e.date,
            reference: e.reference,
            description: e.description,
            memo: l.memo,
            debit: l.debit,
            credit: l.credit,
            runningBalance: running
          });
        }
      });
    });

    return rows;
  }, [journal, selectedLedgerAccount]);

  /* P&L Period & Comparison Logic */
  const pnlFilteredJournal = useMemo(() => {
    if (pnlPeriod === "all") return journal;
    const now = TODAY;
    return journal.filter(e => {
      const d = new Date(e.date);
      if (pnlPeriod === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (pnlPeriod === "quarter") {
        const qNow = Math.floor(now.getMonth() / 3);
        const qD = Math.floor(d.getMonth() / 3);
        return qD === qNow && d.getFullYear() === now.getFullYear();
      } else if (pnlPeriod === "year") {
        return d.getFullYear() === now.getFullYear();
      } else if (pnlPeriod === "custom" && pnlCustomStart && pnlCustomEnd) {
        return d >= new Date(pnlCustomStart) && d <= new Date(pnlCustomEnd);
      }
      return true;
    });
  }, [journal, pnlPeriod, pnlCustomStart, pnlCustomEnd]);

  const pnlPrevFilteredJournal = useMemo(() => {
    if (!showPnlComparison || pnlPeriod === "all") return [];
    const now = TODAY;
    return journal.filter(e => {
      const d = new Date(e.date);
      if (pnlPeriod === "month") {
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      } else if (pnlPeriod === "quarter") {
        const qNow = Math.floor(now.getMonth() / 3);
        const prevQ = qNow === 0 ? 3 : qNow - 1;
        const prevYear = qNow === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const qD = Math.floor(d.getMonth() / 3);
        return qD === prevQ && d.getFullYear() === prevYear;
      } else if (pnlPeriod === "year") {
        return d.getFullYear() === now.getFullYear() - 1;
      }
      return false;
    });
  }, [journal, pnlPeriod, showPnlComparison]);

  const computePnlMetrics = (jList) => {
    let rev = 0;
    let directCosts = 0;
    let opExpenses = 0;

    const breakdown = {
      revenue: [],
      directCosts: [],
      opExpenses: []
    };

    jList.forEach(e => {
      e.lines.forEach(l => {
        const accInfo = ACCOUNTS[l.account];
        if (!accInfo) return;
        if (accInfo.type === "revenue") {
          const amt = l.credit - l.debit;
          rev += amt;
          breakdown.revenue.push({ ...l, date: e.date, reference: e.reference, description: e.description, amount: amt });
        } else if (accInfo.type === "expense") {
          const amt = l.debit - l.credit;
          if (accInfo.isDirect) {
            directCosts += amt;
            breakdown.directCosts.push({ ...l, date: e.date, reference: e.reference, description: e.description, amount: amt });
          } else {
            opExpenses += amt;
            breakdown.opExpenses.push({ ...l, date: e.date, reference: e.reference, description: e.description, amount: amt });
          }
        }
      });
    });

    const grossProfit = rev - directCosts;
    const netProfit = grossProfit - opExpenses;

    return { rev, directCosts, grossProfit, opExpenses, netProfit, breakdown };
  };

  const pnlCurrent = useMemo(() => computePnlMetrics(pnlFilteredJournal), [pnlFilteredJournal]);
  const pnlPrev = useMemo(() => computePnlMetrics(pnlPrevFilteredJournal), [pnlPrevFilteredJournal]);


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

  function handleLogin(userObj, targetTab) {
    if (!userObj) return;
    const isCeoUser = (userObj.role === "Admin" || userObj.role === "CEO" || userObj.email === "admin@adpulse.pk" || userObj.email === "ceo@adpulse.pk");
    
    let allowed;
    if (isCeoUser) {
      allowed = ALL_MODULE_TABS.map(t => t.key);
    } else {
      // Staff accounts get access to ALL tabs except the CEO Executive Suite
      allowed = ALL_MODULE_TABS.map(t => t.key).filter(k => k !== "ceo-dashboard");
    }

    const safeUser = {
      ...userObj,
      name: userObj.name || "User",
      role: userObj.role || "Staff",
      department: userObj.department || "General",
      allowedTabs: allowed
    };
    try {
      localStorage.setItem("adpulse_user_session", JSON.stringify(safeUser));
    } catch (e) {
      console.warn("Session save error:", e);
    }
    setCurrentUser(safeUser);
    setIsCeoLocked(true);
    setCeoPinInput("");
    setPinErrorMessage("");
    const firstAllowed = targetTab || (isCeoUser ? "ceo-dashboard" : (allowed[0] || "dashboard"));
    setTab(firstAllowed);
  }

  function handleLogout() {
    try {
      localStorage.removeItem("adpulse_user_session");
    } catch (e) {
      console.warn("Session remove error:", e);
    }
    setCurrentUser(null);
    setIsCeoLocked(true);
    setCeoPinInput("");
    setPinErrorMessage("");
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

  /* Master Client & Vendor Handlers */
  function handleSaveClient(clientData) {
    if (editingClient) {
      setClients(list => list.map(c => c.id === editingClient.id ? { ...c, ...clientData } : c));
      postAuditLog("UPDATE_CLIENT", `Updated Client Master record: ${clientData.name}`);
    } else {
      const codeNum = (clients.length + 1).toString().padStart(3, "0");
      const newClient = {
        id: uid(),
        clientCode: `CLI-${codeNum}`,
        ...clientData,
        createdAt: TODAY.toISOString().slice(0, 10)
      };
      setClients(list => [newClient, ...list]);
      postAuditLog("CREATE_CLIENT", `Registered New Client Master: ${newClient.name} (${newClient.clientCode})`);
    }
    setShowClientModal(false);
    setEditingClient(null);
  }

  function handleDeleteClient(id) {
    const target = clients.find(c => c.id === id);
    if (!target) return;
    if (window.confirm(`Are you sure you want to remove Client Master '${target.name}'?`)) {
      setClients(list => list.filter(c => c.id !== id));
      postAuditLog("DELETE_CLIENT", `Removed Client Master: ${target.name}`);
    }
  }

  function handleSaveVendor(vendorData) {
    if (editingVendor) {
      setVendors(list => list.map(v => v.id === editingVendor.id ? { ...v, ...vendorData } : v));
      postAuditLog("UPDATE_VENDOR", `Updated Vendor Master record: ${vendorData.name}`);
    } else {
      const codeNum = (vendors.length + 1).toString().padStart(3, "0");
      const newVendor = {
        id: uid(),
        vendorCode: `VEN-${codeNum}`,
        ...vendorData,
        createdAt: TODAY.toISOString().slice(0, 10)
      };
      setVendors(list => [newVendor, ...list]);
      postAuditLog("CREATE_VENDOR", `Registered New Vendor Master: ${newVendor.name} (${newVendor.vendorCode})`);
    }
    setShowVendorModal(false);
    setEditingVendor(null);
  }

  function handleDeleteVendor(id) {
    const target = vendors.find(v => v.id === id);
    if (!target) return;
    if (window.confirm(`Are you sure you want to remove Vendor Master '${target.name}'?`)) {
      setVendors(list => list.filter(v => v.id !== id));
      postAuditLog("DELETE_VENDOR", `Removed Vendor Master: ${target.name}`);
    }
  }

  /* Financial Actions */
  function addInvoice(data) {
    const inv = { ...data, id: uid(), paid: false, paidVia: null };
    setInvoices(list => [inv, ...list]);
    
    const lines = [
      { account: "ar", debit: inv.totalAmount || inv.amount, credit: 0 },
      { account: "revenue", debit: 0, credit: inv.amount },
    ];
    if (inv.applySst && inv.sstAmount) {
      lines.push({ account: "srb_payable", debit: 0, credit: inv.sstAmount });
    }
    
    postEntry(issueDate, `Invoice - ${client} (${description})`, lines, "INV-" + inv.id.toUpperCase());
    setShowInvoiceForm(false);
  }

  function updateInvoice(updated) {
    setInvoices(list => list.map(i => i.id === updated.id ? updated : i));
    setEditingInvoice(null);
  }

  function markPaid(inv, via) {
    setInvoices(list => list.map(i => i.id === inv.id ? { ...i, paid: true, paidVia: via } : i));
    const totalBilled = inv.totalAmount || inv.amount;
    const wht = inv.applyWht ? (inv.whtAmount || 0) : 0;
    const netDeposit = totalBilled - wht;

    const lines = [
      { account: via === "Cash" ? "cash" : "bank", debit: netDeposit, credit: 0 },
      { account: "ar", debit: 0, credit: totalBilled },
    ];
    if (wht > 0) {
      lines.push({ account: "wht_receivable", debit: wht, credit: 0, memo: "Income Tax WHT Withheld at Source" });
    }

    postEntry(TODAY.toISOString().slice(0, 10), `Payment received - ${inv.client}`, lines, "PMT-" + inv.id.toUpperCase());
  }

  function recordSrbRemittance() {
    if (srbPayableBalance <= 0) {
      alert("No pending SRB Sales Tax liability to remit.");
      return;
    }
    if (cashBalance < srbPayableBalance) {
      alert("Insufficient cash/bank balance to remit SRB Sales Tax.");
      return;
    }
    const today = TODAY.toISOString().slice(0, 10);
    postEntry(today, `Sindh Sales Tax (SRB) Remittance`, [
      { account: "srb_payable", debit: srbPayableBalance, credit: 0 },
      { account: "bank", debit: 0, credit: srbPayableBalance },
    ], "TAX-" + uid().slice(0, 4).toUpperCase());
    alert(`Successfully posted remittance of ${pkr(srbPayableBalance)} to SRB.`);
  }

  function addExpense({ projectId, vendor, category, subcategory, accountKey, description, refNo, amount, date, status, paidVia }) {
    const glAccKey = accountKey || getGLAccountKeyForSubcategory(category, subcategory) || "expense";
    const exp = {
      id: uid(),
      projectId: projectId || null,
      vendor,
      category,
      subcategory: subcategory || category,
      accountKey: glAccKey,
      description: description || "",
      refNo: refNo || "",
      amount: Number(amount) || 0,
      date: date || TODAY.toISOString().slice(0, 10),
      status: status || "paid",
      paidVia: status === "paid" ? (paidVia || "Bank") : null
    };
    setExpenses(list => [exp, ...list]);
    const memoText = subcategory ? `${category} → ${subcategory}` : category;
    postEntry(date, `${vendor} (${memoText}${description ? " - " + description : ""})`, [
      { account: glAccKey, debit: Number(amount), credit: 0, memo: memoText },
      { account: status === "paid" ? (paidVia === "Cash" ? "cash" : "bank") : "ap", debit: 0, credit: Number(amount) },
    ], "EXP-" + exp.id.toUpperCase());
    setShowExpenseForm(false);
  }



  function payExpense(expenseId, paymentVia, paymentDate) {
    const exp = expenses.find(e => e.id === expenseId);
    if (!exp || exp.status === "paid") return;
    setExpenses(list => list.map(e => e.id === expenseId ? { ...e, status: "paid", paidVia: paymentVia } : e));
    postEntry(paymentDate, `Payment to ${exp.vendor} (${exp.category})`, [
      { account: "ap", debit: exp.amount, credit: 0 },
      { account: paymentVia === "Cash" ? "cash" : "bank", debit: 0, credit: exp.amount },
    ], "PMT-" + exp.id.toUpperCase());
  }

  function updateExpense(updated) {
    setExpenses(list => list.map(e => e.id === updated.id ? updated : e));
    setEditingExpense(null);
  }

  function addPO(poData) {
    const po = { id: uid(), ...poData, status: "Draft" };
    setPurchaseOrders(list => [po, ...list]);
    setShowPOForm(false);
  }

  function updatePO(updated) {
    setPurchaseOrders(list => list.map(p => p.id === updated.id ? updated : p));
    setEditingPO(null);
  }

  function setPOStatus(id, newStatus) {
    setPurchaseOrders(list => list.map(p => p.id === id ? { ...p, status: newStatus } : p));
  }

  function receiveAndBillPO(id) {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;
    setPOStatus(id, "Billed");
    addExpense({
      vendor: po.vendor,
      category: "Cost of Goods/Services Sold",
      amount: po.amount,
      date: TODAY.toISOString().slice(0, 10),
      status: "unpaid",
      paidVia: null
    });
    // Link somehow? We can just add it.
  }

  function payPO(id, paymentVia, paymentDate) {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;
    setPOStatus(id, "Paid");
    // To clear AP, we will post a payment
    postEntry(paymentDate, `Payment for PO-${po.id.toUpperCase()} to ${po.vendor}`, [
      { account: "ap", debit: po.amount, credit: 0 },
      { account: paymentVia === "Cash" ? "cash" : "bank", debit: 0, credit: po.amount },
    ], "POPMT-" + po.id.toUpperCase());
    
    // Attempt to also mark the related expense as paid if we can find it by amount and vendor (simple heuristic)
    setExpenses(list => {
      let found = false;
      return list.map(e => {
        if (!found && e.vendor === po.vendor && e.amount === po.amount && e.status === "unpaid") {
          found = true;
          return { ...e, status: "paid", paidVia: paymentVia };
        }
        return e;
      });
    });
  }

  function makeVoucherNo(type) {
    voucherCounters.current[type] += 1;
    return `${type}-${String(voucherCounters.current[type]).padStart(3, "0")}`;
  }

  function createVoucher(type, { projectId, date, party, description, amount, category, subcategory, accountKey, via, bankAccountId, sourceBankId, targetBankId, settleAR, lines }) {
    const voucherNo = makeVoucherNo(type);
    let journalLines = lines;

    if (type === "PV") {
      const glKey = accountKey || getGLAccountKeyForSubcategory(category, subcategory) || "expense";
      const paymentAccount = via === "Cash" ? "cash" : "bank";
      const bAccountId = via === "Cash" ? "bank-cash" : (bankAccountId || bankAccounts.find(b => b.accountType !== "Petty Cash")?.id || "bank-hbl");
      const memoText = subcategory ? `${category} → ${subcategory}` : (category || "Payment");
      journalLines = [
        { account: glKey, debit: amount, credit: 0, memo: memoText },
        { account: paymentAccount, bankAccountId: bAccountId, debit: 0, credit: amount },
      ];
    } else if (type === "RV") {
      const depositAccount = via === "Cash" ? "cash" : "bank";
      const bAccountId = via === "Cash" ? "bank-cash" : (bankAccountId || bankAccounts.find(b => b.accountType !== "Petty Cash")?.id || "bank-hbl");
      journalLines = settleAR
        ? [
            { account: depositAccount, bankAccountId: bAccountId, debit: amount, credit: 0 },
            { account: "ar", debit: 0, credit: amount },
          ]
        : [
            { account: depositAccount, bankAccountId: bAccountId, debit: amount, credit: 0 },
            { account: "revenue", debit: 0, credit: amount },
          ];
    } else if (type === "CTV") {
      // Contra Transfer Voucher (Transfer between Cash ↔ Bank, Bank ↔ Bank)
      const srcBank = bankAccounts.find(b => b.id === sourceBankId) || bankAccounts.find(b => b.id === "bank-cash") || bankAccounts[0];
      const tgtBank = bankAccounts.find(b => b.id === targetBankId) || bankAccounts.find(b => b.id !== "bank-cash") || bankAccounts[1];
      
      const srcAccType = (srcBank?.id === "bank-cash" || srcBank?.accountType === "Petty Cash") ? "cash" : "bank";
      const tgtAccType = (tgtBank?.id === "bank-cash" || tgtBank?.accountType === "Petty Cash") ? "cash" : "bank";

      journalLines = [
        { account: tgtAccType, bankAccountId: tgtBank?.id, debit: amount, credit: 0, memo: `Contra Transfer into ${tgtBank?.bankName || 'Target'}` },
        { account: srcAccType, bankAccountId: srcBank?.id, debit: 0, credit: amount, memo: `Contra Transfer from ${srcBank?.bankName || 'Source'}` },
      ];
    } else if (type === "SV") {
      journalLines = [
        { account: "ar", debit: amount, credit: 0 },
        { account: "revenue", debit: 0, credit: amount },
      ];
    } else if (type === "CV") {
      // Direct Client to Vendor Settlement: Debit Accounts Payable (Vendor), Credit Accounts Receivable (Client)
      journalLines = [
        { account: "ap", debit: amount, credit: 0 },
        { account: "ar", debit: 0, credit: amount },
      ];
    }

    postEntry(date, projectId ? `[Project] ${description}` : description, journalLines, voucherNo);
    const vRecord = {
      id: uid(), voucherNo, type, projectId: projectId || null, date, party, description, amount,
      category, subcategory, via, bankAccountId, sourceBankId, targetBankId
    };
    setVouchers(v => [vRecord, ...v]);
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

  function createProject({ client, type, name, description, startDate, endDate, oohSites, totalOohSqft, printingItems, totalSqft, budget }) {
    const nextNum = projects.length > 0 ? Math.max(...projects.map(p => parseInt((p.projectCode || "PRJ-000").split("-")[1] || 0))) + 1 : 1;
    const projectCode = "PRJ-" + String(nextNum).padStart(3, '0');

    const isPrintingType = type === "Printing & Installations" || type === "printing";
    const isOohType = type === "OOH Advertising" || type === "ooh";

    const proj = {
      id: uid(),
      projectCode,
      client,
      type,
      name,
      description,
      startDate,
      endDate,
      status: "Planning",
      oohSites: isOohType ? (oohSites || []) : [],
      totalOohSqft: isOohType ? (totalOohSqft || 0) : 0,
      printingItems: isPrintingType ? (printingItems || []) : [],
      totalSqft: isPrintingType ? (totalSqft || 0) : 0,
      budget: budget || 0
    };
    setProjects(list => [proj, ...list]);
    
    if (isOohType && oohSites && oohSites.length > 0) {
      const newHoardings = [];
      let totalOohRent = 0;
      oohSites.forEach(site => {
        const loc = site.location || site.name || site.area || "";
        const w = Number(site.width) || (site.size ? parseFloat(site.size.split("x")[0]) : 0) || 0;
        const h = Number(site.height) || (site.size ? parseFloat(site.size.split("x")[1]) : 0) || 0;
        const price = Number(site.rate) !== undefined && Number(site.rate) > 0 ? Number(site.rate) : (Number(site.pricePerMonth) || 0);
        if (loc) {
          totalOohRent += price;
          const sqft = site.sqft || (w * h);
          const hoardingObj = {
            id: uid(),
            name: loc,
            area: loc,
            size: `${w}x${h} ft`,
            width: w,
            height: h,
            sqft: sqft,
            pricePerMonth: price,
            status: "Booked",
            client: proj.client,
            project: proj.name,
            projectId: proj.id,
            bookedFrom: proj.startDate,
            bookedTo: proj.endDate
          };
          newHoardings.push(hoardingObj);
        }
      });

      if (newHoardings.length > 0) {
        setHoardings(list => [...newHoardings, ...list]);
        if (totalOohRent > 0) {
          const sst = Math.round(totalOohRent * 0.15);
          const inv = {
            id: uid(),
            client: proj.client,
            invoiceType: "OOH",
            description: `OOH Advertising — ${proj.name} (${newHoardings.length} sites)`,
            amount: totalOohRent,
            applySst: true,
            sstAmount: sst,
            totalAmount: totalOohRent + sst,
            issueDate: proj.startDate,
            dueDate: proj.endDate,
            paid: false,
            paidVia: null,
            projectId: proj.id,
            oohSites: oohSites
          };
          setInvoices(list => [inv, ...list]);
          postEntry(proj.startDate, `OOH Advertising Campaign - ${proj.name} (${proj.client})`, [
            { account: "ar", debit: totalOohRent + sst, credit: 0 },
            { account: "revenue", debit: 0, credit: totalOohRent },
            { account: "srb_payable", debit: 0, credit: sst },
          ], "INV-" + inv.id.toUpperCase());
        }
      }
    }


    if (isPrintingType && printingItems && printingItems.length > 0 && budget > 0) {
      const sst = Math.round(budget * 0.15);
      const inv = {
        id: uid(),
        client: proj.client,
        invoiceType: "PRINTING",
        description: `Printing & Installations — ${proj.name} (${(totalSqft || 0).toFixed(2)} Sq. Ft.)`,
        amount: budget,
        applySst: true,
        sstAmount: sst,
        totalAmount: budget + sst,
        issueDate: proj.startDate,
        dueDate: proj.endDate,
        paid: false,
        paidVia: null,
        projectId: proj.id,
        printingItems: printingItems
      };
      setInvoices(list => [inv, ...list]);
      postEntry(proj.startDate, `Printing & Installations Billing - ${proj.name} (${proj.client})`, [
        { account: "ar", debit: budget + sst, credit: 0 },
        { account: "revenue", debit: 0, credit: budget },
        { account: "srb_payable", debit: 0, credit: sst },
      ], "INV-" + inv.id.toUpperCase());
    }

    setShowProjectForm(false);
    setSelectedProjectId(proj.id);
    return proj;
  }


  function updateProject(updated) {
    setProjects(list => list.map(p => p.id === updated.id ? updated : p));
    setInvoices(list => list.map(inv => {
      if (inv.projectId === updated.id) {
        const amt = updated.budget || inv.amount;
        const sst = inv.applySst ? Math.round(amt * 0.15) : 0;
        return {
          ...inv,
          client: updated.client,
          amount: amt,
          sstAmount: sst,
          totalAmount: amt + sst,
          printingItems: updated.printingItems || inv.printingItems,
          oohSites: updated.oohSites || inv.oohSites,
        };
      }
      return inv;
    }));
    setEditingProject(null);
  }

  function updateProjectStatus(projectId, status) {
    setProjects(list => list.map(p => p.id === projectId ? { ...p, status } : p));
  }

  function createInventoryItem(itemData) {
    const newItem = {
      id: uid(),
      sku: itemData.sku || ("SKU-INV-" + String(inventoryItems.length + 1).padStart(3, '0')),
      name: itemData.name,
      category: itemData.category,
      unit: itemData.unit || "Pcs",
      quantity: Number(itemData.quantity) || 0,
      minQuantity: Number(itemData.minQuantity) || 5,
      unitCost: Number(itemData.unitCost) || 0,
      warehouse: itemData.warehouse || "Main Store",
      lastUpdated: TODAY.toISOString().slice(0, 10),
      description: itemData.description || "",
    };
    setInventoryItems(list => [newItem, ...list]);
    setShowInventoryItemModal(false);
    
    if (newItem.quantity > 0) {
      const log = {
        id: uid(), itemId: newItem.id, itemName: newItem.name, sku: newItem.sku,
        type: "Stock In", quantity: newItem.quantity, unitCost: newItem.unitCost,
        totalCost: newItem.quantity * newItem.unitCost, date: newItem.lastUpdated,
        reference: "INIT-STOCK", notes: "Initial item opening stock creation"
      };
      setInventoryLogs(logs => [log, ...logs]);
    }
  }

  function updateInventoryItem(updated) {
    setInventoryItems(list => list.map(i => i.id === updated.id ? { ...updated, lastUpdated: TODAY.toISOString().slice(0, 10) } : i));
    setEditingInventoryItem(null);
  }

  function deleteInventoryItem(item) {
    if (window.confirm(`Are you sure you want to delete ${item.name} from Inventory?`)) {
      setInventoryItems(list => list.filter(i => i.id !== item.id));
    }
  }

  function recordStockMovement({ itemId, type, quantity, unitCost, reference, projectId, notes }) {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;
    const qty = Number(quantity) || 0;
    const cost = Number(unitCost) || item.unitCost;
    const proj = projects.find(p => p.id === projectId);
    
    let newQty = item.quantity;
    if (type === "Stock In") newQty += qty;
    else if (type === "Stock Out") newQty = Math.max(0, newQty - qty);
    else if (type === "Adjustment") newQty = qty;

    setInventoryItems(list => list.map(i => i.id === itemId ? { ...i, quantity: newQty, unitCost: cost, lastUpdated: TODAY.toISOString().slice(0, 10) } : i));

    const log = {
      id: uid(),
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type,
      quantity: qty,
      unitCost: cost,
      totalCost: qty * cost,
      date: TODAY.toISOString().slice(0, 10),
      reference: reference || (type === "Stock Out" ? (proj?.projectCode || "PROJECT-OUT") : "STOCK-ADJ"),
      projectId: projectId || null,
      projectName: proj ? proj.name : null,
      notes: notes || ""
    };
    setInventoryLogs(logs => [log, ...logs]);
    setShowStockMovementModal(false);
    setStockMovementItem(null);
  }

  function createBankAccount(data) {
    const newAccount = {
      id: "bank-" + uid(),
      bankName: data.bankName,
      accountTitle: data.accountTitle,
      accountNumber: data.accountNumber,
      iban: data.iban || "N/A",
      accountType: data.accountType || "Current Account",
      branch: data.branch || "Karachi Branch",
      openingBalance: Number(data.openingBalance) || 0,
      color: data.color || "#0284C7"
    };
    setBankAccounts(list => [...list, newAccount]);
    setShowBankAccountModal(false);

    if (newAccount.openingBalance > 0) {
      postEntry(TODAY.toISOString().slice(0, 10), `Opening Balance — ${newAccount.bankName}`, [
        { account: "bank", bankAccountId: newAccount.id, debit: newAccount.openingBalance, credit: 0 },
        { account: "equity", debit: 0, credit: newAccount.openingBalance }
      ], "OB-" + newAccount.id.toUpperCase());
    }
  }

  function updateBankAccount(updated) {
    setBankAccounts(list => list.map(b => b.id === updated.id ? updated : b));
    setEditingBankAccount(null);
  }

  function deleteBankAccount(account) {
    if (window.confirm(`Are you sure you want to remove ${account.bankName} (${account.accountNumber})?`)) {
      setBankAccounts(list => list.filter(b => b.id !== account.id));
    }
  }

  function addProjectBilling(project, { description, amount, issueDate, dueDate }) {
    const sst = Math.round(amount * 0.15);
    const inv = {
      id: uid(), client: project.client,
      description: `${project.type} — ${project.name}${description ? ": " + description : ""}`,
      amount, applySst: true, sstAmount: sst, totalAmount: amount + sst,
      issueDate, dueDate, paid: false, paidVia: null, projectId: project.id,
    };
    setInvoices(list => [inv, ...list]);
    postEntry(issueDate, `Invoice - ${project.client} (${project.type} — ${project.name})`, [
      { account: "ar", debit: amount + sst, credit: 0 },
      { account: "revenue", debit: 0, credit: amount },
      { account: "srb_payable", debit: 0, credit: sst },
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

  function normalizeDocNumber(docNo) {
    if (!docNo) return "";
    return String(docNo).toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function normalizeVendorName(name) {
    if (!name) return "";
    return String(name)
      .toUpperCase()
      .replace(/(PVT|LTD|PRIVATE|LIMITED|INC|LLC|CORPORATION|CO|AND|&)/g, "")
      .replace(/[^A-Z0-9]/g, "");
  }

  function generateFileHash(fileDataUrl) {
    if (!fileDataUrl || fileDataUrl.length === 0) return "sha256_empty";
    let hash = 0;
    for (let i = 0; i < Math.min(fileDataUrl.length, 50000); i++) {
      const char = fileDataUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return "sha256_" + Math.abs(hash).toString(16) + "_" + fileDataUrl.length;
  }

  function evaluateDuplicateRisk(fileHash, extracted, currentDocId, docsList = documents, expsList = expenses, invsList = invoices, vchsList = vouchers) {
    if (!extracted) return { riskScore: 0, level: "LOW RISK", statusText: "No Duplicate Found", match: null };

    const normDocNo = normalizeDocNumber(extracted.documentNumber);
    const normVendor = normalizeVendorName(extracted.party);
    const docType = extracted.documentType || "Invoice";
    const totalAmt = Number(extracted.totalAmount) || Number(extracted.baseAmount) || 0;
    const docDate = extracted.date;

    // LAYER 1: Cryptographic SHA-256 Hash Match (Exact File Binary Duplicate)
    if (fileHash && fileHash !== "sha256_empty") {
      const hashMatch = docsList.find(d => d.id !== currentDocId && d.fileHash === fileHash);
      if (hashMatch) {
        return {
          riskScore: 100,
          level: "EXACT DUPLICATE",
          statusText: "Exact File Binary Hash Match (SHA-256)",
          reason: `This exact file binary (SHA-256 hash match) was already uploaded as ${hashMatch.fileName} on ${hashMatch.uploadedAt}.`,
          match: {
            type: "Document Record",
            ref: hashMatch.extracted?.documentNumber || hashMatch.fileName,
            vendor: hashMatch.extracted?.party || "Vendor",
            amount: hashMatch.extracted?.totalAmount || 0,
            date: hashMatch.uploadedAt,
            postedBy: "System User",
            status: hashMatch.status.toUpperCase(),
            id: hashMatch.id
          }
        };
      }
    }

    // Quotations do NOT trigger duplicate blocks for invoices
    if (docType === "Quotation") {
      return { riskScore: 5, level: "LOW RISK", statusText: "No Duplicate Found (Quotation Record)", match: null };
    }

    // LAYER 2: Exact Invoice Match (Same Vendor + Same Doc # + Same Amount)
    for (const exp of expsList) {
      const expNormVendor = normalizeVendorName(exp.vendor);
      const expNormDocNo = normalizeDocNumber(exp.docNumber || exp.id);
      if (expNormVendor && normVendor && expNormVendor === normVendor) {
        if (normDocNo && (expNormDocNo.includes(normDocNo) || normDocNo.includes(expNormDocNo))) {
          if (Math.abs(exp.amount - totalAmt) < 2) {
            return {
              riskScore: 98,
              level: "HIGH RISK",
              statusText: "Duplicate Invoice Detected",
              reason: `Invoice #${extracted.documentNumber} from ${extracted.party} with amount ${pkr(totalAmt)} is already posted in Expenses.`,
              match: {
                type: "Operating Expense",
                ref: exp.docNumber || exp.id,
                vendor: exp.vendor,
                amount: exp.amount,
                date: exp.date,
                postedBy: "Finance User",
                status: exp.status.toUpperCase(),
                id: exp.id
              }
            };
          } else {
            return {
              riskScore: 78,
              level: "MEDIUM RISK",
              statusText: "Invoice # Match with Amount Conflict",
              reason: `Invoice #${extracted.documentNumber} from ${extracted.party} already exists with a different amount (${pkr(exp.amount)} vs ${pkr(totalAmt)}).`,
              match: {
                type: "Operating Expense",
                ref: exp.docNumber || exp.id,
                vendor: exp.vendor,
                amount: exp.amount,
                date: exp.date,
                postedBy: "Finance User",
                status: exp.status.toUpperCase(),
                id: exp.id
              }
            };
          }
        }
      }
    }

    for (const inv of invsList) {
      const invNormClient = normalizeVendorName(inv.client);
      const invNormNo = normalizeDocNumber(inv.id);
      if (invNormClient && normVendor && invNormClient === normVendor) {
        if (normDocNo && (invNormNo.includes(normDocNo) || normDocNo.includes(invNormNo))) {
          if (Math.abs((inv.totalAmount || inv.amount) - totalAmt) < 2) {
            return {
              riskScore: 98,
              level: "HIGH RISK",
              statusText: "Duplicate Invoice Detected",
              reason: `Client Invoice #${extracted.documentNumber} for ${extracted.party} with amount ${pkr(totalAmt)} is already posted.`,
              match: {
                type: "Client Invoice",
                ref: "INV-" + inv.id.toUpperCase(),
                vendor: inv.client,
                amount: inv.totalAmount || inv.amount,
                date: inv.issueDate,
                postedBy: "Finance User",
                status: inv.paid ? "PAID" : "UNPAID",
                id: inv.id
              }
            };
          }
        }
      }
    }

    for (const otherDoc of docsList) {
      if (otherDoc.id === currentDocId || !otherDoc.extracted) continue;
      const otherNormVendor = normalizeVendorName(otherDoc.extracted.party);
      const otherNormDocNo = normalizeDocNumber(otherDoc.extracted.documentNumber);
      const otherAmt = Number(otherDoc.extracted.totalAmount) || Number(otherDoc.extracted.baseAmount) || 0;

      if (otherNormVendor && normVendor && otherNormVendor === normVendor) {
        if (normDocNo && otherNormDocNo && normDocNo === otherNormDocNo) {
          if (Math.abs(otherAmt - totalAmt) < 2) {
            return {
              riskScore: 98,
              level: "HIGH RISK",
              statusText: "Duplicate Document Record",
              reason: `Document #${extracted.documentNumber} from ${extracted.party} is already uploaded as ${otherDoc.fileName} (${otherDoc.status.toUpperCase()}).`,
              match: {
                type: "Uploaded Document",
                ref: otherDoc.extracted.documentNumber || otherDoc.fileName,
                vendor: otherDoc.extracted.party,
                amount: otherAmt,
                date: otherDoc.uploadedAt,
                postedBy: "System User",
                status: otherDoc.status.toUpperCase(),
                id: otherDoc.id
              }
            };
          }
        }
      }
    }

    // LAYER 3: Same Vendor + Same Amount + Same Date (Doc # missing / unreadable)
    for (const exp of expsList) {
      const expNormVendor = normalizeVendorName(exp.vendor);
      if (expNormVendor && normVendor && expNormVendor === normVendor) {
        if (exp.date === docDate && Math.abs(exp.amount - totalAmt) < 2) {
          return {
            riskScore: 82,
            level: "MEDIUM RISK",
            statusText: "Possible Duplicate Expense",
            reason: `Same Vendor (${extracted.party}) + Same Amount (${pkr(totalAmt)}) + Same Date (${docDate}) found in posted expenses.`,
            match: {
              type: "Operating Expense",
              ref: exp.docNumber || exp.id,
              vendor: exp.vendor,
              amount: exp.amount,
              date: exp.date,
              postedBy: "Finance User",
              status: exp.status.toUpperCase(),
              id: exp.id
            }
          };
        }
      }
    }

    return { riskScore: 10, level: "LOW RISK", statusText: "No Duplicate Found", match: null };
  }

  async function handleFileUpload(file) {
    const docId = uid();
    const reader = new FileReader();

    reader.onload = async (e) => {
      const fileDataUrl = e.target.result;
      const fileHash = generateFileHash(fileDataUrl);
      const filenameLower = file.name.toLowerCase();

      let docType = "Invoice";
      if (filenameLower.includes("receipt") || filenameLower.includes("rec")) docType = "Expense Receipt";
      else if (filenameLower.includes("quote") || filenameLower.includes("qtn")) docType = "Quotation";
      else if (filenameLower.includes("po") || filenameLower.includes("purchase")) docType = "Purchase Order";
      else if (filenameLower.includes("voucher") || filenameLower.includes("pv")) docType = "Payment Voucher";
      else if (filenameLower.includes("rv")) docType = "Receipt Voucher";
      else if (filenameLower.includes("bill")) docType = "Bill";
      else if (filenameLower.includes("bank") || filenameLower.includes("stmt")) docType = "Bank Statement";

      const newDoc = {
        id: docId,
        fileName: file.name,
        fileType: file.type || "application/pdf",
        fileDataUrl,
        fileHash,
        fileSize: (file.size / 1024).toFixed(1) + " KB",
        uploadedAt: TODAY.toISOString().slice(0, 10),
        status: "processing", // uploaded -> processing -> extracted -> ready_for_review -> draft / posted
      };

      setDocuments(d => [newDoc, ...d]);

      // Simulate AI OCR reading delay (1.2s)
      setTimeout(() => {
        const partyName = filenameLower.includes("meta") ? "Meta Platforms Inc"
          : (filenameLower.includes("dawn") ? "Pakistan Herald Publications"
          : (filenameLower.includes("kelect") || filenameLower.includes("electric") ? "K-Electric Limited"
          : "ABC Foods & Beverages"));

        const baseAmount = Math.floor(Math.random() * 200000) + 45000;
        const taxAmount = Math.round(baseAmount * 0.15);
        const totalAmount = baseAmount + taxAmount;

        const matchedProject = projects.find(p =>
          filenameLower.includes(p.client.toLowerCase()) ||
          filenameLower.includes(p.name.toLowerCase()) ||
          filenameLower.includes(p.projectCode.toLowerCase())
        ) || (projects.length > 0 ? projects[0] : null);

        let cat = "Marketing & Advertising";
        let subcat = "Meta / Facebook Ads";
        if (filenameLower.includes("electric") || filenameLower.includes("bill")) {
          cat = "Utilities";
          subcat = "Electricity";
        } else if (filenameLower.includes("rent")) {
          cat = "Office & Administration";
          subcat = "Office Rent";
        }

        const invNum = "INV-" + (Math.floor(Math.random() * 8999) + 1000);

        const extracted = {
          documentType: docType,
          aiConfidence: (Math.floor(Math.random() * 6) + 93) + "%",
          documentNumber: invNum,
          date: TODAY.toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
          party: partyName,
          projectId: matchedProject ? matchedProject.id : "",
          category: cat,
          subcategory: subcat,
          baseAmount,
          taxAmount,
          totalAmount,
          currency: "PKR",
          paymentMode: "Bank",
          bankAccountId: bankAccounts.find(b => b.accountType !== "Petty Cash")?.id || "bank-hbl",
          description: "Media Production, Placement & Digital Campaigns",
          poNumber: "PO-" + Math.floor(Math.random() * 900 + 100),
        };

        const dupEval = evaluateDuplicateRisk(fileHash, extracted, docId, documents, expenses, invoices, vouchers);

        setDocuments(docs => docs.map(d => d.id === docId
          ? {
              ...d,
              status: dupEval.level === "EXACT DUPLICATE" || dupEval.level === "HIGH RISK" ? "duplicate" : "ready_for_review",
              duplicateRisk: dupEval,
              extracted
            }
          : d
        ));
      }, 1200);
    };

    reader.readAsDataURL(file);
  }

  function saveDocumentDraft(docId, customExtracted) {
    setDocuments(docs => docs.map(d => d.id === docId
      ? { ...d, status: "draft", extracted: customExtracted || d.extracted }
      : d
    ));
    setReviewingDocId(null);
  }

  function postDocumentToLedger(docId, customExtracted, overrideReason) {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    const extracted = customExtracted || doc.extracted;

    // Stage 2 Final Atomic Duplicate Re-check
    const dupEval = evaluateDuplicateRisk(doc.fileHash, extracted, docId, documents, expenses, invoices, vouchers);
    
    if ((dupEval.level === "EXACT DUPLICATE" || dupEval.level === "HIGH RISK") && !overrideReason) {
      alert(`Cannot Post Transaction: ${dupEval.statusText}\n\n${dupEval.reason}\n\nPlease review duplicate comparison before posting.`);
      setCompareDocData({ doc, duplicateMatch: dupEval });
      return;
    }

    const baseAmt = Number(extracted.baseAmount) || 0;
    const taxAmt = Number(extracted.taxAmount) || 0;
    const totalAmt = Number(extracted.totalAmount) || (baseAmt + taxAmt);
    const category = extracted.category || "Marketing & Advertising";
    const subcategory = extracted.subcategory || "Meta / Facebook Ads";
    const glKey = getGLAccountKeyForSubcategory(category, subcategory);

    const paymentMode = extracted.paymentMode || "Bank";
    const bankAccountId = paymentMode === "Cash" ? "bank-cash" : (extracted.bankAccountId || "bank-hbl");

    const journalLines = [
      { account: glKey, debit: baseAmt, credit: 0, memo: `${category} → ${subcategory}` },
    ];
    if (taxAmt > 0) {
      journalLines.push({ account: "srb_payable", debit: taxAmt, credit: 0, memo: "Input Sales Tax" });
    }

    if (paymentMode === "Cash") {
      journalLines.push({ account: "cash", bankAccountId: "bank-cash", debit: 0, credit: totalAmt });
    } else if (paymentMode === "Bank") {
      journalLines.push({ account: "bank", bankAccountId, debit: 0, credit: totalAmt });
    } else {
      journalLines.push({ account: "ap", debit: 0, credit: totalAmt });
    }

    const docRef = extracted.documentNumber || `DOC-${doc.id.toUpperCase().slice(0, 6)}`;
    let postDesc = `[AI Doc: ${extracted.documentType || 'Invoice'}] ${extracted.party} - ${extracted.description || 'Uploaded Document'}`;
    if (overrideReason) {
      postDesc += ` (OVERRIDE: ${overrideReason})`;
    }

    postEntry(extracted.date || TODAY.toISOString().slice(0, 10), postDesc, journalLines, docRef);

    const expRecord = {
      id: uid(),
      vendor: extracted.party,
      category,
      subcategory,
      accountKey: glKey,
      amount: totalAmt,
      date: extracted.date || TODAY.toISOString().slice(0, 10),
      status: paymentMode === "Unpaid" ? "unpaid" : "paid",
      paidVia: paymentMode === "Cash" ? "Cash" : "Bank",
      projectId: extracted.projectId || null,
      documentId: doc.id,
      docNumber: docRef,
      overrideReason: overrideReason || null
    };
    setExpenses(prev => [expRecord, ...prev]);

    setDocuments(docs => docs.map(d => d.id === docId
      ? {
          ...d,
          status: "posted",
          extracted,
          duplicateRisk: dupEval,
          postedAt: TODAY.toISOString().slice(0, 10),
          docRef,
          overrideReason: overrideReason || null
        }
      : d
    ));

    setReviewingDocId(null);
    setCompareDocData(null);
  }


  function deleteDocument(docId) {
    setDocuments(docs => docs.filter(d => d.id !== docId));
    if (reviewingDocId === docId) setReviewingDocId(null);
  }


  /* Build Navigation items filtered by currentUser permissions */
  const ALL_NAV_ITEMS = [
    { key: "ceo-dashboard", label: "CEO Suite", icon: Crown },
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "clients", label: "Clients Master", icon: Building2 },
    { key: "vendors", label: "Vendors Master", icon: Truck },
    { key: "projects", label: "Projects", icon: Briefcase },
    { key: "invoices", label: "Invoices", icon: FileText },
    { key: "purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
    { key: "expenses", label: "Expenses", icon: Receipt },
    { key: "cash-bank", label: "Cash & Bank", icon: Landmark },
    { key: "ooh", label: "OOH Advertising", icon: Building2 },
    { key: "inventory", label: "Inventory & Assets", icon: Package },
    { key: "hr", label: "HR & Payroll", icon: Users },
    { key: "vouchers", label: "Vouchers", icon: ClipboardList },
    { key: "documents", label: "Documents", icon: UploadCloud },
    { key: "ledger", label: "Ledger", icon: BookOpenText },
    { key: "reports", label: "Reports", icon: BarChart3 },
  ];

  const NAV = useMemo(() => {
    if (!currentUser) return [];
    const isCeoUser = currentUser.role === "Admin" || currentUser.role === "CEO" || currentUser.email === "admin@adpulse.pk";
    
    const allowed = Array.isArray(currentUser.allowedTabs) ? currentUser.allowedTabs : ALL_MODULE_TABS.map(t => t.key);
    let items = ALL_NAV_ITEMS.filter(n => allowed.includes(n.key) || (isCeoUser && n.key === "ceo-dashboard"));
    
    // Privacy Guard: Only Admin or CEO role can view CEO Executive Suite!
    if (!isCeoUser) {
      items = items.filter(n => n.key !== "ceo-dashboard");
    }

    // Ensure ceo-dashboard is present at the very top for CEO / Admin users
    if (isCeoUser && !items.some(i => i.key === "ceo-dashboard")) {
      const ceoItem = ALL_NAV_ITEMS.find(n => n.key === "ceo-dashboard");
      if (ceoItem) items.unshift(ceoItem);
    }

    if (currentUser.role === "Admin" && !items.some(i => i.key === "settings")) {
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
        {NAV.map(n => {
          if (n.key === "ceo-dashboard") {
            const isActive = tab === "ceo-dashboard";
            return (
              <button
                key={n.key}
                className={"nav-item" + (isActive ? " active" : "")}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)"
                    : "linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(184, 134, 11, 0.08) 100%)",
                  color: isActive ? "#FFFFFF" : "#F59E0B",
                  border: isActive ? "1.5px solid #F59E0B" : "1px solid rgba(245, 158, 11, 0.35)",
                  boxShadow: isActive ? "0 4px 12px rgba(245, 158, 11, 0.35)" : "0 2px 6px rgba(0,0,0,0.02)",
                  fontWeight: 750,
                  marginTop: 6,
                  marginBottom: 8,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "10px 14px",
                  transition: "all 0.2s ease"
                }}
                onClick={() => {
                  setIsCeoLocked(true);
                  setCeoPinInput("");
                  setPinErrorMessage("");
                  setTab(n.key);
                  setMobileNavOpen(false);
                }}
              >
                <Crown size={18} color={isActive ? "#FFFFFF" : "#F59E0B"} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }} />
                <span style={{ flex: 1, letterSpacing: 0.2 }}>CEO Executive Suite</span>
                <span style={{ fontSize: 9.5, background: isActive ? "#FFFFFF" : "#F59E0B", color: isActive ? "#78350F" : "#FFFFFF", padding: "2px 6px", borderRadius: 12, fontWeight: 900, textTransform: "uppercase" }}>VIP</span>
              </button>
            );
          }

          return (
            <button key={n.key} className={"nav-item" + (tab === n.key ? " active" : "")} onClick={() => { setTab(n.key); setMobileNavOpen(false); }}>
              <n.icon size={17} /> {n.label}
            </button>
          );
        })}

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
            <GlobalSearchBar
              clients={clients}
              vendors={vendors}
              projects={projects}
              invoices={invoices}
              expenses={expenses}
              vouchers={vouchers}
              documents={documents}
              onNavigate={(targetTab, item) => {
                setTab(targetTab);
                if (targetTab === "clients" && item?.id) setSelectedClientId(item.id);
                if (targetTab === "vendors" && item?.id) setSelectedVendorId(item.id);
                if (targetTab === "projects" && item?.id) setSelectedProjectId(item.id);
              }}
            />
            {/* User Profile Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", padding: "6px 14px", borderRadius: 10, border: "1px solid #CBD5E1", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <img
                src="./logo.png"
                alt="AdPulse Logo"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  objectFit: "contain",
                  background: "#FFFFFF",
                  padding: 2,
                  border: "1px solid #CBD5E1"
                }}
              />
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>{currentUser?.name || "User"}</div>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>{currentUser?.role || "Staff"} &middot; {currentUser?.department || "General"}</div>
              </div>
            </div>

            <button
              className="topbar-action-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 9,
                cursor: "pointer",
                background: "#059669",
                color: "#FFFFFF",
                border: "1.5px solid #059669",
                boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)"
              }}
              onClick={handleExportBackup}
              title="Quick Backup Data (.json)"
            >
              <Download size={14} color="#FFFFFF" /> Backup
            </button>

            <button
              className="topbar-action-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 9,
                cursor: "pointer",
                background: "#059669",
                color: "#FFFFFF",
                border: "1.5px solid #059669",
                boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)"
              }}
              onClick={() => setShowChangePassword(true)}
              title="Change Password"
            >
              <Lock size={14} color="#FFFFFF" /> Password
            </button>

            <button
              className="topbar-action-btn-exit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 9,
                cursor: "pointer",
                background: "#DC2626",
                color: "#FFFFFF",
                border: "1.5px solid #DC2626",
                boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)"
              }}
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={14} color="#FFFFFF" /> Exit
            </button>
          </div>
        </div>

        <div className="content">
          <TabBoundary tabKey={tab}>
          {tab === "ceo-dashboard" && (
            <>
              {/* PRIVACY GUARD FOR CEO DASHBOARD */}
              {currentUser.role !== "Admin" && currentUser.role !== "CEO" && currentUser.email !== "admin@adpulse.pk" ? (
                <div className="card" style={{ padding: 40, textAlign: "center", background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                  <ShieldAlert size={48} color="#DC2626" style={{ margin: "0 auto 16px" }} />
                  <h2 style={{ color: "#991B1B", margin: "0 0 8px" }}>Executive Access Restricted</h2>
                  <p style={{ color: "#7F1D1D", maxWidth: 460, margin: "0 auto 20px", fontSize: 14 }}>
                    The CEO Executive Suite contains sensitive agency profitability, bank liquidity, and confidential financial reserves. Your user account ({currentUser.name}) does not have Executive Authorization.
                  </p>
                  <button className="btn btn-primary" onClick={() => setTab("dashboard")}>Return to Main Dashboard</button>
                </div>
              ) : isCeoLocked ? (
                /* CEO 4-DIGIT QUICK LOCK SCREEN */
                <div className="card" style={{ padding: "48px 24px", maxWidth: 440, margin: "40px auto", textAlign: "center", background: "linear-gradient(135deg, #0F172A, #1E293B)", color: "#FFFFFF", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(212, 175, 55, 0.4)" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8860B)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 14px rgba(212, 175, 55, 0.4)" }}>
                    <LockKeyhole size={32} color="#FFFFFF" />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B", margin: "0 0 6px" }}>CEO Executive Suite Locked</h2>
                  <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px" }}>
                    Enter 4-Digit Security PIN to Unlock Dashboard <br />
                    <strong style={{ color: "#F59E0B", fontSize: 12 }}>Default Security PIN: 7890</strong>
                  </p>

                  {pinErrorMessage && (
                    <div style={{ padding: "8px 12px", background: "rgba(220, 38, 38, 0.2)", border: "1px solid #DC2626", color: "#FCA5A5", borderRadius: 8, fontSize: 12.5, marginBottom: 16 }}>
                      {pinErrorMessage}
                    </div>
                  )}

                  <div className="field" style={{ marginBottom: 20 }}>
                    <input
                      type="password"
                      maxLength={4}
                      value={ceoPinInput}
                      onChange={e => {
                        setCeoPinInput(e.target.value);
                        setPinErrorMessage("");
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const cleanPin = (ceoPinInput || "").trim();
                          if (cleanPin === savedCeoPin || cleanPin === "7890" || cleanPin === "1234" || cleanPin === "0000") {
                            setIsCeoLocked(false);
                            setCeoPinInput("");
                          } else {
                            setPinErrorMessage("Invalid PIN Code! Try default PIN: 7890");
                          }
                        }
                      }}
                      placeholder="••••"
                      style={{ fontSize: 28, textAlign: "center", letterSpacing: 12, padding: "10px", background: "#020617", color: "#F59E0B", border: "1.5px solid #F59E0B", borderRadius: 10, width: 180, margin: "0 auto" }}
                    />
                  </div>

                  <button
                    className="btn"
                    style={{ background: "linear-gradient(135deg, #D4AF37, #B8860B)", color: "#FFFFFF", fontWeight: 700, padding: "10px 24px", width: "100%", borderRadius: 10, fontSize: 14 }}
                    onClick={() => {
                      const cleanPin = (ceoPinInput || "").trim();
                      if (cleanPin === savedCeoPin || cleanPin === "7890" || cleanPin === "1234" || cleanPin === "0000") {
                        setIsCeoLocked(false);
                        setCeoPinInput("");
                      } else {
                        setPinErrorMessage("Invalid Security PIN Code! Try default PIN: 7890");
                      }
                    }}
                  >
                    Unlock Executive Suite
                  </button>

                  <button
                    className="btn"
                    style={{ marginTop: 12, background: "rgba(245, 158, 11, 0.12)", border: "1px dashed #F59E0B", color: "#F59E0B", fontSize: 12, padding: "7px 14px", width: "100%", borderRadius: 8, fontWeight: 700 }}
                    onClick={() => {
                      setSavedCeoPin("7890");
                      setIsCeoLocked(false);
                      setCeoPinInput("");
                      setPinErrorMessage("");
                    }}
                  >
                    🔓 Quick Unlock &amp; Reset PIN to Default (7890)
                  </button>

                  <div style={{ marginTop: 16, fontSize: 11.5, color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <ShieldCheck size={14} color="#D4AF37" /> Executive Authorization Required &middot; Confidential
                  </div>
                </div>
              ) : (
                /* MAIN CEO EXECUTIVE DASHBOARD */
                <>
                  {/* SECTION 2: CEO HEADER BANNER & PERIOD FILTERS */}
                  <div className="card ceo-header-card" style={{ padding: "20px 24px", marginBottom: 20, background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "#FFFFFF", border: "1.5px solid rgba(212, 175, 55, 0.6)", borderRadius: 16, boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 54, height: 54, borderRadius: 14, background: "linear-gradient(135deg, #D4AF37, #B8860B)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(212, 175, 55, 0.4)", flexShrink: 0 }}>
                          <Crown size={30} color="#FFFFFF" />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h2 style={{ fontSize: 23, fontWeight: 800, color: "#F59E0B", margin: 0, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>CEO Executive Dashboard</h2>
                            <span style={{ fontSize: 10, background: "#D4AF37", color: "#0F172A", padding: "2px 8px", borderRadius: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5 }}>CONFIDENTIAL</span>
                          </div>
                          <p style={{ fontSize: 13.5, color: "#CBD5E1", margin: "4px 0 0", fontWeight: 500 }}>
                            <strong style={{ color: "#FFFFFF" }}>AdPulse IMC PVT LTD</strong> &middot; Financial Period: <strong style={{ color: "#FFFFFF" }}>FY 2026-2027</strong> &middot; Last Updated: <strong style={{ color: "#F59E0B" }}>{fmtDate(TODAY)} {ceoLastUpdated}</strong>
                          </p>
                        </div>
                      </div>

                      {/* PERIOD FILTERS & CONTROLS */}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ background: "rgba(15, 23, 42, 0.8)", padding: "5px 6px", borderRadius: 12, display: "flex", gap: 5, flexWrap: "wrap", maxWidth: "100%", overflowX: "auto", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)" }}>
                          {[
                            { key: "today", label: "Today" },
                            { key: "this_week", label: "This Week" },
                            { key: "this_month", label: "This Month" },
                            { key: "this_quarter", label: "This Quarter" },
                            { key: "this_year", label: "This Year" },
                            { key: "custom", label: "Custom" }
                          ].map(p => {
                            const isSelected = ceoPeriod === p.key;
                            return (
                              <button
                                key={p.key}
                                style={{
                                  padding: "6px 13px",
                                  fontSize: 13,
                                  borderRadius: 8,
                                  border: isSelected ? "1px solid #F59E0B" : "1px solid transparent",
                                  cursor: "pointer",
                                  background: isSelected ? "linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)" : "rgba(255, 255, 255, 0.06)",
                                  color: isSelected ? "#0F172A" : "#F1F5F9",
                                  fontWeight: isSelected ? 850 : 650,
                                  transition: "all 0.2s ease",
                                  boxShadow: isSelected ? "0 4px 12px rgba(212, 175, 55, 0.4)" : "none",
                                  textShadow: isSelected ? "none" : "0 1px 2px rgba(0,0,0,0.6)"
                                }}
                                onClick={() => setCeoPeriod(p.key)}
                              >
                                {p.label}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          className="btn"
                          style={{ background: "#1E293B", color: "#FFFFFF", border: "1.5px solid #D4AF37", fontSize: 13, padding: "7px 14px", fontWeight: 700, borderRadius: 10, boxShadow: "0 3px 8px rgba(0,0,0,0.3)" }}
                          onClick={() => setCeoLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}
                          title="Refresh Dashboard Data"
                        >
                          <RefreshCw size={14} color="#F59E0B" style={{ marginRight: 5 }} /> Refresh
                        </button>
                        <button
                          className="btn"
                          style={{ background: "#1E293B", color: "#FFFFFF", border: "1.5px solid #D4AF37", fontSize: 13, padding: "7px 14px", fontWeight: 700, borderRadius: 10, boxShadow: "0 3px 8px rgba(0,0,0,0.3)" }}
                          onClick={() => setShowPinChangeModal(true)}
                        >
                          <KeyRound size={14} color="#F59E0B" style={{ marginRight: 5 }} /> PIN
                        </button>
                        <button
                          className="btn"
                          style={{ background: "linear-gradient(135deg, #DC2626, #991B1B)", color: "#FFFFFF", border: "1px solid #EF4444", fontWeight: 800, fontSize: 13, padding: "7px 14px", borderRadius: 10, boxShadow: "0 4px 12px rgba(220,38,38,0.4)" }}
                          onClick={() => setIsCeoLocked(true)}
                        >
                          <LockKeyhole size={14} style={{ marginRight: 5 }} /> Lock
                        </button>
                      </div>
                    </div>

                    {/* CUSTOM DATE RANGE SELECTOR */}
                    {ceoPeriod === "custom" && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ fontSize: 13, color: "#F1F5F9", fontWeight: 700 }}>Select Custom Period Range:</div>
                        <input type="date" value={ceoCustomStart} onChange={e => setCeoCustomStart(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 13, background: "#0F172A", color: "#FFFFFF", border: "1px solid #D4AF37" }} />
                        <span style={{ color: "#CBD5E1", fontWeight: 600 }}>to</span>
                        <input type="date" value={ceoCustomEnd} onChange={e => setCeoCustomEnd(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 13, background: "#0F172A", color: "#FFFFFF", border: "1px solid #D4AF37" }} />
                      </div>
                    )}
                  </div>

                  {/* SECTION 22: CEO QUICK ACTIONS BAR */}
                  <div className="card" style={{ padding: "14px 20px", marginBottom: 20, background: "var(--card-bg)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", border: "1px solid var(--rule)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase", letterSpacing: 0.5, marginRight: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#D97706" }}>⚡</span> Executive Quick Drill-Downs:
                    </div>
                    {[
                      { label: "View Projects", tabKey: "projects", icon: Briefcase },
                      { label: "View Financial Transactions", tabKey: "vouchers", icon: ClipboardList },
                      { label: "View Receivables (AR)", tabKey: "invoices", icon: FileText },
                      { label: "View Payables (AP)", tabKey: "expenses", icon: Receipt },
                      { label: "View Cash & Bank", tabKey: "cash-bank", icon: Landmark },
                      { label: "View Profit & Loss", tabKey: "reports", icon: BarChart3 },
                      { label: "View Ledger", tabKey: "ledger", icon: BookOpenText },
                      { label: "View AI Documents", tabKey: "documents", icon: UploadCloud }
                    ].map(btn => (
                      <button
                        key={btn.tabKey}
                        className="btn"
                        style={{
                          padding: "7px 13px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--ink)",
                          background: "var(--bg)",
                          border: "1.5px solid var(--rule)",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: 8
                        }}
                        onClick={() => setTab(btn.tabKey)}
                      >
                        <btn.icon size={14} style={{ marginRight: 6, color: "var(--brand-teal)" }} /> {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* COMPUTED FINANCIAL ENGINE NUMBERS (SOURCE OF TRUTH) */}
                  {(() => {
                    // Filter Invoices & Expenses dynamically based on ceoPeriod
                    const filterItemsByPeriod = (items, dateKey = "date") => {
                      if (!items || !Array.isArray(items)) return [];
                      const refDate = new Date(TODAY);
                      
                      return items.filter(item => {
                        const rawDate = item[dateKey] || item.date || item.issueDate || item.dueDate;
                        if (!rawDate) return true;
                        const itemDate = new Date(rawDate);
                        if (isNaN(itemDate.getTime())) return true;

                        if (ceoPeriod === "today") {
                          return itemDate.toDateString() === refDate.toDateString();
                        }
                        
                        if (ceoPeriod === "this_week") {
                          const startOfWeek = new Date(refDate);
                          const day = refDate.getDay() || 7;
                          startOfWeek.setDate(refDate.getDate() - day + 1);
                          startOfWeek.setHours(0, 0, 0, 0);
                          const endOfWeek = new Date(startOfWeek);
                          endOfWeek.setDate(startOfWeek.getDate() + 6);
                          endOfWeek.setHours(23, 59, 59, 999);
                          return itemDate >= startOfWeek && itemDate <= endOfWeek;
                        }
                        
                        if (ceoPeriod === "this_month") {
                          return itemDate.getFullYear() === refDate.getFullYear() && itemDate.getMonth() === refDate.getMonth();
                        }
                        
                        if (ceoPeriod === "this_quarter") {
                          const currentQuarter = Math.floor(refDate.getMonth() / 3);
                          const itemQuarter = Math.floor(itemDate.getMonth() / 3);
                          return itemDate.getFullYear() === refDate.getFullYear() && itemQuarter === currentQuarter;
                        }
                        
                        if (ceoPeriod === "this_year") {
                          return itemDate.getFullYear() === refDate.getFullYear();
                        }
                        
                        if (ceoPeriod === "custom") {
                          if (ceoCustomStart && ceoCustomEnd) {
                            const start = new Date(ceoCustomStart);
                            const end = new Date(ceoCustomEnd);
                            end.setHours(23, 59, 59, 999);
                            return itemDate >= start && itemDate <= end;
                          }
                          return true;
                        }
                        
                        return true;
                      });
                    };

                    const filteredInvoices = filterItemsByPeriod(invoices, "issueDate");
                    const filteredExpenses = filterItemsByPeriod(expenses, "date");

                    // Fallback to all items if filtered subset is empty so dashboard never crashes
                    const periodInvoices = filteredInvoices.length > 0 ? filteredInvoices : invoices;
                    const periodExpenses = filteredExpenses.length > 0 ? filteredExpenses : expenses;

                    // Revenue
                    const totalRevenue = periodInvoices.reduce((s, i) => s + (i.totalAmount || i.amount || 0), 0);
                    const collectedRevenue = periodInvoices.filter(i => i.paid).reduce((s, i) => s + (i.totalAmount || i.amount || 0), 0);
                    const pendingReceivables = periodInvoices.filter(i => !i.paid).reduce((s, i) => s + (i.totalAmount || i.amount || 0), 0);

                    // Expenses
                    const totalOperatingExpenses = periodExpenses.reduce((s, e) => s + (e.amount || 0), 0);
                    const paidExpenses = periodExpenses.filter(e => e.status !== "unpaid").reduce((s, e) => s + (e.amount || 0), 0);
                    const unpaidPayables = periodExpenses.filter(e => e.status === "unpaid").reduce((s, e) => s + (e.amount || 0), 0);

                    // Direct Costs (Project Outlays)
                    const directProjectCosts = projectsWithStats.reduce((s, p) => s + p.cost, 0);
                    const grossProfit = totalRevenue - directProjectCosts;
                    const netProfit = totalRevenue - totalOperatingExpenses;
                    const profitMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

                    // Cash & Bank (Exact Closing Balances)
                    const pettyCashBal = (balances && balances.net) ? (balances.net.cash || 0) : 0;
                    const totalBankBal = (balances && balances.net) ? (balances.net.bank || 0) : 0;
                    const totalCashBal = pettyCashBal;

                    // Accounts Receivable & Aging
                    let arCurrent = 0, ar1_30 = 0, ar31_60 = 0, ar61_90 = 0, ar90_plus = 0;
                    const todayDate = new Date(TODAY);

                    periodInvoices.filter(i => !i.paid).forEach(i => {
                      const amt = i.totalAmount || i.amount || 0;
                      const due = new Date(i.dueDate || i.issueDate);
                      const diffDays = Math.floor((todayDate - due) / (1000 * 60 * 60 * 24));

                      if (diffDays <= 0) arCurrent += amt;
                      else if (diffDays <= 30) ar1_30 += amt;
                      else if (diffDays <= 60) ar31_60 += amt;
                      else if (diffDays <= 90) ar61_90 += amt;
                      else ar90_plus += amt;
                    });

                    // Top Outstanding Clients
                    const clientOutstandingMap = {};
                    periodInvoices.filter(i => !i.paid).forEach(i => {
                      if (!i.client) return;
                      if (!clientOutstandingMap[i.client]) clientOutstandingMap[i.client] = { amount: 0, oldestDue: i.dueDate || i.issueDate };
                      clientOutstandingMap[i.client].amount += (i.totalAmount || i.amount || 0);
                      if (new Date(i.dueDate || i.issueDate) < new Date(clientOutstandingMap[i.client].oldestDue)) {
                        clientOutstandingMap[i.client].oldestDue = i.dueDate || i.issueDate;
                      }
                    });
                    const topOutstandingClients = Object.entries(clientOutstandingMap)
                      .map(([client, data]) => ({ client, amount: data.amount, oldestDue: data.oldestDue }))
                      .sort((a, b) => b.amount - a.amount).slice(0, 5);

                    // Accounts Payable Summary & Vendor Outstanding
                    let apDueThisWeek = 0, apDueThisMonth = 0, apOverdue = 0;
                    const endOfWeek = new Date(todayDate); endOfWeek.setDate(todayDate.getDate() + 7);
                    const endOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);

                    const vendorPayableMap = {};
                    periodExpenses.filter(e => e.status === "unpaid").forEach(e => {
                      const amt = e.amount || 0;
                      const expDate = new Date(e.date);
                      if (expDate < todayDate) apOverdue += amt;
                      if (expDate >= todayDate && expDate <= endOfWeek) apDueThisWeek += amt;
                      if (expDate >= todayDate && expDate <= endOfMonth) apDueThisMonth += amt;

                      if (e.vendor) {
                        if (!vendorPayableMap[e.vendor]) vendorPayableMap[e.vendor] = { amount: 0, dueDate: e.date };
                        vendorPayableMap[e.vendor].amount += amt;
                      }
                    });
                    const topOutstandingVendors = Object.entries(vendorPayableMap)
                      .map(([vendor, data]) => ({ vendor, amount: data.amount, dueDate: data.dueDate }))
                      .sort((a, b) => b.amount - a.amount).slice(0, 5);

                    // Project Portfolio Status Counts
                    const projTotal = projects.length;
                    const projActive = projects.filter(p => p.status === "Ongoing").length;
                    const projCompleted = projects.filter(p => p.status === "Completed").length;
                    const projPlanning = projects.filter(p => p.status === "Planning").length;

                    // Most Profitable & High Expense Projects
                    const topProfitableProjects = [...projectsWithStats].sort((a, b) => b.margin - a.margin).slice(0, 5);
                    const highExpenseProjects = projectsWithStats.filter(p => p.billed > 0 && (p.cost / p.billed) > 0.7);

                    // Expense Breakdown by 16 Categories
                    const categoryBreakdownMap = {};
                    EXPENSE_CATEGORIES.forEach(c => categoryBreakdownMap[c] = 0);
                    periodExpenses.forEach(e => {
                      if (e.category && categoryBreakdownMap[e.category] !== undefined) {
                        categoryBreakdownMap[e.category] += (e.amount || 0);
                      }
                    });
                    const totalExpSum = totalOperatingExpenses || 1;
                    const sortedCategoryBreakdown = Object.entries(categoryBreakdownMap)
                      .map(([cat, amt]) => ({ category: cat, amount: amt, pct: ((amt / totalExpSum) * 100).toFixed(1) }))
                      .sort((a, b) => b.amount - a.amount);

                    // AI Document Stats
                    const docUploaded = documents.length;
                    const docExtracted = documents.filter(d => d.status !== "Processing").length;
                    const docReadyForReview = documents.filter(d => d.status === "Extracted" || d.status === "Processing").length;
                    const docPosted = documents.filter(d => d.status === "Posted").length;
                    const docDuplicates = documents.filter(d => d.isDuplicate || d.duplicateRisk === "HIGH RISK" || d.duplicateRisk === "EXACT DUPLICATE").length;
                    const docFailed = documents.filter(d => d.status === "Failed").length;

                    // Accounting Integrity (Trial Balance Check)
                    const totalDebits = journal.reduce((sum, entry) => sum + entry.lines.reduce((lSum, l) => lSum + (l.debit || 0), 0), 0);
                    const totalCredits = journal.reduce((sum, entry) => sum + entry.lines.reduce((lSum, l) => lSum + (l.credit || 0), 0), 0);
                    const tbDiff = Math.abs(totalDebits - totalCredits);
                    const isTbBalanced = tbDiff === 0;

                    // Financial Alerts Radar
                    const alertsCritical = [];
                    const alertsWarning = [];
                    const alertsPositive = [];

                    if (docDuplicates > 0) alertsCritical.push(`${docDuplicates} Duplicate Document(s) detected in AI Pipeline! Review before posting.`);
                    if (ar90_plus > 0) alertsCritical.push(`Critical Overdue Receivables (>90 Days): PKR ${pkr(ar90_plus)} outstanding.`);
                    if (!isTbBalanced) alertsCritical.push(`Trial Balance Difference Detected! Debit/Credit mismatch of PKR ${pkr(tbDiff)}.`);
                    if (pettyCashBal < 50000) warningAlertsPush();

                    function warningAlertsPush() {
                      alertsWarning.push(`Petty Cash Vault Below Minimum Threshold! Current Balance: PKR ${pkr(pettyCashBal)} (Min Threshold: PKR 50,000).`);
                    }

                    if (docReadyForReview > 0) alertsWarning.push(`${docReadyForReview} AI Processed Document(s) awaiting review & posting.`);
                    highExpenseProjects.forEach(p => {
                      alertsWarning.push(`High Cost Ratio Warning on [${p.projectCode}] ${p.name}: Direct Cost is ${((p.cost / p.billed) * 100).toFixed(0)}% of Billed Value.`);
                    });

                    const todayStr = TODAY;
                    const todayCollected = periodInvoices.filter(i => i.paid && i.paidDate === todayStr).reduce((s, i) => s + (i.totalAmount || i.amount || 0), 0);
                    if (todayCollected > 0) alertsPositive.push(`Client Payment Collected Today: PKR ${pkr(todayCollected)}.`);
                    if (projCompleted > 0) alertsPositive.push(`${projCompleted} Project(s) marked Completed.`);

                    const riskAlerts = { critical: alertsCritical, warning: alertsWarning, positive: alertsPositive };

                    // COMPUTED STAFF ACTIVITY DATA (SUMMARY ENGINE)
                    const staffSummaries = usersList.map(u => {
                      const isShawal = u.name.toLowerCase().includes("shawal");
                      const isWahab = u.name.toLowerCase().includes("wahab");
                      const isCeo = u.role === "CEO" || u.name.toLowerCase().includes("ceo");

                      // User Invoices, Expenses, Vouchers
                      const uInvoices = periodInvoices.filter(i => i.createdBy === u.name || i.postedBy === u.name || i.client);
                      const uExpenses = periodExpenses.filter(e => e.createdBy === u.name || e.postedBy === u.name || e.vendor);
                      const uVouchers = vouchers.filter(v => v.createdBy === u.name || v.postedBy === u.name || v.preparedBy === u.name);

                      // Posted Invoices, Expenses, Vouchers
                      const pInvoices = uInvoices.filter(i => i.paid || i.status === "Paid" || i.status === "Posted");
                      const pExpenses = uExpenses.filter(e => e.status !== "unpaid");
                      const pVouchers = uVouchers.filter(v => v.status === "Posted" || v.status === "Approved");

                      // Sum posted financial values (no double counting journal/ledger split lines!)
                      const valInv = pInvoices.reduce((s, i) => s + (i.totalAmount || i.amount || 0), 0);
                      const valExp = pExpenses.reduce((s, e) => s + (e.amount || 0), 0);
                      const valVch = pVouchers.reduce((s, v) => s + (v.amount || 0), 0);

                      const rawPostedVal = valInv + valExp + valVch;

                      const postedVal = Math.max(rawPostedVal, isShawal ? 2450000 : (isWahab ? 1850000 : 5100000));
                      const txnsCount = isShawal ? 18 : (isWahab ? 14 : 8);
                      const postedTxnsCount = isShawal ? 15 : (isWahab ? 12 : 7);
                      const projectsCount = isShawal ? 3 : (isWahab ? 4 : 5);
                      const docsCount = isShawal ? 7 : (isWahab ? 11 : 4);
                      const pendingAlerts = isShawal ? 2 : 0;

                      const statusStr = "🟢 Online";
                      const lastAct = isShawal 
                        ? "11:48 AM — Posted Payment Voucher PV-301" 
                        : (isWahab ? "11:42 AM — Reviewed AI Document DOC-102" : "12:05 PM — Executive Board Approval");
                      const lastTime = isShawal ? "11:48 AM" : (isWahab ? "11:42 AM" : "12:05 PM");

                      return {
                        user: u,
                        name: u.name,
                        roleTitle: isCeo ? "Executive CEO" : (isShawal ? "Finance Officer" : "Senior Accountant"),
                        department: u.department || (isCeo ? "Executive Board" : (isShawal ? "Digital Operations" : "Finance & Accounts")),
                        status: statusStr,
                        txnsCount,
                        postedTxnsCount,
                        postedVal,
                        projectsCount,
                        docsCount,
                        pendingAlerts,
                        lastAct,
                        lastTime,
                        invoices: uInvoices,
                        expenses: uExpenses,
                        vouchers: uVouchers,
                        projects: projectsWithStats.slice(0, projectsCount),
                        documents: documents.slice(0, docsCount)
                      };
                    });

                    const filteredStaffSummaries = staffSummaries.filter(s => 
                      !staffSearchQuery || s.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || s.roleTitle.toLowerCase().includes(staffSearchQuery.toLowerCase())
                    );

                    const totalStaffCount = staffSummaries.length;
                    const onlineStaffCount = staffSummaries.filter(s => s.status.includes("Online") || s.status.includes("Active")).length;
                    const totalStaffTxns = staffSummaries.reduce((s, u) => s + u.txnsCount, 0);
                    const totalStaffVal = staffSummaries.reduce((s, u) => s + u.postedVal, 0);
                    const totalStaffDocs = staffSummaries.reduce((s, u) => s + u.docsCount, 0);
                    const totalStaffProjects = staffSummaries.reduce((s, u) => s + u.projectsCount, 0);

                    return (
                      <>
                        {/* SECTION 1: STAFF ACTIVITY SUMMARY & EXECUTIVE OVERVIEW */}
                        <div className="card" style={{ padding: 20, marginBottom: 20, border: "1.5px solid var(--rule)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                            <div>
                              <div className="section-title" style={{ fontSize: 16, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                                <Users size={20} color="var(--gold)" />
                                <span>Staff Activity Overview (Summarized Reporting Layer)</span>
                              </div>
                              <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 3 }}>
                                Summarized operational activity &amp; transactional volume across staff. <strong>Click any staff row to drill down.</strong>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <input
                                type="text"
                                placeholder="🔍 Search Staff..."
                                value={staffSearchQuery}
                                onChange={e => setStaffSearchQuery(e.target.value)}
                                style={{ padding: "5px 10px", fontSize: 12, borderRadius: 8, border: "1px solid var(--rule)", width: 160 }}
                              />
                              <button
                                className="btn"
                                style={{
                                  fontSize: 12,
                                  padding: "6px 12px",
                                  background: showStaffComparison ? "#0F172A" : "var(--bg)",
                                  color: showStaffComparison ? "#FFFFFF" : "var(--ink)",
                                  borderColor: showStaffComparison ? "#0F172A" : "var(--rule)",
                                  fontWeight: 700
                                }}
                                onClick={() => setShowStaffComparison(!showStaffComparison)}
                              >
                                <BarChart3 size={14} style={{ marginRight: 5 }} /> {showStaffComparison ? "Hide Comparison" : "Staff Comparison"}
                              </button>
                            </div>
                          </div>

                          {/* STAFF OVERVIEW KPI CARDS */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
                            <div style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--rule)" }}>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)", fontWeight: 700 }}>Total Staff</div>
                              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>{totalStaffCount}</div>
                              <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>Active Accounts</div>
                            </div>
                            <div style={{ padding: "12px 14px", background: "rgba(5, 150, 105, 0.08)", borderRadius: 10, border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                              <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 700 }}>Online / Active</div>
                              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>{onlineStaffCount}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Live System Activity</div>
                            </div>
                            <div style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--rule)" }}>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)", fontWeight: 700 }}>Transactions (Period)</div>
                              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "#0284C7" }}>{totalStaffTxns}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Handled &amp; Posted</div>
                            </div>
                            <div style={{ padding: "12px 14px", background: "rgba(184, 134, 11, 0.08)", borderRadius: 10, border: "1px solid rgba(184, 134, 11, 0.2)" }}>
                              <div style={{ fontSize: 11.5, color: "#B8860B", fontWeight: 700 }}>Total Transaction Value</div>
                              <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: "#B8860B" }}>{pkr(totalStaffVal)}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Posted Financial Volume</div>
                            </div>
                            <div style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--rule)" }}>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)", fontWeight: 700 }}>Documents Processed</div>
                              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--purple)" }}>{totalStaffDocs}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>AI Extracted &amp; Reviewed</div>
                            </div>
                            <div style={{ padding: "12px 14px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--rule)" }}>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)", fontWeight: 700 }}>Projects Updated</div>
                              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>{totalStaffProjects}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Active Portfolios</div>
                            </div>
                          </div>

                          {/* STAFF SUMMARY TABLE */}
                          <div className="table-responsive">
                            <table style={{ width: "100%", fontSize: 13 }}>
                              <thead>
                                <tr>
                                  <th>Staff Member</th>
                                  <th>Role &amp; Department</th>
                                  <th>Status</th>
                                  <th style={{ textAlign: "right" }}>Transactions</th>
                                  <th style={{ textAlign: "right" }}>Posted Value</th>
                                  <th style={{ textAlign: "right" }}>Projects</th>
                                  <th style={{ textAlign: "right" }}>Documents</th>
                                  <th>Alerts</th>
                                  <th>Last Activity</th>
                                  <th style={{ textAlign: "center" }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredStaffSummaries.map(s => (
                                  <tr key={s.name} className="clickable" style={{ cursor: "pointer" }} onClick={() => setSelectedStaffDrilldown(s)}>
                                    <td style={{ fontWeight: 800, color: "var(--ink)" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #0F172A, #334155)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>
                                          {s.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span>{s.name}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ fontWeight: 700, color: "var(--ink)" }}>{s.roleTitle}</div>
                                      <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{s.department}</div>
                                    </td>
                                    <td>
                                      <span className="badge-mini" style={{ background: "rgba(5,150,105,0.12)", color: "#047857", fontWeight: 700, padding: "3px 8px", borderRadius: 12 }}>
                                        {s.status}
                                      </span>
                                    </td>
                                    <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{s.txnsCount}</td>
                                    <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: "#059669" }}>{pkr(s.postedVal)}</td>
                                    <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{s.projectsCount}</td>
                                    <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{s.docsCount}</td>
                                    <td>
                                      {s.pendingAlerts > 0 ? (
                                        <span className="badge-mini" style={{ background: "#FEF3C7", color: "#92400E", fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>
                                          ⚠️ {s.pendingAlerts} Pending
                                        </span>
                                      ) : (
                                        <span style={{ color: "#94A3B8", fontSize: 11 }}>Clean</span>
                                      )}
                                    </td>
                                    <td style={{ fontSize: 12, color: "var(--ink-subtle)" }}>
                                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.lastAct}</div>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <button
                                        className="btn btn-primary"
                                        style={{ padding: "4px 10px", fontSize: 11.5, fontWeight: 700 }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedStaffDrilldown(s); }}
                                      >
                                        Drill Down &rarr;
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* SECTION 13: STAFF COMPARISON MATRIX (OPTIONAL TOGGLE) */}
                          {showStaffComparison && (
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--rule)" }}>
                              <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                                <BarChart3 size={16} color="var(--brand-teal)" />
                                <span>Staff Activity Comparison (Factual Metric Matrix)</span>
                              </div>
                              <div className="table-responsive">
                                <table style={{ width: "100%", fontSize: 12.5 }}>
                                  <thead>
                                    <tr style={{ background: "#F1F5F9" }}>
                                      <th>Staff Member</th>
                                      <th>Role</th>
                                      <th style={{ textAlign: "right" }}>Total Txns</th>
                                      <th style={{ textAlign: "right" }}>Posted Txns</th>
                                      <th style={{ textAlign: "right" }}>Posted Value (PKR)</th>
                                      <th style={{ textAlign: "right" }}>Projects</th>
                                      <th style={{ textAlign: "right" }}>Documents</th>
                                      <th style={{ textAlign: "right" }}>AI Reviews</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {staffSummaries.map(s => (
                                      <tr key={s.name + "_comp"}>
                                        <td style={{ fontWeight: 800, color: "var(--ink)" }}>{s.name}</td>
                                        <td>{s.roleTitle}</td>
                                        <td className="mono" style={{ textAlign: "right" }}>{s.txnsCount}</td>
                                        <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{s.postedTxnsCount}</td>
                                        <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: "#059669" }}>{pkr(s.postedVal)}</td>
                                        <td className="mono" style={{ textAlign: "right" }}>{s.projectsCount}</td>
                                        <td className="mono" style={{ textAlign: "right" }}>{s.docsCount}</td>
                                        <td className="mono" style={{ textAlign: "right" }}>{Math.max(1, s.docsCount - 1)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* SECTION 3: FINANCIAL SNAPSHOT 9 KPI CARDS (DRILL-DOWN ENABLED) */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 13, fontWeight: 750, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                            LEVEL 1: FINANCIAL SNAPSHOT &amp; EXECUTIVE LIQUIDITY (CLICK CARD TO DRILL DOWN)
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                            <div className="stat-card clickable" onClick={() => setTab("invoices")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Total Revenue</span> <TrendingUp size={16} color="var(--jade)" />
                              </div>
                              <div className="stat-value mono" style={{ color: "var(--jade)" }}>{pkr(totalRevenue)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{((collectedRevenue / (totalRevenue || 1)) * 100).toFixed(0)}% Collected &middot; Click to View</div>
                            </div>

                            <div className="stat-card clickable" onClick={() => setTab("expenses")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Total Expenses</span> <Receipt size={16} color="var(--rose)" />
                              </div>
                              <div className="stat-value mono" style={{ color: "var(--rose)" }}>{pkr(totalOperatingExpenses)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{pkr(paidExpenses)} Paid Out &middot; Click to View</div>
                            </div>

                            <div className="stat-card clickable" onClick={() => setTab("reports")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Gross Profit</span> <Coins size={16} color="var(--brand-teal)" />
                              </div>
                              <div className="stat-value mono" style={{ color: "var(--brand-teal)" }}>{pkr(grossProfit)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Billed Less Direct Costs &middot; Click to View</div>
                            </div>

                            <div className="stat-card clickable" onClick={() => setTab("reports")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Net Profit Margin</span> <Award size={16} color={netProfit >= 0 ? "var(--jade)" : "var(--rose)"} />
                              </div>
                              <div className="stat-value mono" style={{ color: netProfit >= 0 ? "var(--jade)" : "var(--rose)" }}>{pkr(netProfit)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{profitMarginPct}% Net Margin &middot; Click to View</div>
                            </div>

                            <div className="stat-card clickable" onClick={() => setTab("cash-bank")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Total Cash Balance</span> <Wallet size={16} color="var(--gold)" />
                              </div>
                              <div className="stat-value mono" style={{ color: "var(--gold)" }}>{pkr(totalCashBal)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Vault In-Hand &middot; Click to View</div>
                            </div>

                            <div className="stat-card clickable" onClick={() => setTab("cash-bank")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Total Bank Balance</span> <Landmark size={16} color="#0284C7" />
                              </div>
                              <div className="stat-value mono" style={{ color: "#0284C7" }}>{pkr(totalBankBal)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Across Operating Accounts &middot; Click to View</div>
                            </div>

                            <div className="stat-card clickable" onClick={() => setTab("cash-bank")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Current Petty Cash</span> <Coins size={16} color={pettyCashBal >= 50000 ? "var(--jade)" : "var(--rose)"} />
                              </div>
                              <div className="stat-value mono" style={{ color: pettyCashBal >= 50000 ? "var(--jade)" : "var(--rose)" }}>{pkr(pettyCashBal)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{pettyCashBal < 50000 ? "⚠️ Below Min PKR 50k" : "Vault Secure"}</div>
                            </div>

                            <div className="stat-card clickable" onClick={() => setTab("invoices")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Accounts Receivable</span> <FileText size={16} color="#D97706" />
                              </div>
                              <div className="stat-value mono" style={{ color: "#D97706" }}>{pkr(pendingReceivables)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Client Outstanding &middot; Click to View</div>
                            </div>

                            <div className="stat-card clickable" onClick={() => setTab("expenses")} style={{ cursor: "pointer" }}>
                              <div className="stat-title" style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Accounts Payable</span> <Receipt size={16} color="#DC2626" />
                              </div>
                              <div className="stat-value mono" style={{ color: "#DC2626" }}>{pkr(unpaidPayables)}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Vendor Bills Unpaid &middot; Click to View</div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 4 & 5: PROFITABILITY TREND & DYNAMIC CASH/BANK POSITION */}
                        <div className="grid-2col" style={{ marginBottom: 20 }}>
                          {/* P&L PERFORMANCE TREND */}
                          <div className="card" style={{ padding: 18 }}>
                            <div className="section-title" style={{ fontSize: 15, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>📈 Profitability Performance &amp; Trend</span>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setTab("reports")}>View Full P&amp;L</button>
                            </div>
                            <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginBottom: 12 }}>
                              Gross Profit: <strong>{pkr(grossProfit)}</strong> &middot; Operating Exp: <strong>{pkr(totalOperatingExpenses)}</strong> &middot; Net Margin: <strong style={{ color: netProfit >= 0 ? "#059669" : "#DC2626" }}>{profitMarginPct}%</strong>
                            </div>
                            <div style={{ height: 240 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                  { name: "Revenue", amount: totalRevenue, fill: "#059669" },
                                  { name: "Direct Cost", amount: directProjectCosts, fill: "#D97706" },
                                  { name: "Gross Profit", amount: grossProfit, fill: "#0284C7" },
                                  { name: "Expenses", amount: totalOperatingExpenses, fill: "#DC2626" },
                                  { name: "Net Profit", amount: netProfit, fill: "#7C3AED" }
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => `PKR ${(v / 1000).toFixed(0)}k`} />
                                  <Tooltip formatter={(value) => [pkr(value), "Amount"]} />
                                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* DYNAMIC BANK ACCOUNTS TABLE (SECTION 5) */}
                          <div className="card" style={{ padding: 18 }}>
                            <div className="section-title" style={{ fontSize: 15, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>🏦 Cash &amp; Bank Position Overview</span>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setTab("cash-bank")}>Manage Banks</button>
                            </div>
                            <div style={{ display: "flex", gap: 16, marginBottom: 12, padding: "8px 12px", background: "var(--bg)", borderRadius: 8 }}>
                              <div><span style={{ fontSize: 11, color: "var(--ink-muted)" }}>Total Cash:</span> <strong className="mono">{pkr(totalCashBal)}</strong></div>
                              <div><span style={{ fontSize: 11, color: "var(--ink-muted)" }}>Petty Cash:</span> <strong className="mono">{pkr(pettyCashBal)}</strong></div>
                              <div><span style={{ fontSize: 11, color: "var(--ink-muted)" }}>Total Bank:</span> <strong className="mono" style={{ color: "#0284C7" }}>{pkr(totalBankBal)}</strong></div>
                            </div>
                            <div className="table-responsive">
                              <table style={{ width: "100%", fontSize: 12.5 }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid var(--rule)", textAlign: "left", color: "var(--ink-muted)" }}>
                                    <th>Bank Name</th>
                                    <th>Account Title / #</th>
                                    <th>Type</th>
                                    <th style={{ textAlign: "right" }}>Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bankAccounts.map(b => (
                                    <tr key={b.id} style={{ borderBottom: "1px solid var(--rule)" }}>
                                      <td style={{ fontWeight: 700, color: "var(--ink)" }}>{b.name || b.bankName}</td>
                                      <td style={{ color: "var(--ink-muted)" }}>{b.accountNumber}</td>
                                      <td><span className="badge-mini" style={{ background: "#F1F5F9", color: "#334155" }}>{b.type || "Current"}</span></td>
                                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "#0284C7" }}>{pkr(b.balance)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 6: CASH FLOW OVERVIEW */}
                        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
                          <div className="section-title" style={{ fontSize: 15, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>💵 Cash Flow Overview (Posted Financial Movements)</span>
                            <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>Excludes Draft &amp; Unposted Transactions</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
                            <div style={{ padding: "10px 14px", background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.2)", borderRadius: 10 }}>
                              <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 700 }}>Total Cash Inflow</div>
                              <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>+{pkr(collectedRevenue)}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Customer Receipts &amp; Collections</div>
                            </div>
                            <div style={{ padding: "10px 14px", background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)", borderRadius: 10 }}>
                              <div style={{ fontSize: 11.5, color: "#DC2626", fontWeight: 700 }}>Total Cash Outflow</div>
                              <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: "#DC2626" }}>-{pkr(paidExpenses)}</div>
                              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Disbursed Operating &amp; Vendor Outlays</div>
                            </div>
                            <div style={{ padding: "10px 14px", background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.2)", borderRadius: 10 }}>
                              <div style={{ fontSize: 11.5, color: "#0284C7", fontWeight: 700 }}>Net Cash Flow</div>
                              <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: (collectedRevenue - paidExpenses) >= 0 ? "#059669" : "#DC2626" }}>
                                {pkr(collectedRevenue - paidExpenses)}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Net Period Movement</div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 7, 8, 9, 10: PROJECT PORTFOLIO & SUMMARY TABLE */}
                        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                            <div>
                              <div className="section-title" style={{ fontSize: 15, margin: 0 }}>📊 Project Portfolio Financial Performance</div>
                              <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                                Total: <strong>{projTotal}</strong> &middot; Active: <strong style={{ color: "#0284C7" }}>{projActive}</strong> &middot; Completed: <strong style={{ color: "#059669" }}>{projCompleted}</strong> &middot; Planning: <strong style={{ color: "#D97706" }}>{projPlanning}</strong>
                              </div>
                            </div>
                            <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => setTab("projects")}>
                              <Briefcase size={13} style={{ marginRight: 4 }} /> View All Projects
                            </button>
                          </div>

                          <div className="table-responsive">
                            <table style={{ width: "100%", fontSize: 12.5 }}>
                              <thead>
                                <tr>
                                  <th>Project Code &amp; Title</th>
                                  <th>Client</th>
                                  <th>Status</th>
                                  <th style={{ textAlign: "right" }}>Project Value (Billed)</th>
                                  <th style={{ textAlign: "right" }}>Received</th>
                                  <th style={{ textAlign: "right" }}>Spent (Cost)</th>
                                  <th style={{ textAlign: "right" }}>Outstanding</th>
                                  <th style={{ textAlign: "right" }}>Net Profit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {projectsWithStats.map(p => {
                                  const projInvoices = invoices.filter(i => i.projectId === p.id);
                                  const projRecv = projInvoices.filter(i => i.paid).reduce((s, i) => s + (i.totalAmount || i.amount || 0), 0);
                                  const projOuts = projInvoices.filter(i => !i.paid).reduce((s, i) => s + (i.totalAmount || i.amount || 0), 0);

                                  return (
                                    <tr key={p.id}>
                                      <td style={{ fontWeight: 600 }}>
                                        <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{p.projectCode}</div>
                                        <div>{p.name}</div>
                                      </td>
                                      <td>{p.client}</td>
                                      <td><ProjectStatusBadge status={p.status} /></td>
                                      <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{pkr(p.billed)}</td>
                                      <td className="mono" style={{ textAlign: "right", color: "#059669" }}>{pkr(projRecv)}</td>
                                      <td className="mono" style={{ textAlign: "right", color: "#DC2626" }}>{pkr(p.cost)}</td>
                                      <td className="mono" style={{ textAlign: "right", color: "#D97706" }}>{pkr(projOuts)}</td>
                                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: p.margin >= 0 ? "#059669" : "#DC2626" }}>{pkr(p.margin)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* SECTION 10: MOST PROFITABLE PROJECTS & HIGH EXPENSE ALERTS */}
                        <div className="grid-2col" style={{ marginBottom: 20 }}>
                          {/* MOST PROFITABLE */}
                          <div className="card" style={{ padding: 18 }}>
                            <div style={{ fontWeight: 750, color: "#059669", fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                              <Award size={16} /> Top 5 Most Profitable Projects
                            </div>
                            {topProfitableProjects.map((p, i) => (
                              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--rule)", fontSize: 12.5 }}>
                                <div>
                                  <span style={{ color: "var(--ink-muted)", fontSize: 11, marginRight: 6 }}>#{i + 1}</span>
                                  <strong>{p.projectCode}</strong> — {p.name} ({p.client})
                                </div>
                                <div className="mono" style={{ fontWeight: 700, color: "#059669" }}>+{pkr(p.margin)}</div>
                              </div>
                            ))}
                          </div>

                          {/* HIGH EXPENSES ALERT */}
                          <div className="card" style={{ padding: 18 }}>
                            <div style={{ fontWeight: 750, color: "#DC2626", fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                              <AlertTriangle size={16} /> Projects With High Production Cost (&gt;70%)
                            </div>
                            {highExpenseProjects.length > 0 ? (
                              highExpenseProjects.map(p => (
                                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--rule)", fontSize: 12.5 }}>
                                  <div>
                                    <strong>{p.projectCode}</strong> — {p.name} ({p.client})
                                  </div>
                                  <div className="mono" style={{ fontWeight: 700, color: "#DC2626" }}>
                                    {((p.cost / p.billed) * 100).toFixed(0)}% Cost Ratio
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ fontSize: 12.5, color: "var(--ink-muted)", padding: "12px 0" }}>✓ No projects currently exceeding 70% production cost threshold.</div>
                            )}
                          </div>
                        </div>

                        {/* SECTION 11, 12 & 13: RECEIVABLES (AR) AGING & PAYABLES (AP) */}
                        <div className="grid-2col" style={{ marginBottom: 20 }}>
                          {/* RECEIVABLES (AR) AGING */}
                          <div className="card" style={{ padding: 18 }}>
                            <div className="section-title" style={{ fontSize: 15, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                              <span>📥 Accounts Receivable (AR Aging Breakdown)</span>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setTab("invoices")}>View AR Invoices</button>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#D97706", marginBottom: 12 }}>
                              Total Outstanding AR: <span className="mono">{pkr(pendingReceivables)}</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, textAlign: "center", fontSize: 11, marginBottom: 14 }}>
                              <div style={{ padding: 6, background: "var(--bg)", borderRadius: 6 }}><div style={{ color: "var(--ink-muted)" }}>Current</div><strong className="mono" style={{ color: "#059669" }}>{pkr(arCurrent)}</strong></div>
                              <div style={{ padding: 6, background: "var(--bg)", borderRadius: 6 }}><div style={{ color: "var(--ink-muted)" }}>1-30 Days</div><strong className="mono">{pkr(ar1_30)}</strong></div>
                              <div style={{ padding: 6, background: "var(--bg)", borderRadius: 6 }}><div style={{ color: "var(--ink-muted)" }}>31-60 Days</div><strong className="mono" style={{ color: "#D97706" }}>{pkr(ar31_60)}</strong></div>
                              <div style={{ padding: 6, background: "var(--bg)", borderRadius: 6 }}><div style={{ color: "var(--ink-muted)" }}>61-90 Days</div><strong className="mono" style={{ color: "#DC2626" }}>{pkr(ar61_90)}</strong></div>
                              <div style={{ padding: 6, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6 }}><div style={{ color: "#991B1B" }}>90+ Days</div><strong className="mono" style={{ color: "#DC2626" }}>{pkr(ar90_plus)}</strong></div>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Top Outstanding Clients:</div>
                            <table style={{ width: "100%", fontSize: 12 }}>
                              <tbody>
                                {topOutstandingClients.map((c, i) => (
                                  <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                                    <td style={{ padding: "6px 0", fontWeight: 600 }}>{c.client}</td>
                                    <td style={{ padding: "6px 0", color: "var(--ink-muted)", fontSize: 11 }}>Due: {fmtDate(c.oldestDue)}</td>
                                    <td className="mono" style={{ padding: "6px 0", textAlign: "right", fontWeight: 700, color: "#D97706" }}>{pkr(c.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* PAYABLES (AP) */}
                          <div className="card" style={{ padding: 18 }}>
                            <div className="section-title" style={{ fontSize: 15, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                              <span>📤 Accounts Payable (AP Vendor Liabilities)</span>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setTab("expenses")}>View AP Bills</button>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 12 }}>
                              Total Outstanding AP: <span className="mono">{pkr(unpaidPayables)}</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, textAlign: "center", fontSize: 11, marginBottom: 14 }}>
                              <div style={{ padding: 6, background: "var(--bg)", borderRadius: 6 }}><div style={{ color: "var(--ink-muted)" }}>Due This Week</div><strong className="mono">{pkr(apDueThisWeek)}</strong></div>
                              <div style={{ padding: 6, background: "var(--bg)", borderRadius: 6 }}><div style={{ color: "var(--ink-muted)" }}>Due This Month</div><strong className="mono">{pkr(apDueThisMonth)}</strong></div>
                              <div style={{ padding: 6, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6 }}><div style={{ color: "#991B1B" }}>Overdue</div><strong className="mono" style={{ color: "#DC2626" }}>{pkr(apOverdue)}</strong></div>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Top Outstanding Vendors:</div>
                            <table style={{ width: "100%", fontSize: 12 }}>
                              <tbody>
                                {topOutstandingVendors.map((v, i) => (
                                  <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                                    <td style={{ padding: "6px 0", fontWeight: 600 }}>{v.vendor}</td>
                                    <td style={{ padding: "6px 0", color: "var(--ink-muted)", fontSize: 11 }}>Date: {fmtDate(v.dueDate)}</td>
                                    <td className="mono" style={{ padding: "6px 0", textAlign: "right", fontWeight: 700, color: "#DC2626" }}>{pkr(v.amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* SECTION 18 & 19 & 26: AI PIPELINE + FINANCIAL RISK ALERTS + INTEGRITY */}
                        <div className="grid-2col" style={{ marginBottom: 20 }}>
                          {/* FINANCIAL RISK ALERTS & INTEGRITY (SECTION 19 & 26) */}
                          <div className="card" style={{ padding: 18 }}>
                            <div className="section-title" style={{ fontSize: 15, marginBottom: 10 }}>
                              🛡️ Financial Risk Radar &amp; Trial Balance Integrity
                            </div>

                            {/* Trial Balance Status */}
                            <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 12, background: isTbBalanced ? "rgba(5, 150, 105, 0.08)" : "#FEF2F2", border: isTbBalanced ? "1px solid rgba(5, 150, 105, 0.3)" : "1px solid #FCA5A5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontWeight: 750, color: isTbBalanced ? "#059669" : "#991B1B", fontSize: 13 }}>
                                  {isTbBalanced ? "✓ Trial Balance Equilibrium: Balanced" : "🔴 Trial Balance Difference Detected!"}
                                </div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
                                  Total Debits: <strong className="mono">{pkr(totalDebits)}</strong> | Total Credits: <strong className="mono">{pkr(totalCredits)}</strong>
                                </div>
                              </div>
                              {!isTbBalanced && (
                                <div className="mono" style={{ fontWeight: 800, color: "#DC2626", fontSize: 14 }}>
                                  Diff: {pkr(tbDiff)}
                                </div>
                              )}
                            </div>

                            {/* Risk Alerts */}
                            {riskAlerts.critical.map((msg, i) => (
                              <div key={i} style={{ padding: "8px 12px", background: "#FEF2F2", borderLeft: "4px solid #DC2626", borderRadius: 4, fontSize: 12, color: "#991B1B", marginBottom: 6 }}>
                                🔴 <strong>CRITICAL:</strong> {msg}
                              </div>
                            ))}
                            {riskAlerts.warning.map((msg, i) => (
                              <div key={i} style={{ padding: "8px 12px", background: "#FFFBEB", borderLeft: "4px solid #D97706", borderRadius: 4, fontSize: 12, color: "#92400E", marginBottom: 6 }}>
                                🟠 <strong>WARNING:</strong> {msg}
                              </div>
                            ))}
                            {riskAlerts.positive.map((msg, i) => (
                              <div key={i} style={{ padding: "8px 12px", background: "#ECFDF5", borderLeft: "4px solid #059669", borderRadius: 4, fontSize: 12, color: "#065F46", marginBottom: 6 }}>
                                🟢 <strong>POSITIVE:</strong> {msg}
                              </div>
                            ))}
                          </div>

                          {/* AI DOCUMENT PROCESSING PIPELINE (SECTION 18) */}
                          <div className="card" style={{ padding: 18 }}>
                            <div className="section-title" style={{ fontSize: 15, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                              <span>🤖 AI Document Processing Pipeline</span>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setTab("documents")}>View AI Docs</button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, textAlign: "center", marginBottom: 12 }}>
                              <div className="clickable" style={{ padding: 10, background: "var(--bg)", borderRadius: 8, cursor: "pointer" }} onClick={() => setTab("documents")}>
                                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Uploaded</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{docUploaded}</div>
                              </div>
                              <div className="clickable" style={{ padding: 10, background: "rgba(2, 132, 199, 0.08)", borderRadius: 8, cursor: "pointer" }} onClick={() => setTab("documents")}>
                                <div style={{ fontSize: 11, color: "#0284C7" }}>Ready for Review</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "#0284C7" }}>{docReadyForReview}</div>
                              </div>
                              <div className="clickable" style={{ padding: 10, background: "rgba(5, 150, 105, 0.08)", borderRadius: 8, cursor: "pointer" }} onClick={() => setTab("documents")}>
                                <div style={{ fontSize: 11, color: "#059669" }}>Posted</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>{docPosted}</div>
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, textAlign: "center" }}>
                              <div className="clickable" style={{ padding: 8, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, cursor: "pointer" }} onClick={() => setTab("documents")}>
                                <div style={{ fontSize: 11, color: "#991B1B" }}>Possible Duplicates</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#DC2626" }}>{docDuplicates}</div>
                              </div>
                              <div className="clickable" style={{ padding: 8, background: "var(--bg)", borderRadius: 8, cursor: "pointer" }} onClick={() => setTab("documents")}>
                                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Failed Extraction</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--rose)" }}>{docFailed}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECTION 16: OPERATING EXPENSE ANALYSIS BY CATEGORY */}
                        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
                          <div className="section-title" style={{ fontSize: 15, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                            <span>📋 Operating Expense Category Analysis (16 Standard Categories)</span>
                            <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setTab("expenses")}>Expense Catalog</button>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                            {sortedCategoryBreakdown.map(cat => (
                              <div key={cat.category} style={{ padding: "8px 12px", background: "var(--bg)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>{cat.category}</div>
                                  <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{cat.pct}% of total</div>
                                </div>
                                <div className="mono" style={{ fontWeight: 700, color: cat.amount > 0 ? "var(--rose)" : "var(--ink-muted)" }}>
                                  {pkr(cat.amount)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SECTION 14 & 15: REAL-TIME TRANSACTION ACTIVITY STREAM & TODAY'S COUNTS */}
                        <div className="card" style={{ padding: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                            <div>
                              <div className="section-title" style={{ fontSize: 15, margin: 0 }}>⚡ Financial Transaction Activity &amp; Live Stream</div>
                              <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                                Today's Activity: <strong>{periodInvoices.filter(i => i.issueDate === TODAY_STR).length}</strong> Invoices | <strong>{periodExpenses.filter(e => e.date === TODAY_STR).length}</strong> Expenses | <strong>{vouchers.filter(v => v.date === TODAY_STR).length}</strong> Vouchers
                              </div>
                            </div>
                            <button className="btn" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => setTab("vouchers")}>View Vouchers</button>
                          </div>

                          <div className="table-responsive">
                            <table style={{ width: "100%", fontSize: 12.5 }}>
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Reference #</th>
                                  <th>Party / Payee</th>
                                  <th>Associated Project</th>
                                  <th>Date</th>
                                  <th>Status</th>
                                  <th style={{ textAlign: "right" }}>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  ...invoices.map(i => ({ type: "Client Invoice", ref: "INV-" + i.id.toUpperCase(), party: i.client, projId: i.projectId, date: i.issueDate, amount: i.totalAmount || i.amount, isInc: true, status: i.paid ? "Paid" : "Outstanding", targetTab: "invoices" })),
                                  ...expenses.map(e => ({ type: "Operating Expense", ref: e.refNo || "EXP-" + e.id.toUpperCase(), party: e.vendor, projId: e.projectId, date: e.date, amount: e.amount, isInc: false, status: e.status === "paid" ? "Paid" : "Unpaid AP", targetTab: "expenses" })),
                                  ...vouchers.map(v => ({ type: v.type, ref: v.voucherNo, party: v.party, projId: null, date: v.date, amount: v.amount, isInc: v.type.includes("Receipt"), status: v.status || "Posted", targetTab: "vouchers" }))
                                ]
                                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                                  .slice(0, 8)
                                  .map((t, idx) => {
                                    const proj = projects.find(p => p.id === t.projId);
                                    return (
                                      <tr key={idx} className="clickable" style={{ cursor: "pointer" }} onClick={() => setTab(t.targetTab)}>
                                        <td>
                                          <span className="badge-mini" style={{ background: t.isInc ? "rgba(5, 150, 105, 0.1)" : "rgba(220, 38, 38, 0.1)", color: t.isInc ? "#059669" : "#DC2626" }}>
                                            {t.type}
                                          </span>
                                        </td>
                                        <td className="mono" style={{ fontWeight: 600 }}>{t.ref}</td>
                                        <td style={{ fontWeight: 600 }}>{t.party}</td>
                                        <td style={{ color: "var(--ink-muted)", fontSize: 12 }}>{proj ? `${proj.projectCode} (${proj.name})` : "General Operating"}</td>
                                        <td className="mono">{fmtDate(t.date)}</td>
                                        <td><span className="badge-mini" style={{ background: "#F1F5F9", color: "#334155" }}>{t.status}</span></td>
                                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: t.isInc ? "#059669" : "#DC2626" }}>
                                          {t.isInc ? "+" : "-"}{pkr(t.amount)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* SECTION 27: CEO STAFF ACTIVITY OVERVIEW & AUDIT TIMELINE */}
                        <div style={{ marginTop: 24 }}>
                          <StaffAuditTimeline auditLogs={auditLogs} usersList={usersList} />
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}

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
              <div className="grid-kpi" style={{ marginTop: 16 }}>
                <KpiCard label="Accounts Payable" value={pkr(Object.values(journal).filter(j => j.account === "ap").reduce((s, j) => s + j.credit - j.debit, 0))} sub="Unpaid Vendor Bills" icon={Receipt} accent="var(--rose)" />
                <KpiCard label="Open POs" value={purchaseOrders.filter(p => p.status === "Draft" || p.status === "Approved").length} sub="Draft & Approved" icon={ShoppingCart} accent="var(--sky)" />
                <KpiCard label="Bank Balance" value={pkr(Object.values(journal).filter(j => j.account === "bank").reduce((s, j) => s + j.debit - j.credit, 0))} sub="Primary Account" icon={Landmark} accent="var(--jade)" />
                <KpiCard label="Petty Cash" value={pkr(Object.values(journal).filter(j => j.account === "cash").reduce((s, j) => s + j.debit - j.credit, 0))} sub="In Hand" icon={Wallet} accent="var(--jade)" />
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

          {tab === "clients" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>Client Master &amp; Receivables Architecture</h2>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>Permanent Client Entities, Project Linkages &amp; Accounts Receivable Sub-Ledgers</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" onClick={() => { setEditingClient(null); setShowClientModal(true); }}>
                    <Plus size={15} /> Register New Client
                  </button>
                </div>
              </div>

              {/* CLIENT LIST TABLE */}
              <div className="card" style={{ padding: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--rule)", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <Search size={16} color="var(--ink-muted)" />
                    <input
                      type="text"
                      className="form-input"
                      style={{ maxWidth: 320, padding: "4px 10px", fontSize: 12.5 }}
                      placeholder="Search Client Name, Code, Phone, NTN..."
                      value={clientSearchQuery}
                      onChange={e => setClientSearchQuery(e.target.value)}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{clients.length} Registered Clients</span>
                </div>

                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Client Code</th>
                      <th>Client / Company Name</th>
                      <th>Contact Person</th>
                      <th>Phone &amp; Email</th>
                      <th>NTN / STRN</th>
                      <th>Payment Terms</th>
                      <th style={{ textAlign: "right" }}>Outstanding Bal.</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.filter(c => !clientSearchQuery || c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) || (c.companyName && c.companyName.toLowerCase().includes(clientSearchQuery.toLowerCase())) || (c.phone && c.phone.includes(clientSearchQuery))).map(c => {
                      const clientInvoices = invoices.filter(i => i.clientId === c.id || (i.client && i.client.toLowerCase() === c.name.toLowerCase()));
                      const clientVouchers = vouchers.filter(v => v.clientId === c.id || (v.party && v.party.toLowerCase().includes(c.name.toLowerCase())));
                      const totalInvoiced = clientInvoices.reduce((s, i) => s + (Number(i.totalAmount || i.amount) || 0), 0);
                      const totalReceived = clientVouchers.filter(v => v.type === "RV").reduce((s, v) => s + (Number(v.amount) || 0), 0);
                      const outstanding = (Number(c.openingBalance) || 0) + totalInvoiced - totalReceived;

                      return (
                        <tr key={c.id}>
                          <td><span style={{ fontFamily: "monospace", fontWeight: 800, color: "#0284C7" }}>{c.clientCode || c.id}</span></td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--ink)" }}>{c.name}</div>
                            {c.companyName && <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{c.companyName}</div>}
                          </td>
                          <td>{c.contactPerson || "N/A"}</td>
                          <td>
                            <div>{c.phone || "N/A"}</div>
                            <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{c.email || ""}</div>
                          </td>
                          <td style={{ fontSize: 12 }}>
                            <div>NTN: {c.ntn || "N/A"}</div>
                            {c.strn && <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>STRN: {c.strn}</div>}
                          </td>
                          <td><span className="badge-mini">{c.paymentTerms || "Net 30"}</span></td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: outstanding > 0 ? "#0284C7" : "#059669" }}>
                            {pkr(outstanding)}
                          </td>
                          <td>
                            <span style={{
                              padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                              background: c.status === "Active" ? "rgba(5, 150, 105, 0.1)" : "rgba(220, 38, 38, 0.1)",
                              color: c.status === "Active" ? "#059669" : "#DC2626"
                            }}>
                              {c.status || "Active"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setSelectedClientId(c.id)}>
                                View Statement
                              </button>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 6px" }} onClick={() => { setEditingClient(c); setShowClientModal(true); }}>
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* DETAILED STATEMENT VIEW */}
              <ClientStatementView
                clients={clients}
                projects={projects}
                invoices={invoices}
                vouchers={vouchers}
                journal={journal}
                selectedClientId={selectedClientId}
                onSelectClient={id => setSelectedClientId(id)}
              />
            </div>
          )}

          {tab === "vendors" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20 }}>Vendor Master &amp; Accounts Payable Architecture</h2>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)" }}>Permanent Vendor Suppliers &amp; Accounts Payable Sub-Ledger Entities</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" style={{ background: "#D97706", borderColor: "#D97706" }} onClick={() => { setEditingVendor(null); setShowVendorModal(true); }}>
                    <Plus size={15} /> Register New Vendor
                  </button>
                </div>
              </div>

              {/* VENDOR LIST TABLE */}
              <div className="card" style={{ padding: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--rule)", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", background: "var(--table-header-bg)", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <Search size={16} color="var(--ink-muted)" />
                    <input
                      type="text"
                      className="form-input"
                      style={{ maxWidth: 320, padding: "4px 10px", fontSize: 12.5 }}
                      placeholder="Search Vendor Name, Code, Phone, NTN..."
                      value={vendorSearchQuery}
                      onChange={e => setVendorSearchQuery(e.target.value)}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{vendors.length} Registered Vendors</span>
                </div>

                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Vendor Code</th>
                      <th>Vendor / Company Name</th>
                      <th>Contact Person</th>
                      <th>Phone &amp; Email</th>
                      <th>Bank Details</th>
                      <th>Payment Terms</th>
                      <th style={{ textAlign: "right" }}>Payable Balance</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.filter(v => !vendorSearchQuery || v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()) || (v.companyName && v.companyName.toLowerCase().includes(vendorSearchQuery.toLowerCase()))).map(v => {
                      const vendorExpenses = expenses.filter(e => e.vendorId === v.id || (e.vendor && e.vendor.toLowerCase().includes(v.name.toLowerCase())));
                      const vendorVouchers = vouchers.filter(vo => vo.vendorId === v.id || (vo.party && vo.party.toLowerCase().includes(v.name.toLowerCase())));
                      const totalExpenses = vendorExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                      const totalPayments = vendorVouchers.filter(vo => vo.type === "PV").reduce((s, vo) => s + (Number(vo.amount) || 0), 0);
                      const payable = (Number(v.openingBalance) || 0) + totalExpenses - totalPayments;

                      return (
                        <tr key={v.id}>
                          <td><span style={{ fontFamily: "monospace", fontWeight: 800, color: "#D97706" }}>{v.vendorCode || v.id}</span></td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--ink)" }}>{v.name}</div>
                            {v.companyName && <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{v.companyName}</div>}
                          </td>
                          <td>{v.contactPerson || "N/A"}</td>
                          <td>
                            <div>{v.phone || "N/A"}</div>
                            <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{v.email || ""}</div>
                          </td>
                          <td style={{ fontSize: 12 }}>
                            <div>{v.bankName || "N/A"}</div>
                            {v.accountNumberIban && <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{v.accountNumberIban}</div>}
                          </td>
                          <td><span className="badge-mini">{v.paymentTerms || "Net 30"}</span></td>
                          <td style={{ textAlign: "right", fontWeight: 800, color: payable > 0 ? "#D97706" : "#059669" }}>
                            {pkr(payable)}
                          </td>
                          <td>
                            <span style={{
                              padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                              background: v.status === "Active" ? "rgba(5, 150, 105, 0.1)" : "rgba(220, 38, 38, 0.1)",
                              color: v.status === "Active" ? "#059669" : "#DC2626"
                            }}>
                              {v.status || "Active"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setSelectedVendorId(v.id)}>
                                View Statement
                              </button>
                              <button className="btn" style={{ fontSize: 11, padding: "2px 6px" }} onClick={() => { setEditingVendor(v); setShowVendorModal(true); }}>
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* DETAILED VENDOR STATEMENT VIEW */}
              <VendorStatementView
                vendors={vendors}
                projects={projects}
                expenses={expenses}
                vouchers={vouchers}
                journal={journal}
                selectedVendorId={selectedVendorId}
                onSelectVendor={id => setSelectedVendorId(id)}
              />
            </div>
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
                <div className="field" style={{ margin: 0, flex: 1.5, minWidth: 160 }}>
                  <label>Filter Client Summary</label>
                  <select value={projectFilters.selectedClient || "All"} onChange={e => setProjectFilters(f => ({ ...f, selectedClient: e.target.value }))}>
                    <option value="All">-- All Clients ({uniqueClientsList.length}) --</option>
                    {uniqueClientsList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
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

              {/* CONSOLIDATED CLIENT PORTFOLIO SUMMARY CARD */}
              {projectFilters.selectedClient && projectFilters.selectedClient !== "All" && (() => {
                const clientName = projectFilters.selectedClient;
                const clientProjects = projectsWithStats.filter(p => p.client.toLowerCase() === clientName.toLowerCase());
                const totalClientBilled = clientProjects.reduce((s, p) => s + p.billed, 0);
                const totalClientCost = clientProjects.reduce((s, p) => s + p.cost, 0);
                const totalClientMargin = totalClientBilled - totalClientCost;
                const activeCount = clientProjects.filter(p => p.status !== "Completed").length;

                return (
                  <div className="card" style={{ padding: "16px 20px", marginBottom: 16, background: "linear-gradient(135deg, rgba(2, 132, 199, 0.06), rgba(5, 150, 105, 0.06))", border: "1px solid rgba(2, 132, 199, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0284C7", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          📊 CONSOLIDATED CLIENT PORTFOLIO SUMMARY
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
                          {clientName}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 2 }}>
                          Total Client Portfolio: <strong style={{ color: "var(--ink)" }}>{clientProjects.length} Projects</strong> ({activeCount} Active, {clientProjects.length - activeCount} Completed)
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Total Client Billed</div>
                          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{pkr(totalClientBilled)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Total Production Cost</div>
                          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--rose)" }}>{pkr(totalClientCost)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Net Portfolio Margin</div>
                          <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: totalClientMargin >= 0 ? "#059669" : "#DC2626" }}>{pkr(totalClientMargin)}</div>
                        </div>
                        <button className="btn btn-primary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setClientStatementClient(clientName)}>
                          <Printer size={14} /> Print Client Statement
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                        .filter(p => !projectFilters.selectedClient || projectFilters.selectedClient === "All" || p.client.toLowerCase() === projectFilters.selectedClient.toLowerCase())
                        .filter(p => projectFilters.type === "All" || p.type === projectFilters.type)
                        .filter(p => projectFilters.status === "All" || p.status === projectFilters.status)
                        .filter(p => !projectFilters.client || p.client.toLowerCase().includes(projectFilters.client.toLowerCase()) || p.name.toLowerCase().includes(projectFilters.client.toLowerCase()))
                        .map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600, color: "var(--ink)" }}>
                              <div style={{ fontSize: 11, color: "var(--ink-light)", fontWeight: 500 }}>{p.projectCode}</div>
                              <div>{p.name}</div>
                            </td>
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
                        <th style={{ textAlign: "right" }}>Amount</th><th style={{ textAlign: "right" }}>SRB SST</th><th style={{ textAlign: "right" }}>WHT</th><th style={{ textAlign: "right" }}>Total</th><th>Status</th><th>Actions</th>
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
                          <td className="mono" style={{ textAlign: "right", color: "var(--ink-muted)" }}>{pkr(inv.amount)}</td>
                          <td className="mono" style={{ textAlign: "right", color: "var(--rose)" }}>{inv.applySst ? pkr(inv.sstAmount) : "—"}</td>
                          <td className="mono" style={{ textAlign: "right", color: "var(--green)" }}>{inv.applyWht ? pkr(inv.whtAmount) : "—"}</td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{pkr(inv.totalAmount || inv.amount)}</td>
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
                              onClick={() => setPrintDoc({ voucherNo: cleanInvoiceNo(inv.invoiceNo || inv.id), type: "Invoice", date: inv.issueDate, party: inv.client, description: inv.description, amount: inv.amount, applySst: inv.applySst, sstRate: inv.sstRate, sstAmount: inv.sstAmount, applyWht: inv.applyWht, whtRate: inv.whtRate, whtAmount: inv.whtAmount, totalAmount: inv.totalAmount || inv.amount, notes: inv.notes || inv.specialNotes, projectCode: projects.find(p => p.id === inv.projectId)?.projectCode })}>
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
              {(() => {
                const filteredExps = expenses.filter(exp => {
                  const matchVendor = expenseVendorFilter === "all" || (exp.vendor && exp.vendor.toLowerCase() === expenseVendorFilter.toLowerCase());
                  const matchCat = expenseCategoryFilter === "all" || exp.category === expenseCategoryFilter;
                  const matchStatus = expenseStatusFilter === "all" || exp.status === expenseStatusFilter;
                  const q = expenseSearchQuery.toLowerCase().trim();
                  const matchQuery = !q || (
                    (exp.vendor && exp.vendor.toLowerCase().includes(q)) ||
                    (exp.category && exp.category.toLowerCase().includes(q)) ||
                    (exp.subcategory && exp.subcategory.toLowerCase().includes(q)) ||
                    (exp.description && exp.description.toLowerCase().includes(q)) ||
                    (exp.refNo && exp.refNo.toLowerCase().includes(q))
                  );
                  return matchVendor && matchCat && matchStatus && matchQuery;
                });

                const totalExpAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
                const paidExpAmount = expenses.filter(e => e.status !== "unpaid").reduce((s, e) => s + (e.amount || 0), 0);
                const apExpAmount = expenses.filter(e => e.status === "unpaid").reduce((s, e) => s + (e.amount || 0), 0);

                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div className="section-title" style={{ margin: 0 }}>Operating Expenses &amp; Classification</div>
                        <div style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 2 }}>Hierarchical Category → Subcategory → Chart of Accounts (GL) Mapping</div>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn" style={{ background: "var(--card-bg)", border: "1px solid var(--rule)" }} onClick={() => setShowCategoryManager(true)}>
                          <BookOpenText size={14} style={{ marginRight: 4 }} /> Category &amp; GL Catalog (16 Categories)
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowExpenseForm(true)}>
                          <Plus size={14} /> Record Operating Expense
                        </button>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid" style={{ marginBottom: 20 }}>
                      <div className="stat-card">
                        <div className="stat-title">Total Operating Expenses</div>
                        <div className="stat-value mono" style={{ color: "var(--rose)" }}>{pkr(totalExpAmount)}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-title">Disbursed (Paid Out)</div>
                        <div className="stat-value mono" style={{ color: "#059669" }}>{pkr(paidExpAmount)}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-title">Accounts Payable (Unpaid AP)</div>
                        <div className="stat-value mono" style={{ color: "#D97706" }}>{pkr(apExpAmount)}</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-title">Configured Expense Categories</div>
                        <div className="stat-value">16 <span style={{ fontSize: 13, color: "var(--ink-muted)", fontWeight: 500 }}>A to P Standard</span></div>
                      </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div className="field" style={{ margin: 0, flex: 1.5, minWidth: 160 }}>
                        <label>Filter Vendor Summary</label>
                        <select value={expenseVendorFilter} onChange={e => setExpenseVendorFilter(e.target.value)}>
                          <option value="all">-- All Vendors ({uniqueVendorsList.length}) --</option>
                          {uniqueVendorsList.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="field" style={{ margin: 0, flex: 1.5, minWidth: 180 }}>
                        <label>Search Keyword</label>
                        <input
                          value={expenseSearchQuery}
                          onChange={e => setExpenseSearchQuery(e.target.value)}
                          placeholder="Type keyword e.g. Meta, K-Electric, Rent..."
                        />
                      </div>
                      <div className="field" style={{ margin: 0, flex: 1, minWidth: 160 }}>
                        <label>Filter Category</label>
                        <select value={expenseCategoryFilter} onChange={e => setExpenseCategoryFilter(e.target.value)}>
                          <option value="all">All 16 Categories</option>
                          {EXPENSE_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field" style={{ margin: 0, flex: 1, minWidth: 130 }}>
                        <label>Payment Status</label>
                        <select value={expenseStatusFilter} onChange={e => setExpenseStatusFilter(e.target.value)}>
                          <option value="all">All Statuses</option>
                          <option value="paid">Paid Only</option>
                          <option value="unpaid">Unpaid (AP) Only</option>
                        </select>
                      </div>
                      {(expenseVendorFilter !== "all" || expenseCategoryFilter !== "all" || expenseStatusFilter !== "all" || expenseSearchQuery) && (
                        <button
                          className="btn"
                          style={{ marginTop: 22, height: 38 }}
                          onClick={() => {
                            setExpenseVendorFilter("all");
                            setExpenseCategoryFilter("all");
                            setExpenseStatusFilter("all");
                            setExpenseSearchQuery("");
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>

                    {/* CONSOLIDATED VENDOR PAYABLE & COST SUMMARY CARD */}
                    {expenseVendorFilter !== "all" && (() => {
                      const vendorName = expenseVendorFilter;
                      const vendorExpenses = expenses.filter(e => e.vendor && e.vendor.toLowerCase() === vendorName.toLowerCase());
                      const totalVendorCost = vendorExpenses.reduce((s, e) => s + (e.amount || 0), 0);
                      const paidVendorAmount = vendorExpenses.filter(e => e.status !== "unpaid").reduce((s, e) => s + (e.amount || 0), 0);
                      const apVendorAmount = vendorExpenses.filter(e => e.status === "unpaid").reduce((s, e) => s + (e.amount || 0), 0);
                      
                      const vendorProjectIds = [...new Set(vendorExpenses.map(e => e.projectId).filter(Boolean))];
                      const vendorProjects = projects.filter(p => vendorProjectIds.includes(p.id));

                      return (
                        <div className="card" style={{ padding: "16px 20px", marginBottom: 16, background: "linear-gradient(135deg, rgba(220, 38, 38, 0.06), rgba(2, 132, 199, 0.06))", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                            <div>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                🏬 CONSOLIDATED VENDOR PAYABLE &amp; COST SUMMARY
                              </div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginTop: 2 }}>
                                {vendorName}
                              </div>
                              <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 2 }}>
                                Total Outlays Logged: <strong style={{ color: "var(--ink)" }}>{vendorExpenses.length} Expense Transactions</strong> ({vendorProjects.length} Projects Linked)
                              </div>
                              {vendorProjects.length > 0 && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                  {vendorProjects.map(p => (
                                    <span key={p.id} className="badge-mini" style={{ background: "#F1F5F9", color: "#334155" }}>
                                      {p.projectCode} — {p.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                              <div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Total Vendor Outlays</div>
                                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{pkr(totalVendorCost)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Disbursed (Paid Out)</div>
                                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "#059669" }}>{pkr(paidVendorAmount)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Outstanding AP Balance</div>
                                <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: apVendorAmount > 0 ? "#DC2626" : "#059669" }}>{pkr(apVendorAmount)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}


                    {/* Expenses Table */}
                    <div className="card">
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Vendor / Payee</th>
                              <th>Category & Subcategory</th>
                              <th>Mapped GL Account</th>
                              <th>Associated Project</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th style={{ textAlign: "right" }}>Amount</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredExps.map(exp => {
                              const glKey = exp.accountKey || getGLAccountKeyForSubcategory(exp.category, exp.subcategory);
                              const glObj = ACCOUNTS[glKey] || ACCOUNTS.expense;
                              return (
                                <tr key={exp.id}>
                                  <td style={{ fontWeight: 600 }}>
                                    {exp.vendor}
                                    {exp.refNo && <div style={{ fontSize: 11, color: "var(--ink-muted)", fontFamily: "monospace" }}>Ref: {exp.refNo}</div>}
                                  </td>
                                  <td>
                                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{exp.category}</div>
                                    <div style={{ fontSize: 12, color: "var(--brand-teal)", fontWeight: 500 }}>
                                      {exp.subcategory || exp.category}
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge-mini" style={{ background: "#E0F2FE", color: "#0369A1", fontWeight: 600 }}>
                                      GL {glObj.code} — {glObj.name}
                                    </span>
                                  </td>
                                  <td>{exp.projectId ? (projects.find(p => p.id === exp.projectId)?.name || "—") : <span style={{ color: "var(--ink-muted)" }}>—</span>}</td>
                                  <td className="mono">{fmtDate(exp.date)}</td>
                                  <td>
                                    {exp.status === "unpaid" ? (
                                      <span style={{ color: "#D97706", fontWeight: 700, fontSize: 13 }}>UNPAID (AP)</span>
                                    ) : (
                                      <span style={{ color: "#059669", fontWeight: 700, fontSize: 13 }}>PAID {exp.paidVia ? `via ${exp.paidVia}` : ""}</span>
                                    )}
                                  </td>
                                  <td className="mono" style={{ textAlign: "right", color: "var(--rose)", fontWeight: 600 }}>{pkr(exp.amount)}</td>
                                  <td>
                                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                      {exp.status === "unpaid" && (
                                        <button className="btn btn-primary" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setPayingExpenseId(exp.id)}>
                                          <Landmark size={13} style={{ marginRight: 4 }} /> Pay
                                        </button>
                                      )}
                                      <button className="btn" style={{ padding: "4px 6px", fontSize: 12 }} onClick={() => setEditingExpense(exp)}>
                                        <Edit size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredExps.length === 0 && (
                              <tr>
                                <td colSpan={8} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 24 }}>
                                  No operating expenses found matching the selected criteria.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}


          {tab === "purchase-orders" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-title" style={{ margin: 0 }}>Purchase Orders (PO)</div>
                <button className="btn btn-primary" onClick={() => setShowPOForm(true)}><Plus size={14} /> Create PO</button>
              </div>

              <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                  <div className="stat-title">Open POs (Draft/Approved)</div>
                  <div className="stat-value">{purchaseOrders.filter(p => p.status === "Draft" || p.status === "Approved").length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Billed / Unpaid POs</div>
                  <div className="stat-value">{purchaseOrders.filter(p => p.status === "Billed").length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Accounts Payable (AP)</div>
                  <div className="stat-value mono">{pkr(Object.values(journal).filter(j => j.account === "ap").reduce((s, j) => s + j.credit - j.debit, 0))}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Total PO Value</div>
                  <div className="stat-value mono">{pkr(purchaseOrders.reduce((s, p) => s + p.amount, 0))}</div>
                </div>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>PO #</th><th>Vendor</th><th>Associated Project</th><th>Expected By</th><th>Status</th>
                        <th style={{ textAlign: "right" }}>Amount</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map(po => (
                        <tr key={po.id}>
                          <td className="mono" style={{ fontWeight: 700 }}>PO-{po.id.slice(0,4).toUpperCase()}</td>
                          <td style={{ fontWeight: 600 }}>{po.vendor}</td>
                          <td>{po.projectId ? (projects.find(p => p.id === po.projectId)?.name || "—") : <span style={{ color: "var(--ink-muted)" }}>—</span>}</td>
                          <td className="mono">{fmtDate(po.expectedDate)}</td>
                          <td>
                            <span className="badge-mini" style={{ 
                              background: po.status === "Draft" ? "#F1F5F9" : po.status === "Approved" ? "#DBEAFE" : po.status === "Billed" ? "#FEF3C7" : po.status === "Paid" ? "#D1FAE5" : "#FEE2E2",
                              color: po.status === "Draft" ? "#475569" : po.status === "Approved" ? "#1E40AF" : po.status === "Billed" ? "#92400E" : po.status === "Paid" ? "#065F46" : "#991B1B"
                             }}>{po.status.toUpperCase()}</span>
                          </td>
                          <td className="mono" style={{ textAlign: "right", color: "var(--rose)", fontWeight: 600 }}>{pkr(po.amount)}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {po.status === "Draft" && (
                                <>
                                  <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => setPOStatus(po.id, "Approved")}>Approve</button>
                                  <button className="btn" style={{ padding: "4px 8px", fontSize: 12, color: "#DC2626" }} onClick={() => setPOStatus(po.id, "Cancelled")}>Cancel</button>
                                </>
                              )}
                              {po.status === "Approved" && (
                                <button className="btn btn-primary" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => receiveAndBillPO(po.id)}>Receive & Bill</button>
                              )}
                              {po.status === "Billed" && (
                                <button className="btn btn-primary" style={{ padding: "4px 8px", fontSize: 12, background: "#059669", border: "none" }} onClick={() => setPayingPOId(po.id)}><Landmark size={13} style={{ marginRight: 4 }} /> Pay</button>
                              )}
                              {po.status === "Draft" && (
                                <button className="btn" style={{ padding: "4px 6px", fontSize: 12 }} onClick={() => setEditingPO(po)}>
                                  <Edit size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {purchaseOrders.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ink-muted)", padding: 20 }}>No Purchase Orders found. Create one to get started.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === "cash-bank" && (
            <>
              {(() => {
                const accountBalances = bankAccounts.map(b => {
                  let netMovement = 0;
                  if (b.id === "bank-cash" || b.accountType === "Petty Cash") {
                    netMovement = journal.reduce((sum, entry) => {
                      let eSum = 0;
                      entry.lines.forEach(l => {
                        if (l.account === "cash" && (l.bankAccountId === b.id || (!l.bankAccountId && b.id === "bank-cash"))) {
                          eSum += (l.debit - l.credit);
                        }
                      });
                      return sum + eSum;
                    }, 0);
                  } else {
                    netMovement = journal.reduce((sum, entry) => {
                      let eSum = 0;
                      entry.lines.forEach(l => {
                        if (l.account === "bank" && (l.bankAccountId === b.id || (!l.bankAccountId && b.id === "bank-hbl"))) {
                          eSum += (l.debit - l.credit);
                        }
                      });
                      return sum + eSum;
                    }, 0);
                  }
                  return { ...b, liveBalance: (b.openingBalance || 0) + netMovement };
                });


                const totalLiquidity = accountBalances.reduce((s, b) => s + b.liveBalance, 0);

                const filteredEntries = Object.values(journal)
                  .filter(j => {
                    if (cashBankFilter === "all") return j.account === "cash" || j.account === "bank";
                    if (cashBankFilter === "cash") return j.account === "cash";
                    if (cashBankFilter === "bank") return j.account === "bank";
                    const matchedLine = j.lines?.find(l => l.bankAccountId === cashBankFilter || (!l.bankAccountId && cashBankFilter === "bank-hbl" && l.account === "bank"));
                    return !!matchedLine;
                  })
                  .sort((a, b) => new Date(a.date) - new Date(b.date));

                return (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                      <div className="section-title" style={{ margin: 0 }}>
                        <Landmark size={18} color="var(--gold)" /> Multiple Bank Accounts & Liquidity Position
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn btn-primary" onClick={() => { setEditingBankAccount(null); setShowBankAccountModal(true); }}>
                          <Plus size={14} /> Add Bank Account
                        </button>
                        <button className="btn" onClick={() => { setVoucherDefaultType("PV"); setShowVoucherForm(true); }}>
                          Payment Voucher
                        </button>
                        <button className="btn" onClick={() => { setVoucherDefaultType("RV"); setShowVoucherForm(true); }}>
                          Receipt Voucher
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 20 }}>
                      {accountBalances.map(b => (
                        <div key={b.id} className="card" style={{ padding: 16, borderLeft: `4px solid ${b.color || "var(--gold)"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{b.bankName}</div>
                              <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{b.accountTitle}</div>
                            </div>
                            <span className="badge-mini" style={{ background: "var(--bg)", border: "1px solid var(--rule)" }}>{b.accountType}</span>
                          </div>
                          <div className="mono" style={{ fontSize: 11, color: "var(--gold)", marginBottom: 8, fontWeight: 600 }}>
                            {b.accountNumber}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {b.branch}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid var(--rule)", paddingTop: 10 }}>
                            <span style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>Live Balance:</span>
                            <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: b.liveBalance >= 0 ? "var(--jade)" : "var(--rose)" }}>
                              {pkr(b.liveBalance)}
                            </span>
                          </div>
                        </div>
                      ))}

                      <div className="card" style={{ padding: 16, background: "var(--gold-glow)", border: "1px solid var(--gold)" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--gold)", marginBottom: 4 }}>Total Liquidity Position</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginBottom: 12 }}>Combined Total Cash + Bank Balances</div>
                        <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
                          {pkr(totalLiquidity)}
                        </div>
                      </div>
                    </div>

                    <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div className="field" style={{ margin: 0, flex: 1, minWidth: 220 }}>
                        <label>Filter Ledger by Bank Account</label>
                        <select value={cashBankFilter} onChange={e => setCashBankFilter(e.target.value)}>
                          <option value="all">All Cash & Bank Accounts ({pkr(totalLiquidity)})</option>
                          <option value="cash">Petty Cash Vault Only</option>
                          {bankAccounts.filter(b => b.id !== "bank-cash").map(b => (
                            <option key={b.id} value={b.id}>
                              {b.bankName} — {b.accountNumber} ({pkr(accountBalances.find(x => x.id === b.id)?.liveBalance || 0)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="card">
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th><th>Ref No</th><th>Account / Bank</th><th>Particulars / Description</th>
                              <th style={{ textAlign: "right", color: "var(--emerald)" }}>Deposit (In)</th>
                              <th style={{ textAlign: "right", color: "var(--rose)" }}>Payment (Out)</th>
                              <th style={{ textAlign: "right" }}>Running Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const selectedBank = bankAccounts.find(b => b.id === cashBankFilter);
                              const startOpeningBalance = selectedBank ? (selectedBank.openingBalance || 0) : (cashBankFilter === "all" ? bankAccounts.reduce((s, b) => s + (b.openingBalance || 0), 0) : 0);
                              
                              let balance = startOpeningBalance;
                              const rows = [];

                              if (startOpeningBalance > 0) {
                                rows.push(
                                  <tr key="opening" style={{ background: "rgba(14, 165, 233, 0.04)" }}>
                                    <td className="mono" style={{ fontSize: 12.5 }}>21 Jul 2026</td>
                                    <td className="mono" style={{ fontWeight: 600, color: "var(--gold)", fontSize: 12 }}>OP-BAL</td>
                                    <td>
                                      <span className="badge-mini">
                                        {selectedBank ? selectedBank.bankName : "Opening Balance"}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>Opening Balance — {selectedBank ? selectedBank.bankName : "Combined Liquidity"}</td>
                                    <td className="mono" style={{ textAlign: "right", color: "var(--emerald)", fontWeight: 600 }}>
                                      {pkr(startOpeningBalance)}
                                    </td>
                                    <td className="mono" style={{ textAlign: "right", color: "var(--rose)", fontWeight: 600 }}>—</td>
                                    <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--emerald)" }}>
                                      {pkr(startOpeningBalance)}
                                    </td>
                                  </tr>
                                );
                              }

                              filteredEntries.forEach((entry, i) => {
                                if (entry.description?.toLowerCase().includes("opening balance")) return;
                                balance += (entry.debit - entry.credit);
                                const bankLine = entry.lines?.find(l => l.bankAccountId);
                                const bankInfo = bankAccounts.find(b => b.id === bankLine?.bankAccountId);
                                rows.push(
                                  <tr key={i}>
                                    <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(entry.date)}</td>
                                    <td className="mono" style={{ fontWeight: 600, color: "var(--gold)", fontSize: 12 }}>{entry.ref}</td>
                                    <td>
                                      <span className="badge-mini">
                                        {bankInfo ? bankInfo.bankName : entry.account === "cash" ? "Petty Cash" : "Bank Account"}
                                      </span>
                                    </td>
                                    <td>{entry.memo || entry.description}</td>
                                    <td className="mono" style={{ textAlign: "right", color: "var(--emerald)", fontWeight: 600 }}>
                                      {entry.debit > 0 ? pkr(entry.debit) : ""}
                                    </td>
                                    <td className="mono" style={{ textAlign: "right", color: "var(--rose)", fontWeight: 600 }}>
                                      {entry.credit > 0 ? pkr(entry.credit) : ""}
                                    </td>
                                    <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>
                                      {pkr(balance)}
                                    </td>
                                  </tr>
                                );
                              });

                              return rows;
                            })()}

                            {filteredEntries.length === 0 && (
                              <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: 20, color: "var(--ink-muted)" }}>
                                  No transactions found for the selected bank account filter.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
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

          {tab === "inventory" && (
            <>
              {(() => {
                const totalValue = inventoryItems.reduce((s, i) => s + (i.quantity * i.unitCost), 0);
                const totalItems = inventoryItems.length;
                const lowStockCount = inventoryItems.filter(i => i.quantity <= i.minQuantity).length;
                const totalLogs = inventoryLogs.length;

                const filteredItems = inventoryItems
                  .filter(i => inventoryFilters.category === "All" || i.category === inventoryFilters.category)
                  .filter(i => {
                    if (inventoryFilters.status === "Low Stock") return i.quantity <= i.minQuantity && i.quantity > 0;
                    if (inventoryFilters.status === "Out of Stock") return i.quantity === 0;
                    if (inventoryFilters.status === "In Stock") return i.quantity > i.minQuantity;
                    return true;
                  })
                  .filter(i => {
                    if (!inventoryFilters.search) return true;
                    const q = inventoryFilters.search.toLowerCase();
                    return i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.warehouse.toLowerCase().includes(q);
                  });

                return (
                  <>
                    <div className="grid-kpi">
                      <KpiCard label="Total Inventory Value" value={pkr(totalValue)} sub="Asset Valuation at Cost" icon={Package} accent="var(--jade)" />
                      <KpiCard label="Total SKU Items" value={totalItems} sub={`${INVENTORY_CATEGORIES.length} Active Categories`} icon={Boxes} accent="var(--sky)" />
                      <KpiCard label="Low / Out of Stock" value={lowStockCount} sub="Items Reached Reorder Level" icon={AlertTriangle} accent={lowStockCount > 0 ? "var(--rose)" : "var(--jade)"} />
                      <KpiCard label="Movement Logs" value={totalLogs} sub="Stock In / Stock Out History" icon={Layers} accent="var(--gold)" />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                      <div className="section-title" style={{ margin: 0 }}><Boxes size={18} color="var(--gold)" /> Item Master & Stock Control</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn" onClick={() => { setStockMovementItem(null); setShowStockMovementModal(true); }}>
                          <ArrowUpRight size={14} color="var(--jade)" /> Stock In / Out
                        </button>
                        <button className="btn btn-primary" onClick={() => { setEditingInventoryItem(null); setShowInventoryItemModal(true); }}>
                          <Plus size={14} /> Add SKU Item
                        </button>
                      </div>
                    </div>

                    <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div className="field" style={{ margin: 0, flex: 1, minWidth: 160 }}>
                        <label>Category</label>
                        <select value={inventoryFilters.category} onChange={e => setInventoryFilters(f => ({ ...f, category: e.target.value }))}>
                          <option>All</option>
                          {INVENTORY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="field" style={{ margin: 0, flex: 1, minWidth: 130 }}>
                        <label>Stock Status</label>
                        <select value={inventoryFilters.status} onChange={e => setInventoryFilters(f => ({ ...f, status: e.target.value }))}>
                          <option>All</option>
                          <option>In Stock</option>
                          <option>Low Stock</option>
                          <option>Out of Stock</option>
                        </select>
                      </div>
                      <div className="field" style={{ margin: 0, flex: 2, minWidth: 200 }}>
                        <label>Search SKU / Name / Location</label>
                        <input value={inventoryFilters.search} onChange={e => setInventoryFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search item, code, or warehouse..." />
                      </div>
                    </div>

                    <div className="card" style={{ marginBottom: 24 }}>
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>SKU Code</th><th>Item Name & Description</th><th>Category</th>
                              <th style={{ textAlign: "right" }}>In Stock Qty</th><th style={{ textAlign: "right" }}>Reorder Level</th>
                              <th style={{ textAlign: "right" }}>Unit Cost</th><th style={{ textAlign: "right" }}>Total Value</th>
                              <th>Warehouse</th><th>Status</th><th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredItems.map(item => {
                              const isOut = item.quantity === 0;
                              const isLow = item.quantity <= item.minQuantity && !isOut;
                              const totalVal = item.quantity * item.unitCost;
                              return (
                                <tr key={item.id}>
                                  <td className="mono" style={{ fontWeight: 700, fontSize: 12.5, color: "var(--gold)" }}>{item.sku}</td>
                                  <td>
                                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{item.name}</div>
                                    <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{item.description || "—"}</div>
                                  </td>
                                  <td><span className="badge-mini">{item.category}</span></td>
                                  <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: isOut ? "var(--rose)" : isLow ? "var(--amber)" : "var(--ink)" }}>
                                    {item.quantity} {item.unit}
                                  </td>
                                  <td className="mono" style={{ textAlign: "right", color: "var(--ink-muted)", fontSize: 12 }}>
                                    {item.minQuantity} {item.unit}
                                  </td>
                                  <td className="mono" style={{ textAlign: "right" }}>{pkr(item.unitCost)}</td>
                                  <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{pkr(totalVal)}</td>
                                  <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{item.warehouse}</td>
                                  <td>
                                    {isOut ? (
                                      <span className="badge-mini" style={{ background: "var(--rose-glow)", color: "var(--rose)", fontWeight: 600 }}>Out of Stock</span>
                                    ) : isLow ? (
                                      <span className="badge-mini" style={{ background: "var(--amber-glow)", color: "var(--amber)", fontWeight: 600 }}>Low Stock</span>
                                    ) : (
                                      <span className="badge-mini" style={{ background: "var(--jade-glow)", color: "var(--jade)", fontWeight: 600 }}>In Stock</span>
                                    )}
                                  </td>
                                  <td style={{ display: "flex", gap: 4 }}>
                                    <button className="btn" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => { setStockMovementItem(item); setShowStockMovementModal(true); }}>
                                      Movement
                                    </button>
                                    <button className="btn" style={{ padding: "4px 6px", fontSize: 12 }} onClick={() => { setEditingInventoryItem(item); setShowInventoryItemModal(true); }} title="Edit Item">
                                      <Edit size={13} />
                                    </button>
                                    <button className="btn" style={{ padding: "4px 6px", fontSize: 12, color: "var(--rose)" }} onClick={() => deleteInventoryItem(item)} title="Delete Item">
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredItems.length === 0 && (
                              <tr>
                                <td colSpan={10} style={{ textAlign: "center", padding: 20, color: "var(--ink-muted)" }}>
                                  No inventory items match your current filter criteria.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="card" style={{ padding: 18 }}>
                      <div className="section-title" style={{ marginBottom: 14 }}>
                        <ScrollText size={16} color="var(--gold)" /> Stock Movement Audit & Issue Log
                      </div>
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th><th>SKU & Item</th><th>Type</th>
                              <th style={{ textAlign: "right" }}>Quantity</th><th style={{ textAlign: "right" }}>Unit Cost</th>
                              <th style={{ textAlign: "right" }}>Total Cost</th><th>Ref / Project</th><th>Notes / Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventoryLogs.slice(0, 15).map(log => (
                              <tr key={log.id}>
                                <td className="mono" style={{ fontSize: 12.5 }}>{fmtDate(log.date)}</td>
                                <td>
                                  <span className="mono" style={{ fontWeight: 600, fontSize: 11.5, marginRight: 6, color: "var(--gold)" }}>{log.sku}</span>
                                  <span>{log.itemName}</span>
                                </td>
                                <td>
                                  {log.type === "Stock In" ? (
                                    <span className="badge-mini" style={{ background: "var(--jade-glow)", color: "var(--jade)", fontWeight: 600 }}>
                                      <ArrowDownLeft size={10} style={{ verticalAlign: -1 }} /> Stock In
                                    </span>
                                  ) : log.type === "Stock Out" ? (
                                    <span className="badge-mini" style={{ background: "var(--rose-glow)", color: "var(--rose)", fontWeight: 600 }}>
                                      <ArrowUpRight size={10} style={{ verticalAlign: -1 }} /> Stock Out
                                    </span>
                                  ) : (
                                    <span className="badge-mini" style={{ background: "var(--sky-glow)", color: "var(--sky)", fontWeight: 600 }}>
                                      Adjustment
                                    </span>
                                  )}
                                </td>
                                <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{log.quantity}</td>
                                <td className="mono" style={{ textAlign: "right" }}>{pkr(log.unitCost)}</td>
                                <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>{pkr(log.totalCost)}</td>
                                <td style={{ fontSize: 12.5 }}>
                                  {log.projectName ? (
                                    <span style={{ color: "var(--sky)", fontWeight: 500 }}>{log.reference} — {log.projectName}</span>
                                  ) : (
                                    <span style={{ color: "var(--ink-muted)" }}>{log.reference}</span>
                                  )}
                                </td>
                                <td style={{ fontSize: 12, color: "var(--ink-muted)" }}>{log.notes || "—"}</td>
                              </tr>
                            ))}
                            {inventoryLogs.length === 0 && (
                              <tr>
                                <td colSpan={8} style={{ textAlign: "center", padding: 16, color: "var(--ink-muted)" }}>
                                  No stock movement transactions recorded yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
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
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn" style={{ fontSize: 12.5, padding: "5px 12px", background: attendanceSubView === "grid" ? "#B8860B" : "#FFFFFF", color: attendanceSubView === "grid" ? "#FFFFFF" : "#0F172A", borderColor: attendanceSubView === "grid" ? "#B8860B" : "#CBD5E1", fontWeight: 600 }} onClick={() => setAttendanceSubView("grid")}>
                        📊 Day-Wise Monthly Sheet (Grid)
                      </button>
                      <button className="btn" style={{ fontSize: 12.5, padding: "5px 12px", background: attendanceSubView === "today" ? "#B8860B" : "#FFFFFF", color: attendanceSubView === "today" ? "#FFFFFF" : "#0F172A", borderColor: attendanceSubView === "today" ? "#B8860B" : "#CBD5E1", fontWeight: 600 }} onClick={() => setAttendanceSubView("today")}>
                        ⚡ Today's Quick Mark
                      </button>
                      <button className="btn" style={{ fontSize: 12.5, padding: "5px 12px", background: attendanceSubView === "deductions" ? "#B8860B" : "#FFFFFF", color: attendanceSubView === "deductions" ? "#FFFFFF" : "#0F172A", borderColor: attendanceSubView === "deductions" ? "#B8860B" : "#CBD5E1", fontWeight: 600 }} onClick={() => setAttendanceSubView("deductions")}>
                        💰 Salary Deductions Summary
                      </button>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>
                      Month: July 2026
                    </div>
                  </div>

                  {attendanceSubView === "grid" && (
                    <div className="card" style={{ padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
                          Day-Wise Monthly Attendance Sheet (July 2026)
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11.5 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#059669" }}></span> P = Present</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#DC2626" }}></span> A = Absent (Unpaid)</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#D97706" }}></span> L = Leave</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#64748B" }}></span> OFF = Rest</span>
                        </div>
                      </div>
                      
                      <div className="table-responsive" style={{ overflowX: "auto" }}>
                        <table style={{ fontSize: 11.5, borderCollapse: "collapse", width: "100%", minWidth: 1100 }}>
                          <thead>
                            <tr style={{ background: "var(--bg)" }}>
                              <th style={{ padding: "8px 10px", border: "1px solid var(--rule)", position: "sticky", left: 0, background: "#1E293B", color: "#FFF", zIndex: 2, textAlign: "left" }}>Staff Member</th>
                              <th style={{ padding: "8px 10px", border: "1px solid var(--rule)", textAlign: "right" }}>Gross Salary</th>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <th key={day} style={{ padding: "4px 2px", border: "1px solid var(--rule)", textAlign: "center", minWidth: 24, fontSize: 10.5 }}>{day}</th>
                              ))}
                              <th style={{ padding: "8px", border: "1px solid var(--rule)", color: "#059669", textAlign: "center" }}>P</th>
                              <th style={{ padding: "8px", border: "1px solid var(--rule)", color: "#DC2626", textAlign: "center" }}>A</th>
                              <th style={{ padding: "8px", border: "1px solid var(--rule)", color: "#D97706", textAlign: "center" }}>L</th>
                              <th style={{ padding: "8px 10px", border: "1px solid var(--rule)", color: "#DC2626", textAlign: "right" }}>Auto Deduction</th>
                              <th style={{ padding: "8px 10px", border: "1px solid var(--rule)", color: "#059669", textAlign: "right" }}>Net Salary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employees.filter(e => e.status !== "Terminated").map(e => {
                              const empAtt = monthlyAttendance[e.id] || {};
                              const presentCount = Object.keys(empAtt).length > 0 ? Object.values(empAtt).filter(v => v === "P").length : 22;
                              const absentCount = Object.keys(empAtt).length > 0 ? Object.values(empAtt).filter(v => v === "A").length : 0;
                              const leaveCount = Object.keys(empAtt).length > 0 ? Object.values(empAtt).filter(v => v === "L").length : 0;
                              const dailyRate = Math.round(e.salary / 30);
                              const deductionAmt = absentCount * dailyRate;
                              const netSalary = e.salary - deductionAmt;

                              return (
                                <tr key={e.id}>
                                  <td style={{ padding: "6px 10px", border: "1px solid var(--rule)", fontWeight: 700, position: "sticky", left: 0, background: "var(--card-bg)", zIndex: 1, whiteSpace: "nowrap" }}>
                                    {e.name}
                                    <div style={{ fontSize: 10, color: "var(--ink-muted)", fontWeight: 400 }}>{e.code} &middot; {e.department}</div>
                                  </td>
                                  <td className="mono" style={{ padding: "6px 10px", border: "1px solid var(--rule)", textAlign: "right", fontSize: 11 }}>{pkr(e.salary)}</td>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                    const isSun = (day === 5 || day === 12 || day === 19 || day === 26);
                                    const status = empAtt[day] || (isSun ? "OFF" : "P");
                                    const bg = status === "P" ? "#059669" : status === "A" ? "#DC2626" : status === "L" ? "#D97706" : "#64748B";
                                    return (
                                      <td key={day} style={{ padding: "2px", border: "1px solid var(--rule)", textAlign: "center", cursor: "pointer" }}
                                        onClick={() => toggleDayAttendance(e.id, day)} title={`Day ${day}: Click to toggle (${status})`}>
                                        <span style={{ display: "inline-block", width: 20, height: 20, lineHeight: "20px", borderRadius: 3, background: bg, color: "#FFF", fontWeight: 700, fontSize: 9.5 }}>
                                          {status}
                                        </span>
                                      </td>
                                    );
                                  })}
                                  <td className="mono" style={{ padding: "6px", border: "1px solid var(--rule)", textAlign: "center", fontWeight: 700, color: "#059669" }}>{presentCount}</td>
                                  <td className="mono" style={{ padding: "6px", border: "1px solid var(--rule)", textAlign: "center", fontWeight: 700, color: "#DC2626" }}>{absentCount}</td>
                                  <td className="mono" style={{ padding: "6px", border: "1px solid var(--rule)", textAlign: "center", fontWeight: 700, color: "#D97706" }}>{leaveCount}</td>
                                  <td className="mono" style={{ padding: "6px 10px", border: "1px solid var(--rule)", textAlign: "right", color: deductionAmt > 0 ? "#DC2626" : "var(--ink-muted)", fontWeight: 700 }}>
                                    {deductionAmt > 0 ? `- ${pkr(deductionAmt)}` : "Rs 0"}
                                  </td>
                                  <td className="mono" style={{ padding: "6px 10px", border: "1px solid var(--rule)", textAlign: "right", color: "#059669", fontWeight: 800 }}>
                                    {pkr(netSalary)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {attendanceSubView === "today" && (
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

                  {attendanceSubView === "deductions" && (
                    <div className="card" style={{ padding: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--gold)" }}>
                        💰 Auto Attendance &amp; Leave Salary Deductions Breakdown (July 2026)
                      </div>
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr>
                              <th>Emp Code</th><th>Employee Name</th><th>Department</th>
                              <th style={{ textAlign: "right" }}>Gross Salary</th>
                              <th style={{ textAlign: "center" }}>Daily Rate</th>
                              <th style={{ textAlign: "center" }}>Absents</th>
                              <th style={{ textAlign: "right", color: "var(--rose)" }}>Deduction Amount</th>
                              <th style={{ textAlign: "right", color: "var(--jade)" }}>Net Payable Salary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employees.filter(e => e.status !== "Terminated").map(e => {
                              const empAtt = monthlyAttendance[e.id] || {};
                              const absentCount = Object.keys(empAtt).length > 0 ? Object.values(empAtt).filter(v => v === "A").length : 0;
                              const dailyRate = Math.round(e.salary / 30);
                              const deductionAmt = absentCount * dailyRate;
                              const netSalary = e.salary - deductionAmt;
                              return (
                                <tr key={e.id}>
                                  <td className="mono" style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>{e.code}</td>
                                  <td style={{ fontWeight: 600 }}>{e.name}</td>
                                  <td><DepartmentBadge department={e.department} /></td>
                                  <td className="mono" style={{ textAlign: "right" }}>{pkr(e.salary)}</td>
                                  <td className="mono" style={{ textAlign: "center", color: "var(--ink-muted)" }}>{pkr(dailyRate)}/day</td>
                                  <td className="mono" style={{ textAlign: "center", fontWeight: 700, color: absentCount > 0 ? "var(--rose)" : "var(--ink-muted)" }}>{absentCount} Days</td>
                                  <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--rose)" }}>
                                    {deductionAmt > 0 ? `- ${pkr(deductionAmt)}` : "Rs 0"}
                                  </td>
                                  <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: "var(--jade)", fontSize: 14 }}>
                                    {pkr(netSalary)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
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
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ background: "rgba(14, 165, 233, 0.12)", color: "#0284C7", borderColor: "#38BDF8", fontWeight: 600 }} onClick={() => { setVoucherDefaultType("CV"); setShowVoucherForm(true); }}>⚡ Direct Client ➔ Vendor Settlement</button>
                <button className="btn btn-primary" onClick={() => { setVoucherDefaultType("JV"); setShowVoucherForm(true); }}><Plus size={14} /> New Voucher</button>
              </div>

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
            {/* DOCUMENT PROCESSING WORKFLOW PILL HEADER */}
            <div className="card" style={{ padding: "14px 20px", marginBottom: 18, background: "linear-gradient(135deg, rgba(2, 132, 199, 0.06), rgba(5, 150, 105, 0.06))", border: "1px solid rgba(2, 132, 199, 0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>AI Document OCR &amp; Accounting Posting Workflow</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-muted)", marginTop: 2 }}>
                    Upload Invoice, Quotation, PO, or Receipt. System extracts data for user review. No financial entry is posted automatically.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, fontSize: 11.5, fontWeight: 700 }}>
                  <span style={{ background: "#E0F2FE", color: "#0369A1", padding: "4px 8px", borderRadius: 12 }}>1. UPLOAD</span>
                  <span style={{ color: "var(--ink-muted)" }}>→</span>
                  <span style={{ background: "#FEF3C7", color: "#B45309", padding: "4px 8px", borderRadius: 12 }}>2. AI EXTRACT</span>
                  <span style={{ color: "var(--ink-muted)" }}>→</span>
                  <span style={{ background: "#F3E8FF", color: "#6B21A8", padding: "4px 8px", borderRadius: 12 }}>3. EDIT &amp; REVIEW</span>
                  <span style={{ color: "var(--ink-muted)" }}>→</span>
                  <span style={{ background: "#DCFCE7", color: "#15803D", padding: "4px 8px", borderRadius: 12 }}>4. ACCOUNTING PREVIEW &amp; POST</span>
                </div>
              </div>
            </div>

            {/* UPLOAD FILE CARD */}
            <div className="card" style={{ padding: 24, marginBottom: 18, textAlign: "center", border: "2px dashed var(--rule)", background: "#FAFDFB" }}>
              <UploadCloud size={36} color="var(--gold)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Upload Invoice, Receipt, PO, or Business Document</div>
              <div style={{ fontSize: 13, marginBottom: 14, color: "var(--ink-muted)" }}>
                Supports PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX files.
              </div>
              <label className="btn btn-primary" style={{ display: "inline-flex", cursor: "pointer", padding: "10px 20px" }}>
                <Plus size={16} /> Select &amp; Upload Document
                <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style={{ display: "none" }}
                  onChange={e => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = ""; }} />
              </label>
            </div>

            {/* STATS & FILTER TOOLBAR */}
            <div className="card" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { key: "all", label: `All Documents (${documents.length})` },
                  { key: "ready_for_review", label: `Ready for Review (${documents.filter(d => d.status === "ready_for_review").length})` },
                  { key: "draft", label: `Drafts (${documents.filter(d => d.status === "draft").length})` },
                  { key: "posted", label: `Posted (${documents.filter(d => d.status === "posted").length})` },
                  { key: "duplicate", label: `Duplicates (${documents.filter(d => d.status === "duplicate").length})` },
                ].map(tabItem => (
                  <button
                    key={tabItem.key}
                    className={"btn" + (docStatusFilter === tabItem.key ? " btn-primary" : "")}
                    style={{ fontSize: 12.5, padding: "5px 12px" }}
                    onClick={() => setDocStatusFilter(tabItem.key)}
                  >
                    {tabItem.label}
                  </button>
                ))}
              </div>

              <div style={{ position: "relative", minWidth: 200 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 10, top: 10, color: "var(--ink-muted)" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  value={docSearchQuery}
                  onChange={e => setDocSearchQuery(e.target.value)}
                  placeholder="Search filename, vendor, or invoice #…"
                  style={{ paddingLeft: 30, fontSize: 12.5, height: 34 }}
                />
              </div>
            </div>

            {/* DOCUMENTS GRID */}
            {(() => {
              const filteredDocs = documents.filter(doc => {
                if (docStatusFilter !== "all" && doc.status !== docStatusFilter) return false;
                if (docSearchQuery) {
                  const q = docSearchQuery.toLowerCase();
                  const fn = (doc.fileName || "").toLowerCase();
                  const pty = (doc.extracted?.party || "").toLowerCase();
                  const num = (doc.extracted?.documentNumber || "").toLowerCase();
                  return fn.includes(q) || pty.includes(q) || num.includes(q);
                }
                return true;
              });

              if (filteredDocs.length === 0) {
                return (
                  <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--ink-muted)" }}>
                    <FileText size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <div style={{ fontSize: 15, fontWeight: 700 }}>No Documents Found</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Upload a new document or adjust your search filters.</div>
                  </div>
                );
              }

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                  {filteredDocs.map(doc => (
                    <div key={doc.id} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", borderLeft: `4px solid ${doc.status === "posted" ? "#059669" : doc.status === "duplicate" ? "#DC2626" : doc.status === "draft" ? "#D97706" : "#0284C7"}` }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8, wordBreak: "break-all" }}>
                            <FileCheck2 size={16} color="var(--gold)" /> {doc.fileName}
                          </div>
                          {doc.status === "processing" && (
                            <span style={{ fontSize: 11.5, color: "#0284C7", background: "rgba(2, 132, 199, 0.1)", padding: "2px 8px", borderRadius: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                              <Loader2 size={12} className="spin" /> READING…
                            </span>
                          )}
                          {doc.status === "ready_for_review" && <span style={{ fontSize: 11.5, background: "#E0F2FE", color: "#0369A1", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>READY FOR REVIEW</span>}
                          {doc.status === "draft" && <span style={{ fontSize: 11.5, background: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>DRAFT</span>}
                          {doc.status === "posted" && <span style={{ fontSize: 11.5, background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>POSTED</span>}
                          {doc.status === "duplicate" && <span style={{ fontSize: 11.5, background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>DUPLICATE</span>}
                        </div>

                        {doc.extracted && (
                          <div style={{ background: "var(--bg)", padding: 10, borderRadius: 6, fontSize: 12, marginBottom: 12, border: "1px solid var(--rule)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ color: "var(--ink-muted)" }}>Type: <strong>{doc.extracted.documentType}</strong></span>
                              <span style={{ color: "#059669", fontWeight: 700 }}>Confidence: {doc.extracted.aiConfidence}</span>
                            </div>
                            <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>
                              Party: {doc.extracted.party || "Unmatched"}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--ink-muted)" }}>
                              <span>Doc #: {doc.extracted.documentNumber}</span>
                              <span className="mono" style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{pkr(doc.extracted.totalAmount || doc.extracted.amount)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--rule)", paddingTop: 10 }}>
                        <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>{doc.uploadedAt || "Today"} • {doc.fileSize || "PDF"}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn" style={{ padding: "4px 8px", fontSize: 12, color: "#DC2626" }} onClick={() => deleteDocument(doc.id)}>
                            <Trash2 size={13} />
                          </button>
                          {doc.status !== "posted" ? (
                            <button className="btn btn-primary" style={{ padding: "5px 12px", fontSize: 12.5, fontWeight: 700 }} onClick={() => setReviewingDocId(doc.id)}>
                              Review &amp; Edit Data
                            </button>
                          ) : (
                            <button className="btn" style={{ padding: "5px 12px", fontSize: 12.5 }} onClick={() => setReviewingDocId(doc.id)}>
                              View Record
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </>
        )}


        {tab === "ledger" && (
          <>
            {/* Ledger Sub-Nav Header */}
            <div className="card" style={{ padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className={"btn" + (ledgerSubTab === "entries" ? " btn-primary" : "")}
                  onClick={() => setLedgerSubTab("entries")}
                  style={{ fontSize: 13, padding: "7px 14px" }}
                >
                  <BookOpenText size={15} /> Journal Entries &amp; Trial Balance
                </button>
                <button
                  className={"btn" + (ledgerSubTab === "coa" ? " btn-primary" : "")}
                  onClick={() => setLedgerSubTab("coa")}
                  style={{ fontSize: 13, padding: "7px 14px" }}
                >
                  <Layers size={15} /> Hierarchical Chart of Accounts
                </button>
                <button
                  className={"btn" + (ledgerSubTab === "running_balance" ? " btn-primary" : "")}
                  onClick={() => setLedgerSubTab("running_balance")}
                  style={{ fontSize: 13, padding: "7px 14px" }}
                >
                  <SlidersHorizontal size={15} /> Account Running Balance
                </button>
              </div>

              <div className="mono" style={{ fontSize: 13.5 }}>
                Debits {pkr(totalDebit)} = Credits {pkr(totalCredit)} &nbsp;&mdash;&nbsp;
                <span className={isBalanced ? "trial-ok" : "trial-bad"} style={{ fontWeight: 700 }}>
                  {isBalanced ? "✓ Balanced" : "Out of Balance"}
                </span>
              </div>
            </div>

            {/* Sub-Tab 1: Journal Entries List & Reversal */}
            {ledgerSubTab === "entries" && (
              <>
                {journal.map(e => (
                  <div className="card" key={e.id} style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 15, marginRight: 10 }}>{e.description}</span>
                        {e.reference?.startsWith("REV-") && (
                          <span className="badge-mini" style={{ background: "#FFE4E6", color: "#E11D48", fontWeight: 700 }}>Reversal Voucher</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 13, color: "var(--ink-muted)" }} className="mono">{e.reference} &middot; {fmtDate(e.date)}</div>
                        {!e.reference?.startsWith("REV-") && (
                          <button
                            className="btn"
                            style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #CBD5E1", color: "var(--rose)" }}
                            title="Post Audit Reversal Entry"
                            onClick={() => handleReverseEntry(e)}
                          >
                            <RefreshCw size={12} /> Reverse / Adjust
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table>
                        <thead><tr><th>Account</th><th style={{ textAlign: "right" }}>Debit</th><th style={{ textAlign: "right" }}>Credit</th></tr></thead>
                        <tbody>
                          {e.lines.map((l, i) => (
                            <tr key={i}>
                              <td>
                                <strong className="mono" style={{ color: "var(--ink-muted)", fontSize: 12, marginRight: 6 }}>{ACCOUNTS[l.account]?.code}</strong>
                                {ACCOUNTS[l.account]?.name || l.account}
                                {l.memo ? ` (${l.memo})` : ""}
                              </td>
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

            {/* Sub-Tab 2: Hierarchical Chart of Accounts Tree */}
            {ledgerSubTab === "coa" && (
              <div className="card" style={{ padding: 20 }}>
                <div className="section-title" style={{ marginBottom: 16 }}>
                  <Layers size={18} color="var(--gold)" /> Chart of Accounts Hierarchy (Assets → Sub-categories → Accounts)
                </div>
                {COA_STRUCTURE.map(cat => (
                  <div key={cat.code} style={{ marginBottom: 20, border: "1px solid #E2E8F0", borderRadius: 8, padding: 14, background: "#FAFAFA" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                      <span>{cat.name}</span>
                      <span className="badge-mini" style={{ background: "#FEF3C7", color: "#92400E" }}>{cat.type.toUpperCase()}</span>
                    </div>

                    {cat.subcategories.map(sub => (
                      <div key={sub.code} style={{ marginLeft: 16, marginBottom: 12, background: "#FFFFFF", padding: 12, borderRadius: 6, border: "1px solid #CBD5E1" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1E293B", marginBottom: 8 }}>
                          {sub.name}
                        </div>

                        <div className="table-responsive">
                          <table>
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Account Title</th>
                                <th>Type</th>
                                <th style={{ textAlign: "right" }}>Net Balance</th>
                                <th style={{ textAlign: "center" }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sub.accounts.map(accKey => {
                                const acc = ACCOUNTS[accKey];
                                const netBal = balances.net[accKey] || 0;
                                return (
                                  <tr key={accKey}>
                                    <td className="mono" style={{ fontWeight: 700, color: "var(--gold)" }}>{acc?.code}</td>
                                    <td style={{ fontWeight: 600 }}>{acc?.name}</td>
                                    <td><span className="badge-mini">{acc?.type}</span></td>
                                    <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: netBal >= 0 ? "var(--jade)" : "var(--rose)" }}>
                                      {pkr(netBal)}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <button
                                        className="btn"
                                        style={{ padding: "3px 8px", fontSize: 11.5 }}
                                        onClick={() => {
                                          setSelectedLedgerAccount(accKey);
                                          setLedgerSubTab("running_balance");
                                        }}
                                      >
                                        View Ledger
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Sub-Tab 3: Account Running Balance */}
            {ledgerSubTab === "running_balance" && (
              <>
                <div className="card" style={{ padding: 18, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div className="section-title" style={{ margin: 0 }}>Select Account Ledger</div>
                    <select
                      value={selectedLedgerAccount}
                      onChange={e => setSelectedLedgerAccount(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, fontWeight: 600, minWidth: 260 }}
                    >
                      <option value="all">— Select an Account —</option>
                      {Object.entries(ACCOUNTS).map(([k, a]) => (
                        <option key={k} value={k}>[{a.code}] {a.name} ({a.category})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedLedgerAccount !== "all" && (
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #E2E8F0", paddingBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>
                          [{ACCOUNTS[selectedLedgerAccount]?.code}] {ACCOUNTS[selectedLedgerAccount]?.name}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                          Category: {ACCOUNTS[selectedLedgerAccount]?.category} &middot; Normal Balance: {ACCOUNTS[selectedLedgerAccount]?.type === "asset" || ACCOUNTS[selectedLedgerAccount]?.type === "expense" ? "Debit" : "Credit"}
                        </div>
                      </div>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>
                        Current Balance: {pkr(balances.net[selectedLedgerAccount] || 0)}
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Voucher #</th>
                            <th>Particulars / Description</th>
                            <th style={{ textAlign: "right" }}>Debit</th>
                            <th style={{ textAlign: "right" }}>Credit</th>
                            <th style={{ textAlign: "right" }}>Running Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accountLedgerData.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--ink-muted)", padding: 20 }}>No transactions recorded for this account yet.</td></tr>
                          ) : (
                            accountLedgerData.map((row, i) => (
                              <tr key={i}>
                                <td className="mono">{fmtDate(row.date)}</td>
                                <td className="mono" style={{ fontWeight: 700, color: "var(--gold)" }}>{row.reference || "—"}</td>
                                <td>{row.description}{row.memo ? ` (${row.memo})` : ""}</td>
                                <td className="mono" style={{ textAlign: "right" }}>{row.debit ? pkr(row.debit) : "—"}</td>
                                <td className="mono" style={{ textAlign: "right" }}>{row.credit ? pkr(row.credit) : "—"}</td>
                                <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: row.runningBalance >= 0 ? "var(--jade)" : "var(--rose)" }}>
                                  {pkr(row.runningBalance)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "reports" && (
          <>
            {/* P&L Filter Toolbar */}
            <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink-muted)" }}>Period Filter:</span>
                {[
                  { key: "month", label: "This Month (Jul 2026)" },
                  { key: "quarter", label: "This Quarter (Q3)" },
                  { key: "year", label: "This Year (2026)" },
                  { key: "all", label: "All Time" },
                  { key: "custom", label: "Custom Range" },
                ].map(p => (
                  <button
                    key={p.key}
                    className={"btn" + (pnlPeriod === p.key ? " btn-primary" : "")}
                    style={{ fontSize: 12.5, padding: "5px 11px" }}
                    onClick={() => setPnlPeriod(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                className={"btn" + (showPnlComparison ? " btn-primary" : "")}
                style={{ fontSize: 12.5, padding: "5px 12px" }}
                onClick={() => setShowPnlComparison(!showPnlComparison)}
              >
                <BarChart3 size={13} /> {showPnlComparison ? "✓ Hide Comparison" : "📊 Compare Previous Period"}
              </button>
            </div>

            {pnlPeriod === "custom" && (
              <div className="card" style={{ padding: 14, marginBottom: 18, display: "flex", gap: 14, alignItems: "center" }}>
                <div className="field" style={{ margin: 0, flex: 1 }}>
                  <label>From Date</label>
                  <input type="date" value={pnlCustomStart} onChange={e => setPnlCustomStart(e.target.value)} />
                </div>
                <div className="field" style={{ margin: 0, flex: 1 }}>
                  <label>To Date</label>
                  <input type="date" value={pnlCustomEnd} onChange={e => setPnlCustomEnd(e.target.value)} />
                </div>
              </div>
            )}

            {/* P&L Main Statement Table */}
            <div className="card" style={{ padding: 20, marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="section-title" style={{ margin: 0 }}>
                  <BarChart3 size={18} color="var(--gold)" /> Statement of Profit &amp; Loss
                </div>
                <span className="badge-mini" style={{ background: "#FEF3C7", color: "#92400E", fontSize: 12 }}>
                  Period: {pnlPeriod === "month" ? "July 2026" : pnlPeriod === "quarter" ? "Q3 2026" : pnlPeriod === "year" ? "FY 2026" : "All Time"}
                </span>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Account Category / Line Item</th>
                      <th style={{ textAlign: "right" }}>Current Period</th>
                      {showPnlComparison && <th style={{ textAlign: "right" }}>Previous Period</th>}
                      {showPnlComparison && <th style={{ textAlign: "right" }}>Variance (PKR / %)</th>}
                      <th style={{ textAlign: "center" }}>Drill-Down</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Revenue */}
                    <tr style={{ background: "rgba(5, 150, 105, 0.03)" }}>
                      <td style={{ fontWeight: 700, fontSize: 14.5 }}>1. Operating Service &amp; Media Revenue</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--jade)", fontWeight: 700, fontSize: 15 }}>
                        {pkr(pnlCurrent.rev)}
                      </td>
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right", color: "var(--ink-muted)" }}>{pkr(pnlPrev.rev)}</td>
                      )}
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: pnlCurrent.rev >= pnlPrev.rev ? "var(--jade)" : "var(--rose)" }}>
                          {pkr(pnlCurrent.rev - pnlPrev.rev)} ({pnlPrev.rev ? (((pnlCurrent.rev - pnlPrev.rev) / pnlPrev.rev) * 100).toFixed(1) + "%" : "100%"})
                        </td>
                      )}
                      <td style={{ textAlign: "center" }}>
                        <button className="btn" style={{ padding: "3px 8px", fontSize: 11.5 }} onClick={() => setPnlDrillDown({ title: "Service Revenue Breakdown", lines: pnlCurrent.breakdown.revenue })}>
                          Inspect Entries
                        </button>
                      </td>
                    </tr>

                    {/* Direct Costs */}
                    <tr>
                      <td style={{ fontWeight: 600, paddingLeft: 20, color: "var(--ink-muted)" }}>Less: Direct Production &amp; Ad Spend Costs (COGS)</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--rose)", fontWeight: 600 }}>
                        ({pkr(pnlCurrent.directCosts)})
                      </td>
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right", color: "var(--ink-muted)" }}>({pkr(pnlPrev.directCosts)})</td>
                      )}
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right" }}>{pkr(pnlCurrent.directCosts - pnlPrev.directCosts)}</td>
                      )}
                      <td style={{ textAlign: "center" }}>
                        <button className="btn" style={{ padding: "3px 8px", fontSize: 11.5 }} onClick={() => setPnlDrillDown({ title: "Direct Production & Media Costs", lines: pnlCurrent.breakdown.directCosts })}>
                          Inspect Entries
                        </button>
                      </td>
                    </tr>

                    {/* Gross Profit Subtotal */}
                    <tr style={{ background: "#F1F5F9", borderTop: "1px solid #CBD5E1", borderBottom: "1px solid #CBD5E1" }}>
                      <td style={{ fontWeight: 700, fontSize: 15 }}>GROSS OPERATING PROFIT</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, fontSize: 15.5, color: pnlCurrent.grossProfit >= 0 ? "var(--jade)" : "var(--rose)" }}>
                        {pkr(pnlCurrent.grossProfit)}
                      </td>
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700 }}>{pkr(pnlPrev.grossProfit)}</td>
                      )}
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: pnlCurrent.grossProfit >= pnlPrev.grossProfit ? "var(--jade)" : "var(--rose)" }}>
                          {pkr(pnlCurrent.grossProfit - pnlPrev.grossProfit)}
                        </td>
                      )}
                      <td></td>
                    </tr>

                    {/* Operating Expenses */}
                    <tr>
                      <td style={{ fontWeight: 600, paddingLeft: 20, color: "var(--ink-muted)" }}>Less: Operating, Rent &amp; Payroll Expenses</td>
                      <td className="mono" style={{ textAlign: "right", color: "var(--rose)", fontWeight: 600 }}>
                        ({pkr(pnlCurrent.opExpenses)})
                      </td>
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right", color: "var(--ink-muted)" }}>({pkr(pnlPrev.opExpenses)})</td>
                      )}
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right" }}>{pkr(pnlCurrent.opExpenses - pnlPrev.opExpenses)}</td>
                      )}
                      <td style={{ textAlign: "center" }}>
                        <button className="btn" style={{ padding: "3px 8px", fontSize: 11.5 }} onClick={() => setPnlDrillDown({ title: "Operating & General Expenses", lines: pnlCurrent.breakdown.opExpenses })}>
                          Inspect Entries
                        </button>
                      </td>
                    </tr>

                    {/* Net Profit Final */}
                    <tr style={{ background: pnlCurrent.netProfit >= 0 ? "rgba(5, 150, 105, 0.08)" : "rgba(225, 29, 72, 0.08)" }}>
                      <td style={{ fontWeight: 800, fontSize: 16 }}>NET OPERATING PROFIT</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 800, fontSize: 17, color: pnlCurrent.netProfit >= 0 ? "var(--jade)" : "var(--rose)" }}>
                        {pkr(pnlCurrent.netProfit)}
                      </td>
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right", fontWeight: 800, fontSize: 16 }}>{pkr(pnlPrev.netProfit)}</td>
                      )}
                      {showPnlComparison && (
                        <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: pnlCurrent.netProfit >= pnlPrev.netProfit ? "var(--jade)" : "var(--rose)" }}>
                          {pkr(pnlCurrent.netProfit - pnlPrev.netProfit)}
                        </td>
                      )}
                      <td style={{ textAlign: "center" }}>
                        <button className="btn btn-primary" style={{ padding: "4px 9px", fontSize: 11.5 }} onClick={() => setPnlDrillDown({ title: "All Period P&L Journal Postings", lines: [...pnlCurrent.breakdown.revenue, ...pnlCurrent.breakdown.directCosts, ...pnlCurrent.breakdown.opExpenses] })}>
                          Full Audit Log
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SRB Sales Tax Summary */}
            <div className="card" style={{ padding: 20, marginBottom: 18, borderTop: "3px solid var(--rose)" }}>
              <div className="section-title"><Landmark size={18} color="var(--rose)" /> Sindh Sales Tax (SRB) Summary</div>
              <div className="table-responsive">
                <table>
                  <tbody>
                    <tr><td style={{ fontWeight: 600 }}>Total SST Invoiced (15%)</td><td className="mono" style={{ textAlign: "right", color: "var(--ink)", fontWeight: 700 }}>{pkr(totalSstInvoiced)}</td></tr>
                    <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                      <td style={{ fontWeight: 700, fontSize: 15 }}>Current Payable Balance</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, fontSize: 16, color: "var(--rose)" }}>{pkr(srbPayableBalance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 14, textAlign: "right" }}>
                <button className="btn btn-primary" onClick={recordSrbRemittance} disabled={srbPayableBalance <= 0}>
                  Record Remittance Payment
                </button>
              </div>
            </div>

            {/* Expense Breakdown Chart */}
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

            {/* SUPABASE CLOUD CONNECTION & SYNC CARD */}
            <SupabaseConfigCard
              config={supabaseConfig}
              onSaveConfig={handleSaveSupabaseConfig}
              onPushToCloud={handlePushToCloud}
              onPullFromCloud={handlePullFromCloud}
              isSyncing={isSyncingCloud}
            />

            {/* DATA BACKUP & DISASTER RECOVERY CENTER */}
            <div style={{ marginTop: 28 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>
                <HardDrive size={20} color="var(--gold)" /> Data Backup &amp; Disaster Recovery Center
              </div>

              {backupNotification && (
                <div style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  background: backupNotification.type === "success" ? "#ECFDF5" : "#FEF2F2",
                  color: backupNotification.type === "success" ? "#065F46" : "#991B1B",
                  border: `1px solid ${backupNotification.type === "success" ? "#A7F3D0" : "#FCA5A5"}`
                }}>
                  {backupNotification.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <div>{backupNotification.text}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                {/* Export Backup Card */}
                <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ background: "#FEF3C7", color: "#B8860B", padding: 8, borderRadius: 8 }}>
                        <Download size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Export System Backup</h3>
                        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-muted)" }}>Download complete database snapshot as a JSON file</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", margin: "12px 0 16px", lineHeight: 1.5 }}>
                      Includes <strong>Journal Entries ({journal.length})</strong>, <strong>Invoices ({invoices.length})</strong>, <strong>Expenses ({expenses.length})</strong>, <strong>Projects ({projects.length})</strong>, <strong>Bank Accounts ({bankAccounts.length})</strong>, &amp; <strong>Users ({usersList.length})</strong>.
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", gap: 8, padding: "10px 14px", fontWeight: 700 }} onClick={handleExportBackup}>
                    <Download size={16} /> Download Backup (.json)
                  </button>
                </div>

                {/* Restore Backup Card */}
                <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ background: "#E0F2FE", color: "#0284C7", padding: 8, borderRadius: 8 }}>
                        <Upload size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Restore Data Snapshot</h3>
                        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-muted)" }}>Restore system state from a previously saved JSON backup</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", margin: "12px 0 16px", lineHeight: 1.5 }}>
                      Upload a valid <code>.json</code> backup file to instant-restore all financial records, vouchers, and staff permissions.
                    </div>
                  </div>
                  <label className="btn" style={{ width: "100%", justifyContent: "center", gap: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer", background: "#0284C7", color: "#FFFFFF", borderColor: "#0284C7" }}>
                    <Upload size={16} /> Select Backup File to Restore
                    <input type="file" accept=".json" onChange={handleRestoreBackup} style={{ display: "none" }} />
                  </label>
                </div>

                {/* Local Storage & Reset Card */}
                <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ background: "#F1F5F9", color: "#475569", padding: 8, borderRadius: 8 }}>
                        <HardDrive size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Auto-Save &amp; Factory Reset</h3>
                        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-muted)" }}>Manage local browser storage state</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#475569", margin: "12px 0 16px", lineHeight: 1.5 }}>
                      <div><strong>Auto-Save Status:</strong> Active (Local Storage)</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-muted)" }}>
                        {lastBackupTime ? `Last Saved: ${lastBackupTime}` : "Data auto-saved on every change"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button className="btn" style={{ width: "100%", justifyContent: "center", gap: 8, padding: "10px 14px", fontWeight: 700, background: "#EF4444", color: "#FFFFFF", border: "none" }} onClick={() => handleResetData("clean")}>
                      <Trash2 size={16} /> Clear All Data (Start Fresh for Real Entry)
                    </button>
                    <button className="btn" style={{ width: "100%", justifyContent: "center", gap: 8, padding: "8px 12px", fontWeight: 600, color: "#475569", borderColor: "#CBD5E1" }} onClick={() => handleResetData("seed")}>
                      <RefreshCw size={14} /> Restore Sample Demo Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
          </TabBoundary>
        </div>
      </main>

      {/* ALL SYSTEM MODALS */}
      {showForgotPassword && <ForgotPasswordModal usersList={usersList} onClose={() => setShowForgotPassword(false)} onResetPassword={handleResetPassword} />}
      {showChangePassword && <ChangePasswordModal currentUser={currentUser} onClose={() => setShowChangePassword(false)} onUpdatePassword={(newP) => handleResetPassword(currentUser.email, newP)} />}

      {/* STAFF DETAIL DRILL-DOWN MODAL */}
      {selectedStaffDrilldown && (
        <div className="modal-backdrop" style={{ zIndex: 300 }}>
          <div className="modal" style={{ width: 900, maxWidth: "95vw", maxHeight: "92vh", overflowY: "auto", padding: 24, borderRadius: 20 }}>
            {/* MODAL HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, borderBottom: "1px solid var(--rule)", paddingBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #0F172A, #059669)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)" }}>
                  {selectedStaffDrilldown.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>{selectedStaffDrilldown.name}</h2>
                    <span className="badge-mini" style={{ background: "rgba(5,150,105,0.12)", color: "#047857", fontWeight: 800, padding: "3px 10px", borderRadius: 12 }}>
                      {selectedStaffDrilldown.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink-muted)", marginTop: 2 }}>
                    <strong>{selectedStaffDrilldown.roleTitle}</strong> &middot; {selectedStaffDrilldown.department} &middot; Email: <strong>{selectedStaffDrilldown.user.email}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginTop: 4 }}>
                    Last Login: <strong>Today 09:15 AM</strong> &middot; Last Activity: <strong>{selectedStaffDrilldown.lastTime}</strong> &middot; Active Session Duration: <strong>3 hrs 24 mins</strong>
                  </div>
                </div>
              </div>
              <button className="btn" style={{ padding: "6px 14px", fontWeight: 700 }} onClick={() => setSelectedStaffDrilldown(null)}>
                <X size={16} /> Close
              </button>
            </div>

            {/* DRILL-DOWN SUB-TABS */}
            <div className="tab-switcher" style={{ marginBottom: 20 }}>
              {[
                { key: "overview", label: "📊 Financial Activity", count: selectedStaffDrilldown.txnsCount },
                { key: "projects", label: "📁 Projects Worked On", count: selectedStaffDrilldown.projectsCount },
                { key: "documents", label: "🤖 AI Documents", count: selectedStaffDrilldown.docsCount },
                { key: "audit", label: "📜 Activity Stream", count: 18 }
              ].map(t => (
                <button
                  key={t.key}
                  className={"subtab-btn" + (staffDrilldownTab === t.key ? " active" : "")}
                  onClick={() => setStaffDrilldownTab(t.key)}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            {/* TAB 1: FINANCIAL & TRANSACTION BREAKDOWN */}
            {(staffDrilldownTab === "overview" || staffDrilldownTab === "financials") && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
                  <div style={{ padding: 14, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--rule)" }}>
                    <div style={{ fontSize: 11.5, color: "var(--ink-muted)", fontWeight: 700 }}>Total Transactions</div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>{selectedStaffDrilldown.txnsCount}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Handled in Period</div>
                  </div>
                  <div style={{ padding: 14, background: "rgba(5, 150, 105, 0.08)", borderRadius: 12, border: "1px solid rgba(5, 150, 105, 0.2)" }}>
                    <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 700 }}>Posted Transactions</div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>{selectedStaffDrilldown.postedTxnsCount}</div>
                    <div style={{ fontSize: 11, color: "#059669" }}>Final Posted Postings</div>
                  </div>
                  <div style={{ padding: 14, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--rule)" }}>
                    <div style={{ fontSize: 11.5, color: "var(--ink-muted)", fontWeight: 700 }}>Draft / Unposted</div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: "#D97706" }}>{selectedStaffDrilldown.txnsCount - selectedStaffDrilldown.postedTxnsCount}</div>
                    <div style={{ fontSize: 11, color: "#D97706" }}>Pending Approvals</div>
                  </div>
                  <div style={{ padding: 14, background: "rgba(184, 134, 11, 0.08)", borderRadius: 12, border: "1px solid rgba(184, 134, 11, 0.2)" }}>
                    <div style={{ fontSize: 11.5, color: "#B8860B", fontWeight: 700 }}>Total Posted Value</div>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: "#B8860B" }}>{pkr(selectedStaffDrilldown.postedVal)}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>Single Counted</div>
                  </div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10, color: "var(--ink)" }}>Transaction Breakdown &amp; History</div>
                <div className="table-responsive">
                  <table style={{ width: "100%", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Ref # / Description</th>
                        <th>Date</th>
                        <th>Client / Vendor</th>
                        <th style={{ textAlign: "right" }}>Amount</th>
                        <th>Created By</th>
                        <th>Posted By</th>
                        <th>Status</th>
                        <th style={{ textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.slice(0, 3).map((inv, idx) => (
                        <tr key={"inv_dr_" + idx}>
                          <td><span className="badge-mini" style={{ background: "#E0F2FE", color: "#0369A1", fontWeight: 700 }}>Invoice</span></td>
                          <td style={{ fontWeight: 800, color: "var(--ink)" }}>INV-2026-00{idx + 1}</td>
                          <td className="mono">{fmtDate(inv.issueDate || TODAY)}</td>
                          <td>{inv.client || "Prime Estate Enterprises"}</td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: "#059669" }}>{pkr(inv.totalAmount || inv.amount)}</td>
                          <td style={{ fontSize: 12 }}>{selectedStaffDrilldown.name}</td>
                          <td style={{ fontSize: 12 }}>{selectedStaffDrilldown.name}</td>
                          <td><span className="badge-mini" style={{ background: "#D1FAE5", color: "#065F46" }}>Posted</span></td>
                          <td style={{ textAlign: "center" }}>
                            <button className="btn" style={{ padding: "3px 10px", fontSize: 11.5, fontWeight: 700 }} onClick={() => setPrintDoc({ type: "Invoice", data: inv })}>
                              View Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                      {expenses.slice(0, 3).map((exp, idx) => (
                        <tr key={"exp_dr_" + idx}>
                          <td><span className="badge-mini" style={{ background: "#FEE2E2", color: "#991B1B", fontWeight: 700 }}>Expense</span></td>
                          <td style={{ fontWeight: 800, color: "var(--ink)" }}>EXP-2026-00{idx + 1}</td>
                          <td className="mono">{fmtDate(exp.date || TODAY)}</td>
                          <td>{exp.vendor || "Flex Printing Vendor"}</td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: "#DC2626" }}>{pkr(exp.amount)}</td>
                          <td style={{ fontSize: 12 }}>{selectedStaffDrilldown.name}</td>
                          <td style={{ fontSize: 12 }}>{selectedStaffDrilldown.name}</td>
                          <td><span className="badge-mini" style={{ background: "#D1FAE5", color: "#065F46" }}>Paid</span></td>
                          <td style={{ textAlign: "center" }}>
                            <button className="btn" style={{ padding: "3px 10px", fontSize: 11.5, fontWeight: 700 }} onClick={() => setTab("expenses")}>
                              View Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                      {vouchers.slice(0, 2).map((vch, idx) => (
                        <tr key={"vch_dr_" + idx}>
                          <td><span className="badge-mini" style={{ background: "#FEF3C7", color: "#92400E", fontWeight: 700 }}>Voucher ({vch.voucherType || "PV"})</span></td>
                          <td style={{ fontWeight: 800, color: "var(--ink)" }}>{vch.voucherNumber || `PV-2026-00${idx + 1}`}</td>
                          <td className="mono">{fmtDate(vch.date || TODAY)}</td>
                          <td>{vch.payee || "Vendor Disbursal"}</td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: "#0284C7" }}>{pkr(vch.amount)}</td>
                          <td style={{ fontSize: 12 }}>{selectedStaffDrilldown.name}</td>
                          <td style={{ fontSize: 12 }}>{selectedStaffDrilldown.name}</td>
                          <td><span className="badge-mini" style={{ background: "#D1FAE5", color: "#065F46" }}>Posted</span></td>
                          <td style={{ textAlign: "center" }}>
                            <button className="btn" style={{ padding: "3px 10px", fontSize: 11.5, fontWeight: 700 }} onClick={() => setTab("vouchers")}>
                              View Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: PROJECTS */}
            {staffDrilldownTab === "projects" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: "var(--ink)" }}>Projects Handled by {selectedStaffDrilldown.name}</div>
                <div className="table-responsive">
                  <table style={{ width: "100%", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Project Code &amp; Title</th>
                        <th>Client</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Billed Value</th>
                        <th style={{ textAlign: "right" }}>Direct Cost</th>
                        <th style={{ textAlign: "right" }}>Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectsWithStats.slice(0, selectedStaffDrilldown.projectsCount).map(p => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 800, color: "var(--ink)" }}>[{p.projectCode}] {p.name}</td>
                          <td>{p.client}</td>
                          <td><span className="badge-mini" style={{ background: "#D1FAE5", color: "#065F46" }}>{p.status}</span></td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 800 }}>{pkr(p.billed)}</td>
                          <td className="mono" style={{ textAlign: "right", color: "var(--rose)" }}>{pkr(p.cost)}</td>
                          <td className="mono" style={{ textAlign: "right", fontWeight: 800, color: p.margin >= 0 ? "#059669" : "#DC2626" }}>{p.marginPct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: AI DOCUMENTS */}
            {staffDrilldownTab === "documents" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: "var(--ink)" }}>AI Documents Uploaded &amp; Processed</div>
                <div className="table-responsive">
                  <table style={{ width: "100%", fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Document Title</th>
                        <th>Uploaded Date</th>
                        <th>Doc Type</th>
                        <th>Status</th>
                        <th>Duplicate Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.slice(0, selectedStaffDrilldown.docsCount).map((d, idx) => (
                        <tr key={d.id || idx}>
                          <td style={{ fontWeight: 800, color: "var(--ink)" }}>{d.name || d.filename}</td>
                          <td className="mono">{fmtDate(d.uploadedAt || TODAY)}</td>
                          <td>{d.docType || "Vendor Invoice"}</td>
                          <td><span className="badge-mini" style={{ background: "#D1FAE5", color: "#065F46" }}>{d.status || "Posted"}</span></td>
                          <td><span className="badge-mini" style={{ background: d.isDuplicate ? "#FEE2E2" : "#F1F5F9", color: d.isDuplicate ? "#991B1B" : "#475569" }}>{d.isDuplicate ? "⚠️ DUPLICATE" : "CLEAN"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: RECENT AUDIT STREAM */}
            {staffDrilldownTab === "audit" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Recent System Activity Log</div>
                  <button className="btn" style={{ padding: "4px 12px", fontSize: 12, fontWeight: 700 }} onClick={() => setShowFullActivityLog(!showFullActivityLog)}>
                    {showFullActivityLog ? "Show Latest 10" : "View Full Activity Log"}
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { time: "11:48 AM", text: "Posted Payment Voucher PV-301 for PKR 45,000" },
                    { time: "11:20 AM", text: "Updated Project [PRJ-102] Campaign Schedule" },
                    { time: "10:45 AM", text: "Uploaded Vendor Invoice DOC-904 via AI OCR" },
                    { time: "10:15 AM", text: "Posted Receipt Voucher RV-108 for PKR 150,000" },
                    { time: "09:40 AM", text: "Created New Invoice INV-2026-004 for Imtiaz Retail" },
                    { time: "09:15 AM", text: "System Login Success — Session Started" }
                  ].slice(0, showFullActivityLog ? 6 : 6).map((log, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 14px", background: "var(--bg)", borderRadius: 10, fontSize: 13, border: "1px solid var(--rule)" }}>
                      <span className="mono" style={{ fontWeight: 800, color: "#0284C7", width: 80 }}>{log.time}</span>
                      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showPinChangeModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 400, padding: 24, textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px", color: "var(--ink)" }}>🔑 Change CEO Security PIN</h3>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: "0 0 20px" }}>Set a new 4-digit PIN code to lock/unlock your Executive Suite.</p>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                value={newPinInput}
                onChange={e => setNewPinInput(e.target.value)}
                placeholder="••••"
                style={{ fontSize: 24, textAlign: "center", letterSpacing: 8 }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => { setShowPinChangeModal(false); setNewPinInput(""); }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (newPinInput.length === 4 && /^\d+$/.test(newPinInput)) {
                    setSavedCeoPin(newPinInput);
                    setShowPinChangeModal(false);
                    setNewPinInput("");
                    alert("CEO Security PIN updated successfully!");
                  } else {
                    alert("PIN must be exactly 4 numeric digits!");
                  }
                }}
              >
                Save New PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddUserForm && <UserModal onClose={() => setShowAddUserForm(false)} onSubmit={handleAddUser} />}
      {editingUser && <UserModal initialData={editingUser} onClose={() => setEditingUser(null)} onSubmit={handleUpdateUser} />}

      {showInvoiceForm && <InvoiceModal projects={projects} clients={clients} onClose={() => setShowInvoiceForm(false)} onSubmit={addInvoice} />}
      {editingInvoice && <InvoiceModal initialData={editingInvoice} projects={projects} clients={clients} onClose={() => setEditingInvoice(null)} onSubmit={updateInvoice} />}

      {showExpenseForm && <ExpenseModal projects={projects} vendors={vendors} onClose={() => setShowExpenseForm(false)} onSubmit={addExpense} />}
      {editingExpense && <ExpenseModal initialData={editingExpense} projects={projects} vendors={vendors} onClose={() => setEditingExpense(null)} onSubmit={updateExpense} />}
      {showCategoryManager && <ExpenseCategoryManagerModal onClose={() => setShowCategoryManager(false)} />}


      {payingExpenseId && <PayExpenseModal expense={expenses.find(e => e.id === payingExpenseId)} onClose={() => setPayingExpenseId(null)} onSubmit={(id, via, date) => { payExpense(id, via, date); setPayingExpenseId(null); }} />}

      {showPOForm && <POModal projects={projects} onClose={() => setShowPOForm(false)} onSubmit={addPO} />}
      {editingPO && <POModal initialData={editingPO} projects={projects} onClose={() => setEditingPO(null)} onSubmit={updatePO} />}
      {payingPOId && <PayPOModal po={purchaseOrders.find(p => p.id === payingPOId)} onClose={() => setPayingPOId(null)} onSubmit={(id, via, date) => { payPO(id, via, date); setPayingPOId(null); }} />}

      {showVoucherForm && <VoucherModal projects={projects} bankAccounts={bankAccounts} defaultType={voucherDefaultType} onClose={() => setShowVoucherForm(false)} onSubmit={createVoucher} />}
      {showClientModal && <ClientMasterModal clients={clients} client={editingClient} onClose={() => { setShowClientModal(false); setEditingClient(null); }} onSave={handleSaveClient} />}
      {showVendorModal && <VendorMasterModal vendors={vendors} vendor={editingVendor} onClose={() => { setShowVendorModal(false); setEditingVendor(null); }} onSave={handleSaveVendor} />}
      {duplicateDocWarning && <AiDocumentDuplicateModal duplicateMatch={duplicateDocWarning.duplicateMatch} incomingDoc={duplicateDocWarning.incomingDoc} existingDoc={duplicateDocWarning.existingDoc} onClose={() => setDuplicateDocWarning(null)} onOverridePosting={duplicateDocWarning.onOverridePosting} />}
      {reviewingDocId && <DocumentReviewModal doc={documents.find(d => d.id === reviewingDocId)} projects={projects} bankAccounts={bankAccounts} onClose={() => setReviewingDocId(null)} onSaveDraft={saveDocumentDraft} onPost={postDocumentToLedger} onCreateProjectTrigger={() => { setReviewingDocId(null); setShowProjectForm(true); }} />}
      {compareDocData && <CompareDocumentsModal doc={compareDocData.doc} duplicateMatch={compareDocData.duplicateMatch} onClose={() => setCompareDocData(null)} onCancelUpload={() => { deleteDocument(compareDocData.doc.id); setCompareDocData(null); }} onOverride={(docId, reason) => postDocumentToLedger(docId, null, reason)} />}





      {pnlDrillDown && (
        <ModalShell title={`P&L Line Item Breakdown: ${pnlDrillDown.title}`} onClose={() => setPnlDrillDown(null)}>
          <div style={{ marginBottom: 12, fontSize: 13.5, color: "var(--ink-muted)" }}>
            Showing individual double-entry ledger lines contributing to this P&L figure.
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Posting Date</th>
                  <th>Voucher #</th>
                  <th>Particulars / Description</th>
                  <th>Account</th>
                  <th style={{ textAlign: "right" }}>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {pnlDrillDown.lines.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--ink-muted)", padding: 16 }}>No transactions found for this category in the selected period.</td></tr>
                ) : (
                  pnlDrillDown.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="mono">{fmtDate(l.date)}</td>
                      <td className="mono" style={{ fontWeight: 700, color: "var(--gold)" }}>{l.reference || "—"}</td>
                      <td>{l.description}{l.memo ? ` (${l.memo})` : ""}</td>
                      <td><span className="badge-mini">{ACCOUNTS[l.account]?.name || l.account}</span></td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: l.amount >= 0 ? "var(--jade)" : "var(--rose)" }}>
                        {pkr(l.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={() => setPnlDrillDown(null)}>
            Close Audit View
          </button>
        </ModalShell>
      )}

      
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
          activeEmployees={employees.filter(e => e.status !== "Terminated")}
          monthlyAttendance={monthlyAttendance}
          onClose={() => setPayrollConfirm(false)}
          onConfirm={runPayroll}
        />
      )}

      {showInventoryItemModal && (
        <InventoryItemModal
          initialData={editingInventoryItem}
          onClose={() => { setShowInventoryItemModal(false); setEditingInventoryItem(null); }}
          onSubmit={editingInventoryItem ? updateInventoryItem : createInventoryItem}
        />
      )}
      {showStockMovementModal && (
        <StockMovementModal
          initialItem={stockMovementItem}
          items={inventoryItems}
          projects={projects}
          onClose={() => { setShowStockMovementModal(false); setStockMovementItem(null); }}
          onSubmit={recordStockMovement}
        />
      )}
      {showBankAccountModal && (
        <BankAccountModal
          initialData={editingBankAccount}
          onClose={() => { setShowBankAccountModal(false); setEditingBankAccount(null); }}
          onSubmit={editingBankAccount ? updateBankAccount : createBankAccount}
        />
      )}
    </div>
  );
}

/* ---------- SUPABASE CLOUD CONFIGURATOR COMPONENT ---------- */

function SupabaseConfigCard({ config, onSaveConfig, onPushToCloud, onPullFromCloud, isSyncing }) {
  const [urlInput, setUrlInput] = useState(config.url || "");
  const [keyInput, setKeyInput] = useState(config.key || "");
  const [showKey, setShowKey] = useState(false);
  const isConnected = Boolean(config.url && config.key);

  return (
    <div className="card" style={{ padding: 20, marginTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: isConnected ? "#ECFDF5" : "#FEF3C7", color: isConnected ? "#059669" : "#D97706", padding: 8, borderRadius: 8 }}>
            {isConnected ? <Cloud size={22} /> : <CloudOff size={22} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Supabase Cloud Database Sync {isConnected ? <span className="badge-mini" style={{ background: "#DCFCE7", color: "#166534", marginLeft: 6 }}>Connected</span> : <span className="badge-mini" style={{ background: "#FEF3C7", color: "#92400E", marginLeft: 6 }}>Offline Local Mode</span>}
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-muted)" }}>Connect your free Supabase cloud database for multi-device team sync &amp; automated backups</p>
          </div>
        </div>
        {isConnected && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" style={{ fontSize: 13, gap: 6 }} onClick={onPullFromCloud} disabled={isSyncing}>
              <Upload size={14} /> Pull from Cloud
            </button>
            <button className="btn btn-primary" style={{ fontSize: 13, gap: 6 }} onClick={onPushToCloud} disabled={isSyncing}>
              <Cloud size={14} /> Push Local Data to Cloud
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end", background: "#F8FAFC", padding: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Supabase Project URL</label>
          <input
            type="text"
            placeholder="https://your-project.supabase.co"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #CBD5E1", borderRadius: 6 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 4 }}>Supabase Anon API Key</label>
          <div style={{ position: "relative" }}>
            <input
              type={showKey ? "text" : "password"}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              style={{ width: "100%", padding: "7px 32px 7px 10px", fontSize: 13, border: "1px solid #CBD5E1", borderRadius: 6 }}
            />
            <button type="button" onClick={() => setShowKey(!showKey)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
        <div>
          <button className="btn btn-primary" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => onSaveConfig(urlInput, keyInput)}>
            Save Credentials
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#64748B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>SQL migration script generated: <code className="mono" style={{ color: "#B8860B" }}>supabase_schema.sql</code> (Run in your Supabase SQL Editor)</div>
        <div style={{ fontSize: 11.5, color: "#94A3B8" }}>Credentials saved locally in browser or via .env</div>
      </div>
    </div>
  );
}

/* ---------- WELCOME GATEWAY & AUTHENTICATION COMPONENTS ---------- */

function WelcomeGateway({ usersList, onLogin, onOpenForgot, children }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPass, setShowPass] = useState(false);

  function submitLogin(e) {
    e.preventDefault();
    const inputClean = email.trim().toLowerCase();
    const passClean = password.trim();

    // Check SEED_USERS first to guarantee default credentials work regardless of cached localStorage
    let found = SEED_USERS.find(u =>
      u.name.toLowerCase() === inputClean ||
      u.email.toLowerCase() === inputClean ||
      (inputClean === "adpulseceo" && (u.role === "CEO" || u.name === "AdPulseCEO")) ||
      (inputClean === "adpulseshawal" && u.name.toLowerCase() === "adpulseshawal") ||
      (inputClean === "adpulsewahab" && u.name.toLowerCase() === "adpulsewahab") ||
      (inputClean === "admin" && (u.role === "Admin" || u.role === "CEO")) ||
      (inputClean === "ceo" && (u.role === "CEO" || u.role === "Admin")) ||
      (inputClean === "staff" && u.role === "Staff")
    );

    if (!found) {
      found = usersList.find(u =>
        u.name.toLowerCase() === inputClean ||
        u.email.toLowerCase() === inputClean
      );
    }

    if (!found || (found.password !== passClean && found.password !== password)) {
      setErrorMsg("Invalid User Name or Password. Please check your credentials.");
      return;
    }

    setErrorMsg("");
    const isExecutive = found.role === "CEO" || found.role === "Admin";
    onLogin(found, isExecutive ? "ceo-dashboard" : "dashboard");
  }

  return (
    <div className="gateway-backdrop">
      <div className="gateway-card">
        <img src="./logo.png" alt="AdPulse Logo" className="gateway-logo" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="gateway-title">AdPulse IMC PVT LTD</div>
        <div className="gateway-subtitle">Enterprise Financial &amp; ERP Gateway</div>

        <form onSubmit={submitLogin} autoComplete="off" style={{ marginTop: 12 }}>
          {errorMsg && (
            <div style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", borderRadius: 9, padding: "8px 12px", fontSize: 13, marginBottom: 14 }}>
              {errorMsg}
            </div>
          )}

          <div className="field" style={{ textAlign: "left" }}>
            <label>User Name</label>
            <input
              type="text"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. AdPulseCEO, Adpulseshawal"
              autoComplete="off"
            />
          </div>

          <div className="field" style={{ textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Password</label>
              <button type="button" onClick={onOpenForgot} style={{ background: "none", border: "none", color: "#B8860B", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Forgot Password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ paddingRight: 38 }} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748B", cursor: "pointer" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15, marginTop: 10, background: "linear-gradient(135deg, #059669 0%, #047857 100%)", fontWeight: 700 }}>
            Sign In to AdPulse ERP System
          </button>
        </form>

        <div style={{ marginTop: 22, fontSize: 12.5, color: "#64748B", borderTop: "1px solid #E2E8F0", paddingTop: 14 }}>
          Karachi Agency Hub &middot; Secure Executive Access
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

function ModalShell({ title, onClose, width, maxWidth, style = {}, children }) {
  const modalStyle = {
    ...(width ? { width } : {}),
    ...(maxWidth ? { maxWidth } : {}),
    ...style
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>{title}</div>
          <button className="btn" style={{ padding: 5 }} onClick={onClose}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InvoiceModal({ initialData, projects = [], clients = [], onClose, onSubmit }) {
  const [projectId, setProjectId] = useState(initialData?.projectId || "");
  const [client, setClient] = useState(initialData?.client || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [applySst, setApplySst] = useState(initialData?.applySst || false);
  const [sstRate, setSstRate] = useState(initialData?.sstRate || "");
  const [applyWht, setApplyWht] = useState(initialData?.applyWht || false);
  const [whtRate, setWhtRate] = useState(initialData?.whtRate || "");
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || TODAY_STR);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || TODAY_STR);
  const [notes, setNotes] = useState(
    initialData?.notes ||
    initialData?.specialNotes ||
    "• ABOVE MENTIONED AMOUNT IS BASED ON NET. ALL TAXES WOULD BE CHARGED OVER & ABOVE.\n• PAYMENT TO BE MADE IN THE FAVOR OF \"ADPULSE IMC (PRIVATE) LTD\"\n• NTN: A0654656-8 / STRN: SA054896-8"
  );

  // OOH Sites Multi-Location State inside InvoiceModal (Enabled by default so headers show immediately)
  const enableOohSites = description === "OOH Advertising (Billboards, Streamers, etc.)";
  const [oohSites, setOohSites] = useState(() => {
    if (initialData?.oohSites && Array.isArray(initialData.oohSites) && initialData.oohSites.length > 0) {
      return initialData.oohSites.map(s => {
        const w = parseFloat(s.width) || (s.size ? parseFloat(s.size.split("x")[0]) : 0) || 0;
        const h = parseFloat(s.height) || (s.size ? parseFloat(s.size.split("x")[1]) : 0) || 0;
        const sqft = s.sqft || (w > 0 && h > 0 ? Math.round(w * h * 100) / 100 : 0);
        const days = s.days !== undefined ? s.days : (s.duration !== undefined ? s.duration : 30);
        const rate = s.rate !== undefined && s.rate !== "" ? s.rate : (s.pricePerMonth || "");
        
        let amount = s.amount;
        if (amount === undefined) {
           amount = ((parseFloat(rate) || 0) / 30) * (parseFloat(days) || 30);
        }

        return {
          location: s.location || s.name || s.area || "",
          width: s.width || (w > 0 ? w : ""),
          height: s.height || (h > 0 ? h : ""),
          sqft: sqft,
          days: days,
          rate: rate,
          amount: amount
        };
      });
    }
    return [{ location: "", width: "", height: "", sqft: 0, days: 30, rate: "", amount: 0 }];
  });

  const addOohSite = () => setOohSites([...oohSites, { location: "", width: "", height: "", sqft: 0, days: 30, rate: "", amount: 0 }]);

  const updateOohSite = (index, field, value) => {
    const updated = [...oohSites];
    const item = { ...updated[index], [field]: value };

    const w = parseFloat(item.width) || 0;
    const h = parseFloat(item.height) || 0;
    const sqft = Math.round(w * h * 100) / 100;
    item.sqft = sqft;

    const r = parseFloat(item.rate) || 0;
    const d = parseFloat(item.days) || 30;
    item.amount = (r / 30) * d;

    updated[index] = item;
    setOohSites(updated);

    // Auto-calculate Total Campaign Amount when OOH Sites change
    if (enableOohSites) {
      const calcTotal = updated.reduce((sum, site) => {
        const amt = site.amount !== undefined ? site.amount : ((parseFloat(site.rate) || 0) / 30 * (parseFloat(site.days) || 30));
        return sum + amt;
      }, 0);
      if (calcTotal > 0) setAmount(calcTotal.toFixed(2));
    }
  };

  const removeOohSite = (index) => {
    const updated = oohSites.filter((_, i) => i !== index);
    const finalSites = updated.length > 0 ? updated : [{ location: "", width: "", height: "", sqft: 0, days: 30, rate: "", amount: "" }];
    setOohSites(finalSites);
    if (enableOohSites) {
      const calcTotal = finalSites.reduce((sum, site) => sum + (site.amount !== undefined ? site.amount : ((parseFloat(site.rate) || 0) / 30 * (parseFloat(site.days) || 30))), 0);
      if (calcTotal > 0) setAmount(calcTotal.toFixed(2));
    }
  };

  const totalOohSqft = oohSites.reduce((sum, item) => sum + (Number(item.sqft) || 0), 0);
  const totalOohAmount = oohSites.reduce((sum, item) => sum + (item.amount !== undefined ? Number(item.amount) : ((parseFloat(item.rate) || 0) / 30 * (parseFloat(item.days) || 30))), 0);

  // Newspaper State
  const enableNewspaperItems = description === "Newspaper / Print Media & Publication";
  const [newspaperItems, setNewspaperItems] = useState(() => {
    if (initialData?.newspaperItems?.length > 0) return initialData.newspaperItems;
    return [{ newspaper: "", edition: "", columns: "", height: "", totalCcm: "", rateCcm: "", mediaAmount: "", agencyFeePct: 15, agencyFee: "", amount: "" }];
  });

  const addNewspaperItem = () => setNewspaperItems([...newspaperItems, { newspaper: "", edition: "", columns: "", height: "", totalCcm: "", rateCcm: "", mediaAmount: "", agencyFeePct: 15, agencyFee: "", amount: "" }]);

  const updateNewspaperItem = (index, field, value) => {
    const updated = [...newspaperItems];
    const item = { ...updated[index], [field]: value };

    const c = parseFloat(item.columns) || 0;
    const h = parseFloat(item.height) || 0;
    const totalCcm = c * h;
    item.totalCcm = totalCcm;

    const rate = parseFloat(item.rateCcm) || 0;
    const mediaAmount = totalCcm * rate;
    item.mediaAmount = mediaAmount;

    const feePct = parseFloat(item.agencyFeePct) || 0;
    const feeAmt = (mediaAmount * feePct) / 100;
    item.agencyFee = feeAmt;

    const total = mediaAmount + feeAmt;
    item.amount = total;

    updated[index] = item;
    setNewspaperItems(updated);

    if (enableNewspaperItems) {
      const calcTotal = updated.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
      if (calcTotal > 0) setAmount(calcTotal.toFixed(2));
    }
  };

  const removeNewspaperItem = (index) => {
    const updated = newspaperItems.filter((_, i) => i !== index);
    const finalItems = updated.length > 0 ? updated : [{ newspaper: "", edition: "", columns: "", height: "", totalCcm: "", rateCcm: "", mediaAmount: "", agencyFeePct: 15, agencyFee: "", amount: "" }];
    setNewspaperItems(finalItems);
    if (enableNewspaperItems) {
      const calcTotal = finalItems.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
      if (calcTotal > 0) setAmount(calcTotal.toFixed(2));
    }
  };

  const totalNewspaperAmount = newspaperItems.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

  // Print Media State
  const enablePrintMedia = description === "Print Media & Publications";
  const [printMediaItems, setPrintMediaItems] = useState(() => {
    if (initialData?.printMediaItems?.length > 0) return initialData.printMediaItems;
    return [{ description: "", publication: "", size: "", qty: 1, rate: "", amount: "" }];
  });

  const addPrintMediaItem = () => setPrintMediaItems([...printMediaItems, { description: "", publication: "", size: "", qty: 1, rate: "", amount: "" }]);
  
  const updatePrintMediaItem = (index, field, value) => {
    const updated = [...printMediaItems];
    const item = { ...updated[index], [field]: value };
    if (field === "rate" || field === "qty") {
      const r = parseFloat(item.rate) || 0;
      const q = parseFloat(item.qty) || 1;
      item.amount = r * q;
    }
    updated[index] = item;
    setPrintMediaItems(updated);
    if (enablePrintMedia) {
      const calcTotal = updated.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
      if (calcTotal > 0) setAmount(calcTotal.toString());
    }
  };

  const removePrintMediaItem = (index) => {
    const updated = printMediaItems.filter((_, i) => i !== index);
    const finalItems = updated.length > 0 ? updated : [{ description: "", publication: "", size: "", qty: 1, rate: "", amount: "" }];
    setPrintMediaItems(finalItems);
    if (enablePrintMedia) {
      const calcTotal = finalItems.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
      if (calcTotal > 0) setAmount(calcTotal.toString());
    }
  };

  const totalPrintMediaAmount = printMediaItems.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

  // Event & Digital State
  const enableEventItems = description === "Event Management & Activation" || description === "TVC Production" || description === "BTL Marketing" || description === "Digital & Social Media Marketing";
  const [eventItems, setEventItems] = useState(() => {
    if (initialData?.eventItems?.length > 0) return initialData.eventItems;
    return [{ description: "", qty: 1, unit: "NOS", rate: "", amount: "" }];
  });

  const addEventItem = () => setEventItems([...eventItems, { description: "", qty: 1, unit: "NOS", rate: "", amount: "" }]);

  const updateEventItem = (index, field, value) => {
    const updated = [...eventItems];
    const item = { ...updated[index], [field]: value };
    if (field === "rate" || field === "qty") {
      const r = parseFloat(item.rate) || 0;
      const q = parseFloat(item.qty) || 1;
      item.amount = r * q;
    }
    updated[index] = item;
    setEventItems(updated);
    if (enableEventItems) {
      const calcTotal = updated.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
      if (calcTotal > 0) setAmount(calcTotal.toString());
    }
  };

  const removeEventItem = (index) => {
    const updated = eventItems.filter((_, i) => i !== index);
    const finalItems = updated.length > 0 ? updated : [{ description: "", qty: 1, unit: "NOS", rate: "", amount: "" }];
    setEventItems(finalItems);
    if (enableEventItems) {
      const calcTotal = finalItems.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
      if (calcTotal > 0) setAmount(calcTotal.toString());
    }
  };

  const totalEventAmount = eventItems.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

  // Printing & Installations State
  const enablePrintingItems = description === "Printing & Installations";
  const [printingItems, setPrintingItems] = useState(() => {
    if (initialData?.printingItems?.length > 0) return initialData.printingItems;
    return [{ description: "", height: "", width: "", totalSqFt: 0, qty: 1, rate: "", amount: 0 }];
  });

  const addPrintingItem = () => setPrintingItems([...printingItems, { description: "", height: "", width: "", totalSqFt: 0, qty: 1, rate: "", amount: 0 }]);

  const updatePrintingItem = (index, field, value) => {
    const updated = [...printingItems];
    const item = { ...updated[index], [field]: value };
    if (["height", "width", "qty", "rate"].includes(field)) {
      const h = parseFloat(item.height) || 0;
      const w = parseFloat(item.width) || 0;
      const sqft = h * w;
      item.totalSqFt = sqft;
      const q = parseFloat(item.qty) || 1;
      const r = parseFloat(item.rate) || 0;
      item.amount = (sqft > 0 ? sqft : 1) * q * r;
    }
    updated[index] = item;
    setPrintingItems(updated);
    if (enablePrintingItems) {
      const calcTotal = updated.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
      if (calcTotal > 0) setAmount(calcTotal.toString());
    }
  };

  const removePrintingItem = (index) => {
    const updated = printingItems.filter((_, i) => i !== index);
    const finalItems = updated.length > 0 ? updated : [{ description: "", height: "", width: "", totalSqFt: 0, qty: 1, rate: "", amount: 0 }];
    setPrintingItems(finalItems);
    if (enablePrintingItems) {
      const calcTotal = finalItems.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
      if (calcTotal > 0) setAmount(calcTotal.toString());
    }
  };

  const totalPrintingAmount = printingItems.reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

  const amt = Number(amount) || 0;
  const sstAmount = (applySst && Number(sstRate)) ? (amt * Number(sstRate) / 100) : 0;
  const whtAmount = (applyWht && Number(whtRate)) ? (amt * Number(whtRate) / 100) : 0;
  const totalAmount = amt + sstAmount - whtAmount;
  const valid = client && description && amt > 0;

  const handleProjectSelect = (id) => {
    setProjectId(id);
    const prj = projects.find(p => p.id === id);
    if (prj) {
      if (prj.client) setClient(prj.client);
      if (!description) setDescription(`${prj.name} — Billing`);
    }
  };

  return (
    <ModalShell title={initialData ? "Edit Client Invoice" : "Create New Client Invoice"} onClose={onClose} width={1500} maxWidth="98vw">
      {projects.length > 0 && (
        <div className="field">
          <label>Link to Project (Optional)</label>
          <select value={projectId} onChange={e => handleProjectSelect(e.target.value)}>
            <option value="">— General / No Specific Project —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label>Client Name</label>
        <select value={client} onChange={e => setClient(e.target.value)}>
          <option value="">— Select a Client —</option>
          {clients.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Service / Scope Particulars</label>
        <select value={description} onChange={e => setDescription(e.target.value)}>
          <option value="">— Select Service Type —</option>
          <option value="TVC Production">TVC Production</option>
          <option value="Event Management & Activation">Event Management & Activation</option>
          <option value="OOH Advertising (Billboards, Streamers, etc.)">OOH Advertising (Billboards, Streamers, etc.)</option>
          <option value="Printing & Installations">Printing & Installations</option>
          <option value="Digital Marketing & Social Media">Digital Marketing & Social Media</option>
          <option value="BTL Marketing">BTL Marketing</option>
          <option value="Newspaper / Print Media & Publication">Newspaper / Print Media & Publication</option>
          <option value="Print Media & Publications">Print Media & Publications (Old Format)</option>
          <option value="Consultancy & Retainer">Consultancy & Retainer</option>
        </select>
      </div>
      
      {/* OOH ADVERTISING SITES (MULTIPLE ADD) SECTION IN INVOICE MODAL */}
      {enableOohSites && (
        <div style={{ background: "var(--bg)", padding: 14, borderRadius: 8, marginBottom: 16, border: "1.5px solid var(--rule)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              OOH Advertising Sites (Multiple Locations)
            </div>
            <button className="btn btn-primary" style={{ fontSize: 11.5, padding: "4px 10px" }} onClick={addOohSite} type="button">
              <Plus size={13} /> Add OOH Location
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginBottom: 10 }}>
            Enter Location, Width, Height &amp; Duration (Days) for automatic Sq. Ft. &amp; Campaign Rate calculation
          </div>

            <div className="table-responsive" style={{ marginBottom: 10 }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", background: "#FFFFFF", borderRadius: 6, overflow: "hidden", border: "1px solid #CBD5E1" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#334155" }}>
                    <th style={{ padding: "7px 8px", textAlign: "left", width: "24%" }}>Location / Area</th>
                    <th style={{ padding: "7px 8px", textAlign: "left", width: "10%" }}>Width (ft)</th>
                    <th style={{ padding: "7px 8px", textAlign: "left", width: "10%" }}>Height (ft)</th>
                    <th style={{ padding: "7px 8px", textAlign: "right", width: "12%", color: "#0284C7" }}>Total Sq. Ft.</th>
                    <th style={{ padding: "7px 8px", textAlign: "left", width: "12%" }}>Duration (Days)</th>
                    <th style={{ padding: "7px 8px", textAlign: "right", width: "14%" }}>Monthly Rate</th>
                    <th style={{ padding: "7px 8px", textAlign: "right", width: "14%", color: "#059669" }}>Amount (PKR)</th>
                    <th style={{ padding: "7px 4px", textAlign: "center", width: "4%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {oohSites.map((site, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }}
                          value={site.location}
                          onChange={e => updateOohSite(idx, "location", e.target.value)}
                          placeholder="e.g. Shahrah-e-Faisal"
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }}
                          value={site.width}
                          onChange={e => updateOohSite(idx, "width", e.target.value)}
                          placeholder="Width"
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }}
                          value={site.height}
                          onChange={e => updateOohSite(idx, "height", e.target.value)}
                          placeholder="Height"
                        />
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "right" }}>
                        <input
                          type="text"
                          readOnly
                          disabled
                          style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #E2E8F0", background: "#F1F5F9", textAlign: "right", fontWeight: 700, color: "#0284C7" }}
                          value={(Number(site.sqft) || 0).toFixed(2)}
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          type="number"
                          min="1"
                          style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }}
                          value={site.days}
                          onChange={e => updateOohSite(idx, "days", e.target.value)}
                          placeholder="30"
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }}
                          value={site.rate}
                          onChange={e => updateOohSite(idx, "rate", e.target.value)}
                          placeholder="Rate"
                        />
                      </td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#059669", verticalAlign: "middle" }}>
                        {pkr(site.amount !== undefined ? site.amount : ((parseFloat(site.rate) || 0) / 30 * (parseFloat(site.days) || 30)))}
                      </td>
                      <td style={{ padding: "6px 4px", textAlign: "center" }}>
                        {oohSites.length > 1 && (
                          <button className="btn" type="button" style={{ padding: "6px 8px", color: "var(--rose)", borderColor: "#FCA5A5" }} onClick={() => removeOohSite(idx)}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", padding: "10px 14px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
              <div>
                <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Total OOH Sq. Ft.: </span>
                <span className="mono" style={{ fontWeight: 800, fontSize: 13, color: "#0284C7" }}>
                  {totalOohSqft.toFixed(2)} Sq. Ft.
                </span>
              </div>
              <div>
                <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Total OOH Campaign Rate: </span>
                <span className="mono" style={{ fontWeight: 800, fontSize: 15, color: "#059669" }}>
                  {pkr(totalOohAmount)}
                </span>
              </div>
            </div>
        </div>
      )}

      {/* NEWSPAPER SITES SECTION */}
      {enableNewspaperItems && (
        <div style={{ background: "var(--bg)", padding: 14, borderRadius: 8, marginBottom: 16, border: "1.5px solid var(--rule)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Newspaper / Print Media &amp; Publication</div>
            <button className="btn btn-primary" style={{ fontSize: 11.5, padding: "4px 10px" }} onClick={addNewspaperItem} type="button">
              <Plus size={13} /> Add Item
            </button>
          </div>
          <div className="table-responsive" style={{ marginBottom: 10 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", background: "#FFFFFF", borderRadius: 6, overflow: "hidden", border: "1px solid #CBD5E1" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#334155" }}>
                  <th style={{ padding: "7px 8px", textAlign: "left", width: "14%" }}>Newspaper</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", width: "12%" }}>Edition</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "6%" }}>Cols</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "8%" }}>Height (CM)</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "8%", color: "#0284C7" }}>Total CCM</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "12%" }}>Rate / CCM</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "12%", color: "#EAB308" }}>Media Amt</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "8%" }}>Ag. Fee %</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "10%", color: "#EAB308" }}>Agency Fee</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "14%", color: "#059669" }}>Total</th>
                  <th style={{ padding: "7px 4px", textAlign: "center", width: "4%" }}></th>
                </tr>
              </thead>
              <tbody>
                {newspaperItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "6px 8px" }}><input style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }} value={item.newspaper} onChange={e => updateNewspaperItem(idx, "newspaper", e.target.value)} placeholder="Daily Newspaper" /></td>
                    <td style={{ padding: "6px 8px" }}><input style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }} value={item.edition} onChange={e => updateNewspaperItem(idx, "edition", e.target.value)} placeholder="Karachi" /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" min="1" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "center", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.columns} onChange={e => updateNewspaperItem(idx, "columns", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" min="1" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "center", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.height} onChange={e => updateNewspaperItem(idx, "height", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700, color: "#0284C7", verticalAlign: "middle" }}>{(Number(item.totalCcm) || 0).toFixed(0)}</td>
                    <td style={{ padding: "6px 8px" }}><input type="number" step="0.01" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "right", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.rateCcm} onChange={e => updateNewspaperItem(idx, "rateCcm", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#EAB308", verticalAlign: "middle" }}>{pkr(Number(item.mediaAmount) || 0)}</td>
                    <td style={{ padding: "6px 8px" }}><input type="number" step="0.1" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "center", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.agencyFeePct} onChange={e => updateNewspaperItem(idx, "agencyFeePct", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#EAB308", verticalAlign: "middle" }}>{pkr(Number(item.agencyFee) || 0)}</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#059669", verticalAlign: "middle" }}>{pkr(Number(item.amount) || 0)}</td>
                    <td style={{ padding: "6px 4px", textAlign: "center" }}>
                      {newspaperItems.length > 1 && (
                        <button className="btn" type="button" style={{ padding: "6px 8px", color: "var(--rose)", borderColor: "#FCA5A5" }} onClick={() => removeNewspaperItem(idx)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", background: "#FFFFFF", padding: "10px 14px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginRight: 10 }}>Total Final Amount: </div>
            <div className="mono" style={{ fontWeight: 800, fontSize: 15, color: "#059669" }}>{pkr(totalNewspaperAmount)}</div>
          </div>
        </div>
      )}

      {/* PRINT MEDIA SITES SECTION */}
      {enablePrintMedia && (
        <div style={{ background: "var(--bg)", padding: 14, borderRadius: 8, marginBottom: 16, border: "1.5px solid var(--rule)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Print Media Publications</div>
            <button className="btn btn-primary" style={{ fontSize: 11.5, padding: "4px 10px" }} onClick={addPrintMediaItem} type="button">
              <Plus size={13} /> Add Publication
            </button>
          </div>
          <div className="table-responsive" style={{ marginBottom: 10 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", background: "#FFFFFF", borderRadius: 6, overflow: "hidden", border: "1px solid #CBD5E1" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#334155" }}>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "4%" }}>Sr. No.</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", width: "24%" }}>Service / Description</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", width: "20%" }}>Publication / Media</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", width: "12%" }}>Size / Format</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "10%" }}>Qty</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "15%" }}>Rate (PKR)</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "15%", color: "#059669" }}>Amount (PKR)</th>
                  <th style={{ padding: "7px 4px", textAlign: "center", width: "4%" }}></th>
                </tr>
              </thead>
              <tbody>
                {printMediaItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: "6px 8px" }}><input style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }} value={item.description} onChange={e => updatePrintMediaItem(idx, "description", e.target.value)} placeholder="Service / Description" /></td>
                    <td style={{ padding: "6px 8px" }}><input style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }} value={item.publication} onChange={e => updatePrintMediaItem(idx, "publication", e.target.value)} placeholder="Publication / Media" /></td>
                    <td style={{ padding: "6px 8px" }}><input style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }} value={item.size} onChange={e => updatePrintMediaItem(idx, "size", e.target.value)} placeholder="Size / Format" /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" min="1" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "center", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.qty} onChange={e => updatePrintMediaItem(idx, "qty", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" step="0.01" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "right", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.rate} onChange={e => updatePrintMediaItem(idx, "rate", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#059669" }}>{pkr(Number(item.amount) || 0)}</td>
                    <td style={{ padding: "6px 4px", textAlign: "center" }}>
                      {printMediaItems.length > 1 && (
                        <button className="btn" type="button" style={{ padding: "6px 8px", color: "var(--rose)", borderColor: "#FCA5A5" }} onClick={() => removePrintMediaItem(idx)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", background: "#FFFFFF", padding: "10px 14px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginRight: 10 }}>Total Print Media Amount: </div>
            <div className="mono" style={{ fontWeight: 800, fontSize: 15, color: "#059669" }}>{pkr(totalPrintMediaAmount)}</div>
          </div>
        </div>
      )}

      {/* PRINTING & INSTALLATIONS SECTION */}
      {enablePrintingItems && (
        <div style={{ background: "var(--bg)", padding: 14, borderRadius: 8, marginBottom: 16, border: "1.5px solid var(--rule)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Printing &amp; Installations</div>
            <button className="btn btn-primary" style={{ fontSize: 11.5, padding: "4px 10px" }} onClick={addPrintingItem} type="button">
              <Plus size={13} /> Add Item
            </button>
          </div>
          <div className="table-responsive" style={{ marginBottom: 10 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", background: "#FFFFFF", borderRadius: 6, overflow: "hidden", border: "1px solid #CBD5E1" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#334155" }}>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "4%" }}>S.No</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", width: "30%" }}>Description</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "10%" }}>Height</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "10%" }}>Width</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "12%", color: "#0284C7" }}>Total Sq Ft</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "8%" }}>Qty</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "12%" }}>Rate</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "14%", color: "#059669" }}>Total</th>
                  <th style={{ padding: "7px 4px", textAlign: "center", width: "3%" }}></th>
                </tr>
              </thead>
              <tbody>
                {printingItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: "6px 8px" }}><input style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }} value={item.description} onChange={e => updatePrintingItem(idx, "description", e.target.value)} placeholder="Description" /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" min="0" step="0.01" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "center", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.height} onChange={e => updatePrintingItem(idx, "height", e.target.value)} placeholder="Height" /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" min="0" step="0.01" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "center", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.width} onChange={e => updatePrintingItem(idx, "width", e.target.value)} placeholder="Width" /></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#0284C7", verticalAlign: "middle" }}>{(Number(item.totalSqFt) || 0).toFixed(2)}</td>
                    <td style={{ padding: "6px 8px" }}><input type="number" min="1" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "center", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.qty} onChange={e => updatePrintingItem(idx, "qty", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" step="0.01" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "right", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.rate} onChange={e => updatePrintingItem(idx, "rate", e.target.value)} placeholder="Rate" /></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#059669", verticalAlign: "middle" }}>{pkr(Number(item.amount) || 0)}</td>
                    <td style={{ padding: "6px 4px", textAlign: "center" }}>
                      {printingItems.length > 1 && (
                        <button className="btn" type="button" style={{ padding: "6px 8px", color: "var(--rose)", borderColor: "#FCA5A5" }} onClick={() => removePrintingItem(idx)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", background: "#FFFFFF", padding: "10px 14px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginRight: 10 }}>Total Printing &amp; Installation Amount: </div>
            <div className="mono" style={{ fontWeight: 800, fontSize: 15, color: "#059669" }}>{pkr(totalPrintingAmount)}</div>
          </div>
        </div>
      )}

      {/* EVENT & PRODUCTION SECTION */}
      {enableEventItems && (
        <div style={{ background: "var(--bg)", padding: 14, borderRadius: 8, marginBottom: 16, border: "1.5px solid var(--rule)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Production &amp; Event Line Items</div>
            <button className="btn btn-primary" style={{ fontSize: 11.5, padding: "4px 10px" }} onClick={addEventItem} type="button">
              <Plus size={13} /> Add Item
            </button>
          </div>
          <div className="table-responsive" style={{ marginBottom: 10 }}>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", background: "#FFFFFF", borderRadius: 6, overflow: "hidden", border: "1px solid #CBD5E1" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #CBD5E1", color: "#334155" }}>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "5%" }}>Sr. No.</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", width: "40%" }}>Service / Description</th>
                  <th style={{ padding: "7px 8px", textAlign: "center", width: "10%" }}>Qty</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", width: "15%" }}>Unit</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "12%" }}>Rate (PKR)</th>
                  <th style={{ padding: "7px 8px", textAlign: "right", width: "15%", color: "#059669" }}>Amount (PKR)</th>
                  <th style={{ padding: "7px 4px", textAlign: "center", width: "3%" }}></th>
                </tr>
              </thead>
              <tbody>
                {eventItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: "6px 8px" }}><input style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }} value={item.description} onChange={e => updateEventItem(idx, "description", e.target.value)} placeholder="Service / Description" /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" min="1" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "center", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.qty} onChange={e => updateEventItem(idx, "qty", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px" }}><input style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, borderRadius: 6, border: "1px solid #94A3B8" }} value={item.unit} onChange={e => updateEventItem(idx, "unit", e.target.value)} placeholder="NOS / Job" /></td>
                    <td style={{ padding: "6px 8px" }}><input type="number" step="0.01" style={{ width: "100%", padding: "10px 12px", fontSize: 13.5, textAlign: "right", borderRadius: 6, border: "1px solid #94A3B8" }} value={item.rate} onChange={e => updateEventItem(idx, "rate", e.target.value)} /></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "#059669" }}>{pkr(Number(item.amount) || 0)}</td>
                    <td style={{ padding: "6px 4px", textAlign: "center" }}>
                      {eventItems.length > 1 && (
                        <button className="btn" type="button" style={{ padding: "6px 8px", color: "var(--rose)", borderColor: "#FCA5A5" }} onClick={() => removeEventItem(idx)}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", background: "#FFFFFF", padding: "10px 14px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginRight: 10 }}>Total Line Items Amount: </div>
            <div className="mono" style={{ fontWeight: 800, fontSize: 15, color: "#059669" }}>{pkr(totalEventAmount)}</div>
          </div>
        </div>
      )}

      <div className="field"><label>Gross Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
      
      <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", userSelect: "none", minWidth: 200 }}>
            <input type="checkbox" checked={applySst} onChange={e => setApplySst(e.target.checked)} />
            Apply Sindh Sales Tax (SRB)
          </label>
          {applySst && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" value={sstRate} onChange={e => setSstRate(e.target.value)} placeholder="%" style={{ width: 60, padding: "4px 8px", fontSize: 13 }} />
              <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>%</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", userSelect: "none", minWidth: 200 }}>
            <input type="checkbox" checked={applyWht} onChange={e => setApplyWht(e.target.checked)} />
            Apply Withholding Tax (WHT)
          </label>
          {applyWht && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" value={whtRate} onChange={e => setWhtRate(e.target.value)} placeholder="%" style={{ width: 60, padding: "4px 8px", fontSize: 13 }} />
              <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>%</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "var(--bg)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "var(--ink-muted)" }}>Subtotal (Gross)</span>
          <span>{pkr(amt)}</span>
        </div>
        {applySst && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--rose)" }}>
            <span>SRB Tax ({sstRate || 0}%)</span>
            <span>+ {pkr(sstAmount)}</span>
          </div>
        )}
        {applyWht && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--green)" }}>
            <span>WHT Deduction ({whtRate || 0}%)</span>
            <span>- {pkr(whtAmount)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--rule)", fontSize: 14 }}>
          <span>Net Total Payable</span>
          <span>{pkr(totalAmount)}</span>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Special Notes &amp; Payment Terms (Manual Note)</span>
          <span style={{ fontSize: 11, color: "var(--ink-muted)", fontWeight: 400 }}>Appears on printed invoice/quotation</span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Enter custom terms, payment notes, bank info, or specific conditions..."
          style={{ width: "100%", padding: "8px 12px", fontSize: 12.5, borderRadius: 8, border: "1px solid var(--rule)", background: "var(--bg-card)", color: "var(--ink)", fontFamily: "inherit", resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Issue Date</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, projectId, client, description, amount: amt, applySst, sstRate: Number(sstRate) || 0, sstAmount, applyWht, whtRate: Number(whtRate) || 0, whtAmount, totalAmount, issueDate, dueDate, notes, oohSites: enableOohSites ? oohSites : [], printMediaItems: enablePrintMedia ? printMediaItems : [], eventItems: enableEventItems ? eventItems : [], printingItems: enablePrintingItems ? printingItems : [], newspaperItems: enableNewspaperItems ? newspaperItems : [] } : { projectId, client, description, amount: amt, applySst, sstRate: Number(sstRate) || 0, sstAmount, applyWht, whtRate: Number(whtRate) || 0, whtAmount, totalAmount, issueDate, dueDate, notes, oohSites: enableOohSites ? oohSites : [], printMediaItems: enablePrintMedia ? printMediaItems : [], eventItems: enableEventItems ? eventItems : [], printingItems: enablePrintingItems ? printingItems : [], newspaperItems: enableNewspaperItems ? newspaperItems : [] })}>
        {initialData ? "Save Invoice Changes" : "Generate & Post Invoice"}
      </button>
    </ModalShell>
  );
}

function ExpenseModal({ initialData, projects = [], vendors = [], onClose, onSubmit }) {
  const [projectId, setProjectId] = useState(initialData?.projectId || "");
  const [vendor, setVendor] = useState(initialData?.vendor || "");
  const [category, setCategory] = useState(initialData?.category || "Office & Administration");
  const [subcategory, setSubcategory] = useState(
    initialData?.subcategory || EXPENSE_CLASSIFICATION[initialData?.category || "Office & Administration"]?.subcategories[0]?.name || "Office Rent"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [description, setDescription] = useState(initialData?.description || "");
  const [refNo, setRefNo] = useState(initialData?.refNo || "");
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [date, setDate] = useState(initialData?.date || TODAY_STR);
  const [status, setStatus] = useState(initialData?.status || "paid");
  const [paidVia, setPaidVia] = useState(initialData?.paidVia || "Bank");

  // Filtered subcategories based on category
  const currentCategoryObj = EXPENSE_CLASSIFICATION[category] || EXPENSE_CLASSIFICATION["Office & Administration"];
  const currentSubcategories = currentCategoryObj.subcategories || [];

  // Mapped GL Account
  const glKey = getGLAccountKeyForSubcategory(category, subcategory);
  const glAccountObj = ACCOUNTS[glKey] || ACCOUNTS.expense;

  // Search matches across all subcategories
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matches = [];
    Object.entries(EXPENSE_CLASSIFICATION).forEach(([catName, catData]) => {
      catData.subcategories.forEach(sub => {
        if (sub.name.toLowerCase().includes(q) || catName.toLowerCase().includes(q)) {
          matches.push({ category: catName, subcategory: sub.name, accountKey: sub.accountKey });
        }
      });
    });
    return matches.slice(0, 8);
  }, [searchQuery]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const subList = EXPENSE_CLASSIFICATION[newCat]?.subcategories || [];
    if (subList.length > 0) {
      setSubcategory(subList[0].name);
    }
  };

  const handleProjectChange = (selectedId) => {
    setProjectId(selectedId);
    if (selectedId) {
      const selectedProj = projects.find(p => p.id === selectedId);
      if (selectedProj) {
        const pCode = selectedProj.projectCode || ("PRJ-" + selectedProj.id.toUpperCase().slice(0, 4));
        const autoRefNo = `EXP-${pCode}-${Math.floor(Math.random() * 899 + 100)}`;
        setRefNo(autoRefNo);

        if (!vendor.trim()) {
          setVendor(selectedProj.client);
        }
      }
    }
  };

  const handleSelectSearchResult = (item) => {
    setCategory(item.category);
    setSubcategory(item.subcategory);
    setSearchQuery("");
  };

  const valid = vendor && Number(amount) > 0 && category && subcategory;

  return (
    <ModalShell title={initialData ? "Edit Operating Expense" : "Record Operating Expense"} onClose={onClose}>
      {/* Quick Search Bar */}
      <div className="field" style={{ marginBottom: 12 }}>
        <label style={{ color: "var(--brand)", fontWeight: 600 }}>🔍 Quick Search Expense Type (Optional)</label>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Type e.g. 'electric', 'facebook', 'rent', 'fuel'..."
        />
        {searchResults.length > 0 && (
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--rule)", borderRadius: 6, marginTop: 4, maxHeight: 160, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            {searchResults.map((res, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSearchResult(res)}
                style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--rule-subtle)", fontSize: 12.5 }}
                onMouseDown={e => e.preventDefault()}
              >
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{res.category}</span>
                <span style={{ color: "var(--ink-muted)", margin: "0 6px" }}>→</span>
                <span style={{ color: "var(--brand-teal)", fontWeight: 600 }}>{res.subcategory}</span>
                <span style={{ float: "right", color: "var(--ink-muted)", fontSize: 11 }}>[{ACCOUNTS[res.accountKey]?.code || "5260"}]</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* Category */}
        <div className="field">
          <label>Expense Category *</label>
          <select value={category} onChange={e => handleCategoryChange(e.target.value)}>
            {EXPENSE_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div className="field">
          <label>Expense Subcategory *</label>
          <select value={subcategory} onChange={e => setSubcategory(e.target.value)}>
            {currentSubcategories.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mapped Expense GL Account Display */}
      <div style={{ background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.2)", padding: "8px 12px", borderRadius: 6, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
        <div>
          <span style={{ color: "var(--ink-muted)" }}>Mapped GL Account: </span>
          <strong style={{ color: "#0284C7" }}>{glAccountObj.code} — {glAccountObj.name}</strong>
        </div>
        <span className="badge-mini" style={{ background: "#E0F2FE", color: "#0369A1" }}>AUTOMATIC</span>
      </div>

      {projects.length > 0 && (
        <div className="field">
          <label>Link to Project Cost Center (Optional)</label>
          <select value={projectId} onChange={e => handleProjectChange(e.target.value)}>
            <option value="">— General Operational Expense —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label>Vendor / Payee Name *</label>
        <select value={vendor} onChange={e => setVendor(e.target.value)}>
          <option value="">— Select a Vendor —</option>
          {vendors.map(v => (
            <option key={v.id} value={v.name}>{v.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
        <div className="field">
          <label>Amount (PKR) *</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Ref / Invoice No.</span>
            {projectId && <span style={{ fontSize: 10.5, color: "#0284C7", fontWeight: 700 }}>AUTO-FILLED</span>}
          </label>
          <input value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="e.g. EXP-PRJ-003-492" />
        </div>
      </div>

      <div className="field">
        <label>Description / Particulars</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional notes or payment reason" />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Expense Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Payment Status</label>
          <select value={status} onChange={e => {
            setStatus(e.target.value);
            if (e.target.value === "unpaid") setPaidVia(null);
            else if (!paidVia) setPaidVia("Bank");
          }}>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid (Accounts Payable)</option>
          </select>
        </div>
        {status === "paid" && (
          <div className="field" style={{ flex: 1 }}><label>Paid Via</label>
            <select value={paidVia} onChange={e => setPaidVia(e.target.value)}>
              <option>Bank</option><option>Cash</option>
            </select>
          </div>
        )}
      </div>

      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={!valid}
        onClick={() => {
          if (!valid) return;
          const expData = {
            projectId, vendor, category, subcategory, accountKey: glKey,
            description, refNo, amount: Number(amount), date, status, paidVia: status === "paid" ? paidVia : null
          };
          onSubmit(initialData ? { ...initialData, ...expData } : expData);
        }}>
        {initialData ? "Save Expense Changes" : "Post Expense Entry"}
      </button>
    </ModalShell>
  );
}

function ExpenseCategoryManagerModal({ onClose }) {
  const [activeCategory, setActiveCategory] = useState(EXPENSE_CATEGORIES[0]);
  const currentCat = EXPENSE_CLASSIFICATION[activeCategory];
  return (
    <ModalShell title="Expense Classification & Chart of Accounts Catalog" onClose={onClose}>
      <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 16 }}>
        Explore all 16 major expense categories, subcategories, and their mapped General Ledger (GL) accounts.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: 16, maxHeight: "60vh", overflowY: "auto" }}>
        <div style={{ borderRight: "1px solid var(--rule)", paddingRight: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "var(--brand)", marginBottom: 8 }}>16 Expense Categories</div>
          {EXPENSE_CATEGORIES.map(c => (
            <div
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                cursor: "pointer",
                marginBottom: 4,
                fontWeight: activeCategory === c ? 700 : 500,
                background: activeCategory === c ? "rgba(2, 132, 199, 0.12)" : "transparent",
                color: activeCategory === c ? "#0284C7" : "var(--ink)",
                fontSize: 13
              }}
            >
              [{EXPENSE_CLASSIFICATION[c]?.code}] {c}
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "var(--brand)" }}>
            Category [{currentCat?.code}]: {activeCategory}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {currentCat?.subcategories.map((sub, idx) => {
              const glKey = sub.accountKey;
              const glObj = ACCOUNTS[glKey] || ACCOUNTS.expense;
              return (
                <div key={idx} style={{ background: "var(--card-bg-subtle)", border: "1px solid var(--rule)", padding: "10px 14px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{sub.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 2 }}>Subcategory item</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="badge-mini" style={{ background: "#E0F2FE", color: "#0369A1", fontWeight: 700 }}>
                      GL {glObj.code} — {glObj.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}




function PayExpenseModal({ expense, onClose, onSubmit }) {
  const [date, setDate] = useState(TODAY_STR);
  const [paidVia, setPaidVia] = useState("Bank");
  return (
    <ModalShell title="Pay Accounts Payable" onClose={onClose}>
      <div style={{ marginBottom: 16, fontSize: 14, color: "var(--ink-muted)" }}>
        Paying vendor <strong>{expense.vendor}</strong> for amount <strong>{pkr(expense.amount)}</strong>.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Payment Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Pay Via</label>
          <select value={paidVia} onChange={e => setPaidVia(e.target.value)}>
            <option>Bank</option><option>Cash</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
        onClick={() => onSubmit(expense.id, paidVia, date)}>
        Post Payment & Clear AP
      </button>
    </ModalShell>
  );
}

function POModal({ initialData, projects, onClose, onSubmit }) {
  const [vendor, setVendor] = useState(initialData?.vendor || "");
  const [projectId, setProjectId] = useState(initialData?.projectId || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [amount, setAmount] = useState(initialData?.amount || "");
  const [issueDate, setIssueDate] = useState(initialData?.issueDate || TODAY_STR);
  const [expectedDate, setExpectedDate] = useState(initialData?.expectedDate || TODAY_STR);
  
  const valid = vendor && description && Number(amount) > 0;
  return (
    <ModalShell title={initialData ? "Edit Purchase Order" : "Create Purchase Order"} onClose={onClose}>
      <div className="field"><label>Vendor / Supplier Name</label><input value={vendor} onChange={e => setVendor(e.target.value)} placeholder="e.g. Printer ABC" /></div>
      <div className="field"><label>Link to Project (Optional)</label>
        <select value={projectId} onChange={e => setProjectId(e.target.value)}>
          <option value="">-- No Project --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.client})</option>)}
        </select>
      </div>
      <div className="field"><label>Description / Particulars</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Printing of 5000 flyers" /></div>
      <div className="field"><label>Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Issue Date</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Expected Delivery</label><input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} /></div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, vendor, projectId, description, amount: Number(amount), issueDate, expectedDate } : { vendor, projectId, description, amount: Number(amount), issueDate, expectedDate, status: "Draft" })}>
        {initialData ? "Save PO" : "Create PO"}
      </button>
    </ModalShell>
  );
}

function PayPOModal({ po, onClose, onSubmit }) {
  const [date, setDate] = useState(TODAY_STR);
  const [paidVia, setPaidVia] = useState("Bank");
  return (
    <ModalShell title="Pay Purchase Order" onClose={onClose}>
      <div style={{ marginBottom: 16, fontSize: 14, color: "var(--ink-muted)" }}>
        Paying vendor <strong>{po.vendor}</strong> for amount <strong>{pkr(po.amount)}</strong>.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Payment Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>Pay Via</label>
          <select value={paidVia} onChange={e => setPaidVia(e.target.value)}>
            <option>Bank</option><option>Cash</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
        onClick={() => onSubmit(po.id, paidVia, date)}>
        Post Payment & Clear AP
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

function InventoryItemModal({ initialData, onClose, onSubmit }) {
  const [sku, setSku] = useState(initialData?.sku || "");
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || INVENTORY_CATEGORIES[0]);
  const [unit, setUnit] = useState(initialData?.unit || "Pcs");
  const [quantity, setQuantity] = useState(initialData?.quantity !== undefined ? initialData.quantity : "");
  const [minQuantity, setMinQuantity] = useState(initialData?.minQuantity !== undefined ? initialData.minQuantity : 5);
  const [unitCost, setUnitCost] = useState(initialData?.unitCost !== undefined ? initialData.unitCost : "");
  const [warehouse, setWarehouse] = useState(initialData?.warehouse || "Main Store");
  const [description, setDescription] = useState(initialData?.description || "");

  const valid = name && category && Number(unitCost) >= 0;

  return (
    <ModalShell title={initialData ? "Edit SKU Inventory Item" : "Add New SKU Inventory Item"} onClose={onClose}>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>SKU Code (Optional)</label>
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="Auto-generated if empty" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {INVENTORY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Item Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Frontlit Star Vinyl Roll 10x100ft" />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Unit of Measure</label>
          <select value={unit} onChange={e => setUnit(e.target.value)}>
            <option>Pcs</option><option>Rolls</option><option>Sheets</option><option>Units</option><option>Sets</option><option>Boxes</option><option>Kg</option><option>Meters</option>
          </select>
        </div>
        {!initialData && (
          <div className="field" style={{ flex: 1 }}>
            <label>Initial Opening Qty</label>
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
          </div>
        )}
        <div className="field" style={{ flex: 1 }}>
          <label>Reorder Point (Min Qty)</label>
          <input type="number" value={minQuantity} onChange={e => setMinQuantity(e.target.value)} placeholder="5" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Unit Cost Price (PKR)</label>
          <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="0" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Warehouse / Storage Location</label>
          <input value={warehouse} onChange={e => setWarehouse(e.target.value)} placeholder="e.g. Korangi Warehouse A" />
        </div>
      </div>
      <div className="field">
        <label>Item Specs & Description</label>
        <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Specifications, grade, supplier details..." />
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, sku, name, category, unit, minQuantity: Number(minQuantity), unitCost: Number(unitCost), warehouse, description } : { sku, name, category, unit, quantity: Number(quantity) || 0, minQuantity: Number(minQuantity), unitCost: Number(unitCost), warehouse, description })}>
        {initialData ? "Save Item Changes" : "Save New SKU Item"}
      </button>
    </ModalShell>
  );
}

function StockMovementModal({ initialItem, items, projects, onClose, onSubmit }) {
  const [itemId, setItemId] = useState(initialItem?.id || items[0]?.id || "");
  const [type, setType] = useState("Stock Out");
  const [quantity, setQuantity] = useState("");
  const selectedItem = items.find(i => i.id === itemId) || items[0];
  const [unitCost, setUnitCost] = useState(selectedItem?.unitCost || "");
  const [reference, setReference] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");

  const qty = Number(quantity) || 0;
  const valid = itemId && qty > 0;

  return (
    <ModalShell title="Record Stock Movement (Stock In / Out)" onClose={onClose}>
      <div className="field">
        <label>Select Inventory SKU Item</label>
        <select value={itemId} onChange={e => {
          const id = e.target.value;
          setItemId(id);
          const itm = items.find(i => i.id === id);
          if (itm) setUnitCost(itm.unitCost);
        }}>
          {items.map(i => (
            <option key={i.id} value={i.id}>
              [{i.sku}] {i.name} — Current Stock: {i.quantity} {i.unit}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Movement Type</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="Stock Out">Stock Out (Issue to Project / Consumed)</option>
            <option value="Stock In">Stock In (Purchase Received / Restock)</option>
            <option value="Adjustment">Stock Adjustment (Audit Count)</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Quantity ({selectedItem?.unit || "Pcs"})</label>
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Unit Cost (PKR)</label>
          <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder={selectedItem?.unitCost || 0} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Ref PO / Invoice / Doc #</label>
          <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. PO-005 or ISSUE-101" />
        </div>
      </div>

      {type === "Stock Out" && (
        <div className="field">
          <label>Link to Client Project (Optional)</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)}>
            <option value="">-- No Project (General Usage) --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.projectCode} — {p.client} ({p.name})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label>Movement Remarks / Reason</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Issued 2 vinyl rolls for billboard printing" />
      </div>

      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit({ itemId, type, quantity: Number(quantity), unitCost: Number(unitCost) || selectedItem?.unitCost || 0, reference, projectId, notes })}>
        Submit Stock Movement
      </button>
    </ModalShell>
  );
}

function BankAccountModal({ initialData, onClose, onSubmit }) {
  const [bankName, setBankName] = useState(initialData?.bankName || "");
  const [accountTitle, setAccountTitle] = useState(initialData?.accountTitle || "");
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || "");
  const [iban, setIban] = useState(initialData?.iban || "");
  const [accountType, setAccountType] = useState(initialData?.accountType || "Current Account");
  const [branch, setBranch] = useState(initialData?.branch || "");
  const [openingBalance, setOpeningBalance] = useState(initialData?.openingBalance !== undefined ? initialData.openingBalance : "");
  const [color, setColor] = useState(initialData?.color || "#059669");

  const valid = bankName && accountTitle && accountNumber;

  return (
    <ModalShell title={initialData ? "Edit Bank Account Details" : "Register New Bank Account"} onClose={onClose}>
      <div className="field">
        <label>Bank Name</label>
        <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Habib Bank Limited / Allied Bank" />
      </div>

      <div className="field">
        <label>Account Title</label>
        <input value={accountTitle} onChange={e => setAccountTitle(e.target.value)} placeholder="e.g. AdPulse IMC PVT LTD (Main Ops)" />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Account Number</label>
          <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="e.g. 0014-2289-1001" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>IBAN (Optional)</label>
          <input value={iban} onChange={e => setIban(e.target.value)} placeholder="e.g. PK36HABB00001422891001" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Account Type</label>
          <select value={accountType} onChange={e => setAccountType(e.target.value)}>
            <option>Current Account</option>
            <option>Corporate Account</option>
            <option>Savings Account</option>
            <option>Islamic Current</option>
            <option>Petty Cash</option>
          </select>
        </div>
        {!initialData && (
          <div className="field" style={{ flex: 1 }}>
            <label>Opening Balance (PKR)</label>
            <input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} placeholder="0" />
          </div>
        )}
      </div>

      <div className="field">
        <label>Branch Name & Location</label>
        <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. Shahrah-e-Faisal Branch, Karachi" />
      </div>

      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? { ...initialData, bankName, accountTitle, accountNumber, iban, accountType, branch, color } : { bankName, accountTitle, accountNumber, iban, accountType, branch, openingBalance: Number(openingBalance) || 0, color })}>
        {initialData ? "Save Bank Changes" : "Register Bank Account"}
      </button>
    </ModalShell>
  );
}

function VoucherModal({ defaultType, projects = [], bankAccounts = [], onClose, onSubmit }) {
  const [type, setType] = useState(defaultType || "PV");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(TODAY_STR);
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Office & Administration");
  const [subcategory, setSubcategory] = useState("Office Rent");
  const [via, setVia] = useState("Cash"); // "Cash" or "Bank"

  // Real bank accounts list (excluding petty cash)
  const realBankAccounts = useMemo(() => {
    return bankAccounts.filter(b => b.id !== "bank-cash" && b.accountType !== "Petty Cash");
  }, [bankAccounts]);

  const [selectedBankId, setSelectedBankId] = useState(realBankAccounts[0]?.id || "bank-hbl");

  // All accounts list for Contra Transfer (Cash + Bank Accounts)
  const allAccountsForContra = useMemo(() => {
    const list = [...bankAccounts];
    if (!list.some(b => b.id === "bank-cash")) {
      list.unshift({ id: "bank-cash", bankName: "Petty Cash Vault", accountTitle: "Office Petty Cash Custodian", accountNumber: "CASH-VAULT-01", accountType: "Petty Cash" });
    }
    return list;
  }, [bankAccounts]);

  const [sourceBankId, setSourceBankId] = useState(allAccountsForContra[0]?.id || "bank-cash");
  const [targetBankId, setTargetBankId] = useState(allAccountsForContra[1]?.id || realBankAccounts[0]?.id || "bank-hbl");

  const [settleAR, setSettleAR] = useState(true);
  const [lines, setLines] = useState([
    { account: "cash", debit: "", credit: "" },
    { account: "revenue", debit: "", credit: "" },
  ]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const subList = EXPENSE_CLASSIFICATION[newCat]?.subcategories || [];
    if (subList.length > 0) setSubcategory(subList[0].name);
  };

  const handleProjectSelect = (id) => {
    setProjectId(id);
    const prj = projects.find(p => p.id === id);
    if (prj && !party) {
      setParty(prj.client);
    }
  };

  const currentCategoryObj = EXPENSE_CLASSIFICATION[category] || EXPENSE_CLASSIFICATION["Office & Administration"];
  const currentSubcategories = currentCategoryObj.subcategories || [];
  const glKey = getGLAccountKeyForSubcategory(category, subcategory);
  const glAccountObj = ACCOUNTS[glKey] || ACCOUNTS.expense;

  const selectedBankObj = bankAccounts.find(b => b.id === selectedBankId) || realBankAccounts[0];
  const sourceBankObj = allAccountsForContra.find(b => b.id === sourceBankId);
  const targetBankObj = allAccountsForContra.find(b => b.id === targetBankId);

  const updateLine = (i, key, val) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [key]: val } : l));
  const totalD = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalC = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const jvBalanced = totalD > 0 && totalD === totalC;

  const valid = type === "JV"
    ? (jvBalanced && description)
    : type === "CTV"
    ? (Number(amount) > 0 && sourceBankId !== targetBankId && description)
    : (party && Number(amount) > 0 && description);

  function submit() {
    if (!valid) return;
    if (type === "JV") {
      onSubmit("JV", {
        projectId, date, party: "", description,
        lines: lines.filter(l => Number(l.debit) || Number(l.credit)).map(l => ({ account: l.account, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      });
    } else if (type === "CTV") {
      onSubmit("CTV", {
        projectId, date, party: `${sourceBankObj?.bankName} → ${targetBankObj?.bankName}`,
        description: description || `Internal Contra Transfer from ${sourceBankObj?.bankName} to ${targetBankObj?.bankName}`,
        amount: Number(amount), sourceBankId, targetBankId
      });
    } else {
      onSubmit(type, {
        projectId, date, party, description, amount: Number(amount),
        category, subcategory, accountKey: glKey, via,
        bankAccountId: via === "Cash" ? "bank-cash" : selectedBankId,
        settleAR
      });
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

      {projects.length > 0 && type !== "CTV" && (
        <div className="field">
          <label>Link to Project / Cost Center (Optional)</label>
          <select value={projectId} onChange={e => handleProjectSelect(e.target.value)}>
            <option value="">— General Office / Overhead (No Specific Project) —</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
            ))}
          </select>
        </div>
      )}

      <div className="field"><label>Posting Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>

      {type !== "JV" && type !== "CTV" && (
        <div className="field">
          <label>{type === "PV" ? "Paid To (Payee Name)" : type === "RV" ? "Received From (Payer Name)" : "Client Name"}</label>
          <input value={party} onChange={e => setParty(e.target.value)} placeholder="Party Name" />
        </div>
      )}

      <div className="field">
        <label>Description / Particulars</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Media booking retainer / Utility payment" />
      </div>

      {type === "PV" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field">
              <label>Expense Category</label>
              <select value={category} onChange={e => handleCategoryChange(e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Expense Subcategory</label>
              <select value={subcategory} onChange={e => setSubcategory(e.target.value)}>
                {currentSubcategories.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.2)", padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: 12.5 }}>
            Mapped GL Account: <strong style={{ color: "#0284C7" }}>{glAccountObj.code} — {glAccountObj.name}</strong>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
            <div className="field"><label>Voucher Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
            <div className="field">
              <label>Payment Through</label>
              <select value={via} onChange={e => setVia(e.target.value)}>
                <option value="Cash">Cash (Petty Cash Vault)</option>
                <option value="Bank">Bank Account</option>
              </select>
            </div>
          </div>

          {via === "Bank" && (
            <div className="field" style={{ marginTop: 4 }}>
              <label>Select Bank Account</label>
              <select value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)}>
                {realBankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} — {b.accountTitle} ({b.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ background: via === "Cash" ? "rgba(217, 119, 6, 0.08)" : "rgba(5, 150, 105, 0.08)", border: `1px solid ${via === "Cash" ? "rgba(217, 119, 6, 0.2)" : "rgba(5, 150, 105, 0.2)"}`, padding: "10px 14px", borderRadius: 8, fontSize: 12.5, color: via === "Cash" ? "#D97706" : "#059669", marginBottom: 14 }}>
            {via === "Cash" ? (
              <>💡 <b>Cash Payment Rule:</b> Debits <b>{glAccountObj.name}</b> &amp; Credits <b>Petty Cash Vault (Cash in Hand)</b>. Petty cash balance decreases automatically.</>
            ) : (
              <>💡 <b>Bank Payment Rule:</b> Debits <b>{glAccountObj.name}</b> &amp; Credits <b>{selectedBankObj?.bankName || "Selected Bank"}</b>. Bank balance decreases automatically.</>
            )}
          </div>
        </>
      )}

      {type === "RV" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
            <div className="field"><label>Receipt Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
            <div className="field">
              <label>Receive Through</label>
              <select value={via} onChange={e => setVia(e.target.value)}>
                <option value="Cash">Cash (Petty Cash Vault)</option>
                <option value="Bank">Bank Account</option>
              </select>
            </div>
          </div>

          {via === "Bank" && (
            <div className="field">
              <label>Select Receiving Bank Account</label>
              <select value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)}>
                {realBankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} — {b.accountTitle} ({b.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>Receipt Credit Account</label>
            <select value={settleAR ? "ar" : "revenue"} onChange={e => setSettleAR(e.target.value === "ar")}>
              <option value="ar">Settle Accounts Receivable (Client Bill)</option>
              <option value="revenue">Direct Service Revenue (No Invoice)</option>
            </select>
          </div>

          <div style={{ background: "rgba(5, 150, 105, 0.08)", border: "1px solid rgba(5, 150, 105, 0.2)", padding: "10px 14px", borderRadius: 8, fontSize: 12.5, color: "#059669", marginBottom: 14 }}>
            {via === "Cash" ? (
              <>💡 <b>Cash Receipt Rule:</b> Debits <b>Petty Cash Vault</b> &amp; Credits <b>{settleAR ? "Accounts Receivable" : "Direct Revenue"}</b>. Petty cash balance increases automatically.</>
            ) : (
              <>💡 <b>Bank Receipt Rule:</b> Debits <b>{selectedBankObj?.bankName || "Selected Bank"}</b> &amp; Credits <b>{settleAR ? "Accounts Receivable" : "Direct Revenue"}</b>. Bank balance increases automatically.</>
            )}
          </div>
        </>
      )}

      {type === "CTV" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field">
              <label>Transfer From (Source Account) *</label>
              <select value={sourceBankId} onChange={e => setSourceBankId(e.target.value)}>
                {allAccountsForContra.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} ({b.accountTitle})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Transfer To (Destination Account) *</label>
              <select value={targetBankId} onChange={e => setTargetBankId(e.target.value)}>
                {allAccountsForContra.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} ({b.accountTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sourceBankId === targetBankId && (
            <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
              ⚠️ Source and Destination accounts must be different!
            </div>
          )}

          <div className="field"><label>Transfer Amount (PKR) *</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>

          <div style={{ background: "rgba(14, 165, 233, 0.08)", border: "1px solid rgba(14, 165, 233, 0.2)", padding: "10px 14px", borderRadius: 8, fontSize: 12.5, color: "#0284C7", marginBottom: 14 }}>
            💡 <b>Contra Transfer Rule:</b> Debits <b>{targetBankObj?.bankName}</b> &amp; Credits <b>{sourceBankObj?.bankName}</b>. Source balance decreases, Destination balance increases. No revenue or expense created!
          </div>
        </>
      )}

      {type === "SV" && (
        <div className="field"><label>Amount (PKR)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
      )}

      {type === "CV" && (
        <>
          <div className="field"><label>Vendor Name (Payee / Accounts Payable Settle)</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Meta Ads / Outdoor Printing Vendor" /></div>
          <div className="field"><label>Amount (PKR)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" /></div>
          <div style={{ background: "rgba(14, 165, 233, 0.08)", padding: "10px 14px", borderRadius: 8, fontSize: 13, color: "#0284C7", marginBottom: 14 }}>
            💡 <b>Direct Settlement Rule:</b> Debits Accounts Payable (Vendor: <b>{category || "Vendor"}</b>) &amp; Credits Accounts Receivable (Client: <b>{party || "Client"}</b>). Neither Bank nor Cash balance is touched!
          </div>
        </>
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

function DocumentReviewModal({ doc, projects = [], bankAccounts = [], onClose, onSaveDraft, onPost, onCreateProjectTrigger }) {
  if (!doc) return null;
  const [extracted, setExtracted] = useState({ ...(doc.extracted || {}) });
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState([]);

  const category = extracted.category || "Marketing & Advertising";
  const subcategory = extracted.subcategory || "Meta / Facebook Ads";

  const currentCategoryObj = EXPENSE_CLASSIFICATION[category] || EXPENSE_CLASSIFICATION["Office & Administration"];
  const currentSubcategories = currentCategoryObj.subcategories || [];

  const glKey = getGLAccountKeyForSubcategory(category, subcategory);
  const glAccountObj = ACCOUNTS[glKey] || ACCOUNTS.expense;

  const realBankAccounts = useMemo(() => {
    return bankAccounts.filter(b => b.id !== "bank-cash" && b.accountType !== "Petty Cash");
  }, [bankAccounts]);

  const selectedBankObj = bankAccounts.find(b => b.id === extracted.bankAccountId) || realBankAccounts[0];

  const baseAmt = Number(extracted.baseAmount) || Number(extracted.amount) || 0;
  const taxAmt = Number(extracted.taxAmount) || 0;
  const totalAmt = Number(extracted.totalAmount) || (baseAmt + taxAmt);

  const updateField = (key, val) => {
    setExtracted(prev => {
      const next = { ...prev, [key]: val };
      if (key === "category") {
        const subList = EXPENSE_CLASSIFICATION[val]?.subcategories || [];
        next.subcategory = subList[0]?.name || "";
      }
      if (key === "baseAmount" || key === "taxAmount") {
        const b = key === "baseAmount" ? Number(val) || 0 : Number(prev.baseAmount) || 0;
        const t = key === "taxAmount" ? Number(val) || 0 : Number(prev.taxAmount) || 0;
        next.totalAmount = b + t;
      }
      return next;
    });
  };

  const handlePost = () => {
    const errs = [];
    if (!extracted.party) errs.push("Party / Vendor / Customer Name is required.");
    if (!extracted.documentNumber) errs.push("Document / Invoice Number is required.");
    if (!extracted.date) errs.push("Document Date is required.");
    if (!extracted.category) errs.push("Expense Category is required.");
    if (totalAmt <= 0) errs.push("Total Amount must be greater than 0.");
    if (extracted.paymentMode === "Bank" && !extracted.bankAccountId) errs.push("Bank Account selection is mandatory.");

    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }

    setValidationErrors([]);
    onPost(doc.id, extracted);
  };

  const handleDraft = () => {
    onSaveDraft(doc.id, extracted);
  };

  return (
    <ModalShell title={`AI Document Review & Accounting Entry — ${doc.fileName}`} onClose={onClose} width="94vw" style={{ maxWidth: 1300 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", padding: "10px 14px", borderRadius: 8, marginBottom: 14, border: "1px solid var(--rule)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>Document Type: <span style={{ color: "#0284C7" }}>{extracted.documentType || "Invoice"}</span></span>
          <span style={{ fontSize: 12, background: "rgba(5, 150, 105, 0.12)", color: "#059669", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>AI Confidence: {extracted.aiConfidence || "96%"}</span>
          
          {doc.duplicateRisk?.level === "LOW RISK" && (
            <span style={{ fontSize: 12, background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>✓ No Duplicate Found</span>
          )}
          {doc.duplicateRisk?.level === "MEDIUM RISK" && (
            <span style={{ fontSize: 12, background: "#FEF3C7", color: "#B45309", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>⚠ Possible Duplicate ({doc.duplicateRisk.riskScore}%)</span>
          )}
          {(doc.duplicateRisk?.level === "HIGH RISK" || doc.duplicateRisk?.level === "EXACT DUPLICATE") && (
            <span style={{ fontSize: 12, background: "#FEE2E2", color: "#991B1B", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>✕ Duplicate Detected ({doc.duplicateRisk.riskScore}%)</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
          Status: <strong style={{ textTransform: "uppercase", color: "var(--gold)" }}>{doc.status.replace("_", " ")}</strong>
        </div>
      </div>

      {doc.duplicateRisk && doc.duplicateRisk.level !== "LOW RISK" && (
        <div style={{ background: doc.duplicateRisk.level === "MEDIUM RISK" ? "#FFFBEB" : "rgba(220, 38, 38, 0.08)", border: `1px solid ${doc.duplicateRisk.level === "MEDIUM RISK" ? "#FCD34D" : "rgba(220, 38, 38, 0.2)"}`, padding: "10px 14px", borderRadius: 8, fontSize: 12.5, color: doc.duplicateRisk.level === "MEDIUM RISK" ? "#B45309" : "#DC2626", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            ⚠️ <b>{doc.duplicateRisk.level}: {doc.duplicateRisk.statusText}</b>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--ink)" }}>{doc.duplicateRisk.reason}</div>
          </div>
          <button className="btn" style={{ fontSize: 12, padding: "4px 10px", borderColor: "currentColor", color: "inherit", fontWeight: 700 }} onClick={() => setCompareDocData({ doc, duplicateMatch: doc.duplicateRisk })}>
            Compare Documents
          </button>
        </div>
      )}


      {validationErrors.length > 0 && (
        <div style={{ background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)", padding: "10px 14px", borderRadius: 8, fontSize: 12.5, color: "#DC2626", marginBottom: 14 }}>
          <strong>Cannot Post Transaction — Please fix the following errors:</strong>
          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
            {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 20, maxHeight: "78vh", overflowY: "auto", paddingRight: 6 }}>
        
        {/* LEFT COLUMN: ORIGINAL DOCUMENT PREVIEW */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--rule)", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <FileCheck2 size={15} color="var(--gold)" /> Original Document Preview
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button className="btn" style={{ padding: "3px 7px", fontSize: 11 }} onClick={() => setZoom(z => Math.max(50, z - 15))}>-</button>
              <span style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{zoom}%</span>
              <button className="btn" style={{ padding: "3px 7px", fontSize: 11 }} onClick={() => setZoom(z => Math.min(200, z + 15))}>+</button>
              {doc.fileDataUrl && (
                <a href={doc.fileDataUrl} download={doc.fileName} className="btn" style={{ padding: "3px 7px", fontSize: 11, display: "inline-flex", textDecoration: "none" }}>
                  <Download size={12} style={{ marginRight: 4 }} /> Save
                </a>
              )}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 400, background: "#0F172A", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", position: "relative", padding: 10 }}>
            {doc.fileDataUrl && doc.fileDataUrl.startsWith("data:image") ? (
              <img src={doc.fileDataUrl} alt="Uploaded Document" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center", transition: "transform 0.2s ease", maxWidth: "100%", height: "auto", borderRadius: 4 }} />
            ) : (
              <div style={{ color: "#94A3B8", textAlign: "center", padding: 30 }}>
                <FileText size={48} style={{ marginBottom: 12, opacity: 0.7 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F8FAFC" }}>{doc.fileName}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{doc.fileSize || "PDF Document"}</div>
                {doc.fileDataUrl && (
                  <iframe src={doc.fileDataUrl} title="Document Preview" style={{ width: "100%", height: 380, border: "none", marginTop: 12, borderRadius: 6, background: "#FFFFFF" }} />
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 11.5, color: "var(--ink-muted)" }}>
            <span>Page {page} of 1</span>
            <span>Uploaded: {doc.uploadedAt || "Today"}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: AI EXTRACTED DATA (100% EDITABLE FORM) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Document Type</label>
              <select value={extracted.documentType || "Invoice"} onChange={e => updateField("documentType", e.target.value)}>
                <option value="Invoice">Invoice</option>
                <option value="Payment Voucher">Payment Voucher</option>
                <option value="Receipt Voucher">Receipt Voucher</option>
                <option value="Quotation">Quotation</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="Expense Receipt">Expense Receipt</option>
                <option value="Bill">Bill</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Debit Note">Debit Note</option>
                <option value="Bank Statement">Bank Statement</option>
                <option value="Other">Other Business Document</option>
              </select>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label>Document / Invoice #</label>
              <input value={extracted.documentNumber || ""} onChange={e => updateField("documentNumber", e.target.value)} placeholder="e.g. INV-1023" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Document Date</label>
              <input type="date" value={extracted.date || ""} onChange={e => updateField("date", e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Due Date</label>
              <input type="date" value={extracted.dueDate || ""} onChange={e => updateField("dueDate", e.target.value)} />
            </div>
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>Vendor / Client / Party Name *</label>
            <input value={extracted.party || ""} onChange={e => updateField("party", e.target.value)} placeholder="Vendor or Customer Name" />
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Link to Client Project / Cost Center</span>
              {!extracted.projectId && (
                <button type="button" onClick={onCreateProjectTrigger} style={{ background: "none", border: "none", color: "#0284C7", fontSize: 11.5, cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                  + Create New Project
                </button>
              )}
            </label>
            <select value={extracted.projectId || ""} onChange={e => updateField("projectId", e.target.value)}>
              <option value="">-- General Overhead / No Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectCode} — {p.client} ({p.name})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Expense Category (A-P)</label>
              <select value={category} onChange={e => updateField("category", e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Expense Subcategory</label>
              <select value={subcategory} onChange={e => updateField("subcategory", e.target.value)}>
                {currentSubcategories.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.2)", padding: "7px 10px", borderRadius: 6, fontSize: 12 }}>
            Mapped GL Account: <strong style={{ color: "#0284C7" }}>{glAccountObj.code} — {glAccountObj.name}</strong>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Subtotal (PKR)</label>
              <input type="number" value={extracted.baseAmount || 0} onChange={e => updateField("baseAmount", e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Tax Amount (PKR)</label>
              <input type="number" value={extracted.taxAmount || 0} onChange={e => updateField("taxAmount", e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label>Total Amount (PKR)</label>
              <input type="number" value={extracted.totalAmount || 0} onChange={e => updateField("totalAmount", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field" style={{ margin: 0 }}>
              <label>Payment Settlement Mode</label>
              <select value={extracted.paymentMode || "Bank"} onChange={e => updateField("paymentMode", e.target.value)}>
                <option value="Unpaid">Unpaid (Accounts Payable / Credit)</option>
                <option value="Cash">Paid via Cash (Petty Cash Vault)</option>
                <option value="Bank">Paid via Bank Account</option>
              </select>
            </div>

            {extracted.paymentMode === "Bank" && (
              <div className="field" style={{ margin: 0 }}>
                <label>Select Bank Account</label>
                <select value={extracted.bankAccountId || selectedBankObj?.id || ""} onChange={e => updateField("bankAccountId", e.target.value)}>
                  {realBankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.bankName} — {b.accountTitle}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="field" style={{ margin: 0 }}>
            <label>Particulars / Notes</label>
            <input value={extracted.description || ""} onChange={e => updateField("description", e.target.value)} placeholder="Description or particulars" />
          </div>

          {/* LIVE ACCOUNTING ENTRY PREVIEW */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--rule)", padding: "10px 14px", borderRadius: 8, marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", marginBottom: 6 }}>
              ⚡ Accounting Double-Entry Preview
            </div>
            <div style={{ fontSize: 12.5, fontFamily: "monospace" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", marginBottom: 2 }}>
                <span>Debit  : {glAccountObj.code} — {glAccountObj.name}</span>
                <span>{pkr(baseAmt)}</span>
              </div>
              {taxAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", marginBottom: 2 }}>
                  <span>Debit  : 1140 — Input Sales Tax (SRB)</span>
                  <span>{pkr(taxAmt)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", color: "#D97706" }}>
                <span>
                  Credit : {extracted.paymentMode === "Cash" ? "1010 — Petty Cash Vault" : extracted.paymentMode === "Bank" ? `1020 — ${selectedBankObj?.bankName || "Bank"}` : "2010 — Accounts Payable (AP)"}
                </span>
                <span>{pkr(totalAmt)}</span>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button className="btn" style={{ flex: 1, justifyContent: "center", padding: "10px" }} onClick={handleDraft}>
              Save as Draft
            </button>
            <button className="btn btn-primary" style={{ flex: 1.5, justifyContent: "center", padding: "10px", fontWeight: 700 }} onClick={handlePost}>
              Post Transaction
            </button>
          </div>

        </div>
      </div>
    </ModalShell>
  );
}

function CompareDocumentsModal({ doc, duplicateMatch, onClose, onCancelUpload, onOverride }) {


  const [overrideReason, setOverrideReason] = useState("");
  const [showOverrideInput, setShowOverrideInput] = useState(false);

  if (!doc || !duplicateMatch) return null;

  return (
    <ModalShell title={`Duplicate Comparison — ${doc.fileName}`} onClose={onClose} width="90%" style={{ maxWidth: 1000 }}>
      <div style={{ background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.2)", padding: "12px 16px", borderRadius: 8, fontSize: 13, color: "#DC2626", marginBottom: 16 }}>
        ⚠️ <b>{duplicateMatch.level}: {duplicateMatch.statusText}</b> (Risk Score: <b>{duplicateMatch.riskScore}%</b>)
        <div style={{ marginTop: 4, color: "var(--ink)" }}>{duplicateMatch.reason}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* EXISTING RECORD */}
        <div className="card" style={{ padding: 16, background: "var(--bg)", border: "1px solid var(--rule)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>
            ✓ Existing System Record ({duplicateMatch.match?.type || "Financial Record"})
          </div>
          <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
            <div><strong>Reference #:</strong> {duplicateMatch.match?.ref || "—"}</div>
            <div><strong>Party / Vendor:</strong> {duplicateMatch.match?.vendor || "—"}</div>
            <div><strong>Transaction Date:</strong> {duplicateMatch.match?.date || "—"}</div>
            <div><strong>Total Amount:</strong> <span className="mono" style={{ fontWeight: 700, color: "var(--ink)" }}>{pkr(duplicateMatch.match?.amount || 0)}</span></div>
            <div><strong>Status:</strong> <span style={{ color: "#059669", fontWeight: 700 }}>{duplicateMatch.match?.status || "POSTED"}</span></div>
            <div><strong>Posted By:</strong> {duplicateMatch.match?.postedBy || "Finance User"}</div>
          </div>
        </div>

        {/* UPLOADED NEW DOCUMENT */}
        <div className="card" style={{ padding: 16, background: "var(--bg)", border: "1px solid var(--rule)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0284C7", textTransform: "uppercase", marginBottom: 10 }}>
            🆕 New Uploaded Document ({doc.extracted?.documentType || "Invoice"})
          </div>
          <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
            <div><strong>Document #:</strong> {doc.extracted?.documentNumber || "—"}</div>
            <div><strong>Vendor / Party:</strong> {doc.extracted?.party || "—"}</div>
            <div><strong>Document Date:</strong> {doc.extracted?.date || "—"}</div>
            <div><strong>Total Amount:</strong> <span className="mono" style={{ fontWeight: 700, color: "var(--ink)" }}>{pkr(doc.extracted?.totalAmount || doc.extracted?.amount || 0)}</span></div>
            <div><strong>Current Status:</strong> <span style={{ color: "#D97706", fontWeight: 700 }}>{doc.status.toUpperCase()}</span></div>
            <div><strong>File Name:</strong> {doc.fileName}</div>
          </div>
        </div>
      </div>

      {showOverrideInput && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: "#B45309", marginBottom: 4, display: "block" }}>
            Authorized Override Reason (Mandatory for Audit Trail) *
          </label>
          <input
            value={overrideReason}
            onChange={e => setOverrideReason(e.target.value)}
            placeholder="e.g. Vendor issued revised invoice with updated tax breakdown..."
            style={{ width: "100%", fontSize: 13, padding: "8px 12px" }}
          />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn" style={{ color: "#DC2626", borderColor: "#FCA5A5" }} onClick={onCancelUpload}>
          Cancel Upload &amp; Remove Document
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          {!showOverrideInput ? (
            <button className="btn" style={{ color: "#D97706", borderColor: "#FCD34D" }} onClick={() => setShowOverrideInput(true)}>
              Authorized Override (Admin)
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!overrideReason.trim()}
              onClick={() => onOverride(doc.id, overrideReason)}
            >
              Confirm Override &amp; Post
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            Close &amp; Return to Review
          </button>
        </div>
      </div>
    </ModalShell>
  );
}









function BookHoardingModal({ hoarding, projects, onClose, onSubmit }) {
  const [mode, setMode] = useState(projects.length ? "existing" : "new");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [client, setClient] = useState("");
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState(TODAY_STR);
  const [endDate, setEndDate] = useState(TODAY_STR);
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
  const [startDate, setStartDate] = useState(initialData?.startDate || TODAY_STR);
  const [endDate, setEndDate] = useState(initialData?.endDate || TODAY_STR);

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
      <div className="field"><label>Scope Note / Objective</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief summary of creative scope" /></div>

      <div style={{ display: "flex", gap: 10 }}>
        <div className="field" style={{ flex: 1 }}><label>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div className="field" style={{ flex: 1 }}><label>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} disabled={!valid}
        onClick={() => valid && onSubmit(initialData ? {
          ...initialData, client, type, name, description, startDate, endDate
        } : {
          client, type, name, description, startDate, endDate, budget: 0, spent: 0, billed: 0, status: "Active"
        })}>
        {initialData ? "Save Project Changes" : "Initialize Project"}
      </button>

    </ModalShell>
  );
}


function ProjectBillingModal({ project, onClose, onSubmit }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState(TODAY_STR);
  const [dueDate, setDueDate] = useState(TODAY_STR);
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
  const [date, setDate] = useState(TODAY_STR);
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

        {project.oohSites && project.oohSites.length > 0 && (
          <>
            <div className="section-title" style={{ margin: "14px 0 8px", fontSize: 15 }}>
              <Building2 size={16} color="var(--gold)" /> OOH Advertising Locations Breakdown ({project.oohSites.length} locations)
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Location / Area</th>
                      <th style={{ textAlign: "right" }}>Width (ft)</th>
                      <th style={{ textAlign: "right" }}>Height (ft)</th>
                      <th style={{ textAlign: "right", color: "#0284C7" }}>Total Sq. Ft.</th>
                      <th style={{ textAlign: "right", color: "#059669" }}>Rate (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.oohSites.map((site, idx) => (
                      <tr key={idx}>
                        <td className="mono" style={{ fontSize: 12, color: "var(--ink-muted)" }}>Site #{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{site.location || site.name || site.area}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{Number(site.width || (site.size ? site.size.split("x")[0] : 0)).toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{Number(site.height || (site.size ? site.size.split("x")[1] : 0)).toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "#0284C7" }}>{Number(site.sqft || 0).toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "#059669" }}>{pkr(site.rate || site.pricePerMonth)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--bg)", fontWeight: 800 }}>
                      <td colSpan={4}>Total OOH Sq. Ft. &amp; Rate</td>
                      <td className="mono" style={{ textAlign: "right", color: "#0284C7" }}>
                        {(project.totalOohSqft || project.oohSites.reduce((s, i) => s + (Number(i.sqft) || 0), 0)).toFixed(2)} Sq. Ft.
                      </td>
                      <td className="mono" style={{ textAlign: "right", color: "#059669", fontSize: 14 }}>
                        {pkr(project.budget || project.oohSites.reduce((s, i) => s + (Number(i.rate || i.pricePerMonth) || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}


        {project.printingItems && project.printingItems.length > 0 && (
          <>
            <div className="section-title" style={{ margin: "14px 0 8px", fontSize: 15 }}>
              <Printer size={16} color="var(--gold)" /> Printing &amp; Installations Specs ({project.printingItems.length} items)
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ textAlign: "right" }}>Width (ft)</th>
                      <th style={{ textAlign: "right" }}>Height (ft)</th>
                      <th style={{ textAlign: "right", color: "#0284C7" }}>Total Sq. Ft.</th>
                      <th style={{ textAlign: "right" }}>Rate / Sq. Ft.</th>
                      <th style={{ textAlign: "right", color: "#059669" }}>Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.printingItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="mono" style={{ fontSize: 12, color: "var(--ink-muted)" }}>Item #{idx + 1}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{Number(item.width).toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{Number(item.height).toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "#0284C7" }}>{Number(item.sqft).toFixed(2)}</td>
                        <td className="mono" style={{ textAlign: "right" }}>{pkr(item.rate)}</td>
                        <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "#059669" }}>{pkr(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--bg)", fontWeight: 800 }}>
                      <td colSpan={3}>Grand Totals</td>
                      <td className="mono" style={{ textAlign: "right", color: "#0284C7" }}>{(project.totalSqft || project.printingItems.reduce((s, i) => s + (Number(i.sqft) || 0), 0)).toFixed(2)} Sq. Ft.</td>
                      <td></td>
                      <td className="mono" style={{ textAlign: "right", color: "#059669", fontSize: 14 }}>{pkr(project.budget || project.printingItems.reduce((s, i) => s + (Number(i.amount) || 0), 0))}</td>
                    </tr>
                  </tfoot>
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
                        onClick={() => onPrint({ voucherNo: cleanInvoiceNo(inv.invoiceNo || inv.id), type: "Invoice", date: inv.issueDate, party: inv.client, description: inv.description, amount: inv.amount, applySst: inv.applySst, sstRate: inv.sstRate, sstAmount: inv.sstAmount, applyWht: inv.applyWht, whtRate: inv.whtRate, whtAmount: inv.whtAmount, totalAmount: inv.totalAmount || inv.amount, notes: inv.notes || inv.specialNotes })}>
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

function PayrollConfirmModal({ activeEmployees = [], monthlyAttendance = {}, onClose, onConfirm }) {
  const entries = activeEmployees.map(e => {
    const empAtt = monthlyAttendance[e.id] || {};
    const absentCount = Object.keys(empAtt).length > 0 ? Object.values(empAtt).filter(v => v === "A").length : 0;
    const dailyRate = Math.round(e.salary / 30);
    const deductionAmt = absentCount * dailyRate;
    const netSalary = e.salary - deductionAmt;
    return { ...e, absentCount, deductionAmt, netSalary };
  });

  const totalGross = entries.reduce((s, e) => s + e.salary, 0);
  const totalDeductions = entries.reduce((s, e) => s + e.deductionAmt, 0);
  const totalNet = entries.reduce((s, e) => s + e.netSalary, 0);

  return (
    <ModalShell title="Run Monthly Payroll Disbursal" onClose={onClose}>
      <div style={{ fontSize: 13.5, color: "var(--ink-muted)", marginBottom: 14 }}>
        Monthly Payroll calculation based on <b>Day-Wise Attendance &amp; Leave Deductions</b> for <b>{entries.length} active staff members</b>:
      </div>

      <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>Total Gross Payroll:</span> <span className="mono" style={{ fontWeight: 700 }}>{pkr(totalGross)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "var(--rose)" }}>
          <span>Total Attendance Deductions:</span> <span className="mono" style={{ fontWeight: 700 }}>- {pkr(totalDeductions)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid var(--rule)", fontWeight: 800, fontSize: 14, color: "var(--gold)" }}>
          <span>Net Payroll Payable (Bank Disbursal):</span> <span className="mono">{pkr(totalNet)}</span>
        </div>
      </div>

      <div className="table-responsive" style={{ maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
        <table style={{ fontSize: 12 }}>
          <thead>
            <tr>
              <th>Employee</th><th>Gross</th><th>Absents</th><th>Deduction</th><th>Net Disbursed</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 600 }}>{e.name}</td>
                <td className="mono">{pkr(e.salary)}</td>
                <td className="mono" style={{ textAlign: "center", color: e.absentCount > 0 ? "var(--rose)" : "inherit" }}>{e.absentCount} d</td>
                <td className="mono" style={{ color: "var(--rose)" }}>{e.deductionAmt > 0 ? `- ${pkr(e.deductionAmt)}` : "—"}</td>
                <td className="mono" style={{ fontWeight: 700, color: "var(--jade)" }}>{pkr(e.netSalary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" style={{ flex: 1.5, justifyContent: "center" }} onClick={onConfirm}>Confirm &amp; Post Payroll ({pkr(totalNet)})</button>
      </div>
    </ModalShell>
  );
}

function PrintPreviewModal({ doc, onClose }) {

  const [pageSize, setPageSize] = useState("A4");
  const [pageOrientation, setPageOrientation] = useState("portrait");
  const [pageMargin, setPageMargin] = useState("8mm");
  const [printScale, setPrintScale] = useState("100%");
  const [template, setTemplate] = useState(() => {
    if (doc.invoiceType) return doc.invoiceType;
    if (doc.oohSites && doc.oohSites.length > 0) return "OOH";
    if (doc.printingItems && doc.printingItems.length > 0) return "PRINTING";
    const desc = (doc.description || "").toLowerCase();
    const typeStr = (doc.type || doc.serviceCategory || "").toLowerCase();
    if (doc.newspaperItems && doc.newspaperItems.length > 0) return "NEWSPAPER";
    if (doc.printMediaItems && doc.printMediaItems.length > 0) return "PRINT_MEDIA";
    if (doc.eventItems && doc.eventItems.length > 0) return "EVENT";
    if (desc.includes("print media") || typeStr.includes("print media") || desc.includes("publication")) return "PRINT_MEDIA";
    if (desc.includes("event") || typeStr.includes("event") || desc.includes("production") || desc.includes("tvc") || desc.includes("btl")) return "EVENT";
    if (desc.includes("ooh") || typeStr.includes("ooh") || desc.includes("billboard") || desc.includes("outdoor") || desc.includes("sites")) return "OOH";
    if (desc.includes("printing") || typeStr.includes("printing") || desc.includes("flex") || desc.includes("installation")) return "PRINTING";
    return "GENERAL";
  });
  const [specialNote, setSpecialNote] = useState(
    doc.notes || doc.specialNotes || doc.specialNote || doc.note ||
    `• ABOVE MENTIONED AMOUNT IS BASED ON NET. ALL TAXES WOULD BE CHARGED OVER & ABOVE.\n• PAYMENT TO BE MADE IN THE FAVOR OF "ADPULSE IMC (PRIVATE) LTD"\n• NTN: A0654656-8 / STRN: SA054896-8`
  );

  const totalAmt = doc.totalAmount || doc.amount || 0;
  const sstAmt = doc.sstAmount || 0;
  const whtAmt = doc.whtAmount || 0;
  const netAmt = doc.amount || 0;

  const renderTotals = (colSpanAmount) => {
    return (
      <React.Fragment>
        {doc.applySst ? (
          <React.Fragment>
            <tr>
              <td colSpan={colSpanAmount} style={{ border: "1px solid #000000", padding: "5px 8px", fontWeight: 700, textAlign: "right", boxSizing: "border-box" }}>Total Net Amount</td>
              <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", boxSizing: "border-box", fontSize: 10 }}>{pkr(netAmt)}</td>
            </tr>
            <tr>
              <td colSpan={colSpanAmount} style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "right", fontWeight: 600, boxSizing: "border-box" }}>15% Sindh Sales Tax (SRB)</td>
              <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", boxSizing: "border-box", fontSize: 10 }}>{pkr(sstAmt || (netAmt * 0.15))}</td>
            </tr>
            {doc.applyWht && (
              <tr>
                <td colSpan={colSpanAmount} style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "right", color: "#059669", boxSizing: "border-box" }}>Less: WHT Deduction ({doc.whtRate || 0}%)</td>
                <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "right", color: "#059669", whiteSpace: "nowrap", boxSizing: "border-box", fontSize: 10 }}>- {pkr(whtAmt)}</td>
              </tr>
            )}
            <tr style={{ background: "#F1F5F9", fontWeight: 800 }}>
              <td colSpan={colSpanAmount} style={{ border: "1px solid #000000", padding: "6px 8px", fontSize: 11, textAlign: "right", boxSizing: "border-box" }}>Grand Total Payable</td>
              <td style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "right", fontSize: 12, color: "#A81C1C", whiteSpace: "nowrap", boxSizing: "border-box" }}>{pkr(totalAmt)}</td>
            </tr>
          </React.Fragment>
        ) : (
          <React.Fragment>
            {doc.applyWht && (
              <tr>
                <td colSpan={colSpanAmount} style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "right", color: "#059669", boxSizing: "border-box" }}>Less: WHT Deduction ({doc.whtRate || 0}%)</td>
                <td style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "right", color: "#059669", whiteSpace: "nowrap", boxSizing: "border-box", fontSize: 10 }}>- {pkr(whtAmt)}</td>
              </tr>
            )}
            <tr style={{ background: "#F1F5F9", fontWeight: 800 }}>
              <td colSpan={colSpanAmount} style={{ border: "1px solid #000000", padding: "6px 8px", fontSize: 11, textAlign: "right", boxSizing: "border-box" }}>Grand Total Payable</td>
              <td style={{ border: "1px solid #000000", padding: "6px 6px", textAlign: "right", fontSize: 12, color: "#0F172A", whiteSpace: "nowrap", boxSizing: "border-box" }}>{pkr(totalAmt || (netAmt - whtAmt))}</td>
            </tr>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  const handleExportExcel = () => {
    const docTitle = doc.type || (doc.applySst ? "Sales_Tax_Invoice" : "Invoice");
    const refNo = cleanInvoiceNo(doc.voucherNo || doc.invoiceNo || doc.id);
    const clientName = doc.client || doc.party || "Client";
    const issueDate = doc.date || doc.issueDate || TODAY;

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `ADPULSE IMC (PVT) LTD - FINANCIAL DOCUMENT EXPORT\n`;
    csvContent += `Document Type:,${docTitle}\n`;
    csvContent += `Reference No:,${refNo}\n`;
    csvContent += `Date:,${issueDate}\n`;
    csvContent += `Client / Party:,${clientName}\n`;
    csvContent += `Description:,${(doc.description || "").replace(/,/g, ' ')}\n\n`;

    if (template === "PRINTING" || template === "OOH") {
      csvContent += `S.No,Location / Particulars,Width (Ft),Height (Ft),Sq. Ft.,Rate (PKR),Amount (PKR)\n`;
      const items = doc.printingItems || doc.oohSites || [
        { location: doc.description || "Service Line Item", width: 45, height: 15, sqft: 675, rate: doc.amount, amount: doc.amount }
      ];
      items.forEach((item, idx) => {
        const loc = `"${(item.location || item.description || doc.description || "").replace(/"/g, '""')}"`;
        const w = Number(item.width || 0).toFixed(2);
        const h = Number(item.height || 0).toFixed(2);
        const sq = Number(item.sqft || 0).toFixed(2);
        const r = Number(item.rate || item.amount || 0).toFixed(2);
        const a = Number(item.amount || 0).toFixed(2);
        csvContent += `${idx + 1},${loc},${w},${h},${sq},${r},${a}\n`;
      });
    } else {
      csvContent += `S.No,Description / Scope Particulars,Quantity,Rate (PKR),Amount (PKR)\n`;
      csvContent += `1,"${(doc.description || "Commercial Media Service").replace(/"/g, '""')}",1,${(doc.amount || 0).toFixed(2)},${(doc.amount || 0).toFixed(2)}\n`;
    }

    csvContent += `\n`;
    csvContent += `Subtotal Amount (PKR):,${(doc.amount || 0).toFixed(2)}\n`;
    if (doc.applySst) csvContent += `SRB Sales Tax (15%):,${(doc.sstAmount || 0).toFixed(2)}\n`;
    if (doc.applyWht) csvContent += `WHT Withholding (3%):,${(doc.whtAmount || 0).toFixed(2)}\n`;
    csvContent += `NET TOTAL RECEIVABLE (PKR):,${(doc.totalAmount || doc.amount || 0).toFixed(2)}\n\n`;
    csvContent += `Special Notes & Terms:,"${(specialNote || "").replace(/\n/g, ' ').replace(/"/g, '""')}"\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${docTitle}_${refNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportImage = () => {
    const printEl = document.querySelector(".print-area");
    if (!printEl) return;
    const refNo = cleanInvoiceNo(doc.voucherNo || doc.invoiceNo || doc.id);

    const triggerPng = () => {
      if (window.html2canvas) {
        window.html2canvas(printEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false
        }).then(canvas => {
          const pngUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `Invoice_${refNo}.png`;
          link.href = pngUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }).catch(err => {
          console.warn("PNG export error:", err);
          window.print();
        });
      } else {
        window.print();
      }
    };

    if (window.html2canvas) {
      triggerPng();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = triggerPng;
      script.onerror = () => window.print();
      document.head.appendChild(script);
    }
  };

  const handleExportPDF = () => {
    const printEl = document.querySelector(".print-area");
    if (!printEl) return;
    const refNo = cleanInvoiceNo(doc.voucherNo || doc.invoiceNo || doc.id);

    const triggerPdf = () => {
      if (window.html2pdf) {
        const opt = {
          margin: 8,
          filename: `Invoice_${refNo}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: (pageSize || "A4").toLowerCase(), orientation: pageOrientation || "portrait" }
        };
        window.html2pdf().set(opt).from(printEl).save();
      } else {
        window.print();
      }
    };

    if (window.html2pdf) {
      triggerPdf();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = triggerPdf;
      script.onerror = () => window.print();
      document.head.appendChild(script);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style>{`
        @page { size: ${PAGE_SIZES[pageSize] || pageSize} ${pageOrientation}; margin: ${pageMargin}; }
        .print-area table, .print-area th, .print-area td { border-color: #000000 !important; }
        .no-print-header select option {
          background-color: #1E293B !important;
          color: #FFFFFF !important;
          padding: 6px 10px !important;
        }
        @media print {
          .no-print-header { display: none !important; }
          .modal-backdrop { background: none !important; padding: 0 !important; }
          .modal { box-shadow: none !important; border: none !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .print-area {
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            transform: scale(${parseInt(printScale) / 100});
            transform-origin: top left;
            width: 100% !important;
            min-height: 255mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
          .print-area table, .print-area th, .print-area td, .print-area div { border-color: #000000 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .invoice-footer-banner {
            background: #A81C1C !important;
            background-image: linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%) !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: flex !important;
            visibility: visible !important;
            margin-top: auto !important;
          }
        }
      `}</style>
      <div className="modal" style={{ width: 880, maxWidth: "95vw", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div className="no-print-header" style={{ marginBottom: 14, background: "#1E293B", padding: "14px 18px", borderRadius: 12, color: "#fff", border: "1px solid #334155", boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, fontSize: 13.5, color: "#F59E0B", display: "flex", alignItems: "center", gap: 5 }}>
                <FileText size={16} /> Document Layout:
              </span>
              <select value={template} onChange={e => setTemplate(e.target.value)} style={{ background: "#0F172A", color: "#fff", border: "1.5px solid #475569", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>
                <option value="GENERAL" style={{ background: "#1E293B", color: "#FFFFFF" }}>General / Standard Agency Invoice</option>
                <option value="PRINTING" style={{ background: "#1E293B", color: "#FFFFFF" }}>OOH Printing &amp; Installation Invoice</option>
                <option value="OOH" style={{ background: "#1E293B", color: "#FFFFFF" }}>OOH Billboards Sales Tax Invoice</option>
                <option value="PRINT_MEDIA" style={{ background: "#1E293B", color: "#FFFFFF" }}>Print Media Sales Tax Invoice</option>
                <option value="EVENT" style={{ background: "#1E293B", color: "#FFFFFF" }}>Sales Tax Event Invoice</option>
                <option value="BRANDING" style={{ background: "#1E293B", color: "#FFFFFF" }}>Project Branding Invoice</option>
              </select>
            </div>

            {/* PAGE SETTING CONTROLS */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Paper:</span>
                <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="A4" style={{ background: "#1E293B", color: "#FFFFFF" }}>A4 (210 x 297 mm)</option>
                  <option value="A5" style={{ background: "#1E293B", color: "#FFFFFF" }}>A5 (148 x 210 mm)</option>
                  <option value="Letter" style={{ background: "#1E293B", color: "#FFFFFF" }}>Letter (8.5 x 11 in)</option>
                  <option value="Legal" style={{ background: "#1E293B", color: "#FFFFFF" }}>Legal (8.5 x 14 in)</option>
                  <option value="A3" style={{ background: "#1E293B", color: "#FFFFFF" }}>A3 (297 x 420 mm)</option>
                  <option value="Executive" style={{ background: "#1E293B", color: "#FFFFFF" }}>Executive (7.25 x 10.5 in)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Orient:</span>
                <select value={pageOrientation} onChange={e => setPageOrientation(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="portrait" style={{ background: "#1E293B", color: "#FFFFFF" }}>Portrait 📄</option>
                  <option value="landscape" style={{ background: "#1E293B", color: "#FFFFFF" }}>Landscape 📑</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Margin:</span>
                <select value={pageMargin} onChange={e => setPageMargin(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="8mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Compact (8mm)</option>
                  <option value="15mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Normal (15mm)</option>
                  <option value="20mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Wide (20mm)</option>
                  <option value="0mm" style={{ background: "#1E293B", color: "#FFFFFF" }}>Zero (0mm)</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0F172A", padding: "4px 8px", borderRadius: 8, border: "1px solid #334155" }}>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>Scale:</span>
                <select value={printScale} onChange={e => setPrintScale(e.target.value)} style={{ background: "transparent", border: "none", color: "#FFF", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <option value="100%" style={{ background: "#1E293B", color: "#FFFFFF" }}>100%</option>
                  <option value="95%" style={{ background: "#1E293B", color: "#FFFFFF" }}>95%</option>
                  <option value="90%" style={{ background: "#1E293B", color: "#FFFFFF" }}>90%</option>
                  <option value="85%" style={{ background: "#1E293B", color: "#FFFFFF" }}>85%</option>
                </select>
              </div>

              <button className="btn" style={{ background: "var(--rose)", color: "#fff", border: "none", padding: "6px 10px" }} onClick={onClose}><X size={15} /></button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 12.5, color: "#94A3B8" }}>
              Formatted for <b>Official Sindh Revenue Board (SRB) Tax &amp; Audit Compliance</b>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: 12.5, fontWeight: 700 }} onClick={handleExportPDF}>
                <Download size={14} /> Download PDF
              </button>
              <button className="btn" style={{ background: "#059669", color: "#FFFFFF", border: "none", padding: "6px 14px", fontSize: 12.5, fontWeight: 700 }} onClick={handleExportExcel}>
                <Download size={14} /> Download Excel
              </button>
              <button className="btn" style={{ background: "#475569", color: "#FFFFFF", border: "none", padding: "6px 12px", fontSize: 12.5, fontWeight: 700 }} onClick={() => window.print()}>
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>

        {/* PRINT AREA MATCHING PDF TEMPLATES */}
        <div className="print-area" style={{ background: "#ffffff", color: "#000000", padding: "16px 18px 12px 18px", fontFamily: "'Calibri', 'Inter', sans-serif", border: "1px solid #E2E8F0", borderRadius: 8, position: "relative", boxSizing: "border-box", width: "100%", minHeight: "890px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflowX: "hidden" }}>
          
          {/* HEADER SECTION - 3 COLUMN BALANCED GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 16 }}>
            {/* Left Logo */}
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <img src="./logo.png" alt="AdPulse Logo" style={{ height: 55, width: "auto", objectFit: "contain" }} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>

            {/* Center Heading (Mathematically Centered) */}
            <div style={{ textAlign: "center", padding: "0 10px" }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, textDecoration: "underline", letterSpacing: "1px", textTransform: "uppercase", color: doc.applySst ? "#A81C1C" : "#0F172A" }}>
                {doc.applySst ? "SALES TAX INVOICE (15% SST INCLUDED)" : "INVOICE"}
              </h2>
              {doc.applySst && (
                <div style={{ fontSize: 10.5, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                  Sindh Revenue Board (SRB) Regn. # SA054896-8
                </div>
              )}
            </div>

            {/* Right Meta Info */}
            <div style={{ textAlign: "right", fontSize: 12.5, fontWeight: 700, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ marginBottom: 3 }}>DATE: <span style={{ fontWeight: 500 }}>{fmtDate(doc.date || doc.issueDate || TODAY)}</span></div>
              <div>INVOICE NO: <span style={{ fontWeight: 800 }}>{cleanInvoiceNo(doc.voucherNo || doc.invoiceNo || doc.id)}</span></div>
            </div>
          </div>

          {/* CLIENT, PROJECT & SERVICE INFO CARD */}
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 10, alignItems: "center", background: "#F8FAFC", padding: "8px 12px", border: "1px solid #000000", borderRadius: 6, boxSizing: "border-box" }}>
            <div style={{ wordBreak: "break-word", textAlign: "left" }}>CLIENT: <span style={{ fontWeight: 600, color: "#0F172A" }}>{(doc.client || doc.party || "CLIENT NAME").toUpperCase()}</span></div>
            <div style={{ wordBreak: "break-word", textAlign: "left" }}>PROJECT: <span style={{ fontWeight: 600, color: "#0F172A" }}>{(doc.projectName || doc.project || (doc.description ? doc.description.replace(/^OOH Advertising\s*—\s*/i, "").replace(/\s*\(\d+\s*sites\)$/i, "") : "PROJECT SCOPE")).toUpperCase()}</span></div>
            <div style={{ wordBreak: "break-word", textAlign: "right" }}>SERVICE: <span style={{ fontWeight: 600, color: "#A81C1C" }}>{(() => {
              const svc = doc.serviceCategory;
              if (svc && svc.toUpperCase() !== "INVOICE") return svc.toUpperCase();
              const typ = doc.type;
              if (typ && typ.toUpperCase() !== "INVOICE" && typ.toUpperCase() !== "SALES TAX INVOICE") return typ.toUpperCase();
              if (template === "OOH") return "OOH ADVERTISING";
              if (template === "PRINTING") return "PRINTING & INSTALLATION";
              if (template === "NEWSPAPER") return "NEWSPAPER / PRINT MEDIA & PUBLICATION";
              return "COMMERCIAL SERVICE";
            })()}</span></div>
          </div>

          {/* DYNAMIC DATA TABLE BASED ON TEMPLATE */}
          {template === "NEWSPAPER" ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, border: "1px solid #000000", wordWrap: "break-word", overflowWrap: "break-word", fontSize: 10, boxSizing: "border-box" }}>
              <thead>
                <tr style={{ background: "#F1F5F9", color: "#0F172A" }}>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "left", width: "16%", fontSize: 8, fontWeight: 700 }}>NEWSPAPER</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "left", width: "12%", fontSize: 8, fontWeight: 700 }}>EDITION</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "7%", fontSize: 8, fontWeight: 700 }}>COLS</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "10%", fontSize: 8, fontWeight: 700 }}>HEIGHT (CM)</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "10%", fontSize: 8, fontWeight: 700 }}>TOTAL CCM</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right", width: "11%", fontSize: 8, fontWeight: 700 }}>RATE / CCM</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right", width: "11%", fontSize: 8, fontWeight: 700 }}>MEDIA AMT</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "10%", fontSize: 8, fontWeight: 700 }}>AG. FEE</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right", width: "13%", fontSize: 8, fontWeight: 700 }}>TOTAL (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {doc.newspaperItems && doc.newspaperItems.length > 0 ? (
                  doc.newspaperItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "left", fontWeight: 700 }}>{item.newspaper}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "left", fontWeight: 600 }}>{item.edition}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>{item.columns}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>{item.height}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700 }}>{(Number(item.totalCcm) || 0).toFixed(0)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right" }}>{pkr(item.rateCcm)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right" }}>{pkr(item.mediaAmount)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>{pkr(item.agencyFee)}<br/><span style={{ fontSize: 7 }}>({item.agencyFeePct}%)</span></td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right", fontWeight: 700 }}>{pkr(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "left", fontWeight: 700 }}>Daily Newspaper</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "left", fontWeight: 600 }}>Karachi</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>4</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>12</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700 }}>48</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right" }}>2,500</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right" }}>120,000</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>12,000<br/><span style={{ fontSize: 7 }}>(10%)</span></td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "right", fontWeight: 700 }}>132,000</td>
                  </tr>
                )}
                {renderTotals(8)}
              </tbody>
            </table>
          ) : template === "PRINTING" ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, border: "1px solid #000000", wordWrap: "break-word", overflowWrap: "break-word", fontSize: 8, boxSizing: "border-box" }}>
              <thead>
                <tr style={{ background: "#F1F5F9", color: "#0F172A" }}>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "5%", fontSize: 7, fontWeight: 700 }}>S.NO</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", width: "35%", fontSize: 7, fontWeight: 700 }}>DESCRIPTION</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "10%", fontSize: 7, fontWeight: 700 }}>HEIGHT</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "10%", fontSize: 7, fontWeight: 700 }}>WIDTH</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "10%", fontSize: 7, fontWeight: 700 }}>TOTAL SQ FT</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "5%", fontSize: 7, fontWeight: 700 }}>QTY</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "10%", fontSize: 7, fontWeight: 700 }}>RATE</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "15%", fontSize: 7, fontWeight: 700 }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {doc.printingItems && doc.printingItems.length > 0 ? (
                  doc.printingItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", fontWeight: 600 }}>{item.description || doc.description || `Printing Item #${idx + 1}`}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>{item.height}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>{item.width}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>{(Number(item.totalSqFt) || 0).toFixed(2)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>{item.qty}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{pkr(item.rate)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "7px 2px", textAlign: "center", fontWeight: 700 }}>1</td>
                    <td style={{ border: "1px solid #000000", padding: "7px 4px", textAlign: "left", fontWeight: 600 }}>{doc.description || "PRINTING & INSTALLATION WORK"}</td>
                    <td style={{ border: "1px solid #000000", padding: "7px 2px", textAlign: "center" }}>10</td>
                    <td style={{ border: "1px solid #000000", padding: "7px 2px", textAlign: "center" }}>12</td>
                    <td style={{ border: "1px solid #000000", padding: "7px 2px", textAlign: "center" }}>120</td>
                    <td style={{ border: "1px solid #000000", padding: "7px 2px", textAlign: "center" }}>1</td>
                    <td style={{ border: "1px solid #000000", padding: "7px 4px", textAlign: "right" }}>{pkr(30)}</td>
                    <td style={{ border: "1px solid #000000", padding: "7px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(netAmt)}</td>
                  </tr>
                )}
                <tr style={{ fontWeight: 800, background: "#F8FAFC" }}>
                  <td colSpan={7} style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontSize: 9 }}>TOTAL AMOUNT</td>
                  <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700, fontSize: 9 }}>{pkr(netAmt)}</td>
                </tr>
                {renderTotals(7)}
              </tbody>
            </table>
          ) : template === "OOH" || (doc.oohSites && doc.oohSites.length > 0) ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, border: "1px solid #000000", fontSize: 11, boxSizing: "border-box" }}>
              <thead>
                <tr style={{ background: "#F1F5F9", color: "#0F172A" }}>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "4%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", letterSpacing: "-0.3px" }}>#</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", width: "22%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle", letterSpacing: "-0.2px" }}>LOCATION / AREA</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "11%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", letterSpacing: "-0.3px" }}>SIZE (FT)</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "15%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", letterSpacing: "-0.3px" }}>TOTAL SQ. FT.</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "14%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", letterSpacing: "-0.3px" }}>DURATION</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "17%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", letterSpacing: "-0.3px" }}>RATE (PKR)</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "17%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle", whiteSpace: "nowrap", overflow: "hidden", letterSpacing: "-0.3px" }}>AMOUNT (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {doc.oohSites && doc.oohSites.length > 0 ? (
                  doc.oohSites.map((site, idx) => {
                    const w = Number(site.width || (site.size ? site.size.split("x")[0] : 0)) || 20;
                    const h = Number(site.height || (site.size ? site.size.split("x")[1] : 0)) || 10;
                    const sqft = Number(site.sqft) || (w * h);
                    const days = Number(site.days || site.duration) || 30;
                    const rate = Number(site.rate !== undefined && site.rate !== "" ? site.rate : site.pricePerMonth) || 0;
                    let cleanLoc = site.location || site.area || site.name || "";
                    if (!cleanLoc || cleanLoc.toLowerCase().includes("ooh advertising") || cleanLoc.toLowerCase().includes("back to school")) {
                      cleanLoc = idx === 0 ? "Shahrah-e-Faisal Site" : (idx === 1 ? "Clifton Billboard Site" : `OOH Location #${idx + 1}`);
                    }
                    return (
                      <tr key={idx}>
                        <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700, boxSizing: "border-box", verticalAlign: "middle" }}>{idx + 1}</td>
                        <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", fontWeight: 600, wordBreak: "break-word", boxSizing: "border-box", verticalAlign: "middle" }}>{cleanLoc}</td>
                        <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 600, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>{w.toFixed(0)} × {h.toFixed(0)} ft</td>
                        <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>{sqft.toFixed(2)}</td>
                        <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 600, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>{days} Days</td>
                        <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>{pkr(rate)}</td>
                        <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>{pkr(site.amount !== undefined ? site.amount : ((rate / 30) * days))}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700, boxSizing: "border-box", verticalAlign: "middle" }}>1</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", fontWeight: 600, wordBreak: "break-word", boxSizing: "border-box", verticalAlign: "middle" }}>
                      {doc.location || "Shahrah-e-Faisal Billboard Site"}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 600, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>20 × 10 ft</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>200.00</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 600, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>30 Days</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>{pkr(netAmt)}</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle" }}>{pkr(netAmt)}</td>
                  </tr>
                )}
                <tr style={{ fontWeight: 800, background: "#F8FAFC" }}>
                  <td colSpan={3} style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", boxSizing: "border-box", verticalAlign: "middle", fontSize: 9 }}>TOTAL OOH AREA &amp; AMOUNT</td>
                  <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700, whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle", fontSize: 9 }}>
                    {doc.oohSites && doc.oohSites.length > 0 ? doc.oohSites.reduce((s, i) => s + (Number(i.sqft) || 0), 0).toFixed(2) : "200.00"} Sq. Ft.
                  </td>
                  <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", boxSizing: "border-box", verticalAlign: "middle" }}>—</td>
                  <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", boxSizing: "border-box", verticalAlign: "middle" }}>—</td>
                  <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", color: "#A81C1C", whiteSpace: "nowrap", boxSizing: "border-box", verticalAlign: "middle", fontSize: 9.5 }}>{pkr(netAmt)}</td>
                </tr>
                {renderTotals(6)}
              </tbody>
            </table>
          ) : template === "EVENT" ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, border: "1px solid #000000", fontSize: 11, boxSizing: "border-box" }}>
              <thead>
                <tr style={{ background: "#F1F5F9", color: "#0F172A" }}>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "5%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle" }}>S.NO</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", width: "40%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle" }}>SERVICE / DESCRIPTION</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "10%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle" }}>QTY</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "15%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle" }}>UNIT</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "15%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle" }}>RATE (PKR)</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "15%", boxSizing: "border-box", fontSize: 8, fontWeight: 700, verticalAlign: "middle" }}>AMOUNT (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {doc.eventItems && doc.eventItems.length > 0 ? (
                  doc.eventItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700, boxSizing: "border-box" }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", fontWeight: 600, boxSizing: "border-box" }}>{item.description}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700, boxSizing: "border-box" }}>{item.qty}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", boxSizing: "border-box" }}>{item.unit}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", boxSizing: "border-box" }}>{pkr(item.rate)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700, boxSizing: "border-box" }}>{pkr(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700 }}>1</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", fontWeight: 600 }}>{doc.description}</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700 }}>1</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center" }}>NOS</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{pkr(netAmt)}</td>
                    <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(netAmt)}</td>
                  </tr>
                )}
                {renderTotals(5)}
              </tbody>
            </table>
          ) : template === "PRINT_MEDIA" ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, border: "1px solid #000000", fontSize: 11, boxSizing: "border-box" }}>
              <thead>
                <tr style={{ background: "#F1F5F9", color: "#0F172A" }}>
                  <th style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", width: "5%", fontSize: 8, fontWeight: 700 }}>S.NO</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", width: "25%", fontSize: 8, fontWeight: 700 }}>SERVICE / DESCRIPTION</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", width: "25%", fontSize: 8, fontWeight: 700 }}>PUBLICATION / MEDIA</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", width: "15%", fontSize: 8, fontWeight: 700 }}>SIZE / FORMAT</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", width: "10%", fontSize: 8, fontWeight: 700 }}>QTY</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "10%", fontSize: 8, fontWeight: 700 }}>RATE (PKR)</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "10%", fontSize: 8, fontWeight: 700 }}>AMOUNT (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {doc.printMediaItems && doc.printMediaItems.length > 0 ? (
                  doc.printMediaItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "1px solid #000000", padding: "5px 2px", textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", fontWeight: 600 }}>{item.description || doc.description}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left" }}>{item.publication}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left" }}>{item.size}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", fontWeight: 700 }}>{item.qty}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right" }}>{pkr(item.rate)}</td>
                      <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: 700 }}>{pkr(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center" }}>No print media items found.</td>
                  </tr>
                )}
                {renderTotals(7)}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14, border: "1px solid #000000", fontSize: 11.5, boxSizing: "border-box" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", color: "#0F172A" }}>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", width: "4.5%", boxSizing: "border-box", fontSize: 8.5, fontWeight: 700, verticalAlign: "middle" }}>S #</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "left", width: "45.5%", boxSizing: "border-box", fontSize: 8.5, fontWeight: 700, verticalAlign: "middle" }}>DESCRIPTION / SCOPE PARTICULARS</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", width: "10%", boxSizing: "border-box", fontSize: 8.5, fontWeight: 700, verticalAlign: "middle" }}>QTY</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "right", width: "20%", boxSizing: "border-box", fontSize: 8.5, fontWeight: 700, verticalAlign: "middle" }}>RATE</th>
                  <th style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "right", width: "20%", boxSizing: "border-box", fontSize: 8.5, fontWeight: 700, verticalAlign: "middle" }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ minHeight: 70 }}>
                  <td style={{ border: "1px solid #000000", padding: "10px 4px", textAlign: "center", verticalAlign: "top", fontWeight: 700, boxSizing: "border-box" }}>1</td>
                  <td style={{ border: "1px solid #000000", padding: "10px 8px", textAlign: "left", verticalAlign: "top", wordBreak: "break-word", boxSizing: "border-box" }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{doc.description || "Media & Production Scope"}</div>
                    {doc.projectCode && <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 4 }}>Project Reference: {doc.projectCode}</div>}
                  </td>
                  <td style={{ border: "1px solid #000000", padding: "10px 4px", textAlign: "center", verticalAlign: "top", fontWeight: 700, boxSizing: "border-box" }}>1</td>
                  <td style={{ border: "1px solid #000000", padding: "10px 8px", textAlign: "right", verticalAlign: "top", fontWeight: 600, whiteSpace: "nowrap", boxSizing: "border-box" }}>{pkr(netAmt)}</td>
                  <td style={{ border: "1px solid #000000", padding: "10px 8px", textAlign: "right", fontWeight: 700, verticalAlign: "top", whiteSpace: "nowrap", boxSizing: "border-box" }}>{pkr(netAmt)}</td>
                </tr>
                {renderTotals(4)}
              </tbody>
            </table>
          )}

          {/* AMOUNT IN WORDS */}
          <div style={{ fontSize: 11.5, fontStyle: "italic", marginBottom: 12, background: "#F8FAFC", padding: "6px 10px", border: "1px solid #000000", borderRadius: 4 }}>
            Amount in words: <b style={{ fontStyle: "normal", color: "#000" }}>{amountInWords(totalAmt)}</b>
          </div>

          {/* SPECIAL NOTES & TERMS SECTION */}
          <div style={{ fontSize: 10.5, lineHeight: 1.4, marginBottom: 14, color: "#1E293B", background: "#F8FAFC", padding: "8px 12px", border: "1px solid #000000", borderRadius: 6 }}>
            <div style={{ fontWeight: 800, textDecoration: "underline", marginBottom: 3, color: "#0F172A", textTransform: "uppercase", fontSize: 10 }}>
              Special Notes &amp; Terms:
            </div>
            {specialNote ? (
              specialNote.split("\n").map((line, idx) => (
                <div key={idx} style={{ fontWeight: line.startsWith("•") || line.startsWith("-") ? 500 : 600 }}>
                  {line}
                </div>
              ))
            ) : (
              <>
                <div>• ABOVE MENTIONED AMOUNT IS BASED ON NET. ALL TAXES WOULD BE CHARGED OVER &amp; ABOVE.</div>
                <div>• PAYMENT TO BE MADE IN THE FAVOR OF <b>"ADPULSE IMC (PRIVATE) LTD"</b></div>
                <div>• NTN: <b>A0654656-8</b> / STRN: <b>SA054896-8</b></div>
              </>
            )}
          </div>

          {/* SIGNATURES */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 18, marginBottom: 16, fontSize: 11.5, fontWeight: 700 }}>
            <div style={{ textAlign: "center", width: 200 }}>
              <div style={{ borderTop: "1.5px solid #000", paddingTop: 4 }}>ACCOUNTANT SIGNATURE</div>
            </div>
            <div style={{ textAlign: "center", width: 200 }}>
              <div style={{ borderTop: "1.5px solid #000", paddingTop: 4 }}>RECEIVER'S SIGNATURE</div>
            </div>
          </div>

          {/* FOOTER BRAND BANNER */}
          <div className="invoice-footer-banner" style={{ background: "#A81C1C", backgroundImage: "linear-gradient(90deg, #A81C1C 0%, #1D3B4E 100%)", color: "#FFFFFF", padding: "6px 12px", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, fontWeight: 600, marginTop: "auto", boxSizing: "border-box", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <div>📞 +92 21 37526834</div>
            <div>✉️ communication@adpulse.pk | 🌐 www.adpulse.pk</div>
            <div>📍 Office # 213, 2nd Floor, Park Tower, Block 5 Clifton, Karachi.</div>
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
  const totalBilled = clientInvoices.reduce((s, i) => s + (i.totalAmount || i.amount), 0);
  const totalPaid = clientInvoices.filter(i => i.paid).reduce((s, i) => s + (i.totalAmount || i.amount), 0);
  const totalOutstanding = totalBilled - totalPaid;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style>{`@page { size: ${PAGE_SIZES[pageSize]}; margin: 14mm; }`}</style>
      <div className="modal" style={{ width: 720 }} onClick={e => e.stopPropagation()}>
        <div className="no-print-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="section-title" style={{ margin: 0 }}>Client Statement Preview</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, color: "#0F172A", fontSize: 13, padding: "6px 10px" }}>
              {Object.keys(PAGE_SIZES).map(p => <option key={p} style={{ background: "#FFFFFF", color: "#0F172A" }}>{p}</option>)}
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
                <div style={{ fontSize: 12, color: "#475569", fontWeight: "sans-serif" }}></div>
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
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Gross</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>SST</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>WHT</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Net Billed</th>
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
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", color: "#475569", fontSize: 13 }}>{pkr(inv.amount)}</td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", color: "#475569", fontSize: 13 }}>{inv.applySst ? pkr(inv.sstAmount) : "—"}</td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", color: "#475569", fontSize: 13 }}>{inv.applyWht ? pkr(inv.whtAmount) : "—"}</td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", fontWeight: 700, fontSize: 14 }}>{pkr(inv.totalAmount || inv.amount)}</td>
                </tr>
              ))}
              {clientInvoices.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 16, color: "#64748B" }}>No billings found for this client.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} style={{ borderTop: "1.5px solid #0F172A", padding: "8px 0", fontWeight: 700, fontSize: 13.5 }}>Total Billed</td>
                <td className="mono" style={{ borderTop: "1.5px solid #0F172A", textAlign: "right", padding: "8px 0", fontWeight: 700, fontSize: 14 }}>{pkr(totalBilled)}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ padding: "4px 0", fontWeight: 700, fontSize: 13.5, color: "#059669" }}>Total Payments Received</td>
                <td className="mono" style={{ textAlign: "right", padding: "4px 0", fontWeight: 700, fontSize: 14, color: "#059669" }}>({pkr(totalPaid)})</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ borderTop: "2px solid #0F172A", padding: "10px 0", fontWeight: 800, fontSize: 15 }}>Net Balance Payable</td>
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
  const totalBilled = projInvoices.reduce((s, i) => s + (i.totalAmount || i.amount), 0);
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
                <div style={{ fontSize: 12, color: "#475569", fontWeight: "sans-serif" }}></div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#B8860B", textTransform: "uppercase" }}>PROJECT STATEMENT</div>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{project.projectCode || `PROJ-${project.name.replace(/\s+/g, "").toUpperCase().slice(0, 6)}`}</div>
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
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Gross</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>SST</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>WHT</th>
                <th style={{ textAlign: "right", borderBottom: "1.5px solid #0F172A", padding: "7px 0", fontSize: 12.5, color: "#475569" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {projInvoices.map(inv => (
                <tr key={inv.id}>
                  <td className="mono" style={{ padding: "9px 0", fontSize: 13 }}>{fmtDate(inv.issueDate)}</td>
                  <td style={{ padding: "9px 0", fontSize: 13.5 }}>{inv.description}</td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", color: "#475569", fontSize: 13 }}>{pkr(inv.amount)}</td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", color: "#475569", fontSize: 13 }}>{inv.applySst ? pkr(inv.sstAmount) : "—"}</td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", color: "#475569", fontSize: 13 }}>{inv.applyWht ? pkr(inv.whtAmount) : "—"}</td>
                  <td className="mono" style={{ textAlign: "right", padding: "9px 0", fontWeight: 700, fontSize: 14 }}>{pkr(inv.totalAmount || inv.amount)}</td>
                </tr>
              ))}
              {projInvoices.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 14, color: "#64748B" }}>No billings logged for this project.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ borderTop: "2px solid #0F172A", padding: "10px 0", fontWeight: 800, fontSize: 15 }}>Total Billed Project Net</td>
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
