import { MODELS, getModelSupportedRam, getModelSupportedStorage } from '../src/data/mockDatabase.ts';

interface VariantEntry {
  brandId: string;
  modelId: string;
  modelName: string;
  ramGb: number;
  storageGb: number;
}

const list: VariantEntry[] = [];

MODELS.forEach(m => {
  const rams = getModelSupportedRam(m);
  const storages = getModelSupportedStorage(m);

  for (const r of rams) {
    for (const s of storages) {
      list.push({
        brandId: m.brandId,
        modelId: m.id,
        modelName: m.name,
        ramGb: r,
        storageGb: s
      });
    }
  }
});

console.log(`Total Models: ${MODELS.length}`);
console.log(`Total RAM/Storage Variants: ${list.length}`);
console.log(JSON.stringify(list.slice(0, 10), null, 2));
