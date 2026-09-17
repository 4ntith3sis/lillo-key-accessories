'use client';

import { Category } from '@/types/category';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slugOrId: string) => void;
  productCounts?: Record<string, number>;
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  productCounts,
}: CategorySidebarProps) {
  const renderButton = (
    key: string,
    label: string,
    count: number | undefined,
    isSelected: boolean
  ) => (
    <button
      key={key}
      type="button"
      className={`category-item-btn ${isSelected ? 'active' : ''}`}
      onClick={() => onSelectCategory(key)}
    >
      <span className="cat-name">{label}</span>
      {count !== undefined && <span className="cat-count">{count}</span>}
    </button>
  );

  return (
    <div className="collection-category-bar" aria-label="Category navigation">
      <div className="category-nav-list" role="list">
        {renderButton('all', 'ALL', productCounts?.['all'], selectedCategory === 'all')}

        {categories.map((cat) => {
          const key = cat.slug || cat.$id || cat.name.toLowerCase();
          const isSelected = selectedCategory.toLowerCase() === key.toLowerCase() ||
                             selectedCategory.toLowerCase() === cat.name.toLowerCase() ||
                             selectedCategory === cat.$id;
          const countKey = cat.slug || cat.$id || cat.name.toUpperCase();
          const count = productCounts?.[countKey] ?? productCounts?.[cat.name.toUpperCase()] ?? productCounts?.[cat.name];

          return renderButton(key, cat.name.toUpperCase(), count, isSelected);
        })}
      </div>
    </div>
  );
}
