'use client';

import Link from 'next/link';
import { NormalizedProductItem } from '@/lib/api';

interface ProductCardProps {
  product: NormalizedProductItem;
  isSelected?: boolean;
  onClick?: () => void;
  actionLabel?: string;
}

export default function ProductCard({
  product,
  isSelected = false,
  onClick,
  actionLabel = 'VIEW DETAILS',
}: ProductCardProps) {
  const cardContent = (
    <article
      className={`lillo-product-card ${isSelected ? 'active' : ''}`}
      data-charm-id={product.id}
      data-img={product.image}
      onClick={onClick}
    >
      <div className="card-image-box">
        <span className="active-pill-badge">PREVIEW</span>
        {product.hasImage && product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const ph = (e.target as HTMLImageElement).parentElement?.querySelector('.card-image-placeholder');
              if (ph) (ph as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="card-image-placeholder"
          style={{ display: product.hasImage && product.image ? 'none' : 'flex' }}
        >
            <span>IMAGE COMING SOON</span>
        </div>
      </div>
      <div className="card-info-box">
        <span className="card-category">{product.category}</span>
        <h3 className="card-title">{product.name}</h3>
        <div className="card-price">{product.price}</div>
        <div className="card-preview-action">
          <span>{actionLabel}</span>
          <span className="sparkle-icon">✦</span>
        </div>
      </div>
    </article>
  );

  if (onClick) {
    return cardContent;
  }

  return (
    <Link href={`/products/${encodeURIComponent(product.id)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      {cardContent}
    </Link>
  );
}
