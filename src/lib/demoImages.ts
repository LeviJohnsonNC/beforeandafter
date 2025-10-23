import sinkBefore from '@/assets/demo/sink-before.jpg';
import sinkAfter from '@/assets/demo/sink-after.jpg';
import fanBefore from '@/assets/demo/fan-before.jpg';
import fanAfter from '@/assets/demo/fan-after.jpg';
import tableCluttered from '@/assets/demo/table-cluttered.jpg';
import shelfElephant from '@/assets/demo/shelf-elephant.jpg';
import kitchenCounter from '@/assets/demo/kitchen-counter.jpg';
import nightstand from '@/assets/demo/nightstand.jpg';
import bathroomVanity from '@/assets/demo/bathroom-vanity.jpg';
import deskOffice from '@/assets/demo/desk-office.jpg';

const demoImageImports = [
  { url: sinkBefore, name: 'sink-before.jpg' },
  { url: sinkAfter, name: 'sink-after.jpg' },
  { url: fanBefore, name: 'fan-before.jpg' },
  { url: fanAfter, name: 'fan-after.jpg' },
  { url: tableCluttered, name: 'table-cluttered.jpg' },
  { url: shelfElephant, name: 'shelf-elephant.jpg' },
  { url: kitchenCounter, name: 'kitchen-counter.jpg' },
  { url: nightstand, name: 'nightstand.jpg' },
  { url: bathroomVanity, name: 'bathroom-vanity.jpg' },
  { url: deskOffice, name: 'desk-office.jpg' },
];

export async function loadDemoImages(): Promise<File[]> {
  const files: File[] = [];

  for (const { url, name } of demoImageImports) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], name, { type: 'image/jpeg' });
      files.push(file);
    } catch (error) {
      console.error(`Failed to load demo image ${name}:`, error);
    }
  }

  return files;
}
