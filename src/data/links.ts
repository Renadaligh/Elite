/** Short addresses of a bracket / tournament: registration = /<8 characters>, bracket view = /<8 characters>v.
 *  Anything with another id shape (older or special ids) keeps the long address, which still works. */
const SHORT = /^[0-9a-f]{8}$/i;
export const joinPath = (id: string) => (SHORT.test(id) ? `/${id.toLowerCase()}` : `/j/${encodeURIComponent(id)}`);
export const viewPath = (id: string) => (SHORT.test(id) ? `/${id.toLowerCase()}v` : `/v/${encodeURIComponent(id.slice(0, 6))}`);
