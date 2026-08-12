export const treatments = [
  { name: "Gel nokti", specialty: "Nokti", price: 50, duration: 90 },
  { name: "Trajni lak", specialty: "Nokti", price: 35, duration: 60 },
  { name: "Trajni lak noge", specialty: "Nokti", price: 25, duration: 30 },
  { name: "Depilacija noge", specialty: "Depilacija", price: 30, duration: 30 },
  { name: "Depilacija ruke", specialty: "Depilacija", price: 20, duration: 30 },
  { name: "Masaža leđa", specialty: "Masaža", price: 20, duration: 30 },
  { name: "Masaža cijelo tijelo", specialty: "Masaža", price: 45, duration: 60 },
];

export function findTreatment(name) {
  return treatments.find((t) => t.name.toLowerCase() === name.toLowerCase());
}
