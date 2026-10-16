// Builds the URL of a file in the /public folder, so links work both locally and on GitHub Pages.
export const asset = (path: string) => import.meta.env.BASE_URL + path;
