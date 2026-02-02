import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center border border-gray-100">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-6">
                    We encountered an unexpected error.
                </p>

                {/* Optional: Show error details in development */}
                {process.env.NODE_ENV === 'development' && (
                    <pre className="bg-gray-100 p-3 rounded text-left text-xs overflow-auto mb-6 max-h-40 text-red-800">
                        {error.message}
                    </pre>
                )}

                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    >
                        Try Again
                    </button>

                    <button
                        onClick={() => {
                            resetErrorBoundary();
                            window.location.href = '/';
                        }}
                        className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorFallback;
