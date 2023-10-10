export const ENDPOINT = '/api';

export type ResponseTransformFunc<T> = (response: Response) => Promise<T>;

// export function ResponseToJsonType<T>(response: Response) {
//     return response.json() as T;
// }

// export function ResponseToTextType<T=string>(response: Response) {
//     return response.text() as T;
// }
