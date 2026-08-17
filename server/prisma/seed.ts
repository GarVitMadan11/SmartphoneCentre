/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const phoneImagesPath = path.resolve(__dirname, '../../src/data/phoneImages.json');
let phoneImagesMap: Record<string, string> = {};
try {
  phoneImagesMap = JSON.parse(fs.readFileSync(phoneImagesPath, 'utf-8'));
} catch (err) {
  console.warn('Could not read phoneImages.json in seed script:', err);
}

const dbUrl = (process.env.DATABASE_URL || '').trim();
const schemaPath = path.resolve(__dirname, 'schema.prisma');
if (fs.existsSync(schemaPath) && dbUrl) {
  const targetProvider = (dbUrl.startsWith('postgres:') || dbUrl.startsWith('postgresql:')) ? 'postgresql' : 'sqlite';
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const updatedSchema = schemaContent.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${targetProvider}"`);
  if (schemaContent !== updatedSchema) {
    fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
  }
}

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
  { id: 'apple-17pm',   brandId: 'brand-apple', name: 'iPhone 17 Pro Max', category: 'flagship', releaseYear: 2025, basePrice128GB: 97500, series: 'iPhone 17 Series', imageUrl: 'https://m.media-amazon.com/images/I/71MXmswILHL.jpg' },
  { id: 'apple-17p',    brandId: 'brand-apple', name: 'iPhone 17 Pro', category: 'flagship', releaseYear: 2025, basePrice128GB: 88000, series: 'iPhone 17 Series', imageUrl: 'https://www.myimaginestore.com/media/catalog/product/cache/350c0dac84622638a906c7177340801e/i/p/iphone_17_pro_max_silver_pdp_image_position_1__en-in.jpg' },
  { id: 'apple-17air',  brandId: 'brand-apple', name: 'iPhone 17 Air', category: 'premium',  releaseYear: 2025, basePrice128GB: 74000, series: 'iPhone 17 Series', imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-air.jpg' },
  { id: 'apple-17',     brandId: 'brand-apple', name: 'iPhone 17', category: 'premium',  releaseYear: 2025, basePrice128GB: 66000, series: 'iPhone 17 Series', imageUrl: 'https://rukmini1.flixcart.com/image/300/300/xif0q/mobile/s/t/g/-original-imahft5gqkxzyeqa.jpeg' },
  { id: 'apple-16pm',   brandId: 'brand-apple', name: 'iPhone 16 Pro Max', category: 'flagship', releaseYear: 2024, basePrice128GB: 83500, series: 'iPhone 16 Series', imageUrl: 'https://rukminim2.flixcart.com/image/480/640/xif0q/mobile/w/z/h/-original-imahggetkf6y67sr.jpeg?q=90' },
  { id: 'apple-16p',    brandId: 'brand-apple', name: 'iPhone 16 Pro', category: 'flagship', releaseYear: 2024, basePrice128GB: 75500, series: 'iPhone 16 Series', imageUrl: 'https://imgs.search.brave.com/_XxEqq7-_Q5SbamCTZ2m6edqEAxeuiC7E8SakEpPtBM/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS1pay5jcm9tYS5j/b20vQ3JvbWElMjBB/c3NldHMvQ29tbXVu/aWNhdGlvbi9Nb2Jp/bGVzL0ltYWdlcy8z/MDk3MzBfMl95Y2t6/ZXYucG5n' },
  { id: 'apple-16plus', brandId: 'brand-apple', name: 'iPhone 16 Plus', category: 'premium',  releaseYear: 2024, basePrice128GB: 57500, series: 'iPhone 16 Series' },
  { id: 'apple-16',     brandId: 'brand-apple', name: 'iPhone 16', category: 'premium',  releaseYear: 2024, basePrice128GB: 50500, series: 'iPhone 16 Series', imageUrl: 'https://rukminim2.flixcart.com/image/480/640/xif0q/mobile/h/u/i/-original-imahgfmyczqxhtm2.jpeg?q=90' },
  { id: 'apple-15pm',   brandId: 'brand-apple', name: 'iPhone 15 Pro Max', category: 'flagship', releaseYear: 2023, basePrice128GB: 68000, series: 'iPhone 15 Series' },
  { id: 'apple-15p',    brandId: 'brand-apple', name: 'iPhone 15 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 59000, series: 'iPhone 15 Series' },
  { id: 'apple-15plus', brandId: 'brand-apple', name: 'iPhone 15 Plus', category: 'premium',  releaseYear: 2023, basePrice128GB: 37000, series: 'iPhone 15 Series' },
  { id: 'apple-15',     brandId: 'brand-apple', name: 'iPhone 15', category: 'premium',  releaseYear: 2023, basePrice128GB: 33000, series: 'iPhone 15 Series' },
  { id: 'apple-14pm',   brandId: 'brand-apple', name: 'iPhone 14 Pro Max', category: 'flagship', releaseYear: 2022, basePrice128GB: 37000, series: 'iPhone 14 Series' },
  { id: 'apple-14p',    brandId: 'brand-apple', name: 'iPhone 14 Pro', category: 'flagship', releaseYear: 2022, basePrice128GB: 35000, series: 'iPhone 14 Series' },
  { id: 'apple-14plus', brandId: 'brand-apple', name: 'iPhone 14 Plus', category: 'premium',  releaseYear: 2022, basePrice128GB: 26000, series: 'iPhone 14 Series' },
  { id: 'apple-14',     brandId: 'brand-apple', name: 'iPhone 14', category: 'premium',  releaseYear: 2022, basePrice128GB: 23000, series: 'iPhone 14 Series' },
  { id: 'apple-13pm',   brandId: 'brand-apple', name: 'iPhone 13 Pro Max', category: 'flagship', releaseYear: 2021, basePrice128GB: 29000, series: 'iPhone 13 Series' },
  { id: 'apple-13p',    brandId: 'brand-apple', name: 'iPhone 13 Pro', category: 'flagship', releaseYear: 2021, basePrice128GB: 27000, series: 'iPhone 13 Series' },
  { id: 'apple-13',     brandId: 'brand-apple', name: 'iPhone 13', category: 'premium',  releaseYear: 2021, basePrice128GB: 21000, series: 'iPhone 13 Series' },
  { id: 'apple-13m',    brandId: 'brand-apple', name: 'iPhone 13 mini', category: 'midrange', releaseYear: 2021, basePrice128GB: 16000, series: 'iPhone 13 Series' },
  { id: 'apple-12pm',   brandId: 'brand-apple', name: 'iPhone 12 Pro Max', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12p',    brandId: 'brand-apple', name: 'iPhone 12 Pro', category: 'premium',  releaseYear: 2020, basePrice128GB: 16000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12',     brandId: 'brand-apple', name: 'iPhone 12', category: 'midrange', releaseYear: 2020, basePrice128GB: 13000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-12m',    brandId: 'brand-apple', name: 'iPhone 12 mini', category: 'midrange', releaseYear: 2020, basePrice128GB: 10500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11pm',   brandId: 'brand-apple', name: 'iPhone 11 Pro Max', category: 'premium',  releaseYear: 2019, basePrice128GB: 11000, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11p',    brandId: 'brand-apple', name: 'iPhone 11 Pro', category: 'premium',  releaseYear: 2019, basePrice128GB:  9500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-11',     brandId: 'brand-apple', name: 'iPhone 11', category: 'midrange', releaseYear: 2019, basePrice128GB:  7500, series: 'iPhone 12 & 11 Series' },
  { id: 'apple-se3',    brandId: 'brand-apple', name: 'iPhone SE3', category: 'budget',   releaseYear: 2022, basePrice128GB:  8500, series: 'iPhone SE & Legacy' },
  { id: 'apple-se2',    brandId: 'brand-apple', name: 'iPhone SE2', category: 'budget',   releaseYear: 2020, basePrice128GB:  6000, series: 'iPhone SE & Legacy' },
  { id: 'apple-16e',    brandId: 'brand-apple', name: 'iPhone 16e', category: 'midrange', releaseYear: 2024, basePrice128GB: 32000, series: 'iPhone 16 Series', imageUrl: 'https://vsprod.vijaysales.com/media/catalog/product/w/h/white_17_e_5_.jpg?optimize=medium&fit=bounds&height=500&width=500' },
  { id: 'apple-xr',     brandId: 'brand-apple', name: 'iPhone XR', category: 'budget',   releaseYear: 2018, basePrice128GB:  5500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xs',     brandId: 'brand-apple', name: 'iPhone XS', category: 'budget',   releaseYear: 2018, basePrice128GB:  6500, series: 'iPhone SE & Legacy' },
  { id: 'apple-xsmax',  brandId: 'brand-apple', name: 'iPhone XS Max', category: 'budget',   releaseYear: 2018, basePrice128GB:  8000, series: 'iPhone SE & Legacy' },
  { id: 'apple-x',      brandId: 'brand-apple', name: 'iPhone X', category: 'budget',   releaseYear: 2017, basePrice128GB:  5000, series: 'iPhone SE & Legacy' },

  // --- SAMSUNG ---
  { id: 'sam-s20u',     brandId: 'brand-samsung', name: 'Galaxy S20 Ultra', category: 'premium',  releaseYear: 2020, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s21u',     brandId: 'brand-samsung', name: 'Galaxy S21 Ultra', category: 'premium',  releaseYear: 2021, basePrice128GB: 16000, series: 'S Series' },
  { id: 'sam-s22u',     brandId: 'brand-samsung', name: 'Galaxy S22 Ultra', category: 'premium',  releaseYear: 2022, basePrice128GB: 21000, series: 'S Series' },
  { id: 'sam-s23u',     brandId: 'brand-samsung', name: 'Galaxy S23 Ultra', category: 'flagship', releaseYear: 2023, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s24u',     brandId: 'brand-samsung', name: 'Galaxy S24 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 42000, series: 'S Series' },
  { id: 'sam-s25u',     brandId: 'brand-samsung', name: 'Galaxy S25 Ultra', category: 'flagship', releaseYear: 2025, basePrice128GB: 46000, series: 'S Series' },
  { id: 'sam-s21',      brandId: 'brand-samsung', name: 'Galaxy S21', category: 'midrange', releaseYear: 2021, basePrice128GB:  9500, series: 'S Series' },
  { id: 'sam-s22',      brandId: 'brand-samsung', name: 'Galaxy S22', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'S Series' },
  { id: 'sam-s23',      brandId: 'brand-samsung', name: 'Galaxy S23', category: 'premium',  releaseYear: 2023, basePrice128GB: 17000, series: 'S Series' },
  { id: 'sam-s24',      brandId: 'brand-samsung', name: 'Galaxy S24', category: 'premium',  releaseYear: 2024, basePrice128GB: 25000, series: 'S Series' },
  { id: 'sam-s25',      brandId: 'brand-samsung', name: 'Galaxy S25', category: 'premium',  releaseYear: 2025, basePrice128GB: 30000, series: 'S Series' },
  { id: 'sam-s21plus',  brandId: 'brand-samsung', name: 'Galaxy S21 Plus', category: 'midrange', releaseYear: 2021, basePrice128GB: 11000, series: 'S Series' },
  { id: 'sam-s22plus',  brandId: 'brand-samsung', name: 'Galaxy S22 Plus', category: 'premium',  releaseYear: 2022, basePrice128GB: 15000, series: 'S Series' },
  { id: 'sam-s23plus',  brandId: 'brand-samsung', name: 'Galaxy S23 Plus', category: 'premium',  releaseYear: 2023, basePrice128GB: 20000, series: 'S Series' },
  { id: 'sam-s24plus',  brandId: 'brand-samsung', name: 'Galaxy S24 Plus', category: 'premium',  releaseYear: 2024, basePrice128GB: 32000, series: 'S Series' },
  { id: 'sam-s25plus',  brandId: 'brand-samsung', name: 'Galaxy S25 Plus', category: 'flagship', releaseYear: 2025, basePrice128GB: 35000, series: 'S Series' },
  { id: 'sam-s21fe',    brandId: 'brand-samsung', name: 'Galaxy S21 FE', category: 'midrange', releaseYear: 2021, basePrice128GB:  8500, series: 'S Series' },
  { id: 'sam-s23fe',    brandId: 'brand-samsung', name: 'Galaxy S23 FE', category: 'midrange', releaseYear: 2023, basePrice128GB: 13000, series: 'S Series' },
  { id: 'sam-s24fe',    brandId: 'brand-samsung', name: 'Galaxy S24 FE', category: 'midrange', releaseYear: 2024, basePrice128GB: 18000, series: 'S Series' },
  { id: 'sam-flip3',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 3', category: 'premium',  releaseYear: 2021, basePrice128GB: 11000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip4',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 4', category: 'premium',  releaseYear: 2022, basePrice128GB: 16000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip5',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 5', category: 'flagship', releaseYear: 2023, basePrice128GB: 22000, series: 'Z Fold & Z Flip' },
  { id: 'sam-flip6',    brandId: 'brand-samsung', name: 'Galaxy Z Flip 6', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold2',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 2', category: 'premium',  releaseYear: 2020, basePrice128GB: 18000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold3',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 3', category: 'premium',  releaseYear: 2021, basePrice128GB: 26000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold4',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 4', category: 'flagship', releaseYear: 2022, basePrice128GB: 38000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold5',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 5', category: 'flagship', releaseYear: 2023, basePrice128GB: 45000, series: 'Z Fold & Z Flip' },
  { id: 'sam-fold6',    brandId: 'brand-samsung', name: 'Galaxy Z Fold 6', category: 'flagship', releaseYear: 2024, basePrice128GB: 55000, series: 'Z Fold & Z Flip' },
  { id: 'sam-a13',      brandId: 'brand-samsung', name: 'Galaxy A13', category: 'budget',   releaseYear: 2022, basePrice128GB:  4500, series: 'A Series' },
  { id: 'sam-a23-4g',   brandId: 'brand-samsung', name: 'Galaxy A23 4G', category: 'budget',   releaseYear: 2022, basePrice128GB:  6000, series: 'A Series' },
  { id: 'sam-a23-5g',   brandId: 'brand-samsung', name: 'Galaxy A23 5G', category: 'budget',   releaseYear: 2022, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a33',      brandId: 'brand-samsung', name: 'Galaxy A33', category: 'midrange', releaseYear: 2022, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a53',      brandId: 'brand-samsung', name: 'Galaxy A53', category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'A Series' },
  { id: 'sam-a73',      brandId: 'brand-samsung', name: 'Galaxy A73', category: 'midrange', releaseYear: 2022, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a14-4g',   brandId: 'brand-samsung', name: 'Galaxy A14 4G', category: 'budget',   releaseYear: 2023, basePrice128GB:  5500, series: 'A Series' },
  { id: 'sam-a14-5g',   brandId: 'brand-samsung', name: 'Galaxy A14 5G', category: 'budget',   releaseYear: 2023, basePrice128GB:  6000, series: 'A Series' },
  { id: 'sam-a24',      brandId: 'brand-samsung', name: 'Galaxy A24', category: 'budget',   releaseYear: 2023, basePrice128GB:  7500, series: 'A Series' },
  { id: 'sam-a34',      brandId: 'brand-samsung', name: 'Galaxy A34', category: 'midrange', releaseYear: 2023, basePrice128GB:  8500, series: 'A Series' },
  { id: 'sam-a54',      brandId: 'brand-samsung', name: 'Galaxy A54', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'A Series' },
  { id: 'sam-a15-4g',   brandId: 'brand-samsung', name: 'Galaxy A15 4G', category: 'budget',   releaseYear: 2024, basePrice128GB:  6500, series: 'A Series' },
  { id: 'sam-a15-5g',   brandId: 'brand-samsung', name: 'Galaxy A15 5G', category: 'budget',   releaseYear: 2024, basePrice128GB:  7000, series: 'A Series' },
  { id: 'sam-a25',      brandId: 'brand-samsung', name: 'Galaxy A25', category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'A Series' },
  { id: 'sam-a35',      brandId: 'brand-samsung', name: 'Galaxy A35', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a55',      brandId: 'brand-samsung', name: 'Galaxy A55', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'A Series' },
  { id: 'sam-a16',      brandId: 'brand-samsung', name: 'Galaxy A16', category: 'budget',   releaseYear: 2025, basePrice128GB:  8500, series: 'A Series' },
  { id: 'sam-a26',      brandId: 'brand-samsung', name: 'Galaxy A26', category: 'midrange', releaseYear: 2025, basePrice128GB: 11000, series: 'A Series' },
  { id: 'sam-a36',      brandId: 'brand-samsung', name: 'Galaxy A36', category: 'midrange', releaseYear: 2025, basePrice128GB: 13500, series: 'A Series' },
  { id: 'sam-a56',      brandId: 'brand-samsung', name: 'Galaxy A56', category: 'midrange', releaseYear: 2025, basePrice128GB: 18000, series: 'A Series' },

  // --- XIAOMI ---
  { id: 'xi-14u',     brandId: 'brand-xiaomi', name: 'Xiaomi 14 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Xiaomi Series' },
  { id: 'xi-14',      brandId: 'brand-xiaomi', name: 'Xiaomi 14', category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'Xiaomi Series' },
  { id: 'xi-13p',     brandId: 'brand-xiaomi', name: 'Xiaomi 13 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 18000, series: 'Xiaomi Series' },
  { id: 'xi-13',      brandId: 'brand-xiaomi', name: 'Xiaomi 13', category: 'premium',  releaseYear: 2023, basePrice128GB: 13000, series: 'Xiaomi Series' },
  { id: 'xi-12p',     brandId: 'brand-xiaomi', name: 'Xiaomi 12 Pro', category: 'premium',  releaseYear: 2022, basePrice128GB: 11000, series: 'Xiaomi Series' },
  { id: 'xi-12',      brandId: 'brand-xiaomi', name: 'Xiaomi 12', category: 'midrange', releaseYear: 2022, basePrice128GB:  8000, series: 'Xiaomi Series' },
  { id: 'xi-n14p',    brandId: 'brand-xiaomi', name: 'Redmi Note 14 Pro+', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'Redmi Note Series' },
  { id: 'xi-n14',     brandId: 'brand-xiaomi', name: 'Redmi Note 14', category: 'midrange', releaseYear: 2024, basePrice128GB:  9000, series: 'Redmi Note Series' },
  { id: 'xi-n13p',    brandId: 'brand-xiaomi', name: 'Redmi Note 13 Pro+', category: 'midrange', releaseYear: 2023, basePrice128GB: 10000, series: 'Redmi Note Series' },
  { id: 'xi-n13',     brandId: 'brand-xiaomi', name: 'Redmi Note 13', category: 'budget',   releaseYear: 2023, basePrice128GB:  6500, series: 'Redmi Note Series' },
  { id: 'xi-poc6p',   brandId: 'brand-xiaomi', name: 'POCO F6 Pro', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'POCO Series' },
  { id: 'xi-poc6',    brandId: 'brand-xiaomi', name: 'POCO F6', category: 'midrange', releaseYear: 2024, basePrice128GB: 11000, series: 'POCO Series' },

  // --- VIVO ---
  { id: 'vi-x200p',    brandId: 'brand-vivo', name: 'vivo X200 Pro', category: 'flagship', releaseYear: 2024, basePrice128GB: 38000, series: 'X Series & Folds' },
  { id: 'vi-x200',     brandId: 'brand-vivo', name: 'vivo X200', category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'X Series & Folds' },
  { id: 'vi-x100',     brandId: 'brand-vivo', name: 'vivo X100', category: 'flagship', releaseYear: 2024, basePrice128GB: 20000, series: 'X Series & Folds' },
  { id: 'vi-x100p',    brandId: 'brand-vivo', name: 'vivo X100 Pro', category: 'flagship', releaseYear: 2024, basePrice128GB: 27000, series: 'X Series & Folds' },
  { id: 'vi-v40',      brandId: 'brand-vivo', name: 'vivo V40', category: 'midrange', releaseYear: 2024, basePrice128GB: 14000, series: 'V Series' },
  { id: 'vi-v40p',     brandId: 'brand-vivo', name: 'vivo V40 Pro', category: 'premium',  releaseYear: 2024, basePrice128GB: 18000, series: 'V Series' },
  { id: 'vi-v30',      brandId: 'brand-vivo', name: 'vivo V30', category: 'midrange', releaseYear: 2024, basePrice128GB: 12000, series: 'V Series' },
  { id: 'vi-v30p',     brandId: 'brand-vivo', name: 'vivo V30 Pro', category: 'premium',  releaseYear: 2024, basePrice128GB: 15000, series: 'V Series' },

  // --- ONEPLUS ---
  { id: 'op-12',      brandId: 'brand-oneplus', name: 'OnePlus 12', category: 'flagship', releaseYear: 2024, basePrice128GB: 24000, series: 'Numbered Series' },
  { id: 'op-12r',     brandId: 'brand-oneplus', name: 'OnePlus 12R', category: 'premium',  releaseYear: 2024, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11',      brandId: 'brand-oneplus', name: 'OnePlus 11', category: 'premium',  releaseYear: 2023, basePrice128GB: 16000, series: 'Numbered Series' },
  { id: 'op-11r',     brandId: 'brand-oneplus', name: 'OnePlus 11R', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Numbered Series' },
  { id: 'op-nord4',   brandId: 'brand-oneplus', name: 'OnePlus Nord 4', category: 'midrange', releaseYear: 2024, basePrice128GB: 13000, series: 'Nord Series' },
  { id: 'op-nord3',   brandId: 'brand-oneplus', name: 'OnePlus Nord 3', category: 'budget',   releaseYear: 2023, basePrice128GB:  9000, series: 'Nord Series' },

  // --- GOOGLE ---
  { id: 'goog-8p',  brandId: 'brand-google', name: 'Pixel 8 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 27000, series: 'Pixel 8 Series' },
  { id: 'goog-8',   brandId: 'brand-google', name: 'Pixel 8', category: 'premium',  releaseYear: 2023, basePrice128GB: 19000, series: 'Pixel 8 Series' },
  { id: 'goog-8a',  brandId: 'brand-google', name: 'Pixel 8a', category: 'midrange', releaseYear: 2024, basePrice128GB: 14500, series: 'Pixel 8 Series' },
  { id: 'goog-7p',  brandId: 'brand-google', name: 'Pixel 7 Pro', category: 'premium',  releaseYear: 2022, basePrice128GB: 20000, series: 'Pixel 7 Series' },
  { id: 'goog-7',   brandId: 'brand-google', name: 'Pixel 7', category: 'midrange', releaseYear: 2022, basePrice128GB: 12000, series: 'Pixel 7 Series' },
  { id: 'goog-7a',  brandId: 'brand-google', name: 'Pixel 7a', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Pixel 7 Series' },
];

const catalogId = (brandId: string, name: string) =>
  `catalog-${brandId.replace('brand-', '')}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

const catalogCategory = (name: string) => {
  if (/ultra|pro max|fold|flip|\bpro\b|x300|x200 pro|x100 pro|find x9|find x8|s26 ultra|s25 ultra/i.test(name)) return 'flagship';
  if (/\bplus\b|edge|air|reno|razr|v\d+ elite|\biphone 17\b|\biphone 16\b|\bgalaxy s2\d\b/i.test(name)) return 'premium';
  if (/\b(a|y|m|f|g)\d|lite|ce|cmf|\b\d+e\b|\b\d+c\b/i.test(name)) return 'budget';
  return 'midrange';
};

const getCashifyBasePrice256GB = (brandId: string, name: string, category: string, releaseYear: number): number => {
  if (name === 'iPhone 17 Pro Max') return 109000;
  if (name === 'iPhone 17 Pro') return 101000;
  if (name === 'iPhone 17 Air') return 85000;
  if (name === 'iPhone 17') return 59000;
  if (name === 'iPhone 17e') return 43000;
  if (name === 'iPhone 16 Pro Max') return 96000;
  if (name === 'iPhone 16 Pro') return 86800;

  let base256 = 15000;
  if (category === 'flagship') base256 = 58000;
  else if (category === 'premium') base256 = 36000;
  else if (category === 'midrange') base256 = 18000;
  else if (category === 'budget') base256 = 10000;

  let brandMult = 1.0;
  if (brandId === 'brand-apple') brandMult = 1.35;
  else if (brandId === 'brand-samsung') brandMult = /fold|flip|ultra|s2/i.test(name) ? 1.15 : 0.9;
  else if (brandId === 'brand-google') brandMult = 1.05;
  else if (brandId === 'brand-oneplus') brandMult = 1.0;
  else if (brandId === 'brand-vivo' || brandId === 'brand-oppo') brandMult = /ultra|pro|find x|x\d+/i.test(name) ? 1.05 : 0.85;

  let yearFactor = 1.0;
  if (releaseYear >= 2026) yearFactor = 1.30;
  else if (releaseYear === 2025) yearFactor = 1.15;
  else if (releaseYear === 2024) yearFactor = 1.0;
  else if (releaseYear === 2023) yearFactor = 0.82;
  else yearFactor = 0.60;

  let bonus = 0;
  if (/ultra|pro max|fold/i.test(name)) bonus += 8000;
  else if (/pro\b|plus|flip|air/i.test(name)) bonus += 4000;

  return Math.round((base256 * brandMult * yearFactor + bonus) / 500) * 500;
};

const catalogPrice = (brandId: string, name: string, category: string, releaseYear: number): number => {
  const cashify256 = getCashifyBasePrice256GB(brandId, name, category, releaseYear);
  const base128 = Math.max(3500, cashify256 - 6000);
  return Math.round((base128 * 1.02) / 500) * 500;
};

const CASHIFY_BENCHMARKS: Record<string, { supportedStorageGb: number[]; variantPrices: Record<string, number> }> = {
  'iPhone 17 Pro Max': {
    supportedStorageGb: [256, 512, 1024, 2048],
    variantPrices: {
      '0_256': Math.round(109000 * 1.02),
      '0_512': Math.round(115500 * 1.02),
      '0_1024': Math.round(119500 * 1.02),
      '0_2048': Math.round(125000 * 1.02),
    }
  },
  'iPhone 17 Pro': {
    supportedStorageGb: [256, 512, 1024],
    variantPrices: {
      '0_256': Math.round(101000 * 1.02),
      '0_512': Math.round(106000 * 1.02),
      '0_1024': Math.round(111000 * 1.02),
    }
  },
  'iPhone 17e': {
    supportedStorageGb: [256, 512],
    variantPrices: {
      '0_256': Math.round(43000 * 1.02),
      '0_512': Math.round(52200 * 1.02),
    }
  },
  'iPhone 17': {
    supportedStorageGb: [256, 512],
    variantPrices: {
      '0_256': Math.round(59000 * 1.02),
      '0_512': Math.round(64500 * 1.02),
    }
  }
};

const makeCatalogModels = (brandId: string, series: string, releaseYear: number, names: string[]) =>
  names.map((name) => {
    const category = catalogCategory(name);
    return { id: catalogId(brandId, name), brandId, name, category, releaseYear, basePrice128GB: catalogPrice(brandId, name, category, releaseYear), series };
  });

const CATALOG_ADDITIONS = [
  ...makeCatalogModels('brand-apple', 'iPhone 17 Series', 2025, ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17', 'iPhone 17e']),
  ...makeCatalogModels('brand-samsung', 'S Series', 2026, ['Galaxy S26 Ultra', 'Galaxy S26 Plus', 'Galaxy S26']),
  ...makeCatalogModels('brand-samsung', 'S Series', 2025, ['Galaxy S25 FE', 'Galaxy S25 Edge']),
  ...makeCatalogModels('brand-samsung', 'Z Fold & Z Flip', 2025, ['Galaxy Z Fold 7', 'Galaxy Z Flip 7', 'Galaxy Z Flip 7 FE']),
  ...makeCatalogModels('brand-samsung', 'A Series', 2025, ['Galaxy A17', 'Galaxy A27', 'Galaxy A37', 'Galaxy A57']),
  ...makeCatalogModels('brand-samsung', 'F Series', 2025, ['Galaxy F07', 'Galaxy F70']),
  ...makeCatalogModels('brand-samsung', 'M Series', 2025, ['Galaxy M07']),
  ...makeCatalogModels('brand-samsung', 'Z Fold & Z Flip', 2026, ['Galaxy Z Fold 8', 'Galaxy Z Fold 8 Ultra', 'Galaxy Z Flip 8']),
  ...makeCatalogModels('brand-samsung', 'M Series', 2026, ['Galaxy M47']),
  ...makeCatalogModels('brand-samsung', 'F Series', 2026, ['Galaxy F47']),
  ...makeCatalogModels('brand-vivo', 'X Series & Folds', 2025, ['vivo X300 Ultra', 'vivo X300 Pro', 'vivo X300', 'vivo X300 FE', 'vivo X5 Fold']),
  ...makeCatalogModels('brand-vivo', 'V Series', 2025, ['vivo V70', 'vivo V70 Elite', 'vivo V70 FE', 'vivo V60', 'vivo V60e']),
  ...makeCatalogModels('brand-vivo', 'T Series', 2025, ['vivo T4', 'vivo T4x', 'vivo T4 Lite', 'vivo T4 Ultra', 'vivo T5x', 'vivo T5 Pro']),
  ...makeCatalogModels('brand-vivo', 'Y Series', 2025, ['vivo Y400', 'vivo Y400 Pro']),
  ...makeCatalogModels('brand-vivo', 'S Series', 2026, ['vivo S2']),
  ...makeCatalogModels('brand-oppo', 'A Series', 2025, ['OPPO A3', 'OPPO A3x', 'OPPO A3 Pro', 'OPPO A5', 'OPPO A5x', 'OPPO A5 Pro', 'OPPO A6', 'OPPO A6 Pro', 'OPPO A6x']),
  ...makeCatalogModels('brand-oppo', 'F Series', 2025, ['OPPO F21', 'OPPO F21 Pro 5G', 'OPPO F23', 'OPPO F23 Pro', 'OPPO F25', 'OPPO F25 Pro', 'OPPO F27', 'OPPO F27 Pro+', 'OPPO F29', 'OPPO F29 Pro', 'OPPO F31', 'OPPO F31 Pro', 'OPPO F31 Pro+', 'OPPO F33', 'OPPO F33 Pro']),
  ...makeCatalogModels('brand-oppo', 'Reno Series', 2025, ['OPPO Reno 8', 'OPPO Reno 8 Pro', 'OPPO Reno 10', 'OPPO Reno 10 Pro', 'OPPO Reno 10 Pro+', 'OPPO Reno 11', 'OPPO Reno 11 Pro', 'OPPO Reno 12', 'OPPO Reno 12 Pro', 'OPPO Reno 13', 'OPPO Reno 13 Pro', 'OPPO Reno 14', 'OPPO Reno 14 Pro', 'OPPO Reno 15c', 'OPPO Reno 15', 'OPPO Reno 15 Pro', 'OPPO Reno 15 Pro Mini', 'OPPO Reno 16c', 'OPPO Reno 16']),
  ...makeCatalogModels('brand-oppo', 'Find X Series', 2025, ['OPPO Find X8', 'OPPO Find X8 Pro', 'OPPO Find X9', 'OPPO Find X9s', 'OPPO Find X9 Pro', 'OPPO Find X9 Ultra']),
  ...makeCatalogModels('brand-nothing', 'Phone Series', 2025, ['Nothing Phone 1', 'Nothing Phone 2', 'Nothing Phone 2a', 'Nothing Phone 2a Pro', 'Nothing Phone 3', 'Nothing Phone 3a', 'Nothing Phone 3a Pro', 'Nothing Phone 3a Pro+', 'Nothing Phone 4a', 'Nothing Phone 4a Pro', 'CMF Phone 1', 'CMF Phone 2']),
  ...makeCatalogModels('brand-oneplus', 'Numbered Series', 2025, ['OnePlus 8', 'OnePlus 8 Pro', 'OnePlus 8T', 'OnePlus 9', 'OnePlus 9 Pro', 'OnePlus 9T', 'OnePlus 10', 'OnePlus 10 Pro', 'OnePlus Open Fold', 'OnePlus 11 Pro', 'OnePlus 11 Pro Marvel Edition', 'OnePlus 11R Red Edition', 'OnePlus 12 Pro', 'OnePlus 13', 'OnePlus 13R', 'OnePlus 13s', 'OnePlus 15', 'OnePlus 15R']),
  ...makeCatalogModels('brand-oneplus', 'Nord Series', 2025, ['OnePlus Nord 2 CE', 'OnePlus Nord 2 CE Lite', 'OnePlus Nord 2', 'OnePlus Nord 2T', 'OnePlus Nord CE 3', 'OnePlus Nord CE 3 Lite', 'OnePlus Nord CE 4 Lite', 'OnePlus Nord 5', 'OnePlus Nord 5 CE Lite', 'OnePlus Nord 5 CE', 'OnePlus Nord 6', 'OnePlus Nord CE 6', 'OnePlus Nord CE 6 Lite']),
  ...makeCatalogModels('brand-xiaomi', 'Redmi Series', 2025, ['Redmi 10', 'Redmi 10A', 'Redmi Note 10', 'Redmi Note 10 Pro', 'Redmi Note 10 Pro+', 'Redmi 11', 'Redmi Note 11', 'Redmi Note 11s', 'Redmi Note 11 Pro', 'Redmi Note 11 Pro+', 'Redmi 12', 'Redmi Note 12', 'Redmi Note 12 Pro', 'Redmi Note 12 Pro+', 'Redmi 13', 'Redmi 13c', 'Redmi 14', 'Redmi 14c', 'Redmi 15', 'Redmi 15c', 'Redmi Note 15', 'Redmi Note 15 Pro', 'Redmi Note 15 Pro+']),
  ...makeCatalogModels('brand-xiaomi', 'Xiaomi Series', 2026, ['Xiaomi 11 Ultra', 'Xiaomi 14 Civi', 'Xiaomi 15', 'Xiaomi 15 Ultra', 'Xiaomi 16', 'Xiaomi 16 Ultra', 'Xiaomi 17', 'Xiaomi 17T', 'Xiaomi 17 Ultra']),
  ...makeCatalogModels('brand-xiaomi', 'POCO Series', 2025, ['POCO M6', 'POCO M6 Pro', 'POCO M7', 'POCO M7 Pro', 'POCO M7 Pro+', 'POCO M8', 'POCO M8 Pro', 'POCO M8 Pro+', 'POCO X4', 'POCO X4 Pro', 'POCO X5', 'POCO X5 Pro', 'POCO X6', 'POCO X6 Pro', 'POCO X7', 'POCO X7 Pro', 'POCO X8 Pro', 'POCO X8 Pro Ultra', 'POCO F7']),
  ...makeCatalogModels('brand-motorola', 'G Series', 2025, ['Motorola G04', 'Motorola G05', 'Motorola G06', 'Motorola G36', 'Motorola G56', 'Motorola G57', 'Motorola G60', 'Motorola G67']),
  ...makeCatalogModels('brand-motorola', 'Edge Series', 2025, ['Motorola Edge 40', 'Motorola Edge 40 Fusion', 'Motorola Edge 50', 'Motorola Edge 50 Fusion', 'Motorola Edge 50 Ultra', 'Motorola Edge 60', 'Motorola Edge 60 Fusion', 'Motorola Edge 60 Pro', 'Motorola Edge 70', 'Motorola Edge 70 Fusion', 'Motorola Edge 70 Pro']),
  ...makeCatalogModels('brand-motorola', 'Razr Series', 2025, ['Motorola Razr 50', 'Motorola Razr 50 Ultra', 'Motorola Razr 60', 'Motorola Razr 60 Ultra']),
];

const TABLET_MODELS = [
  { id: 'apple-ipad-pro-m4-13', brandId: 'brand-apple', name: 'iPad Pro 13" (M4)', category: 'flagship', releaseYear: 2024, basePrice128GB: 78000, series: 'iPad Pro', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-pro-13-select-wifi-spaceblack-202405?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-pro-m4-11', brandId: 'brand-apple', name: 'iPad Pro 11" (M4)', category: 'flagship', releaseYear: 2024, basePrice128GB: 64000, series: 'iPad Pro', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-pro-11-select-wifi-spaceblack-202405?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-air-m2-13', brandId: 'brand-apple', name: 'iPad Air 13" (M2)', category: 'premium', releaseYear: 2024, basePrice128GB: 48000, series: 'iPad Air', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-13-select-wifi-blue-202405?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-air-m2-11', brandId: 'brand-apple', name: 'iPad Air 11" (M2)', category: 'premium', releaseYear: 2024, basePrice128GB: 39000, series: 'iPad Air', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-air-11-select-wifi-starlight-202405?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-10gen', brandId: 'brand-apple', name: 'iPad (10th Generation)', category: 'midrange', releaseYear: 2022, basePrice128GB: 22000, series: 'iPad', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-10th-gen-finish-select-202212-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-ipad-mini-7', brandId: 'brand-apple', name: 'iPad mini 7 (A17 Pro)', category: 'premium', releaseYear: 2024, basePrice128GB: 34000, series: 'iPad mini', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-mini-select-wifi-purple-202410?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'samsung-tab-s10-ultra', brandId: 'brand-samsung', name: 'Galaxy Tab S10 Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 72000, series: 'Galaxy Tab S', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x920nzaainu/gallery/in-galaxy-tab-s10-ultra-sm-x920-sm-x920nzaainu-543598501?$650_519_PNG$' },
  { id: 'samsung-tab-s10-plus', brandId: 'brand-samsung', name: 'Galaxy Tab S10+', category: 'flagship', releaseYear: 2024, basePrice128GB: 58000, series: 'Galaxy Tab S', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x820nzaainu/gallery/in-galaxy-tab-s10-plus-sm-x820-sm-x820nzaainu-543598462?$650_519_PNG$' },
  { id: 'samsung-tab-s9-ultra', brandId: 'brand-samsung', name: 'Galaxy Tab S9 Ultra', category: 'flagship', releaseYear: 2023, basePrice128GB: 52000, series: 'Galaxy Tab S', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x910nzaainu/gallery/in-galaxy-tab-s9-ultra-sm-x910-sm-x910nzaainu-537466829?$650_519_PNG$' },
  { id: 'samsung-tab-s9-fe', brandId: 'brand-samsung', name: 'Galaxy Tab S9 FE+', category: 'midrange', releaseYear: 2023, basePrice128GB: 26000, series: 'Galaxy Tab FE', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x610nzaainu/gallery/in-galaxy-tab-s9-fe-plus-sm-x610-sm-x610nzaainu-538466184?$650_519_PNG$' },
  { id: 'samsung-tab-a9-plus', brandId: 'brand-samsung', name: 'Galaxy Tab A9+', category: 'budget', releaseYear: 2023, basePrice128GB: 12500, series: 'Galaxy Tab A', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-x210nzaainu/gallery/in-galaxy-tab-a9-plus-sm-x210-sm-x210nzaainu-538622176?$650_519_PNG$' }
];

const SMARTWATCH_MODELS = [
  { id: 'apple-watch-ultra-2', brandId: 'brand-apple', name: 'Apple Watch Ultra 2', category: 'flagship', releaseYear: 2024, basePrice128GB: 46000, series: 'Apple Watch Ultra', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ultra-black-titanium-select-202409?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-watch-series-10', brandId: 'brand-apple', name: 'Apple Watch Series 10', category: 'flagship', releaseYear: 2024, basePrice128GB: 28000, series: 'Apple Watch Series 10', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/s10-case-unselect-gallery-1-202409?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-watch-series-9', brandId: 'brand-apple', name: 'Apple Watch Series 9', category: 'premium', releaseYear: 2023, basePrice128GB: 21000, series: 'Apple Watch Series 9', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/s9-case-unselect-gallery-1-202309?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'apple-watch-se-2', brandId: 'brand-apple', name: 'Apple Watch SE (2nd Gen)', category: 'midrange', releaseYear: 2023, basePrice128GB: 13500, series: 'Apple Watch SE', imageUrl: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/se-case-unselect-gallery-1-202309?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { id: 'samsung-watch-ultra', brandId: 'brand-samsung', name: 'Galaxy Watch Ultra', category: 'flagship', releaseYear: 2024, basePrice128GB: 32000, series: 'Galaxy Watch Ultra', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-l705fdaainu/gallery/in-galaxy-watch-ultra-sm-l705-sm-l705fdaainu-542385317?$650_519_PNG$' },
  { id: 'samsung-watch-7', brandId: 'brand-samsung', name: 'Galaxy Watch 7', category: 'premium', releaseYear: 2024, basePrice128GB: 18500, series: 'Galaxy Watch 7', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-l310nzaainu/gallery/in-galaxy-watch7-l310-sm-l310nzaainu-542385150?$650_519_PNG$' },
  { id: 'samsung-watch-6-classic', brandId: 'brand-samsung', name: 'Galaxy Watch 6 Classic', category: 'premium', releaseYear: 2023, basePrice128GB: 14500, series: 'Galaxy Watch 6', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-r950nzkainu/gallery/in-galaxy-watch6-classic-r950-sm-r950nzkainu-537424915?$650_519_PNG$' },
  { id: 'samsung-watch-6', brandId: 'brand-samsung', name: 'Galaxy Watch 6', category: 'midrange', releaseYear: 2023, basePrice128GB: 11000, series: 'Galaxy Watch 6', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-r930nzeainu/gallery/in-galaxy-watch6-r930-sm-r930nzeainu-537424785?$650_519_PNG$' }
];

const ALL_MODELS = [
  ...BASE_MODELS,
  ...TABLET_MODELS,
  ...SMARTWATCH_MODELS,
  ...CATALOG_ADDITIONS.filter((addition) => !BASE_MODELS.some((model) =>
    model.brandId === addition.brandId && model.name.toLowerCase() === addition.name.toLowerCase(),
  )),
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

  for (const m of ALL_MODELS) {
    const benchmarkKey = Object.keys(CASHIFY_BENCHMARKS).find(key => m.name === key);
    const benchmark = benchmarkKey ? CASHIFY_BENCHMARKS[benchmarkKey] : undefined;

    const nameLower = m.name.toLowerCase();
    const isProMaxOrUltra = nameLower.includes('pro max') || nameLower.includes('17 pro') || nameLower.includes('17 air') || nameLower.includes('ultra') || nameLower.includes('fold');

    let storageArr = benchmark ? benchmark.supportedStorageGb : (isProMaxOrUltra ? [256, 512, 1024] : m.category === 'budget' ? [32, 64, 128, 256] : [128, 256, 512]);
    if (isProMaxOrUltra) {
      storageArr = storageArr.filter(gb => gb >= 256);
    }
    const supportedStorageGbStr = JSON.stringify(storageArr);
    const variantPrices = benchmark ? JSON.stringify(benchmark.variantPrices) : undefined;

    const isApple = m.brandId === 'brand-apple' || m.name.toLowerCase().includes('iphone') || m.name.toLowerCase().includes('ipad');
    const isWatch = m.name.toLowerCase().includes('watch');
    const ramArr = isApple ? [0] : isWatch ? [2] : m.category === 'flagship' ? [8, 12, 16] : m.category === 'premium' ? [8, 12] : m.category === 'midrange' ? [6, 8, 12] : [2, 4, 6, 8];
    const supportedRamGbStr = JSON.stringify(ramArr);

    const brandSlug = m.brandId.replace('brand-', '');
    const cleanId = m.id.replace(/^catalog-/, '');
    const deDuplicatedId = cleanId.replace(new RegExp(`^${brandSlug}-${brandSlug}-`), `${brandSlug}-`);

    const modelImageUrl =
      (m as any).imageUrl ||
      phoneImagesMap[m.id] ||
      phoneImagesMap[cleanId] ||
      phoneImagesMap[deDuplicatedId] ||
      phoneImagesMap[`catalog-${deDuplicatedId}`] ||
      '';

    await prisma.model.upsert({
      where: { legacyId: m.id },
      create: {
        legacyId: m.id,
        brandId: m.brandId,
        name: m.name,
        category: m.category,
        releaseYear: m.releaseYear,
        basePrice128GB: m.basePrice128GB,
        series: m.series,
        imageUrl: modelImageUrl,
        supportedStorageGb: supportedStorageGbStr,
        supportedRamGb: supportedRamGbStr,
        variantPrices: variantPrices ?? '{}',
      },
      update: {
        basePrice128GB: m.basePrice128GB,
        category: m.category,
        releaseYear: m.releaseYear,
        imageUrl: modelImageUrl || undefined,
        supportedStorageGb: supportedStorageGbStr,
        supportedRamGb: supportedRamGbStr,
        variantPrices: variantPrices ?? undefined,
      },
    });
  }
  console.log(`  ✓ ${ALL_MODELS.length} catalog models ready`);

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
