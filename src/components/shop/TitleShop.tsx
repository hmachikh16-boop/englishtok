import React, { useMemo } from 'react';
import { ShoppingBag, Coins, CheckCircle2, Lock } from 'lucide-react';
import type { UserProfile } from '../../types';
import { TITLES, getTitleById } from '../../data/titles';

interface TitleShopProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const TitleShop: React.FC<TitleShopProps> = ({ userProfile, onUpdateProfile }) => {
  const points = userProfile.points ?? 0;
  const owned = new Set(userProfile.ownedTitles ?? []);
  const active = userProfile.activeTitle;

  const handleBuy = (id: string, price: number) => {
    if (owned.has(id)) return;
    if (points < price) return;
    const title = TITLES.find((t) => t.id === id);
    if (!title || userProfile.xp < title.minXP) return;
    onUpdateProfile({
      points: points - price,
      ownedTitles: [...owned, id],
      activeTitle: id,
    });
  };

  const handleEquip = (id: string) => {
    if (!owned.has(id)) return;
    onUpdateProfile({ activeTitle: id });
  };

  const sorted = useMemo(() => [...TITLES].sort((a, b) => a.price - b.price), []);

  return (
    <section className="title-shop" aria-labelledby="title-shop-title">
      <div className="title-shop-head">
        <div className="min-w-0">
          <h3 id="title-shop-title" className="title-shop-title">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" /> متجر الألقاب
          </h3>
          <p className="title-shop-sub">اكسب نقاطًا من الألعاب واشترِ ألقابًا تُعرض تحت اسمك في الملف.</p>
        </div>
        <div className="title-shop-balance">
          <Coins className="h-4 w-4" aria-hidden="true" />
          <strong>{points.toLocaleString('en-US')}</strong>
          <span>نقطة</span>
        </div>
      </div>

      <div className="title-shop-grid">
        {sorted.map((title) => {
          const isOwned = owned.has(title.id);
          const isActive = active === title.id;
          const canAfford = points >= title.price;
          const meetsXP = userProfile.xp >= title.minXP;
          const canBuy = !isOwned && canAfford && meetsXP;

          return (
            <div
              key={title.id}
              className={`title-card ${isActive ? 'is-active' : ''} ${isOwned ? 'is-owned' : ''}`}
              style={{ borderColor: isActive ? title.tone : undefined }}
            >
              <span className="title-card-icon" aria-hidden="true" style={{ color: title.tone }}>
                {title.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="title-card-name">{title.nameAr}</div>
                <div className="title-card-desc">{title.descriptionAr}</div>
                <div className="title-card-meta">
                  {isOwned ? (
                    <span className="title-card-owned">
                      <CheckCircle2 className="h-3 w-3" /> مملوك
                    </span>
                  ) : (
                    <>
                      <span className="title-card-price">
                        <Coins className="h-3 w-3" /> {title.price}
                      </span>
                      {!meetsXP && (
                        <span className="title-card-lock">
                          <Lock className="h-3 w-3" /> {title.minXP} XP
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="title-card-action">
                {isOwned ? (
                  isActive ? (
                    <span className="title-card-equipped">مُجهَّز</span>
                  ) : (
                    <button type="button" className="title-card-btn title-card-btn-equip" onClick={() => handleEquip(title.id)}>
                      تجهيز
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className={`title-card-btn ${canBuy ? 'title-card-btn-buy' : 'title-card-btn-disabled'}`}
                    onClick={() => handleBuy(title.id, title.price)}
                    disabled={!canBuy}
                  >
                    {canAfford && meetsXP ? 'شراء' : meetsXP ? 'نقاط غير كافية' : 'XP غير كافٍ'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
