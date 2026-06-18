import PostSkeleton from '@/components/PostSkeleton';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function Loading() {
  return (
    <main className="min-h-screen bg-if-bg p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Simulação do Header */}
        <div className="mb-6 flex items-center gap-3">
          <Skeleton width={150} height={40} borderRadius={999} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
          <div className="flex-1">
             <Skeleton height={45} borderRadius={999} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
          </div>
          <Skeleton width={120} height={40} borderRadius={999} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
        </div>

        {/* Simulação do Destaque */}
        <div className="mb-8">
           <Skeleton height={120} borderRadius={24} baseColor="#3D2B3D" highlightColor="#4D3B4D" />
        </div>

        {/* Simulação do Feed */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <Skeleton width={200} height={24} className="mb-6" baseColor="#3D2B3D" highlightColor="#4D3B4D" />
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <PostSkeleton key={item} />
              ))}
            </div>
          </div>
          <aside className="hidden lg:block">
            <Skeleton width={150} height={24} className="mb-6" baseColor="#3D2B3D" highlightColor="#4D3B4D" />
            <div className="space-y-4">
              {[1, 2].map((item) => (
                <PostSkeleton key={item} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
