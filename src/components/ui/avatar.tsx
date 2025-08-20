import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Enhanced Avatar component with fallback handling
interface EnhancedAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function EnhancedAvatar({ 
  src, 
  alt = 'Avatar', 
  fallback = '👤',
  size = 'md',
  className 
}: EnhancedAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [src]);

  if (!src || imageError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium',
          sizeClasses[size],
          className
        )}
        title={alt}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full object-cover w-full h-full',
          !imageLoaded && 'opacity-0'
        )}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-muted animate-pulse">
          <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback }
