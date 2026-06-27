export const treatments = [
  { name: "massage", specialty: "Massage", price: 50, duration: 60 },
  { name: "facial", specialty: "Facial", price: 45, duration: 60 },
  { name: "haircut", specialty: "Haircut", price: 30, duration: 45 },
];

export function findTreatment(name) {
  return treatments.find((t) => t.name.toLowerCase() === name.toLowerCase());
}
