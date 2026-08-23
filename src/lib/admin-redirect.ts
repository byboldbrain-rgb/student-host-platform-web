const ADMIN_REDIRECT_ORIGIN = 'https://navienty.local';

export function getSafeAdminRedirectPath(
  value: string | null | undefined,
): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  try {
    const url = new URL(value, ADMIN_REDIRECT_ORIGIN);
    const isAdminPath =
      url.pathname === '/admin' || url.pathname.startsWith('/admin/');
    const isLoginPath =
      url.pathname === '/admin/login' ||
      url.pathname.startsWith('/admin/login/');

    if (
      url.origin !== ADMIN_REDIRECT_ORIGIN ||
      !isAdminPath ||
      isLoginPath
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
