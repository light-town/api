export default function clearUndefinedProps(obj: Record<string, any>) {
  Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);

  return obj;
}
