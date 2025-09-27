import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DASHBOARD_PATH = '/dashboard'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith(DASHBOARD_PATH)) {
    const hasAccess = request.cookies.get('mbda_pin_ok')?.value === '1'
    if (!hasAccess) {
      const url = request.nextUrl.clone()
      url.pathname = '/pin'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}


