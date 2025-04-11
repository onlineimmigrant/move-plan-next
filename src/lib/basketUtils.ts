import { cookies } from 'next/headers';

export async function getBasket() {
  const cookieStore = await cookies(); // Await cookies()
  const basketCookie = cookieStore.get('basket');
  if (basketCookie) {
    try {
      return JSON.parse(basketCookie.value);
    } catch (error) {
      console.error('Error parsing basket cookie:', error);
    }
  }
  return [];
}