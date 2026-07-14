// Northwind Coffee Co. — sample ES module (open in the HTML viewer as source)
const MENU = [
  { name: "Espresso", shots: 2, oz: 2 },
  { name: "Cortado", shots: 2, oz: 4 },
  { name: "Flat White", shots: 2, oz: 6 },
];

export function priceOf(drink, perShot = 1.25) {
  return (drink.shots * perShot).toFixed(2);
}

MENU.forEach((d) => {
  console.log(`${d.name.padEnd(12)} $${priceOf(d)}`);
});
