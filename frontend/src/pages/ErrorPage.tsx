import { Link, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import Button from '@/components/Button';
import ThemeToggle from '@/components/ThemeToggle';

export default function ErrorPage() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? 'Page Not Found' : `Error ${error.status}`;
    message = error.status === 404 ? "The page you're looking for doesn't exist or has moved." : error.statusText;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <Link to="/">
          <Button className="mt-2">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
