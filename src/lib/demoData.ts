import faucetBefore from '@/assets/demo/faucet-before.png';
import faucetAfter from '@/assets/demo/faucet-after.png';
import floorBefore from '@/assets/demo/floor-before.png';
import floorAfter from '@/assets/demo/floor-after.png';
import stoveBefore from '@/assets/demo/stove-before.png';
import stoveAfter from '@/assets/demo/stove-after.png';

export interface DemoImage {
  name: string;
  url: string;
}

export const demoImages: DemoImage[] = [
  { name: 'faucet-before.png', url: faucetBefore },
  { name: 'faucet-after.png', url: faucetAfter },
  { name: 'floor-before.png', url: floorBefore },
  { name: 'floor-after.png', url: floorAfter },
  { name: 'stove-before.png', url: stoveBefore },
  { name: 'stove-after.png', url: stoveAfter },
];

export async function loadDemoImages(): Promise<File[]> {
  const files = await Promise.all(
    demoImages.map(async (demo) => {
      const response = await fetch(demo.url);
      const blob = await response.blob();
      return new File([blob], demo.name, { type: 'image/png' });
    })
  );
  
  return files;
}
