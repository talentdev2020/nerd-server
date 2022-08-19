export function getDateFromAge({
  date,
  age,
}: {
  date: Date;
  age: number; //age of offer in seconds
}) {
  return new Date((date.getTime() / 1000 - age) * 1000);
}
