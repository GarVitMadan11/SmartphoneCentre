/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
  { id: 'apple-17pm',   brandId: 'brand-apple', name: 'iPhone 17 Pro Max', category: 'flagship', releaseYear: 2025, basePrice128GB: 78000, series: 'iPhone 17 Series' },
  { id: 'apple-17p',    brandId: 'brand-apple', name: 'iPhone 17 Pro', category: 'flagship', releaseYear: 2025, basePrice128GB: 68000, series: 'iPhone 17 Series' },
  { id: 'apple-17air',  brandId: 'brand-apple', name: 'iPhone 17 Air', category: 'premium',  releaseYear: 2025, basePrice128GB: 55000, series: 'iPhone 17 Series' },
  { id: 'apple-17',     brandId: 'brand-apple', name: 'iPhone 17', category: 'premium',  releaseYear: 2025, basePrice128GB: 50000, series: 'iPhone 17 Series' },
  { id: 'apple-16pm',   brandId: 'brand-apple', name: 'iPhone 16 Pro Max', category: 'flagship', releaseYear: 2024, basePrice128GB: 67000, series: 'iPhone 16 Series' },
  { id: 'apple-16p',    brandId: 'brand-apple', name: 'iPhone 16 Pro', category: 'flagship', releaseYear: 2024, basePrice128GB: 57000, series: 'iPhone 16 Series' },
  { id: 'apple-16plus', brandId: 'brand-apple', name: 'iPhone 16 Plus', category: 'premium',  releaseYear: 2024, basePrice128GB: 45000, series: 'iPhone 16 Series' },
  { id: 'apple-16',     brandId: 'brand-apple', name: 'iPhone 16', category: 'premium',  releaseYear: 2024, basePrice128GB: 40000, series: 'iPhone 16 Series' },
  { id: 'apple-15pm',   brandId: 'brand-apple', name: 'iPhone 15 Pro Max', category: 'flagship', releaseYear: 2023, basePrice128GB: 57000, series: 'iPhone 15 Series' },
  { id: 'apple-15p',    brandId: 'brand-apple', name: 'iPhone 15 Pro', category: 'flagship', releaseYear: 2023, basePrice128GB: 47000, series: 'iPhone 15 Series' },
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
  { id: 'apple-16e',    brandId: 'brand-apple', name: 'iPhone 16e', category: 'midrange', releaseYear: 2024, basePrice128GB: 32000, series: 'iPhone 16 Series' },
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
