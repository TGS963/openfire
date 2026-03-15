import { cn } from '@/lib/utils';

export type ShineBorderProps = {
  children: React.ReactNode;
  className?: string;
  color?: string;
  duration?: number;
};

export function ShineBorder({
  children,
  className,
  color = '#f59e0b',
  duration = 3,
}: ShineBorderProps) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-xl p-px', className)}
      style={{
        background: `linear-gradient(var(--shine-angle, 0deg), transparent 40%, ${color} 50%, transparent 60%)`,
        animation: `shine-pulse ${duration}s ease-in-out infinite`,
        backgroundSize: '200% 200%',
      }}
    >
      <div className="relative rounded-[calc(0.75rem-1px)] dark:bg-[rgba(20,20,25,0.95)] bg-[rgba(255,255,255,0.95)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
