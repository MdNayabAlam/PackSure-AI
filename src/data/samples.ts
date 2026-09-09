export interface SampleDeclarations {
  productName: string;
  manufacturer: string;
  address: string;
  netQty: string;
  mrp: string;
  usp: string;
  mfgDate: string;
  consumerCare: string;
  countryOrigin: string;
  category: string;
  channel: string;
  packArea: string;
  fontHeight: string;
  notes: string;
  isImport: boolean;
  [key: string]: string | boolean;
}

export interface SampleCase {
  key: string;
  tag: string;
  label: string;
  blurb: string;
  image: string;
  declarations: SampleDeclarations;
  conf: Record<string, number>;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    key: 'compliant-rice',
    tag: 'Fully compliant',
    label: 'Malabar Basmati Rice · 500 g',
    blurb: 'Clean retail pack. All Rule 6 declarations present, metric units, tax-inclusive MRP.',
    image: '/images/spice-packs.jpg',
    declarations: {
      productName: 'Malabar Premium Basmati Rice',
      manufacturer: 'Malabar Foods Pvt. Ltd.',
      address: 'Plot 44, MIDC Industrial Area, Pune, Maharashtra 411026',
      netQty: '500 g',
      mrp: 'MRP ₹ 145.00 (incl. of all taxes)',
      usp: '₹ 290.00 per kg',
      mfgDate: 'MFD 06/2026',
      consumerCare: 'Customer Care: 1800-266-7788, care@malabarfoods.in',
      countryOrigin: 'India',
      category: 'Food',
      channel: 'retail',
      packArea: '320',
      fontHeight: '3',
      notes: '',
      isImport: false,
    },
    conf: { productName: 98, manufacturer: 96, address: 94, netQty: 97, mrp: 99, usp: 93, mfgDate: 95, consumerCare: 92, countryOrigin: 99 },
  },
  {
    key: 'missing-mrp',
    tag: 'Missing declarations',
    label: 'GlowSilk Face Cream · 50 g',
    blurb: 'Cosmetic pack with no MRP and no consumer-care contact — two critical failures.',
    image: '/images/pack-cosmetic.jpg',
    declarations: {
      productName: 'GlowSilk Herbal Face Cream',
      manufacturer: 'GlowSilk Cosmetics',
      address: 'Baddi Industrial Estate, Himachal Pradesh 173205',
      netQty: '50 g',
      mrp: '',
      usp: '',
      mfgDate: 'MFD 02/2026',
      consumerCare: '',
      countryOrigin: 'India',
      category: 'Cosmetics',
      channel: 'retail',
      packArea: '',
      fontHeight: '',
      notes: '',
      isImport: false,
    },
    conf: { productName: 95, manufacturer: 93, address: 90, netQty: 96, mrp: 0, usp: 0, mfgDate: 91, consumerCare: 0, countryOrigin: 99 },
  },
  {
    key: 'small-font',
    tag: 'Incorrect declaration',
    label: 'EverBite Biscuits · 300 g',
    blurb: 'Net-quantity numerals measure ~1.2 mm on a 210 cm² panel — below the Fifth Schedule minimum of 2 mm.',
    image: '/images/pack-food.jpg',
    declarations: {
      productName: 'EverBite Glucose Biscuits',
      manufacturer: 'EverBite Foods',
      address: 'Vapi GIDC, Gujarat 396195',
      netQty: '300 g',
      mrp: 'MRP ₹ 60.00 (incl. of all taxes)',
      usp: '₹ 200.00 per kg',
      mfgDate: 'PKD 08/2026',
      consumerCare: 'Care: 1800-419-2200',
      countryOrigin: 'India',
      category: 'Food',
      channel: 'retail',
      packArea: '210',
      fontHeight: '1.2',
      notes: '',
      isImport: false,
    },
    conf: { productName: 96, manufacturer: 94, address: 90, netQty: 97, mrp: 98, usp: 90, mfgDate: 93, consumerCare: 89, countryOrigin: 99 },
  },
  {
    key: 'blurry-pharma',
    tag: 'Uncertain image',
    label: 'NovaCure Vitamin-C · 60 N',
    blurb: 'Foil pouch with glare. MRP and date numerals are unreadable — routed to manual review, not failed.',
    image: '/images/pack-pharma.jpg',
    declarations: {
      productName: 'NovaCure Vitamin-C Chewables',
      manufacturer: 'NovaCure Lifesciences',
      address: 'Plot 9, Pharma Zone, Hyderabad 500090',
      netQty: '60 N tablets',
      mrp: 'MRP ₹ 2?9.00 (uncertain)',
      usp: '',
      mfgDate: 'MFD 0?/2026 (unreadable)',
      consumerCare: 'Customer care 040-6712 4400, customercare@novacure.in',
      countryOrigin: 'India',
      category: 'Pharma',
      channel: 'retail',
      packArea: '',
      fontHeight: '',
      notes: 'glare on foil; digits 2 and 9 uncertain',
      isImport: false,
    },
    conf: { productName: 88, manufacturer: 84, address: 70, netQty: 52, mrp: 38, usp: 0, mfgDate: 41, consumerCare: 81, countryOrigin: 99 },
  },
  {
    key: 'repeat-import',
    tag: 'Repeat violation',
    label: 'VoltLite LED Bulb · 9 W',
    blurb: 'Imported bulb, previously flagged (LMPC-2026-QQ11). Same MRP defect recurring — enforcement escalated.',
    image: '/images/factory-line.jpg',
    declarations: {
      productName: 'VoltLite LED Bulb 9W (Pack of 1)',
      manufacturer: 'VoltLite Electricals (Importer: TrueNorth Traders)',
      address: 'Imported by TrueNorth Traders, Ballard Estate, Mumbai 400001',
      netQty: '1 N (9 W bulb)',
      mrp: 'Rs. 349 (taxes extra)',
      usp: '',
      mfgDate: 'Imported 01/2026',
      consumerCare: 'support@voltlite.in, 1800-572-9900',
      countryOrigin: 'Vietnam',
      category: 'Electronics',
      channel: 'retail',
      packArea: '140',
      fontHeight: '2.4',
      notes: '',
      isImport: true,
    },
    conf: { productName: 94, manufacturer: 90, address: 86, netQty: 92, mrp: 95, usp: 0, mfgDate: 88, consumerCare: 90, countryOrigin: 93 },
  },
];
