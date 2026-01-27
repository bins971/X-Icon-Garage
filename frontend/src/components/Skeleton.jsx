import React from 'react';

const Skeleton = ({ className = "" }) => (
    <div className={`animate-pulse bg-neutral-800 rounded-lg ${className}`}></div>
);

const ListSkeleton = ({ count = 5, height = "h-24" }) => {
    return (
        <div className="space-y-4">
            {[...Array(count)].map((_, i) => (
                <Skeleton key={i} className={`w-full ${height}`} />
            ))}
        </div>
    );
};

const CardSkeleton = ({ count = 3 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-3/4" />
                        </div>
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-8 w-1/4 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export { Skeleton, ListSkeleton, CardSkeleton };
