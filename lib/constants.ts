// Business rules constants
export const BUSINESS_RULES = {
  MAX_REFERRALS_PER_INSTALLER: 5,
  REFERRER_REWARD_AMOUNT: 500,
  MAX_BULK_BATCH_SIZE: 500,
} as const;

// Product Models with their configurations
export interface ProductModels {
  value: string;
  label: string;
  reward?: number;
  requiresInverter?: boolean;
  isBattery?: boolean;
}
export const PRODUCT_MODELS: ProductModels[] = [
  // BATTERIES WITH INVERTERS
  {
    value: "TP LD-51 Battery with Fronus Inverter",
    label: "TP LD-51 Battery with Fronus Inverter",
    reward: 2000,
    requiresInverter: true,
    isBattery: true,
  },
  {
    value: "Fronus 5.12kW Battery with Fronus Inverter",
    label: "Fronus 5.12kW Battery with Fronus Inverter",
    reward: 2000,
    requiresInverter: true,
    isBattery: true,
  },
  {
    value: "TP LD-55 Ultra Battery with Fronus Inverter",
    label: "TP LD-55 Ultra Battery with Fronus Inverter",
    reward: 2000,
    requiresInverter: true,
    isBattery: true,
  },
  {
    value: "Titan 2.5kw Battery with Fronus Inverter",
    label: "Titan 2.5kw Battery with Fronus Inverter",
    reward: 2000,
    requiresInverter: true,
    isBattery: true,
  },
  {
    value: "Titan 15kW Battery with Fronus Inverter",
    label: "Titan 15kW Battery with Fronus Inverter",
    reward: 2000,
    requiresInverter: true,
    isBattery: true,
  },
  // PARALLEL BATTERIES
  {
    value: "TP LD-51 Battery Parallel",
    label: "TP LD-51 Battery Parallel",
    reward: 2000,
    requiresInverter: false,
    isBattery: true,
  },
  {
    value: "Fronus 5.12kW Battery Parallel",
    label: "Fronus 5.12kW Battery Parallel",
    reward: 2000,
    requiresInverter: false,
    isBattery: true,
  },
  {
    value: "TP LD-55 Ultra Battery Parallel",
    label: "TP LD-55 Ultra Battery Parallel",
    reward: 2000,
    requiresInverter: false,
    isBattery: true,
  },
  {
    value: "Titan 2.5kw Battery Parallel",
    label: "Titan 2.5kw Battery Parallel",
    reward: 2000,
    requiresInverter: false,
    isBattery: true,
  },
  {
    value: "Titan 15kW Battery Parallel",
    label: "Titan 15kW Battery Parallel",
    reward: 2000,
    requiresInverter: false,
    isBattery: true,
  },
  // BATTERIES
  {
    value: "TP LD-51 Battery",
    label: "TP LD-51 Battery",
    reward: 1500,
    requiresInverter: false,
    isBattery: true,
  },
  {
    value: "Fronus 5.12kW Battery",
    label: "Fronus 5.12kW Battery",
    reward: 1500,
    requiresInverter: false,
    isBattery: true,
  },
  {
    value: "TP LD-55 Ultra Battery",
    label: "TP LD-55 Ultra Battery",
    reward: 1500,
    requiresInverter: false,
    isBattery: true,
  },
  {
    value: "Titan 2.5kw Battery",
    label: "Titan 2.5kw Battery",
    reward: 1500,
    requiresInverter: false,
    isBattery: true,
  },
  {
    value: "Titan 15kW Battery",
    label: "Titan 15kW Battery",
    reward: 1500,
    requiresInverter: false,
    isBattery: true,
  },
  // INVERTERS
  {
    value: "4.2kW - PV 5200",
    label: "4.2kW - PV 5200",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "6.2kW - PV 7200",
    label: "6.2kW - PV 7200",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "8kW - PV 9200",
    label: "8kW - PV 9200",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "10kW - PV 12200",
    label: "10kW - PV 12200",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "6KW - X1 Genki",
    label: "6KW - X1 Genki",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "8kW - X1 Genki",
    label: "8kW - X1 Genki",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "10kW - X1 Genki",
    label: "10kW - X1 Genki",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "12kW - X1 Genki",
    label: "12kW - X1 Genki",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "10kW - X3 Genki",
    label: "10kW - X3 Genki",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "15kW - X3 Genki",
    label: "15kW - X3 Genki",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "5KW - X3 Mic G2",
    label: "5KW - X3 Mic G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "10KW - X3 Mic G2",
    label: "10KW - X3 Mic G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "15KW - X3 Mic G2",
    label: "15KW - X3 Mic G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "20KW - X3 Pro G2",
    label: "20KW - X3 Pro G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "25KW - X3 Pro G2",
    label: "25KW - X3 Pro G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "30KW - X3 Pro G2",
    label: "30KW - X3 Pro G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "40KW - X3 Mega G2",
    label: "40KW - X3 Mega G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "50KW - X3 Mega G2",
    label: "50KW - X3 Mega G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "60KW - X3 Mega G2",
    label: "60KW - X3 Mega G2",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "80KW - X3 Forth",
    label: "80KW - X3 Forth",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "100KW - X3 Forth",
    label: "100KW - X3 Forth",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "110KW - X3 Forth",
    label: "110KW - X3 Forth",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
  {
    value: "125KW - X3 Forth",
    label: "125KW - X3 Forth",
    reward: 1500,
    requiresInverter: false,
    isBattery: false,
  },
];

// Serial number statuses
export const SERIAL_STATUSES = [
  { value: "2025", label: "2025" },
  { value: "2025 - Not Found", label: "2025 - Not Found" },
  { value: "2024", label: "2024" },
  { value: "Not Found", label: "Not Found" },
];

export const PAYMENT_METHOD = [
  { value: "UBANK", label: "UBANK" },
  { value: "UPaisa", label: "UPaisa" },
  { value: "NayaPay", label: "NayaPay" },
];

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit Baltistan",
  "Islamabad",
  "Azad Jammu and Kashmir",
] as const;

export type Province = (typeof PROVINCES)[number];

export interface ProvinceLocationData {
  province: Province;
  districts: Record<string, { code: string; cities: string[] }>;
}

// Province > District > Cities. Source of truth for CITY_TO_PROVINCE,
// CITY_TO_DISTRICT, DISTRICT_CODES and CITIES below.
export const PAKISTAN_LOCATION_DATA: ProvinceLocationData[] = [
  {
    province: "Islamabad",
    districts: {
      Islamabad: { code: "ISB", cities: ["Islamabad"] },
    },
  },
  {
    province: "Punjab",
    districts: {
      Attock: { code: "ATK", cities: ["Attock", "Fateh Jang"] },
      Bahawalnagar: { code: "BWN", cities: ["Bahawalnagar", "Chishtian"] },
      Bahawalpur: { code: "BWP", cities: ["Bahawalpur", "Ahmadpur East"] },
      Bhakkar: { code: "BKK", cities: ["Bhakkar", "Darya Khan"] },
      Chakwal: { code: "CKW", cities: ["Chakwal", "Dhaular", "Talagang"] },
      Chiniot: { code: "CHT", cities: ["Chiniot", "Rabwah"] },
      "Dera Ghazi Khan": {
        code: "DGK",
        cities: ["Dera Ghazi Khan", "Mamoori"],
      },
      Faisalabad: {
        code: "FSD",
        cities: ["Faisalabad", "Jaranwala", "Soianwala"],
      },
      Gujranwala: {
        code: "GRW",
        cities: [
          "Gujranwala",
          "Ahmed Nager Chatha",
          "Ghakhar Mandi",
          "Kamoke",
          "Qila Didar Singh",
        ],
      },
      Gujrat: {
        code: "GRT",
        cities: [
          "Gujrat",
          "Dinga",
          "Jalalpur",
          "Jattan",
          "Kharian",
          "Lalamusa",
          "Sarai Alamgir",
        ],
      },
      Hafizabad: { code: "HFD", cities: ["Hafizabad"] },
      Jhang: { code: "JHG", cities: ["Jhang", "Shorkot"] },
      Jhelum: { code: "JLM", cities: ["Jhelum", "Dina", "Sohawa"] },
      Kasur: { code: "KSR", cities: ["Kasur"] },
      Khanewal: { code: "KWL", cities: ["Khanewal", "Mian Channu"] },
      Khushab: { code: "KSB", cities: ["Khushab", "Jauharabad"] },
      Lahore: { code: "LHE", cities: ["Lahore", "Raiwind", "Ali Khan Abad"] },
      Layyah: { code: "LYH", cities: ["Layyah", "Karor Lal Esan"] },
      Lodhran: { code: "LDR", cities: ["Lodhran"] },
      "Mandi Bahauddin": {
        code: "MBD",
        cities: ["Mandi Bahauddin", "Chillianwala", "Malakwal"],
      },
      Mianwali: { code: "MWL", cities: ["Mianwali", "Kalabagh"] },
      Multan: { code: "MUX", cities: ["Multan"] },
      Murree: { code: "MUR", cities: ["Murree"] },
      Muzaffargarh: {
        code: "MZG",
        cities: ["Muzaffargarh", "Alipur", "Jatoi"],
      },
      "Nankana Sahib": {
        code: "NNS",
        cities: ["Nankana Sahib", "Sangla Hill"],
      },
      Narowal: { code: "NWL", cities: ["Narowal", "Shakargarh"] },
      Okara: { code: "OKR", cities: ["Okara", "Haveli Lakha", "Renala Khurd"] },
      Pakpattan: { code: "PKP", cities: ["Pakpattan", "Arifwala"] },
      "Rahim Yar Khan": {
        code: "RYK",
        cities: ["Rahim Yar Khan", "Khanpur", "Liaquat Pur", "Sadiqabad"],
      },
      Rajanpur: { code: "RJP", cities: ["Rajanpur", "Jampur"] },
      Rawalpindi: {
        code: "RWP",
        cities: ["Rawalpindi", "Gujar Khan", "Taxila", "Wah Cantonment"],
      },
      Sahiwal: { code: "SWL", cities: ["Sahiwal", "Chichawatni"] },
      Sargodha: { code: "SGD", cities: ["Sargodha", "Bhera", "Bhalwal"] },
      Sheikhupura: {
        code: "SKP",
        cities: [
          "Sheikhupura",
          "Ferozewala",
          "Mianwali Bangla",
          "Muridke",
          "Safdarabad",
        ],
      },
      Sialkot: { code: "SKT", cities: ["Sialkot", "Daska", "Siranwali"] },
      "Toba Tek Singh": {
        code: "TTS",
        cities: ["Toba Tek Singh", "Gojra", "Kamalia", "Pir Mahal"],
      },
      Vehari: { code: "VHR", cities: ["Vehari", "Burewala", "Mailsi"] },
      Wazirabad: { code: "WZB", cities: ["Wazirabad"] },
      Pattoki: { code: "PTK", cities: ["Pattoki"] },
      Depalpur: { code: "DPL", cities: ["Depalpur"] },
      Hasilpur: { code: "HSP", cities: ["Hasilpur"] },
      Haroonabad: { code: "HRN", cities: ["Haroonabad"] },
      "Kot Addu": { code: "KAD", cities: ["Kot Addu"] },
      Taunsa: { code: "TNS", cities: ["Taunsa"] },
    },
  },
  {
    province: "Sindh",
    districts: {
      Badin: { code: "BDN", cities: ["Badin", "Rajo Khanani"] },
      Dadu: { code: "DDU", cities: ["Dadu", "Mehar"] },
      Ghotki: { code: "GTK", cities: ["Ghotki"] },
      Hyderabad: { code: "HYD", cities: ["Hyderabad", "Qasimabad"] },
      Jacobabad: { code: "JCD", cities: ["Jacobabad"] },
      Jamshoro: { code: "JMS", cities: ["Jamshoro", "Kotri"] },
      Karachi: { code: "KHI", cities: ["Karachi", "Nazimabad"] },
      Kashmore: { code: "KSM", cities: ["Kashmore", "Kandhkot", "Tangwani"] },
      Khairpur: { code: "KHP", cities: ["Khairpur", "Ranipur"] },
      Larkana: {
        code: "LRK",
        cities: ["Larkana", "Dokri", "Naudero", "Ratodero"],
      },
      Matiari: { code: "MTI", cities: ["Matiari", "Haala"] },
      "Mirpur Khas": { code: "MPK", cities: ["Mirpur Khas", "Digri"] },
      "Naushahro Feroze": {
        code: "NSF",
        cities: [
          "Naushahro Feroze",
          "Bhirkan",
          "Kandiaro",
          "Mehrabpur",
          "Mithani",
          "Moro",
          "Naushara",
        ],
      },
      "Qambar Shahdadkot": {
        code: "QSK",
        cities: ["Qambar", "Shahdadkot", "Warah"],
      },
      Sanghar: {
        code: "SGR",
        cities: ["Sanghar", "Shahdadpur", "Shahpur Chakar", "Tando Adam Khan"],
      },
      "Shaheed Benazirabad": { code: "SBA", cities: ["Nawabshah", "Sakrand"] },
      Shikarpur: { code: "SHK", cities: ["Shikarpur", "Chak"] },
      Sujawal: { code: "SJW", cities: ["Shahbandar"] },
      Sukkur: { code: "SKR", cities: ["Sukkur", "Rohri"] },
      "Tando Allahyar": { code: "TAY", cities: ["Tando Allahyar"] },
      "Tando Muhammad Khan": { code: "TMK", cities: ["Tando Muhammad Khan"] },
      Tharparkar: {
        code: "TPR",
        cities: ["Diplo", "Islamkot", "Mithi", "Nagarparkar"],
      },
      Thatta: { code: "TTA", cities: ["Thatta", "Jungshahi", "Keti Bandar"] },
      Umerkot: { code: "UMK", cities: ["Umerkot"] },
    },
  },
  {
    province: "Khyber Pakhtunkhwa",
    districts: {
      Abbottabad: { code: "ATD", cities: ["Abbottabad", "Ayubia", "Birote"] },
      Bajaur: { code: "BJR", cities: ["Khar", "Nawagai", "Utmanzai"] },
      Bannu: { code: "BNU", cities: ["Bannu"] },
      Batagram: { code: "BTG", cities: ["Battagram"] },
      Buner: { code: "BNR", cities: ["Buner", "Daggar"] },
      Charsadda: { code: "CSD", cities: ["Charsadda", "Tangi"] },
      Chitral: { code: "CTR", cities: ["Chitral", "Drosh", "Mastuj"] },
      "Dera Ismail Khan": {
        code: "DIK",
        cities: ["Dera Ismail Khan", "Kulachi", "Paharpur"],
      },
      Hangu: { code: "HGU", cities: ["Hangu", "Doaba", "Thall"] },
      Haripur: { code: "HRP", cities: ["Haripur"] },
      Karak: { code: "KRK", cities: ["Karak", "Banda Daud Shah", "Latamber"] },
      Khyber: { code: "KBR", cities: ["Landi Kotal", "Michni"] },
      Kohat: { code: "KHT", cities: ["Kohat"] },
      Kohistan: { code: "KSN", cities: ["Dassu", "Kolia"] },
      Kurram: { code: "KRM", cities: ["Lower Kurram", "Upper Kurram"] },
      "Lakki Marwat": { code: "LKM", cities: ["Lakki Marwat"] },
      "Lower Dir": { code: "LWD", cities: ["Chakdara", "Timergara"] },
      Malakand: { code: "MKD", cities: ["Batkhela", "Dargai"] },
      Mansehra: { code: "MNS", cities: ["Mansehra"] },
      Mardan: { code: "MDN", cities: ["Mardan"] },
      Mohmand: { code: "MMD", cities: ["Ghalanai", "Pirsai"] },
      "North Waziristan": { code: "NWS", cities: ["Miranshah", "Datta Khel"] },
      Nowshera: { code: "NSR", cities: ["Nowshera", "Akora Khattak", "Pabbi"] },
      Orakzai: { code: "OKZ", cities: ["Kalach", "Singai"] },
      Peshawar: { code: "PEW", cities: ["Peshawar", "Adezai"] },
      Shangla: {
        code: "SGL",
        cities: ["Shangla", "Alpuri", "Bisham", "Martung"],
      },
      "South Waziristan": { code: "SWS", cities: ["Wana", "Spinkai"] },
      Swabi: { code: "SWB", cities: ["Swabi", "Shewa Adda", "Tordher"] },
      Swat: {
        code: "SWT",
        cities: ["Swat", "Madyan", "Mingora", "Saidu Sharif"],
      },
      Tank: { code: "TNK", cities: ["Tank"] },
      Torghar: { code: "TGH", cities: ["Kala Dhaka"] },
      "Upper Dir": { code: "UPD", cities: ["Dir"] },
    },
  },
  {
    province: "Balochistan",
    districts: {
      Awaran: { code: "AWN", cities: ["Awaran"] },
      Barkhan: { code: "BKN", cities: ["Barkhan"] },
      Chagai: { code: "CGH", cities: ["Chagai"] },
      Chaman: { code: "CMN", cities: ["Chaman"] },
      "Dera Bugti": { code: "DBG", cities: ["Dera Bugti"] },
      Duki: { code: "DKI", cities: ["Duki"] },
      Gwadar: { code: "GWD", cities: ["Gwadar"] },
      Harnai: { code: "HNI", cities: ["Harnai"] },
      Hub: { code: "HUB", cities: ["Hub"] },
      Jafarabad: { code: "JFB", cities: ["Jafarabad"] },
      "Jhal Magsi": { code: "JHM", cities: ["Jhal Magsi"] },
      Kachhi: { code: "KCH", cities: ["Kachhi"] },
      Kalat: { code: "KLT", cities: ["Kalat"] },
      Kech: { code: "KEC", cities: ["Kech"] },
      Kharan: { code: "KRN", cities: ["Kharan"] },
      Khuzdar: { code: "KZD", cities: ["Khuzdar"] },
      "Killa Abdullah": { code: "KAB", cities: ["Killa Abdullah"] },
      "Killa Saifullah": { code: "KSF", cities: ["Killa Saifullah"] },
      Kohlu: { code: "KLU", cities: ["Kohlu"] },
      Lasbela: { code: "LSB", cities: ["Lasbela"] },
      Loralai: { code: "LRL", cities: ["Loralai"] },
      Mastung: { code: "MSG", cities: ["Mastung"] },
      Musakhel: { code: "MSK", cities: ["Musakhel"] },
      Nasirabad: { code: "NSD", cities: ["Nasirabad"] },
      Nushki: { code: "NSK", cities: ["Nushki"] },
      Panjgur: { code: "PJG", cities: ["Panjgur"] },
      Pishin: { code: "PSN", cities: ["Pishin"] },
      Quetta: { code: "QTA", cities: ["Quetta"] },
      Sherani: { code: "SRN", cities: ["Sherani"] },
      Sibi: { code: "SBI", cities: ["Sibi", "Lehri"] },
      Sohbatpur: { code: "SBP", cities: ["Sohbatpur"] },
      "Usta Muhammad": { code: "UMD", cities: ["Usta Muhammad"] },
      Washuk: { code: "WSK", cities: ["Washuk"] },
      Zhob: { code: "ZHB", cities: ["Zhob"] },
      Ziarat: { code: "ZRT", cities: ["Ziarat"] },
    },
  },
  {
    province: "Gilgit Baltistan",
    districts: {
      Astore: { code: "AST", cities: ["Astore"] },
      Diamer: { code: "DMR", cities: ["Chilas", "Tangir"] },
      Ghanche: { code: "GNC", cities: ["Khaplu"] },
      Ghizer: { code: "GZR", cities: ["Gahkuch"] },
      Gilgit: { code: "GLT", cities: ["Gilgit", "Danyor"] },
      Hunza: { code: "HZA", cities: ["Karimabad", "Aliabad"] },
      Kharmang: { code: "KMG", cities: ["Kharmang"] },
      Nagar: { code: "NGR", cities: ["Nagar"] },
      Shigar: { code: "SHG", cities: ["Shigar"] },
      Skardu: { code: "KDU", cities: ["Skardu"] },
    },
  },
  {
    province: "Azad Jammu and Kashmir",
    districts: {
      Bagh: { code: "BGH", cities: ["Bagh"] },
      Bhimber: { code: "BMB", cities: ["Bhimber"] },
      "Hattian Bala": { code: "HTB", cities: ["Hattian Bala"] },
      Haveli: { code: "HVL", cities: ["Forward Kahuta", "Mang"] },
      Kotli: { code: "KTL", cities: ["Kotli", "Nakyal"] },
      Mirpur: { code: "MIR", cities: ["Mirpur", "Dadyal"] },
      Muzaffarabad: { code: "MZD", cities: ["Muzaffarabad", "Hattian"] },
      Neelum: { code: "NLM", cities: ["Athmuqam"] },
      Poonch: { code: "PCH", cities: ["Rawalakot", "Hajira"] },
      Sudhnoti: { code: "SDT", cities: ["Pallandri", "Trarkhel"] },
    },
  },
];

// City to province mapping, derived from PAKISTAN_LOCATION_DATA.
export const CITY_TO_PROVINCE: Record<string, Province> = {};
// City to district mapping, derived from PAKISTAN_LOCATION_DATA.
export const CITY_TO_DISTRICT: Record<string, string> = {};
// District name to 3-letter code, derived from PAKISTAN_LOCATION_DATA.
export const DISTRICT_CODES: Record<string, string> = {};
// City to its district's 3-letter code, derived from PAKISTAN_LOCATION_DATA.
export const CITY_TO_DISTRICT_CODE: Record<string, string> = {};

for (const { province, districts } of PAKISTAN_LOCATION_DATA) {
  for (const [district, { code, cities }] of Object.entries(districts)) {
    DISTRICT_CODES[district] = code;
    for (const city of cities) {
      CITY_TO_PROVINCE[city] = province;
      CITY_TO_DISTRICT[city] = district;
      CITY_TO_DISTRICT_CODE[city] = code;
    }
  }
}

// List of all cities derived from the mapping
export const CITIES = Object.keys(CITY_TO_PROVINCE);

export interface Bank {
  value: string;
  label: string;
  shortcut: string;
  matchcase: string;
  mobile?: boolean;
}

export const BANKS: Bank[] = [
  // DIGITAL PAYMENT METHODS
  {
    matchcase: "Mobilink Bank/JazzCash",
    value: "jazzcash",
    label: "Jazzcash",
    shortcut: "JCS",
    mobile: true,
  },
  {
    matchcase: "Telenor Microfinance Bank",
    value: "easypaisa",
    label: "Easypaisa",
    shortcut: "ETP",
    mobile: true,
  },
  {
    matchcase: "NayaPay",
    value: "nayapay",
    label: "NayaPay",
    shortcut: "NPY",
    mobile: true,
  },
  {
    matchcase: "SadaPay",
    value: "sadapay",
    label: "SadaPay",
    shortcut: "SDP",
    mobile: true,
  },
  {
    matchcase: "FINJA EMI",
    value: "finja",
    label: "Finja",
    shortcut: "FNJ",
    mobile: true,
  },
  {
    matchcase: "Keenu",
    value: "keenu",
    label: "Keenu",
    shortcut: "KNU",
    mobile: true,
  },

  // COMMERCIAL BANKS
  { matchcase: "ABL", value: "abl", label: "Allied Bank Ltd", shortcut: "ABL" },
  {
    matchcase: "Apna Bank",
    value: "apnabank",
    label: "Apna Bank",
    shortcut: "AMBL",
  },
  { matchcase: "Ubank", value: "ubank", label: "Ubank", shortcut: "UBK" },
  {
    matchcase: "National Savings",
    value: "nationalsavings",
    label: "National Savings",
    shortcut: "NSB",
  },
  {
    matchcase: "Samba",
    value: "sambabank",
    label: "Samba Bank Ltd",
    shortcut: "SMBL",
  },
  {
    matchcase: "Digitt",
    value: "Digittbank",
    label: "Digitt Bank",
    shortcut: "DGT",
  },
  {
    matchcase: "FINCA Microfinance",
    value: "finca",
    label: "FINCA Microfinance Bank",
    shortcut: "FMB",
  },
  {
    matchcase: "Askari Bank",
    value: "askari",
    label: "Askari Bank Ltd",
    shortcut: "ASK",
  },
  {
    matchcase: "Bank of Khyber",
    value: "bok",
    label: "The Bank of Khyber",
    shortcut: "BOK",
  },
  {
    matchcase: "Bank of Punjab",
    value: "bop",
    label: "The Bank of Punjab",
    shortcut: "BOP",
  },
  {
    matchcase: "Burj Bank",
    value: "burjbank",
    label: "Burj Bank Ltd",
    shortcut: "BRJ",
  },
  {
    matchcase: "Citi Bank",
    value: "citibank",
    label: "Citibank N.A.",
    shortcut: "CIT",
  },
  {
    matchcase: "Faysal Bank",
    value: "faysal",
    label: "Faysal Bank Ltd",
    shortcut: "FBL",
  },
  {
    matchcase: "HBL/KONNECT",
    value: "hbl",
    label: "Habib Bank Ltd",
    shortcut: "HBL",
  },
  {
    matchcase: "ICBC",
    value: "icbc",
    label: "Industrial and Commercial Bank of China",
    shortcut: "ICBC",
  },
  {
    matchcase: "Habib Metro",
    value: "habibmetro",
    label: "Habib Metropolitan Bank Ltd",
    shortcut: "HMB",
  },
  {
    matchcase: "Khushhali Bank",
    value: "khushhali",
    label: "Khushhali Microfinance Bank Ltd",
    shortcut: "KMBL",
  },
  { matchcase: "JS Bank", value: "js", label: "JS Bank Ltd", shortcut: "JSB" },
  { matchcase: "MCB", value: "mcb", label: "MCB Bank Ltd", shortcut: "MCB" },
  {
    matchcase: "NBP",
    value: "nbp",
    label: "National Bank of Pakistan",
    shortcut: "NBP",
  },
  {
    matchcase: "NBP Funds",
    value: "nbpfunds",
    label: "National Bank of Pakistan Funds",
    shortcut: "NBPF",
  },
  {
    matchcase: "NRSP Bank",
    value: "nrsp",
    label: "NRSP Bank Ltd",
    shortcut: "NRSP",
  },
  {
    matchcase: "Sindh Bank",
    value: "sindh",
    label: "Sindh Bank Ltd",
    shortcut: "SIBL",
  },
  {
    matchcase: "Silk Bank",
    value: "silkbank",
    label: "Silkbank Ltd",
    shortcut: "SILB",
  },
  {
    matchcase: "Soneri",
    value: "soneri",
    label: "Soneri Bank Ltd",
    shortcut: "SNBL",
  },
  {
    matchcase: "Standard Chartered",
    value: "scb",
    label: "Standard Chartered Bank Ltd",
    shortcut: "SCB",
  },
  {
    matchcase: "Summit Bank",
    value: "summit",
    label: "Summit Bank Ltd",
    shortcut: "SBL",
  },
  { matchcase: "UBL", value: "ubl", label: "United Bank Ltd", shortcut: "UBL" },
  {
    matchcase: "ZTBL",
    value: "ztbl",
    label: "Zarai Taraqiati Bank Ltd.",
    shortcut: "ZTB",
  },

  // ISLAMIC BANKS
  {
    matchcase: "Al Baraka",
    value: "albaraka",
    label: "AlBaraka Bank Ltd",
    shortcut: "ABB",
  },
  {
    matchcase: "Bank AlHabib",
    value: "alhabib",
    label: "Bank AL Habib Ltd",
    shortcut: "BAH",
  },
  {
    matchcase: "Bank Alfalah",
    value: "alfalah",
    label: "Bank Alfalah Ltd",
    shortcut: "BAF",
  },
  {
    matchcase: "Bank Islami",
    value: "bankislami",
    label: "BankIslami Pakistan Ltd",
    shortcut: "BIP",
  },
  {
    matchcase: "Dubai Islamic",
    value: "dubaiislamic",
    label: "Dubai Islamic Bank Pakistan Ltd",
    shortcut: "DIB",
  },
  {
    matchcase: "Meezan Bank",
    value: "meezan",
    label: "Meezan Bank Ltd",
    shortcut: "MBL",
  },
  {
    matchcase: "MCB Islamic",
    value: "mcbislamic",
    label: "MCB Islamic Bank",
    shortcut: "MCBI",
  },
  {
    matchcase: "MCB ARIF HABIB",
    value: "mcbarifhabib",
    label: "MCB Arif Habib Bank Ltd",
    shortcut: "MCBAH",
  },
];

export function getBankLabel(bankName: string): string {
  if (!bankName) return bankName;
  const bank = BANKS.find(
    (b) =>
      b.label === bankName ||
      b.value === bankName ||
      b.shortcut === bankName ||
      b.matchcase === bankName,
  );
  return bank ? bank.label : bankName;
}
