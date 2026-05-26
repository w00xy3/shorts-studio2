import { NextRequest, NextResponse } from 'next/server';
// Убедись, что путь к твоему файлу инициализации Prisma указан верно (например, @/lib/prisma)
import { prisma } from '@/lib/prisma'; 

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth_error=${error}`);
    }

    if (!code) {
      return NextResponse.json({ ok: false, error: 'Authorization code missing' }, { status: 400 });
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

    // 1. Обмениваем временный `code` на токены доступа доступа по API v2 TikTok
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey || '',
        client_secret: clientSecret || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Ошибка получения токенов TikTok:', tokenData);
      return NextResponse.json({ ok: false, error: tokenData.error_description || 'Failed to fetch tokens' }, { status: 500 });
    }

    const { access_token, refresh_token, expires_in, open_id } = tokenData;

    // 2. Запрашиваем базовую инфу о профиле (никнейм и аватарку), чтобы красиво отобразить в интерфейсе
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    let displayName = 'TikTok User';
    let avatarUrl = null;

    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData?.data?.user) {
        displayName = userData.data.user.display_name || displayName;
        avatarUrl = userData.data.user.avatar_url || null;
      }
    }

    // Рассчитываем время протухания access_token
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // 3. Сохраняем аккаунт в базу данных через Prisma
    // Так как в твоей схеме заложен принцип безопасных референсов (tokenKeyRef),
    // мы временно запишем токены прямо туда. Если позже подключишь keytar, просто заменишь строчки.
    await prisma.account.upsert({
      where: {
        platform_platformUserId: {
          platform: 'tiktok',
          platformUserId: open_id,
        },
      },
      update: {
        displayName: displayName,
        avatarUrl: avatarUrl,
        tokenKeyRef: access_token, // сохраняем токен в поле ссылки для простоты локального запуска
        refreshTokenKeyRef: refresh_token || null,
        tokenExpiresAt: tokenExpiresAt,
        isActive: true,
      },
      create: {
        platform: 'tiktok',
        platformUserId: open_id,
        displayName: displayName,
        avatarUrl: avatarUrl,
        tokenKeyRef: access_token,
        refreshTokenKeyRef: refresh_token || null,
        tokenExpiresAt: tokenExpiresAt,
        isActive: true,
      },
    });

    // 4. После успешного сохранения редиректим пользователя обратно на фронтенд во вкладку аккаунтов
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?tab=accounts&status=success`);

  } catch (error: any) {
    console.error('Критическая ошибка в TikTok callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?tab=accounts&status=error`);
  }
}