import { Text } from '../ui';
import { Icon } from '../ui/icons';

type BrandLockupProps = {
  className?: string;
};

export function BrandLockup({ className = 'brand-row' }: BrandLockupProps) {
  return (
    <div className={className}>
      <span className="brand-mark">
        <Icon name="thunderbolt" />
      </span>
      <div>
        <Text className="brand-name">玄知助手</Text>
        <Text className="brand-subtitle">Web Assistant</Text>
      </div>
    </div>
  );
}
