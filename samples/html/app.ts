// Northwind Coffee Co. — sample TypeScript (open in the HTML viewer as source)
interface Drink {
  name: string;
  shots: number;
  ounces: number;
}

const espresso: Drink = { name: "Espresso", shots: 2, ounces: 2 };

function describe(d: Drink): string {
  return `${d.name}: ${d.shots} shot(s), ${d.ounces} oz`;
}

console.log(describe(espresso));
