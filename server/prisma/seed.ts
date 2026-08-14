import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const DEFAULT_POSTGRES_URL = 'postgresql://database_fplv_user:mhFh1bnyfLV4jpId5R0D8t7osV0Nlx0T@dpg-d9v6fa67bikc73bsvnhg-a/database_fplv';
let dbUrl = (process.env.DATABASE_URL ?? '').trim().replace(/^['"]|['"]$/g, '');
const isRenderEnv = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);

if (isRenderEnv) {
  dbUrl = dbUrl || DEFAULT_POSTGRES_URL;
} else if (!dbUrl || dbUrl.includes('dpg-d9v6fa67bikc73bsvnhg-a')) {
  dbUrl = 'file:./dev.db';
}
process.env.DATABASE_URL = dbUrl;

const prisma = new PrismaClient();

const DEFAULT_ADMIN_PASSWORD_HASH = bcrypt.hashSync('AdminPass123!', 10);

const BRANDS = [
  { id: 'brand-apple', name: 'Apple', logo: 'apple' },
  { id: 'brand-xiaomi', name: 'Xiaomi', logo: 'xiaomi' },
  { id: 'brand-samsung', name: 'Samsung', logo: 'samsung' },
  { id: 'brand-vivo', name: 'vivo', logo: 'vivo' },
  { id: 'brand-oneplus', name: 'OnePlus', logo: 'oneplus' },
  { id: 'brand-google', name: 'Google', logo: 'google' },
  { id: 'brand-oppo', name: 'OPPO', logo: 'oppo' },
  { id: 'brand-nothing', name: 'Nothing', logo: 'nothing' },
  { id: 'brand-motorola', name: 'Motorola', logo: 'motorola' },
];

const BASE_MODELS = [
  // --- APPLE ---
  { id: 'apple-16pm',   brandId: 'brand-apple', name: 'iPhone 16 Pro Max',   modelNumber: 'A3296', category: 'flagship', releaseYear: 2024, basePrice128GB: 67000, series: 'iPhone 16 Series' },
  { id: 'apple-16p',    brandId: 'brand-apple', name: 'iPhone 16 Pro',       modelNumber: 'A3293', category: 'flagship', releaseYear: 2024, basePrice128GB: 57000, series: 'iPhone 16 Series' },
  { id: 'apple-16plus', brandId: 'brand-apple', name: 'iPhone 16 Plus',      modelNumber: 'A3290', category: 'premium',  releaseYear: 2024, basePrice128GB: 45000, series: 'iPhone 16 Series' },
  { id: 'apple-16',     brandId: 'brand-apple', name: 'iPhone 16',           modelNumber: 'A3287', category: 'premium',  releaseYear: 2024, basePrice128GB: 40000, series: 'iPhone 16 Series' },
  { id: 'apple-15pm',   brandId: 'brand-apple', name: 'iPhone 15 Pro Max',   modelNumber: 'A3106', category: 'flagship', releaseYear: 2023, basePrice128GB: 57000, series: 'iPhone 15 Series' },
  { id: 'apple-15p',    brandId: 'brand-apple', name: 'iPhone 15 Pro',       modelNumber: 'A3102', category: 'flagship', releaseYear: 2023, basePrice128GB: 47000, series: 'iPhone 15 Series' },
  { id: 'apple-15plus', brandId: 'brand-apple', name: 'iPhone 15 Plus',      modelNumber: 'A3094', category: 'premium',  releaseYear: 2023, basePrice128GB: 37000, series: 'iPhone 15 Series' },
  { id: 'apple-15',     brandId: 'brand-apple', name: 'iPhone 15',           modelNumber: 'A3090', category: 'premium',  releaseYear: 2023, basePrice128GB: 33000, series: 'iPhone 15 Series' },
  { id: 'apple-14pm',   brandId: 'brand-apple', name: 'iPhone 14 Pro Max',   modelNumber: 'A2894', category: 'flagship', releaseYear: 2022, basePrice128GB: 37000, series: 'iPhone 14 Series' },
  { id: 'apple-14p',    brandId: 'brand-apple', name: 'iPhone 14 Pro',       modelNumber: 'A2890', category: 'flagship', releaseYear: 2022, basePrice128GB: 35000, series: 'iPhone 14 Series' },
  { id: 'apple-14plus', brandId: 'brand-apple', name: 'iPhone 14 Plus',      modelNumber: 'A2886', category: 'premium',  releaseYear: 2022, basePrice128GB: 26000, series: 'iPhone 14 Series' },
  { id: 'apple-14',     brandId: 'brand-apple', name: 'iPhone 14',           modelNumber: 'A2882', category: 'premium',  releaseYear: 2022, basePrice128GB: 23000, series: 'iPhone 14 Series' },
  { id: 'apple-13pm',   brandId: 'brand-apple', name: 'iPhone 13 Pro Max',   modelNumber: 'A2643', category: 'flagship', releaseYear: 2021, basePrice128GB: 29000, series: 'iPhone 13 Series' },
  { id: 'apple-13p',    brandId: 'brand-apple', name: 'iPhone 13 Pro',       modelNumber: 'A2638', category: 'flagship', releaseYear: 2021, basePrice128GB: 27000, series: 'iPhone 13 Series' },
  { id: 'apple-13',     brandId: 'brand-apple', name: 'iPhone 13',           modelNumber: 'A2633', category: 'premium',  releaseYear: 2021, basePrice128GB: 21000, series: 'iPhone 13 Series' },
  { id: 'apple-13m',    brandId: 'brand-apple', name: 'iPhone 13 mini',      modelNumber: 'A2628', category: 'midrange', releaseYear: 2021, basePrice128GB: 16000, series: 'iPhone 13 Series' },
  { id: 'apple-12pm',   brandId: 'brand-apple', name: 'iPhone 12 Pro Max',   modelNumber: 'A2411', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12p',    brandId: 'brand-apple', name: 'iPhone 12 Pro',       modelNumber: 'A2407', category: 'premium',  releaseYear: 2020, basePrice128GB: 16000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12',     brandId: 'brand-apple', name: 'iPhone 12',           modelNumber: 'A2403', category: 'midrange', releaseYear: 2020, basePrice128GB: 13000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12m',    brandId: 'brand-apple', name: 'iPhone 12 mini',      modelNumber: 'A2399', category: 'midrange', releaseYear: 2020, basePrice128GB: 10500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11pm',   brandId: 'brand-apple', name: 'iPhone 11 Pro Max',   modelNumber: 'A2218', category: 'premium',  releaseYear: 2019, basePrice128GB: 11000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11p',    brandId: 'brand-apple', name: 'iPhone 11 Pro',       modelNumber: 'A2160', category: 'premium',  releaseYear: 2019, basePrice128GB:  9500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11',     brandId: 'brand-apple', name: 'iPhone 11',           modelNumber: 'A2111', category: 'midrange', releaseYear: 2019, basePrice128GB:  7500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-se3',    brandId: 'brand-apple', name: 'iPhone SE3',          modelNumber: 'A2783', category: 'budget',   releaseYear: 2022, basePrice128GB:  8500, series: 'iPhone SE & Legacy' },
  { id: 'apple-se2',    brandId: 'brand-apple', name: 'iPhone SE2',          modelNumber: 'A2275', category: 'budget',   releaseYear: 2020, basePrice128GB:  6000, series: 'iPhone SE & Legacy' },
  { id: 'apple-16e',    brandId: 'brand-apple', name: 'iPhone 16e',          modelNumber: 'A3294', category: 'midrange', releaseYear: 2024, basePrice128GB: 32000, series: 'iPhone 16 Series' },
  { id: 'apple-xr',     brandId: 'brand-apple', name: 'iPhone XR',           modelNumber: 'A2105', category: 'budget',   releaseYear: 2018, basePrice128GB:  5500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xs',     brandId: 'brand-apple', name: 'iPhone XS',           modelNumber: 'A2097', category: 'budget',   releaseYear: 2018, basePrice128GB:  6500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xsmax',  brandId: 'brand-apple', name: 'iPhone XS Max',       modelNumber: 'A2101', category: 'budget',   releaseYear: 2018, basePrice128GB:  8000, series: 'iPhone SE & Legacy' },
  { id: 'apple-x',      brandId: 'brand-apple', name: 'iPhone X',            modelNumber: 'A1901', category: 'budget',   releaseYear: 2017, basePrice128GB:  5000, series: 'iPhone SE & Legacy' },

  // --- SAMSUNG ---
  { id: 'sam-s20u',     brandId: 'brand-samsung', name: 'Galaxy S20 Ultra',  modelNumber: 'SM-G988B', category: 'premium',  releaseYear: 2020, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s21u',     brandId: 'brand-samsung', name: 'Galaxy S21 Ultra',  modelNumber: 'SM-G998B', category: 'premium',  releaseYear: 2021, basePrice128GB: 16000, series: 'S Series' },
  { id: 'sam-s22u',     brandId: 'brand-samsung', name: 'Galaxy S22 Ultra',  modelNumber: 'SM-S908B', category: 'premium',  releaseYear: 2022, basePrice128GB: 21000, series: 'S Series' },
  { id: 'sam-s23u',     brandId: 'brand-samsung', name: 'Galaxy S23 Ultra',  modelNumber: 'SM-S918B', category: 'flagship', releaseYear: 2023, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s24u',     brandId: 'brand-samsung', name: 'Galaxy S24 Ultra',  modelNumber: 'SM-S928B', category: 'flagship', releaseYear: 2024, basePrice128GB: 42000, series: 'S Series' },
  { id: 'sam-s25u',     brandId: 'brand-samsung', name: 'Galaxy S25 Ultra',  modelNumber: 'SM-S938B', category: 'flagship', releaseYear: 2025, basePrice128GB: 46000, series: 'S Series' },
  { id: 'sam-s21',      brandId: 'brand-samsung', name: 'Galaxy S21',         modelNumber: 'SM-G991B', category: 'midrange', releaseYear: 2021, basePrice128GB:  9500, series: 'S Series' },
  { id: 'sam-s22',      brandId: 'brand-samsung', name: 'Galaxy S22',         modelNumber: 'SM-S901B', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s23',      brandId: 'brand-samsung', name: 'Galaxy S23',         modelNumber: 'SM-S911B', category: 'premium',  releaseYear: 2023, basePrice128GB: 17000, series: 'S Series' },
  { id: 'sam-s24',      brandId: 'brand-samsung', name: 'Galaxy S24',         modelNumber: 'SM-S921B', category: 'premium',  releaseYear: 2024, basePrice128GB: 25000, series: 'S Series' },
  { id: 'sam-s25',      brandId: 'brand-samsung', name: 'Galaxy S25',         modelNumber: 'SM-S931B', category: 'premium',  releaseYear: 2025, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s21plus',  brandId: 'brand-samsung', name: 'Galaxy S21 Plus',   modelNumber: 'SM-G996B', category: 'midrange', releaseYear: 2021, basePrice128GB: 11000, series: 'S Series' },
  { id: 'sam-s22plus',  brandId: 'brand-samsung', name: 'Galaxy S22 Plus',   modelNumber: 'SM-S906B', category: 'premium',  releaseYear: 2022, basePrice128GB: 15000, series: 'S Series' },
  { id: 'sam-s23plus',  brandId: 'brand-samsung', name: 'Galaxy S23 Plus',   modelNumber: 'SM-S916B', category: 'premium',  releaseYear: 2023, basePrice128GB: 20000, series: 'S Series' },
  { id: 'sam-s24plus',  brandId: 'brand-samsung', name: 'Galaxy S24 Plus',   modelNumber: 'SM-S926B', category: 'premium',  releaseYear: 2024, basePrice128GB: 32000, series: 'S Series' },
  { id: 'sam-s25plus',  brandId: 'brand-samsung', name: 'Galaxy S25 Plus',   modelNumber: 'SM-S936B', category: 'flagship', releaseYear: 2025, basePrice128GB: 35000, series: 'S Series' },
  { id: 'sam-s21fe',    brandId: 'brand-samsung', name: 'Galaxy S21 FE',     modelNumber: 'SM-G990B', category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'S Series' },
  { id: 'sam-s23fe',    brandId: 'brand-samsung', name: 'Galaxy S23 FE',     modelNumber: 'SM-S711B', category: 'midrange', releaseYear: 2023, basePrice128GB: 13000, series: 'S Series' },
  { id: 'sam-s24fe',    brandId: 'brand-samsung', name: 'Galaxy S24 FE',     modelNumber: 'SM-S721B', category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'S Series' },
  { id: 'sam-flip3',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 3',   modelNumber: 'SM-F711B', category: 'premium',  releaseYear: 2021, basePrice128GB: 11000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip4',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 4',   modelNumber: 'SM-F721B', category: 'premium',  releaseYear: 2022, basePrice128GB: 16000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip5',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 5',   modelNumber: 'SM-F731B', category: 'flagship', releaseYear: 2023, basePrice128GB: 22000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip6',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 6',   modelNumber: 'SM-F741B', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold2',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 2',   modelNumber: 'SM-F916B', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold3',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 3',   modelNumber: 'SM-F926B', category: 'premium',  releaseYear: 2021, basePrice128GB: 26000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold4',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 4',   modelNumber: 'SM-F936B', category: 'flagship', releaseYear: 2022, basePrice128GB: 38000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold5',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 5',   modelNumber: 'SM-F946B', category: 'flagship', releaseYear: 2023, basePrice128GB: 45000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold6',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 6',   modelNumber: 'SM-F956B', category: 'flagship', releaseYear: 2024, basePrice128GB: 55000, series: 'Z Fold & Z Flip' },
  { id: 'sam-a13',      brandId: 'brand-samsung', name: 'Galaxy A13',        modelNumber: 'SM-A135F', category: 'budget',   releaseYear: 2022, basePrice128GB:  4500, series: 'A Series' },
  { id: 'sam-a23-4g',   brandId: 'brand-samsung', name: 'Galaxy A23 4G',     modelNumber: 'SM-A235F', category: 'budget',   releaseYear: 2022, basePrice128GB:  6000, series: 'A Series' },
  { id: 'sam-a23-5g',   brandId: 'brand-samsung', name: 'Galaxy A23 5G',     modelNumber: 'SM-A236B', category: 'budget',   releaseYear: 2022, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a33',      brandId: 'brand-samsung', name: 'Galaxy A33',        modelNumber: 'SM-A336B', category: 'midrange', releaseYear: 2022, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a53',      brandId: 'brand-samsung', name: 'Galaxy A53',        modelNumber: 'SM-A536B', category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'A Series' },
  { id: 'sam-a73',      brandId: 'brand-samsung', name: 'Galaxy A73',        modelNumber: 'SM-A736B', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a14-4g',   brandId: 'brand-samsung', name: 'Galaxy A14 4G',     modelNumber: 'SM-A145F', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'A Series' },
  { id: 'sam-a14-5g',   brandId: 'brand-samsung', name: 'Galaxy A14 5G',     modelNumber: 'SM-A146B', category: 'budget',   releaseYear: 2023, basePrice128GB:  6000, series: 'A Series' },
  { id: 'sam-a24',      brandId: 'brand-samsung', name: 'Galaxy A24',        modelNumber: 'SM-A245F', category: 'budget',   releaseYear: 2023, basePrice128GB:  7500, series: 'A Series' },
  { id: 'sam-a34',      brandId: 'brand-samsung', name: 'Galaxy A34',        modelNumber: 'SM-A346B', category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'A Series' },
  { id: 'sam-a54',      brandId: 'brand-samsung', name: 'Galaxy A54',        modelNumber: 'SM-A546B', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'A Series' },
  { id: 'sam-a15-4g',   brandId: 'brand-samsung', name: 'Galaxy A15 4G',     modelNumber: 'SM-A155F', category: 'budget',   releaseYear: 2024, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a15-5g',   brandId: 'brand-samsung', name: 'Galaxy A15 5G',     modelNumber: 'SM-A156B', category: 'budget',   releaseYear: 2024, basePrice128GB:  7000, series: 'A Series' },
  { id: 'sam-a25',      brandId: 'brand-samsung', name: 'Galaxy A25',        modelNumber: 'SM-A256B', category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'A Series' },
  { id: 'sam-a35',      brandId: 'brand-samsung', name: 'Galaxy A35',        modelNumber: 'SM-A356B', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a55',      brandId: 'brand-samsung', name: 'Galaxy A55',        modelNumber: 'SM-A556B', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'A Series' },
  { id: 'sam-a16',      brandId: 'brand-samsung', name: 'Galaxy A16',        modelNumber: 'SM-A166B', category: 'budget',   releaseYear: 2025, basePrice128GB:  8500, series: 'A Series' },
  { id: 'sam-a26',      brandId: 'brand-samsung', name: 'Galaxy A26',        modelNumber: 'SM-A266B', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a36',      brandId: 'brand-samsung', name: 'Galaxy A36',        modelNumber: 'SM-A366B', category: 'midrange', releaseYear: 2025, basePrice128GB: 13500, series: 'A Series' },
  { id: 'sam-a56',      brandId: 'brand-samsung', name: 'Galaxy A56',        modelNumber: 'SM-A566B', category: 'midrange', releaseYear: 2025, basePrice128GB: 18000, series: 'A Series' },

  // --- XIAOMI ---
  { id: 'xi-14u',     brandId: 'brand-xiaomi', name: 'Xiaomi 14 Ultra',    modelNumber: '24030PN60G', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Xiaomi Series' },
  { id: 'xi-14',      brandId: 'brand-xiaomi', name: 'Xiaomi 14',          modelNumber: '23127PN0CG', category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'Xiaomi Series' },
  { id: 'xi-13p',     brandId: 'brand-xiaomi', name: 'Xiaomi 13 Pro',      modelNumber: '2210132G', category: 'flagship', releaseYear: 2023, basePrice128GB: 18000, series: 'Xiaomi Series' },
  { id: 'xi-13',      brandId: 'brand-xiaomi', name: 'Xiaomi 13',          modelNumber: '2211133G', category: 'premium',  releaseYear: 2023, basePrice128GB: 13000, series: 'Xiaomi Series' },
  { id: 'xi-12p',     brandId: 'brand-xiaomi', name: 'Xiaomi 12 Pro',      modelNumber: '2201122G', category: 'premium',  releaseYear: 2022, basePrice128GB: 11000, series: 'Xiaomi Series' },
  { id: 'xi-12',      brandId: 'brand-xiaomi', name: 'Xiaomi 12',          modelNumber: '2201123G', category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'Xiaomi Series' },
  { id: 'xi-n14p',    brandId: 'brand-xiaomi', name: 'Redmi Note 14 Pro+', modelNumber: '24115RA8EG', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'Redmi Note Series' },
  { id: 'xi-n14',     brandId: 'brand-xiaomi', name: 'Redmi Note 14',      modelNumber: '24090RA29G', category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'Redmi Note Series' },
  { id: 'xi-n13p',    brandId: 'brand-xiaomi', name: 'Redmi Note 13 Pro+', modelNumber: '23090RA98G', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'Redmi Note Series' },
  { id: 'xi-n13',     brandId: 'brand-xiaomi', name: 'Redmi Note 13',      modelNumber: '23129RAA4G', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Redmi Note Series' },
  { id: 'xi-poc6p',   brandId: 'brand-xiaomi', name: 'POCO F6 Pro',        modelNumber: '23113RKC6G', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'POCO Series' },
  { id: 'xi-poc6',    brandId: 'brand-xiaomi', name: 'POCO F6',            modelNumber: '24069PC21G', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'POCO Series' },

  // --- VIVO ---
  { id: 'vi-x200p',    brandId: 'brand-vivo', name: 'vivo X200 Pro',       modelNumber: 'V2405A', category: 'flagship', releaseYear: 2024, basePrice128GB: 38000, series: 'X Series & Folds' },
  { id: 'vi-x200',     brandId: 'brand-vivo', name: 'vivo X200',           modelNumber: 'V2415A', category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'X Series & Folds' },
  { id: 'vi-x100',     brandId: 'brand-vivo', name: 'vivo X100',           modelNumber: 'V2309', category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'X Series & Folds' },
  { id: 'vi-x100p',    brandId: 'brand-vivo', name: 'vivo X100 Pro',       modelNumber: 'V2324', category: 'flagship', releaseYear: 2024, basePrice128GB: 27000, series: 'X Series & Folds' },
  { id: 'vi-v40',      brandId: 'brand-vivo', name: 'vivo V40',            modelNumber: 'V2348', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'V Series' },
  { id: 'vi-v40p',     brandId: 'brand-vivo', name: 'vivo V40 Pro',        modelNumber: 'V2347', category: 'premium',  releaseYear: 2024, basePrice128GB: 18000, series: 'V Series' },
  { id: 'vi-v30',      brandId: 'brand-vivo', name: 'vivo V30',            modelNumber: 'V2318', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'V Series' },
  { id: 'vi-v30p',     brandId: 'brand-vivo', name: 'vivo V30 Pro',        modelNumber: 'V2319', category: 'premium',  releaseYear: 2024, basePrice128GB: 15000, series: 'V Series' },

  // --- ONEPLUS ---
  { id: 'op-12',      brandId: 'brand-oneplus', name: 'OnePlus 12',        modelNumber: 'CPH2581', category: 'flagship', releaseYear: 2024, basePrice128GB: 24000, series: 'Numbered Series' },
  { id: 'op-12r',     brandId: 'brand-oneplus', name: 'OnePlus 12R',       modelNumber: 'CPH2585', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11',      brandId: 'brand-oneplus', name: 'OnePlus 11',        modelNumber: 'CPH2447', category: 'premium',  releaseYear: 2023, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11r',     brandId: 'brand-oneplus', name: 'OnePlus 11R',       modelNumber: 'CPH2487', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Numbered Series' },
  { id: 'op-nord4',   brandId: 'brand-oneplus', name: 'OnePlus Nord 4',    modelNumber: 'CPH2621', category: 'midrange', releaseYear: 2024, basePrice128GB: 13000, series: 'Nord Series' },
  { id: 'op-nord3',   brandId: 'brand-oneplus', name: 'OnePlus Nord 3',    modelNumber: 'CPH2493', category: 'budget',   releaseYear: 2023, basePrice128GB:  9000, series: 'Nord Series' },

  // --- GOOGLE ---
  { id: 'goog-8p',  brandId: 'brand-google', name: 'Pixel 8 Pro',  modelNumber: 'GC3VE', category: 'flagship', releaseYear: 2023, basePrice128GB: 27000, series: 'Pixel 8 Series' },
  { id: 'goog-8',   brandId: 'brand-google', name: 'Pixel 8',      modelNumber: 'GKWS6', category: 'premium',  releaseYear: 2023, basePrice128GB: 19000, series: 'Pixel 8 Series' },
  { id: 'goog-8a',  brandId: 'brand-google', name: 'Pixel 8a',     modelNumber: 'G8HHN', category: 'midrange', releaseYear: 2024, basePrice128GB: 14500, series: 'Pixel 8 Series' },
  { id: 'goog-7p',  brandId: 'brand-google', name: 'Pixel 7 Pro',  modelNumber: 'GE2AE', category: 'premium',  releaseYear: 2022, basePrice128GB: 20000, series: 'Pixel 7 Series' },
  { id: 'goog-7',   brandId: 'brand-google', name: 'Pixel 7',      modelNumber: 'GVU6C', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'Pixel 7 Series' },
  { id: 'goog-7a',  brandId: 'brand-google', name: 'Pixel 7a',     modelNumber: 'GWKK3', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Pixel 7 Series' },
];

const DEFAULT_ADMIN_USERS = [
  { username: 'superadmin', email: 'admin@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'SUPER_ADMIN', active: true },
  { username: 'finance_lead', email: 'finance@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'FINANCE_APPROVER', active: true },
  { username: 'ops_agent1', email: 'ops@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'OPERATIONS_AGENT', active: true },
  { username: 'catalog_mgr', email: 'catalog@smartphonecentre.com', passwordHash: DEFAULT_ADMIN_PASSWORD_HASH, role: 'CATALOG_EDITOR', active: true },
];

async function main() {
  console.log('🌱 Syncing database brands, catalog models & admin accounts...');

  for (const b of BRANDS) {
    await prisma.brand.upsert({
      where: { id: b.id },
      create: { id: b.id, name: b.name, logo: b.logo },
      update: {}, // Preserve any live brand edits
    });
  }
  console.log(`  ✓ ${BRANDS.length} brands ready`);

  for (const m of BASE_MODELS) {
    await prisma.model.upsert({
      where: { legacyId: m.id },
      create: {
        legacyId: m.id,
        brandId: m.brandId,
        name: m.name,
        modelNumber: m.modelNumber,
        category: m.category,
        releaseYear: m.releaseYear,
        basePrice128GB: m.basePrice128GB,
        series: m.series,
      },
      update: {}, // Preserve any live model edits
    });
  }
  console.log(`  ✓ ${BASE_MODELS.length} catalog models ready`);

  for (const adminUser of DEFAULT_ADMIN_USERS) {
    await prisma.adminUser.upsert({
      where: { username: adminUser.username },
      create: adminUser,
      update: {}, // Preserve any live admin user edits
    });
  }
  console.log(`  ✓ ${DEFAULT_ADMIN_USERS.length} admin staff accounts ready`);

  console.log('✅ Database sync complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
