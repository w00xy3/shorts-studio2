import { NextResponse } from 'next/server';

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;
  
  // Scopes (права), которые мы запрашиваем у пользователя. 
  // video.upload необходим для прямой публикации готовых клипов
  const scopes = ['user.info.basic', 'video.upload'].join(',');
  
  // Уникальное состояние для защиты от CSRF-атак
  const state = Math.random().toString(36).substring(2);

  const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  tiktokAuthUrl.searchParams.append('client_key', clientKey || '');
  tiktokAuthUrl.searchParams.append('scope', scopes);
  tiktokAuthUrl.searchParams.append('response_type', 'code');
  tiktokAuthUrl.searchParams.append('redirect_uri', redirectUri);
  tiktokAuthUrl.searchParams.append('state', state);

  // Перенаправляем пользователя на страницу авторизации TikTok
  return NextResponse.redirect(tiktokAuthUrl.toString());
}