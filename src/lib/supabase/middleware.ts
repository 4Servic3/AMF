import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = 
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/entrar' ||
    request.nextUrl.pathname === '/cadastro' ||
    request.nextUrl.pathname === '/recuperar-senha' ||
    request.nextUrl.pathname === '/termos' ||
    request.nextUrl.pathname === '/privacidade' ||
    request.nextUrl.pathname === '/admin/login' ||
    request.nextUrl.pathname === '/admin/unauthorized' ||
    request.nextUrl.pathname === '/admin/session-expired';

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

  if (!user && isAdminRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  if (!user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/_next') && !isAdminRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    return NextResponse.redirect(url)
  }

  if (user && (request.nextUrl.pathname === '/entrar' || request.nextUrl.pathname === '/cadastro' || request.nextUrl.pathname === '/admin/login')) {
    const url = request.nextUrl.clone()
    url.pathname = request.nextUrl.pathname === '/admin/login' ? '/admin' : '/app'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

