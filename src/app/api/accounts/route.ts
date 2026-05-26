/**
 * API Route: GET /api/accounts & POST /api/accounts
 * * GET: Возвращает реальные подключенные аккаунты из базы данных Prisma
 * POST: Генерирует реальную ссылку авторизации для TikTok и моки для остальных
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Берем все аккаунты из реальной базы данных SQLite через Prisma
    const dbAccounts = await prisma.account.findMany({
      orderBy: { connectedAt: 'desc' }
    });

    // 2. Маппим данные из бд в формат, который строго ожидает твой фронтенд
    const formattedAccounts = dbAccounts.map(acc => {
      // Автоматически рассчитываем статус токена для интерфейса
      let currentStatus: "active" | "expired" | "revoked" | "error" = "active";
      
      if (!acc.isActive) {
        currentStatus = "revoked";
      } else if (acc.tokenExpiresAt && new Date() > new Date(acc.tokenExpiresAt)) {
        currentStatus = "expired";
      }

      return {
        id: acc.id,
        platform: acc.platform as "tiktok" | "youtube" | "instagram",
        platformUserId: acc.platformUserId,
        displayName: acc.displayName,
        avatarUrl: acc.avatarUrl,
        tokenKeyRef: acc.tokenKeyRef,
        refreshTokenKeyRef: acc.refreshTokenKeyRef,
        tokenExpiresAt: acc.tokenExpiresAt ? acc.tokenExpiresAt.toISOString() : null,
        status: currentStatus,
        connectedAt: acc.connectedAt.toISOString(),
        updatedAt: acc.updatedAt.toISOString(),
        lastRefreshedAt: acc.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      ok: true as const,
      data: formattedAccounts,
    });

  } catch (error: any) {
    console.error("Ошибка при получении аккаунтов из базы:", error);
    return NextResponse.json({
      ok: false as const,
      error: {
        code: "DATABASE_ERROR",
        message: "Не удалось загрузить аккаунты из базы данных",
        retryable: true,
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform } = body as { platform?: string };

    if (!platform || !["tiktok", "youtube", "instagram"].includes(platform)) {
      return NextResponse.json(
        {
          ok: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid or missing platform. Must be: tiktok, youtube, or instagram",
            retryable: false,
          },
        },
        { status: 400 },
      );
    }

    const state = `oauth_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let oauthUrl = "";

    // 3. Оживляем авторизацию TikTok реальными параметрами
    if (platform === "tiktok") {
      const clientKey = process.env.TIKTOK_CLIENT_KEY || "mock_client";
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;
      const scopes = ['user.info.basic', 'video.upload'].join(',');
      
      const tiktokAuthUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
      tiktokAuthUrl.searchParams.append('client_key', clientKey);
      tiktokAuthUrl.searchParams.append('scope', scopes);
      tiktokAuthUrl.searchParams.append('response_type', 'code');
      tiktokAuthUrl.searchParams.append('redirect_uri', redirectUri);
      tiktokAuthUrl.searchParams.append('state', state);
      
      oauthUrl = tiktokAuthUrl.toString();
    } else {
      // Для YouTube и Instagram пока оставляем заглушки, чтобы не ломать кнопки
      oauthUrl = `https://www.${platform}.com/oauth/authorize?client_id=mock_client&state=${state}&redirect_uri=http://localhost:3000/callback`;
    }

    return NextResponse.json({
      ok: true as const,
      data: {
        oauthUrl,
        state,
        platform,
      },
    });

  } catch (error: any) {
    console.error("Ошибка при генерации OAuth ссылки:", error);
    return NextResponse.json(
      {
        ok: false as const,
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to initiate OAuth connection",
          retryable: true,
        },
      },
      { status: 500 },
    );
  }
}